/* ===========================================================
   Export vers Google Drive — fiche de conseils du coach
   IMPORTANT : remplace GOOGLE_OAUTH_CLIENT_ID ci-dessous par ton
   Client ID OAuth (créé dans la console Google Cloud, type
   "Application Web", avec jeremy1277.github.io en origine autorisée).
   Scope utilisé : drive.file (accès uniquement aux fichiers créés
   par cette appli — jamais le reste de ton Drive).
   =========================================================== */

const GOOGLE_OAUTH_CLIENT_ID = 'COLLE_TON_CLIENT_ID_OAUTH_ICI';

const RBTDrive = {
  _tokenClient: null,
  _gisLoaded: false,
  _gisLoading: null,

  async _loadGis() {
    if (RBTDrive._gisLoaded) return;
    if (RBTDrive._gisLoading) return RBTDrive._gisLoading;

    RBTDrive._gisLoading = new Promise((resolve, reject) => {
      if (!GOOGLE_OAUTH_CLIENT_ID || GOOGLE_OAUTH_CLIENT_ID.includes('COLLE_TON_CLIENT_ID')) {
        reject(new Error('Client ID OAuth Google non configuré. Remplace GOOGLE_OAUTH_CLIENT_ID dans drive-export.js.'));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => { RBTDrive._gisLoaded = true; resolve(); };
      script.onerror = () => reject(new Error('Impossible de charger Google Identity Services.'));
      document.head.appendChild(script);
    });

    return RBTDrive._gisLoading;
  },

  async _getAccessToken() {
    await RBTDrive._loadGis();

    return new Promise((resolve, reject) => {
      RBTDrive._tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
          if (response.error) reject(new Error('Autorisation refusée ou échouée.'));
          else resolve(response.access_token);
        },
      });
      RBTDrive._tokenClient.requestAccessToken();
    });
  },

  // Construit le texte de la fiche à partir des conseils du coach pour un sport donné.
  _buildCoachSheetText(sport) {
    const advice = RBT.state.coach[sport];
    const sportLabel = sport === 'velo' ? 'Vélo' : 'Course à pied';
    if (!advice) return `Fiche coach — ${sportLabel}\n\nPas encore de conseils générés.`;

    const date = new Date(advice.generated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    let text = `RUN & BIKE TRAINER — FICHE COACH\n${sportLabel} — générée le ${date}\n${'='.repeat(50)}\n\nCONSTAT\n${advice.constat || ''}\n\n`;

    if (advice.seances && advice.seances.length) {
      text += `SÉANCES RECOMMANDÉES\n${'-'.repeat(50)}\n`;
      advice.seances.forEach((s, i) => {
        text += `${i + 1}. ${s.titre} ${s.done ? '[FAIT]' : ''}\n   Terrain : ${s.type_terrain} — Durée : ${s.duree_min} min — Zone FC : ${s.zone_fc_cible}\n   ${s.objectif}\n\n`;
      });
    }

    if (advice.vigilance) {
      text += `POINT DE VIGILANCE\n${'-'.repeat(50)}\n${advice.vigilance}\n`;
    }

    return text;
  },

  async exportCoachSheet(sport, buttonEl) {
    const sportLabel = sport === 'velo' ? 'velo' : 'course';
    const originalText = buttonEl.textContent;
    buttonEl.disabled = true;
    buttonEl.textContent = 'Connexion à Drive...';

    try {
      const accessToken = await RBTDrive._getAccessToken();
      buttonEl.textContent = 'Enregistrement...';

      const text = RBTDrive._buildCoachSheetText(sport);
      const fileName = `RunBikeTrainer_Coach_${sportLabel}_${new Date().toISOString().slice(0, 10)}.txt`;

      const metadata = { name: fileName, mimeType: 'text/plain' };
      const boundary = 'rbt_boundary_' + Date.now();
      const body =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: text/plain\r\n\r\n${text}\r\n--${boundary}--`;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      });

      if (!res.ok) throw new Error('Échec de l\'upload vers Drive.');
      const data = await res.json();

      buttonEl.textContent = 'Enregistré ✓';
      setTimeout(() => { buttonEl.textContent = originalText; buttonEl.disabled = false; }, 2500);
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'export vers Drive.');
      buttonEl.textContent = originalText;
      buttonEl.disabled = false;
    }
  },
};
