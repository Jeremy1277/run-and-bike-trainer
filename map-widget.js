/* ===========================================================
   Carte des lieux d'entraînement — itinéraire réel avec D+ calculé
   Stack 100% gratuite : Leaflet (carte) + tuiles CyclOSM (fond de
   carte lisible vélo, basé OpenStreetMap) + OpenRouteService
   (calcul d'itinéraire réel + dénivelé en une seule requête).
   IMPORTANT : remplace ORS_API_KEY ci-dessous par ta clé
   OpenRouteService (gratuite, openrouteservice.org).
   =========================================================== */

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImMyN2M1MmQwN2ZkYjQ5OGNiZWFhNWY3ZDEzNGVlMmY4IiwiaCI6Im11cm11cjY0In0=';

const RBTMap = {
  _map: null,
  _routeLayers: [],
  _leafletLoaded: false,
  _leafletLoading: null,
  _activeSeance: null,
  _geocodeCache: {},

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

  async _loadLeaflet() {
    if (RBTMap._leafletLoaded) return;
    if (RBTMap._leafletLoading) return RBTMap._leafletLoading;

    RBTMap._leafletLoading = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(css);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.onload = () => { RBTMap._leafletLoaded = true; resolve(); };
      script.onerror = () => reject(new Error('Impossible de charger Leaflet.'));
      document.head.appendChild(script);
    });

    return RBTMap._leafletLoading;
  },

  async _geocode(location) {
    if (RBTMap._geocodeCache[location]) return RBTMap._geocodeCache[location];

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
    const data = await res.json();
    if (!data || data.length === 0) throw new Error('Lieu introuvable. Précise la ville ou l\'adresse.');

    const point = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    RBTMap._geocodeCache[location] = point;
    return point;
  },

  _destinationPoint(lat, lng, distanceKm, bearingDeg) {
    const R = 6371;
    const bearing = (bearingDeg * Math.PI) / 180;
    const lat1 = (lat * Math.PI) / 180;
    const lng1 = (lng * Math.PI) / 180;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceKm / R) + Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(bearing));
    const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(distanceKm / R) * Math.cos(lat1), Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2));
    return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
  },

  async _computeRouteLoop(origin, distanceKm, bearingDeg, sport) {
    const waypoint = RBTMap._destinationPoint(origin.lat, origin.lng, distanceKm / 2, bearingDeg);
    const profile = sport === 'course' ? 'foot-walking' : 'cycling-regular';

    const body = {
      coordinates: [
        [origin.lng, origin.lat],
        [waypoint.lng, waypoint.lat],
        [origin.lng, origin.lat],
      ],
      elevation: true,
    };

    const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
      method: 'POST',
      headers: {
        Authorization: ORS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.error?.message || `Itinéraire impossible (${res.status})`);
    }

    const data = await res.json();
    const feature = data.features[0];
    const coords = feature.geometry.coordinates;
    const summary = feature.properties.summary;

    let elevationGain = 0;
    let cumulativeDistance = 0;
    const elevationProfile = [{ distanceKm: 0, elevation: coords[0][2] }];

    for (let i = 1; i < coords.length; i++) {
      const delta = coords[i][2] - coords[i - 1][2];
      if (delta > 0) elevationGain += delta;

      const segmentDistance = RBTMap._haversine(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
      cumulativeDistance += segmentDistance;
      elevationProfile.push({ distanceKm: cumulativeDistance, elevation: coords[i][2] });
    }

    const path = coords.map((c) => [c[1], c[0]]);

    return {
      path,
      actualDistanceKm: summary.distance / 1000,
      elevationGain: Math.round(elevationGain),
      elevationProfile,
      bearingDeg,
    };
  },

  _haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  // Construit un lien OpenStreetMap centré sur le point de départ, pour navigation sur le terrain.
  // (OSM n'a pas de "navigation turn-by-turn" partageable par URL comme Google Maps, donc on
  // ouvre la carte centrée sur le point de départ — le coureur/cycliste suit le tracé visuellement.)
  _osmNavigationUrl(originLat, originLng) {
    return `https://www.openstreetmap.org/directions?from=&to=${originLat},${originLng}#map=15/${originLat}/${originLng}`;
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
    if (!ORS_API_KEY || ORS_API_KEY.includes('COLLE_TA_CLE')) {
      resultsEl.innerHTML = `<div class="map-result-item"><span class="map-result-name">Clé OpenRouteService non configurée. Remplace ORS_API_KEY dans map-widget.js.</span></div>`;
      return;
    }

    let targetDistanceKm = parseFloat(distanceInput.value);
    if (!targetDistanceKm || targetDistanceKm <= 0) {
      if (RBTMap._activeSeance) {
        if (RBTMap._activeSeance.distance_cible_km) {
          targetDistanceKm = RBTMap._activeSeance.distance_cible_km;
        } else {
          const speedAssumed = sport === 'course' ? 9 : 20;
          targetDistanceKm = Math.round((RBTMap._activeSeance.duree_min / 60) * speedAssumed);
        }
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
      await RBTMap._loadLeaflet();
      const origin = await RBTMap._geocode(location);

      mapCanvas.style.display = 'block';

      if (!RBTMap._map) {
        RBTMap._map = L.map(mapCanvas, { center: [origin.lat, origin.lng], zoom: 12 });
        L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors, CyclOSM',
          maxZoom: 20,
        }).addTo(RBTMap._map);
      } else {
        RBTMap._map.setView([origin.lat, origin.lng], 12);
      }

      RBTMap._routeLayers.forEach((l) => RBTMap._map.removeLayer(l));
      RBTMap._routeLayers = [];

      const bearings = [0, 90, 180, 270];
      const candidates = [];
      for (const bearing of bearings) {
        try {
          const candidate = await RBTMap._computeRouteLoop(origin, targetDistanceKm, bearing, sport);
          candidates.push(candidate);
        } catch (e) {
          // direction sans itinéraire praticable, on l'ignore et on essaie les autres
        }
      }

      if (candidates.length === 0) {
        resultsEl.innerHTML = `<div class="map-result-item"><span class="map-result-name">Impossible de calculer un itinéraire depuis ce point. Essaie un lieu plus précis ou une distance plus courte.</span></div>`;
        btn.disabled = false;
        btn.textContent = 'Générer un parcours';
        return;
      }

      candidates.sort((a, b) => {
        if (targetElevation !== null) {
          return Math.abs(a.elevationGain - targetElevation) - Math.abs(b.elevationGain - targetElevation);
        }
        return Math.abs(a.actualDistanceKm - targetDistanceKm) - Math.abs(b.actualDistanceKm - targetDistanceKm);
      });

      const top3 = candidates.slice(0, 3);
      const colors = ['#ff6b35', '#4fd1a5', '#f2b84b'];

      top3.forEach((c, i) => {
        const polyline = L.polyline(c.path, {
          color: colors[i],
          weight: i === 0 ? 5 : 3,
          opacity: i === 0 ? 0.95 : 0.5,
        }).addTo(RBTMap._map);
        RBTMap._routeLayers.push(polyline);
      });

      RBTMap._map.fitBounds(RBTMap._routeLayers[0].getBounds(), { padding: [20, 20] });

      RBTMap._currentCandidates = top3;
      RBTMap._currentOrigin = origin;
      RBTMap._selectedIndex = 0;

      resultsEl.innerHTML = top3.map((c, i) => `
        <div class="map-result-item" data-select-loop="${i}" style="border-left: 3px solid ${colors[i]}; cursor: pointer;">
          <div>
            <div class="map-result-name">Boucle ${i + 1} ${i === 0 ? '— recommandée' : ''}</div>
            <div class="map-result-meta">${c.actualDistanceKm.toFixed(1)} km · ${c.elevationGain} m D+</div>
          </div>
        </div>
      `).join('') + (targetElevation ? `<div class="map-result-meta" style="margin-top:8px;">Cible séance : ~${targetDistanceKm} km, ~${targetElevation} m D+ (terrain ${RBTMap._activeSeance.type_terrain})</div>` : '');

      resultsEl.querySelectorAll('[data-select-loop]').forEach((item) => {
        item.addEventListener('click', () => RBTMap._selectLoop(sport, Number(item.dataset.selectLoop)));
      });
      RBTMap._highlightSelected();
    } catch (err) {
      resultsEl.innerHTML = `<div class="map-result-item"><span class="map-result-name">${RBT.escapeHtml(err.message)}</span></div>`;
    }

    btn.disabled = false;
    btn.textContent = 'Générer un parcours';
  },

  // Met une boucle en avant sur la carte (les autres s'atténuent) et ouvre son détail.
  _selectLoop(sport, index) {
    RBTMap._selectedIndex = index;
    RBTMap._highlightSelected();
    RBTMap._showLoopDetail(sport, index);
  },

  _highlightSelected() {
    RBTMap._routeLayers.forEach((layer, i) => {
      const isSelected = i === RBTMap._selectedIndex;
      layer.setStyle({ weight: isSelected ? 5 : 3, opacity: isSelected ? 0.95 : 0.3 });
      if (isSelected) layer.bringToFront();
    });
    document.querySelectorAll('[data-select-loop]').forEach((item) => {
      const isSelected = Number(item.dataset.selectLoop) === RBTMap._selectedIndex;
      item.style.opacity = isSelected ? '1' : '0.55';
    });
  },

  _showLoopDetail(sport, index) {
    const candidate = RBTMap._currentCandidates[index];
    const origin = RBTMap._currentOrigin;
    if (!candidate) return;

    const profile = candidate.elevationProfile;
    const navUrl = RBTMap._osmNavigationUrl(origin.lat, origin.lng);

    const elevations = profile.map((p) => p.elevation);
    const altMax = Math.round(Math.max(...elevations));
    const altMin = Math.round(Math.min(...elevations));
    const avgGrade = candidate.actualDistanceKm > 0
      ? ((candidate.elevationGain / (candidate.actualDistanceKm * 1000)) * 100).toFixed(1)
      : '0.0';

    // Temps/vitesse estimés : hypothèses prudentes, ajustées si une séance est active.
    const speedAssumed = sport === 'course' ? 9 : 18;
    const estimatedMin = Math.round((candidate.actualDistanceKm / speedAssumed) * 60);

    const modalContainer = document.getElementById('modalContainer');
    modalContainer.innerHTML = `
      <div class="rbt-modal-overlay" id="loopDetailOverlay">
        <div class="rbt-modal" style="max-width: 560px;">
          <h4>Boucle ${index + 1}${index === 0 ? ' — recommandée' : ''}</h4>
          <div class="timeline-meta" style="margin: 8px 0 16px; flex-wrap: wrap;">
            <span class="timeline-badge">${candidate.actualDistanceKm.toFixed(1)} km</span>
            <span class="timeline-badge">${candidate.elevationGain} m D+</span>
            <span class="timeline-badge">${altMin}-${altMax} m alt.</span>
            <span class="timeline-badge">${avgGrade}% pente moy.</span>
            <span class="timeline-badge">~${estimatedMin} min (${speedAssumed} km/h)</span>
          </div>
          <div style="position: relative; height: 160px; margin-bottom: 18px;">
            <canvas id="loopElevationChart"></canvas>
          </div>
          <div class="rbt-modal-actions" style="justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; gap: 8px;">
              <a href="${navUrl}" target="_blank" rel="noopener" class="btn-ghost btn-small" style="text-decoration: none; display: inline-flex; align-items: center;">Voir sur OSM</a>
              <button class="btn-ghost btn-small" id="loopDetailExportGpx">Télécharger le GPX</button>
            </div>
            <button class="btn-signal btn-small" id="loopDetailClose">Fermer</button>
          </div>
        </div>
      </div>`;

    document.getElementById('loopDetailClose').onclick = () => { modalContainer.innerHTML = ''; };
    document.getElementById('loopDetailOverlay').onclick = (e) => {
      if (e.target.id === 'loopDetailOverlay') modalContainer.innerHTML = '';
    };
    document.getElementById('loopDetailExportGpx').onclick = () => RBTMap._exportGpx(sport, candidate, index);

    if (window.Chart) {
      const ctx = document.getElementById('loopElevationChart');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: profile.map((p) => p.distanceKm.toFixed(1)),
          datasets: [{
            data: profile.map((p) => Math.round(p.elevation)),
            borderColor: '#ff6b35',
            backgroundColor: 'rgba(255, 107, 53, 0.15)',
            fill: true,
            pointRadius: 0,
            tension: 0.2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'km', color: '#9aa1a9' }, ticks: { color: '#9aa1a9', maxTicksLimit: 8 }, grid: { color: '#2e343b' } },
            y: { title: { display: true, text: 'altitude (m)', color: '#9aa1a9' }, ticks: { color: '#9aa1a9' }, grid: { color: '#2e343b' } },
          },
        },
      });
    }
  },

  // Construit un fichier GPX Track (compatible iGPSport et la plupart des GPS/applis vélo)
  // et déclenche son téléchargement dans le navigateur.
  _exportGpx(sport, candidate, index) {
    const sportLabel = sport === 'course' ? 'Course' : 'Velo';
    // iGPSport exige un nom limité aux lettres/chiffres/tirets, 28 caractères max.
    const rawName = `${sportLabel}-Boucle${index + 1}-${Math.round(candidate.actualDistanceKm)}km`;
    const safeName = rawName.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 28);

    const trackPoints = candidate.path.map((coord, i) => {
      const elevation = candidate.elevationProfile[i] ? candidate.elevationProfile[i].elevation : 0;
      return `      <trkpt lat="${coord[0]}" lon="${coord[1]}"><ele>${elevation.toFixed(1)}</ele></trkpt>`;
    }).join('\n');

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Run and Bike Trainer" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${safeName}</name>
  </metadata>
  <trk>
    <name>${safeName}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
