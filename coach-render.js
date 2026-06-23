/* ===========================================================
   Rendu du Coach IA : panneau de constat + frise de séances
   =========================================================== */

const RBTCoach = {
  renderPanel(sport) {
    const advice = RBT.state.coach[sport];

    if (!advice) {
      return `
        <div class="panel coach-panel">
          <h3>Coach IA</h3>
          <div class="panel-sub">Pas encore de recommandations générées pour ce sport.</div>
          <button class="btn-signal" id="coachRegenBtn-${sport}" data-coach-regen="${sport}">Générer mes conseils</button>
        </div>`;
    }

    const generatedDate = new Date(advice.generated_at).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });

    const escaped = RBT.escapeHtml(advice.constat || '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    return `
      <div class="panel coach-panel">
        <div class="panel-head-row">
          <h3>Coach IA</h3>
          <div style="display:flex; gap:8px;">
            <button class="btn-ghost btn-small" id="coachDriveBtn-${sport}" data-coach-drive="${sport}">Enregistrer dans Drive</button>
            <button class="btn-ghost btn-small" id="coachRegenBtn-${sport}" data-coach-regen="${sport}">Régénérer les conseils</button>
          </div>
        </div>
        <div class="coach-text">${escaped}</div>
        ${advice.vigilance ? `
          <div class="coach-vigilance">
            <span>⚠</span>
            <span>${RBT.escapeHtml(advice.vigilance)}</span>
          </div>` : ''}
        <div class="coach-meta">Généré le ${generatedDate}</div>
      </div>`;
  },

  renderTimeline(sport) {
    const advice = RBT.state.coach[sport];
    if (!advice || !advice.seances || advice.seances.length === 0) return '';

    const terrainLabel = { plat: 'Plat', vallonne: 'Vallonné', montagneux: 'Montagneux' };

    return `
      <div class="panel">
        <h3>Prochaines séances</h3>
        <div class="panel-sub">Coche au fur et à mesure que tu les fais</div>
        <div class="timeline">
          ${advice.seances.map((s) => `
            <div class="timeline-item ${s.done ? 'done' : ''}">
              <div class="timeline-dot ${s.done ? 'done' : ''}" data-toggle-seance="${s.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div class="timeline-card">
                <div class="timeline-title">${RBT.escapeHtml(s.titre)}</div>
                <div class="timeline-meta">
                  <span class="timeline-badge">${terrainLabel[s.type_terrain] || s.type_terrain}</span>
                  <span class="timeline-badge">${s.duree_min} min</span>
                  <span class="timeline-badge">${RBT.escapeHtml(s.zone_fc_cible)}</span>
                </div>
                <div class="timeline-objectif">${RBT.escapeHtml(s.objectif)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  },

  attachHandlers(sport, rerenderFn) {
    const btn = document.querySelector(`[data-coach-regen="${sport}"]`);
    if (btn) {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Analyse en cours...';
        try {
          const data = await RBT.regenerateCoach();
          if (data.error) {
            alert(data.message || 'Le coach IA n\'est pas configuré côté serveur (clé API manquante).');
          } else {
            rerenderFn();
          }
        } catch (err) {
          alert('Erreur lors de la génération des conseils. Réessaie dans un instant.');
        }
        btn.disabled = false;
        btn.textContent = 'Régénérer les conseils';
      });
    }

    document.querySelectorAll('[data-toggle-seance]').forEach((dot) => {
      dot.addEventListener('click', async () => {
        await RBT.toggleSeance(dot.dataset.toggleSeance);
        rerenderFn();
      });
    });

    const driveBtn = document.querySelector(`[data-coach-drive="${sport}"]`);
    if (driveBtn) {
      driveBtn.addEventListener('click', () => RBTDrive.exportCoachSheet(sport, driveBtn));
    }
  },
};
