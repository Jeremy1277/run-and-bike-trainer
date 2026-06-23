/* ===========================================================
   Run & Bike Trainer — logique partagée entre les pages
   =========================================================== */

const API_BASE = 'https://run-and-bike-trainer-api.onrender.com';

const RBT = {
  state: {
    activities: [],
    excludedIds: [],
    dateOverrides: {},
    coach: { velo: null, course: null, seances_status: {} },
    connected: false,
    athlete: null,
  },

  // --- Utils ---
  fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  },
  fmtDateLong(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  },
  fmtMonthLabel(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  },
  fmtKm(meters) { return (meters / 1000).toFixed(1); },
  fmtSpeed(mps) { return mps ? (mps * 3.6).toFixed(1) : '—'; },
  ratioDplusKm(act) {
    const km = act.distance / 1000;
    return km > 0 ? act.total_elevation_gain / km : 0;
  },
  // Renvoie la date effective d'une activité : la correction manuelle si elle existe, sinon la date Strava.
  effectiveDate(act) {
    return RBT.state.dateOverrides[act.id] || act.start_date;
  },
  guessSource(act) {
    const ext = (act.external_id || '').toLowerCase();
    if (ext.includes('garmin')) return 'Garmin';
    if (ext.includes('wahoo')) return 'Wahoo';
    if (ext.includes('igpsport') || ext.includes('igs')) return 'iGPSport';
    if (act.upload_id_str || act.upload_id) return 'Import';
    if (act.manual) return 'Manuel';
    return 'Strava';
  },
  escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  // --- Chargement initial : utilisé par toutes les pages ---
  async loadAll() {
    const statusRes = await fetch(`${API_BASE}/api/status`);
    const status = await statusRes.json();
    RBT.state.connected = !!status.connected;
    RBT.state.athlete = status.athlete || null;

    if (!RBT.state.connected) return false;

    const [actRes, excludedRes, overridesRes, coachRes] = await Promise.all([
      fetch(`${API_BASE}/api/activities`),
      fetch(`${API_BASE}/api/excluded`).catch(() => null),
      fetch(`${API_BASE}/api/date-overrides`).catch(() => null),
      fetch(`${API_BASE}/api/coach`).catch(() => null),
    ]);

    const data = await actRes.json();
    RBT.state.activities = data.activities || [];

    if (excludedRes) {
      const ex = await excludedRes.json();
      RBT.state.excludedIds = ex.ids || [];
    }
    if (overridesRes) {
      RBT.state.dateOverrides = await overridesRes.json();
    }
    if (coachRes) {
      const coachData = await coachRes.json();
      RBT.state.coach = coachData || { velo: null, course: null, seances_status: {} };
    }

    return true;
  },

  async sync() {
    await fetch(`${API_BASE}/api/sync`);
  },

  async toggleExclude(id, exclude) {
    const action = exclude ? 'exclude' : 'include';
    await fetch(`${API_BASE}/api/activities/${id}/${action}`, { method: 'POST' });
    if (exclude) {
      if (!RBT.state.excludedIds.includes(id)) RBT.state.excludedIds.push(id);
    } else {
      RBT.state.excludedIds = RBT.state.excludedIds.filter((x) => x !== id);
    }
  },

  async setDateOverride(id, newDate) {
    await fetch(`${API_BASE}/api/activities/${id}/date`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate }),
    });
    RBT.state.dateOverrides[id] = newDate;
  },

  async clearDateOverride(id) {
    await fetch(`${API_BASE}/api/activities/${id}/date`, { method: 'DELETE' });
    delete RBT.state.dateOverrides[id];
  },

  async regenerateCoach() {
    const res = await fetch(`${API_BASE}/api/coach/generate`, { method: 'POST' });
    const data = await res.json();
    if (!data.error) RBT.state.coach = data;
    return data;
  },

  async toggleSeance(id) {
    const res = await fetch(`${API_BASE}/api/coach/seance/${id}/toggle`, { method: 'POST' });
    const data = await res.json();
    RBT.state.coach.seances_status[id] = data.done;
    ['velo', 'course'].forEach((sport) => {
      if (RBT.state.coach[sport]?.seances) {
        RBT.state.coach[sport].seances = RBT.state.coach[sport].seances.map((s) =>
          s.id === id ? { ...s, done: data.done } : s
        );
      }
    });
    return data.done;
  },

  // --- Filtres par sport ---
  getRides() {
    return RBT.state.activities
      .filter((a) => a.type === 'Ride' || a.sport_type === 'Ride' || a.sport_type === 'GravelRide')
      .sort((a, b) => new Date(RBT.effectiveDate(b)) - new Date(RBT.effectiveDate(a)));
  },
  getRuns() {
    return RBT.state.activities
      .filter((a) => a.type === 'Run' || a.sport_type === 'Run')
      .sort((a, b) => new Date(RBT.effectiveDate(b)) - new Date(RBT.effectiveDate(a)));
  },

  // --- Navigation commune ---
  renderNav(active) {
    const items = [
      { key: 'home', href: 'index.html', label: 'Accueil', icon: 'M3 11l9-8 9 8M5 10v9a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1v-9' },
      { key: 'velo', href: 'velo.html', label: 'Vélo', icon: 'M5 18a3 3 0 100-6 3 3 0 000 6zM19 18a3 3 0 100-6 3 3 0 000 6zM8 18l3-9h3l4 9M9 9h5l-1-3' },
      { key: 'course', href: 'course.html', label: 'Course', icon: 'M13 4l-2 5 3 2-1 7M9 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM6 21l3-6 3 1 2-4M5 13l3-2' },
    ];
    return `
      <nav class="rbt-nav">
        <div class="rbt-nav-brand">
          <span class="rbt-nav-mark"></span>
          <span>R&amp;B Trainer</span>
        </div>
        <div class="rbt-nav-links">
          ${items.map(i => `
            <a href="${i.href}" class="rbt-nav-link ${active === i.key ? 'active' : ''}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="${i.icon}" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>${i.label}</span>
            </a>
          `).join('')}
        </div>
      </nav>`;
  },

  renderReliefSvg() {
    return `<svg class="relief-svg" viewBox="0 0 1080 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 90 L0 60 Q60 20 120 45 T240 30 Q300 10 360 40 T480 55 Q540 65 600 35 T720 20 Q780 15 840 50 T960 35 Q1020 25 1080 45 L1080 90 Z" fill="#ff6b35" opacity="0.12"/>
      <path d="M0 90 L0 70 Q80 45 160 60 T320 50 Q400 35 480 58 T640 65 Q720 50 800 60 T960 48 Q1020 42 1080 55 L1080 90 Z" fill="#ff6b35" opacity="0.18"/>
    </svg>`;
  },
};
