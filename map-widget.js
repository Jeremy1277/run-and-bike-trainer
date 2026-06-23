/* ===========================================================
   Carte des lieux d'entraînement — itinéraire réel avec D+ calculé
   Combine Geocoding + Directions + Elevation API pour proposer une
   boucle dont la distance et le dénivelé correspondent à la séance
   choisie, plutôt qu'une simple recherche de lieux.
   IMPORTANT : remplace GOOGLE_MAPS_API_KEY ci-dessous par ta clé
   (restreinte au domaine jeremy1277.github.io dans la console Google Cloud).
   =========================================================== */

const GOOGLE_MAPS_API_KEY = 'AIzaSyCz_vkQaCbEz2kgvwHB9c9UtaRPu0G011g';

const RBTMap = {
  _map: null,
  _routePolylines: [],
  _scriptLoaded: false,
  _scriptLoading: null,
  _activeSeance: null,

  renderPanel(sport) {
    return `
      <div class="panel">
        <h3>Lieux d'entraînement</h3>
        <div class="panel-sub" id="mapContextSub-${sport}">Renseigne un point de départ, puis clique sur une séance ci-dessus pour générer un parcours adapté — ou lance une recherche libre.</div>
        <div class="map-search-row">
          <input type="text" id="mapLocationInput-${sport}" placeholder="Ville, adresse, ou lieu de départ...">
          <input type="number" id="mapDistanceInput-${sport}" placeholder="Distance (km)" style="max-width: 130px;" class="mono">
          <button class="btn-signal" id="mapFindBtn-${sport}">Générer un parcours</button>
        </div>
        <div id="map-canvas-${sport}" style="display:none;"></div>
        <div class="map-result-list" id="mapResults-${sport}"></div>
      </div>`;
  },

  attachHandlers(sport) {
    const btn = document.getElementById(`mapFindBtn-${sport}`);
    if (!btn) return;
    btn.addEventListener('click', () => RBTMap._search(sport));

    const input = document.getElementById(`mapLocationInput-${sport}`);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') RBTMap._search(sport); });
  },

  async _loadGoogleMapsScript() {
    if (RBTMap._scriptLoaded) return;
    if (RBTMap._scriptLoading) return RBTMap._scriptLoading;

    RBTMap._scriptLoading = new Promise((resolve, reject) => {
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.includes('COLLE_TA_CLE')) {
        reject(new Error('Clé Google Maps non configurée. Remplace GOOGLE_MAPS_API_KEY dans map-widget.js.'));
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=__rbtGoogleMapsReady`;
      window.__rbtGoogleMapsReady = () => { RBTMap._scriptLoaded = true; resolve(); };
      script.onerror = () => reject(new Error('Impossible de charger Google Maps.'));
      document.head.appendChild(script);
    });

    return RBTMap._scriptLoading;
  },

  // Calcule un point à une distance (km) et un cap (degrés) donnés depuis l'origine.
  _destinationPoint(lat, lng, distanceKm, bearingDeg) {
    const R = 6371;
    const bearing = (bearingDeg * Math.PI) / 180;
    const lat1 = (lat * Math.PI) / 180;
    const lng1 = (lng * Math.PI) / 180;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceKm / R) + Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(bearing));
    const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(distanceKm / R) * Math.cos(lat1), Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2));
    return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
  },

  // Calcule le D+ total d'un tracé en sommant les montées entre points d'élévation échantillonnés.
  async _computeElevationGain(path) {
    return new Promise((resolve, reject) => {
      const elevator = new google.maps.ElevationService();
      elevator.getElevationAlongPath({ path, samples: 40 }, (results, status) => {
        if (status !== 'OK' || !results) { reject(new Error('Élévation indisponible')); return; }
        let gain = 0;
        for (let i = 1; i < results.length; i++) {
          const delta = results[i].elevation - results[i - 1].elevation;
          if (delta > 0) gain += delta;
        }
        resolve(Math.round(gain));
      });
    });
  },

  async _computeRouteLoop(directionsService, origin, distanceKm, bearingDeg) {
    // Une boucle approximative : départ -> point à mi-distance dans une direction -> retour.
    // DirectionsService recalcule le vrai tracé routier entre ces points.
    const waypoint = RBTMap._destinationPoint(origin.lat(), origin.lng(), distanceKm / 2, bearingDeg);

    const result = await new Promise((resolve, reject) => {
      directionsService.route({
        origin,
        destination: origin,
        waypoints: [{ location: waypoint, stopover: true }],
        travelMode: google.maps.TravelMode.BICYCLING,
        optimizeWaypoints: false,
      }, (res, status) => {
        if (status === 'OK') resolve(res);
        else reject(new Error(`Itinéraire impossible (${status})`));
      });
    });

    const route = result.routes[0];
    const path = route.overview_path;
    const actualDistanceKm = route.legs.reduce((s, leg) => s + leg.distance.value, 0) / 1000;
    const elevationGain = await RBTMap._computeElevationGain(path).catch(() => null);

    return { result, route, path, actualDistanceKm, elevationGain, bearingDeg };
  },

  async _search(sport) {
    const input = document.getElementById(`mapLocationInput-${sport}`);
    const distanceInput = document.getElementById(`mapDistanceInput-${sport}`);
    const resultsEl = document.getElementById(`mapResults-${sport}`);
    const mapCanvas = document.getElementById(`map-canvas-${sport}`);
    const btn = document.getElementById(`mapFindBtn-${sport}`);
    const location = input.value.trim();

    if (!location) {
      resultsEl.innerHTML = `<div class="map-result-item"><span class="map-result-name">Renseigne d'abord un point de départ.</span></div>`;
      return;
    }

    // Distance cible : celle saisie manuellement, ou déduite de la séance active (durée -> distance approx),
    // ou une valeur par défaut raisonnable.
    let targetDistanceKm = parseFloat(distanceInput.value);
    if (!targetDistanceKm || targetDistanceKm <= 0) {
      if (RBTMap._activeSeance) {
        const speedAssumed = sport === 'course' ? 9 : 20; // km/h, hypothèse prudente
        targetDistanceKm = Math.round((RBTMap._activeSeance.duree_min / 60) * speedAssumed);
      } else {
        targetDistanceKm = sport === 'course' ? 8 : 30;
      }
    }

    const targetElevation = RBTMap._activeSeance
      ? { plat: 50, vallonne: 250, montagneux: 600 }[RBTMap._activeSeance.type_terrain] || null
      : null;

    btn.disabled = true;
    btn.textContent = 'Calcul du parcours...';
    resultsEl.innerHTML = `<div class="map-result-item"><span class="map-result-name">Recherche d'itinéraires réels autour de ${RBT.escapeHtml(location)}...</span></div>`;

    try {
      await RBTMap._loadGoogleMapsScript();

      const geocoder = new google.maps.Geocoder();
      const geoResult = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: location }, (results, status) => {
          if (status === 'OK' && results[0]) resolve(results[0]);
          else reject(new Error('Lieu introuvable. Précise la ville ou l\'adresse.'));
        });
      });

      const origin = geoResult.geometry.location;
      mapCanvas.style.display = 'block';

      if (!RBTMap._map) {
        RBTMap._map = new google.maps.Map(mapCanvas, { center: origin, zoom: 12, styles: RBTMap._darkStyles() });
      } else {
        RBTMap._map.setCenter(origin);
      }

      RBTMap._routePolylines.forEach((p) => p.setMap(null));
      RBTMap._routePolylines = [];

      const directionsService = new google.maps.DirectionsService();
      const bearings = [0, 60, 120, 180, 240, 300];
      const candidates = [];

      for (const bearing of bearings) {
        try {
          const candidate = await RBTMap._computeRouteLoop(directionsService, origin, targetDistanceKm, bearing);
          candidates.push(candidate);
        } catch (e) {
          // direction sans route praticable, on l'ignore
        }
      }

      if (candidates.length === 0) {
        resultsEl.innerHTML = `<div class="map-result-item"><span class="map-result-name">Impossible de calculer un itinéraire depuis ce point. Essaie un lieu plus précis.</span></div>`;
        btn.disabled = false;
        btn.textContent = 'Générer un parcours';
        return;
      }

      // Trie les candidats : priorité à ceux dont le D+ colle à la cible (si une séance est active),
      // sinon priorité à ceux dont la distance colle le mieux à la distance demandée.
      candidates.sort((a, b) => {
        if (targetElevation !== null && a.elevationGain !== null && b.elevationGain !== null) {
          return Math.abs(a.elevationGain - targetElevation) - Math.abs(b.elevationGain - targetElevation);
        }
        return Math.abs(a.actualDistanceKm - targetDistanceKm) - Math.abs(b.actualDistanceKm - targetDistanceKm);
      });

      const top3 = candidates.slice(0, 3);
      const colors = ['#ff6b35', '#4fd1a5', '#f2b84b'];

      top3.forEach((c, i) => {
        const polyline = new google.maps.Polyline({
          path: c.path,
          strokeColor: colors[i],
          strokeOpacity: i === 0 ? 0.95 : 0.5,
          strokeWeight: i === 0 ? 5 : 3,
        });
        polyline.setMap(RBTMap._map);
        RBTMap._routePolylines.push(polyline);
      });

      const bounds = new google.maps.LatLngBounds();
      top3[0].path.forEach((p) => bounds.extend(p));
      RBTMap._map.fitBounds(bounds);

      resultsEl.innerHTML = top3.map((c, i) => `
        <div class="map-result-item" style="border-left: 3px solid ${colors[i]};">
          <div>
            <div class="map-result-name">Boucle ${i + 1} ${i === 0 ? '— recommandée' : ''}</div>
            <div class="map-result-meta">${c.actualDistanceKm.toFixed(1)} km${c.elevationGain !== null ? ` · ${c.elevationGain} m D+` : ' · D+ indisponible'}</div>
          </div>
        </div>
      `).join('') + (targetElevation ? `<div class="map-result-meta" style="margin-top:8px;">Cible séance : ~${targetDistanceKm} km, ~${targetElevation} m D+ (terrain ${RBTMap._activeSeance.type_terrain})</div>` : '');
    } catch (err) {
      resultsEl.innerHTML = `<div class="map-result-item"><span class="map-result-name">${RBT.escapeHtml(err.message)}</span></div>`;
    }

    btn.disabled = false;
    btn.textContent = 'Générer un parcours';
  },

  _darkStyles() {
    return [
      { elementType: 'geometry', stylers: [{ color: '#1c2024' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1c2024' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#9aa1a9' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e343b' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#14171a' }] },
      { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#20242a' }] },
      { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#181b1e' }] },
    ];
  },
};
