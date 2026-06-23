/* ===========================================================
   Carte des lieux d'entraînement — Google Maps + Places API
   IMPORTANT : remplace GOOGLE_MAPS_API_KEY ci-dessous par ta clé
   (restreinte au domaine jeremy1277.github.io dans la console Google Cloud).
   =========================================================== */

const GOOGLE_MAPS_API_KEY = 'AIzaSyCz_vkQaCbEz2kgvwHB9c9UtaRPu0G011g';

const RBTMap = {
  _map: null,
  _markers: [],
  _scriptLoaded: false,
  _scriptLoading: null,

  renderPanel(sport) {
    const terrainQuery = sport === 'velo'
      ? 'piste cyclable, chemin gravel ou route avec dénivelé'
      : 'parcours de course à pied, sentier ou boucle';

    return `
      <div class="panel">
        <h3>Lieux d'entraînement</h3>
        <div class="panel-sub">Renseigne un endroit, puis cherche un terrain adapté (${terrainQuery})</div>
        <div class="map-search-row">
          <input type="text" id="mapLocationInput-${sport}" placeholder="Ville, adresse, ou lieu...">
          <button class="btn-signal" id="mapFindBtn-${sport}">Trouve-moi un parcours</button>
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
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') RBTMap._search(sport);
    });
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=__rbtGoogleMapsReady`;
      window.__rbtGoogleMapsReady = () => { RBTMap._scriptLoaded = true; resolve(); };
      script.onerror = () => reject(new Error('Impossible de charger Google Maps.'));
      document.head.appendChild(script);
    });

    return RBTMap._scriptLoading;
  },

  async _search(sport) {
    const input = document.getElementById(`mapLocationInput-${sport}`);
    const resultsEl = document.getElementById(`mapResults-${sport}`);
    const mapCanvas = document.getElementById(`map-canvas-${sport}`);
    const btn = document.getElementById(`mapFindBtn-${sport}`);
    const location = input.value.trim();

    if (!location) {
      resultsEl.innerHTML = `<div class="map-result-item"><span class="map-result-name">Renseigne d'abord un lieu ci-dessus.</span></div>`;
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Recherche...';
    resultsEl.innerHTML = '';

    try {
      await RBTMap._loadGoogleMapsScript();

      const geocoder = new google.maps.Geocoder();
      const geoResult = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: location }, (results, status) => {
          if (status === 'OK' && results[0]) resolve(results[0]);
          else reject(new Error('Lieu introuvable. Précise la ville ou l\'adresse.'));
        });
      });

      const center = geoResult.geometry.location;
      mapCanvas.style.display = 'block';

      if (!RBTMap._map || RBTMap._map._sport !== sport) {
        RBTMap._map = new google.maps.Map(mapCanvas, {
          center, zoom: 12,
          styles: RBTMap._darkStyles(),
          disableDefaultUI: false,
        });
        RBTMap._map._sport = sport;
      } else {
        RBTMap._map.setCenter(center);
      }

      RBTMap._markers.forEach(m => m.setMap(null));
      RBTMap._markers = [];

      const textQuery = sport === 'velo'
        ? 'piste cyclable OR chemin gravel OR route vallonnée'
        : 'parcours course à pied OR sentier OR boucle running';

      const { Place } = await google.maps.importLibrary('places');
      const request = {
        textQuery: `${textQuery} près de ${location}`,
        fields: ['displayName', 'location', 'formattedAddress', 'rating'],
        locationBias: center,
        maxResultCount: 8,
      };
      const { places } = await Place.searchByText(request);

      if (!places || places.length === 0) {
        resultsEl.innerHTML = `<div class="map-result-item"><span class="map-result-name">Aucun résultat trouvé près de "${RBT.escapeHtml(location)}". Essaie un lieu plus précis.</span></div>`;
        btn.disabled = false;
        btn.textContent = 'Trouve-moi un parcours';
        return;
      }

      places.forEach((place) => {
        const marker = new google.maps.Marker({
          position: place.location,
          map: RBTMap._map,
          title: place.displayName,
        });
        RBTMap._markers.push(marker);
      });

      resultsEl.innerHTML = places.map((place) => `
        <div class="map-result-item">
          <div>
            <div class="map-result-name">${RBT.escapeHtml(place.displayName || 'Lieu')}</div>
            <div class="map-result-meta">${RBT.escapeHtml(place.formattedAddress || '')}</div>
          </div>
          ${place.rating ? `<div class="map-result-meta">★ ${place.rating}</div>` : ''}
        </div>
      `).join('');
    } catch (err) {
      resultsEl.innerHTML = `<div class="map-result-item"><span class="map-result-name">${RBT.escapeHtml(err.message)}</span></div>`;
    }

    btn.disabled = false;
    btn.textContent = 'Trouve-moi un parcours';
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
