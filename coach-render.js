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
        <div class="panel-sub">Coche au fur et à mesure, clique une carte pour voir le détail complet</div>
        <div class="timeline">
          ${advice.seances.map((s) => `
            <div class="timeline-item ${s.done ? 'done' : ''}">
              <div class="timeline-dot ${s.done ? 'done' : ''}" data-toggle-seance="${s.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div class="timeline-card" data-show-detail="${s.id}" style="cursor:pointer;">
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

  renderDetailModal(sport, seance) {
    const terrainLabel = { plat: 'Plat', vallonne: 'Vallonné', montagneux: 'Montagneux' };
    return `
      <div class="rbt-modal-overlay" id="seanceDetailOverlay">
        <div class="rbt-modal" style="max-width: 480px;">
          <h4>${RBT.escapeHtml(seance.titre)}</h4>
          <div class="timeline-meta" style="margin: 8px 0 16px;">
            <span class="timeline-badge">${terrainLabel[seance.type_terrain] || seance.type_terrain}</span>
            <span class="timeline-badge">${seance.duree_min} min</span>
            ${seance.distance_cible_km ? `<span class="timeline-badge">${seance.distance_cible_km} km</span>` : ''}
            <span class="timeline-badge">${RBT.escapeHtml(seance.zone_fc_cible)}</span>
          </div>
          <p style="font-size: 14px; color: var(--ink-soft); line-height: 1.6; margin-bottom: 18px;">${RBT.escapeHtml(seance.explication || seance.objectif)}</p>
          ${seance.blocs && seance.blocs.length ? `
            <div style="border-top: 1px solid var(--line); padding-top: 14px;">
              ${seance.blocs.map((b) => `
                <div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 13px;">
                  <div style="flex: 1;">
                    <div style="font-weight: 600;">${RBT.escapeHtml(b.phase)}</div>
                    <div style="color: var(--ink-soft); margin-top: 2px;">${RBT.escapeHtml(b.description)}</div>
                    ${b.rythme_cible ? `<div class="mono" style="color: var(--moss); margin-top: 4px; font-size: 12px;">${RBT.escapeHtml(b.rythme_cible)}</div>` : ''}
                  </div>
                  <div class="mono" style="text-align: right; flex-shrink: 0; color: var(--ink-soft);">
                    <div>${b.duree_min} min</div>
                    ${b.distance_km ? `<div>${b.distance_km} km</div>` : ''}
                    <div style="color: var(--signal);">${RBT.escapeHtml(b.zone_fc)}</div>
                  </div>
                </div>
              `).join('')}
            </div>` : ''}
          <div class="rbt-modal-actions" style="margin-top: 18px;">
            <button class="btn-ghost btn-small" id="seanceDetailPlan" data-plan-seance='${JSON.stringify({ titre: seance.titre, type_terrain: seance.type_terrain, duree_min: seance.duree_min }).replace(/'/g, "&#39;")}'>Voir un parcours adapté</button>
            <button class="btn-signal btn-small" id="seanceDetailClose">Fermer</button>
          </div>
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

    document.querySelectorAll('[data-show-detail]').forEach((card) => {
      card.addEventListener('click', () => {
        const advice = RBT.state.coach[sport];
        const seance = advice?.seances?.find((s) => s.id === card.dataset.showDetail);
        if (!seance) return;

        const modalContainer = document.getElementById('modalContainer');
        modalContainer.innerHTML = RBTCoach.renderDetailModal(sport, seance);

        document.getElementById('seanceDetailClose').onclick = () => { modalContainer.innerHTML = ''; };
        document.getElementById('seanceDetailOverlay').onclick = (e) => {
          if (e.target.id === 'seanceDetailOverlay') modalContainer.innerHTML = '';
        };
        document.getElementById('seanceDetailPlan').onclick = () => {
          modalContainer.innerHTML = '';
          RBTMap._activeSeance = seance;
          const sub = document.getElementById(`mapContextSub-${sport}`);
          if (sub) {
            sub.innerHTML = `Parcours calé sur : <strong>${RBT.escapeHtml(seance.titre)}</strong> — terrain ${seance.type_terrain}. <button class="btn-ghost btn-small" id="mapClearSeance-${sport}" style="margin-left:8px;">Annuler</button>`;
            document.getElementById(`mapClearSeance-${sport}`)?.addEventListener('click', (ev) => {
              ev.stopPropagation();
              RBTMap._activeSeance = null;
              sub.textContent = 'Renseigne un point de départ, puis clique sur une séance ci-dessus pour générer un parcours adapté — ou lance une recherche libre.';
            });
          }
          document.getElementById(`mapLocationInput-${sport}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
      });
    });

    const driveBtn = document.querySelector(`[data-coach-drive="${sport}"]`);
    if (driveBtn) {
      driveBtn.addEventListener('click', () => RBTDrive.exportCoachSheet(sport, driveBtn));
    }
  },
};
