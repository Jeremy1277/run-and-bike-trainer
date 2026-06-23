/* ===========================================================
   Run & Bike Trainer — design system
   Univers : compteur de vélo embarqué, lecture nocturne, relief.
   =========================================================== */

@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

:root {
  --bg: #14171a;
  --bg-raised: #1c2024;
  --bg-card: #20242a;
  --bg-card-hover: #262b32;
  --line: #2e343b;
  --line-bright: #3a424b;
  --ink: #f5f3ee;
  --ink-soft: #9aa1a9;
  --ink-faint: #5c636b;

  --signal: #ff6b35;
  --signal-dim: #4a2c1f;
  --moss: #4fd1a5;
  --moss-dim: #1f3d34;
  --alert: #e8553f;
  --alert-dim: #3d2420;
  --amber: #f2b84b;

  --shadow: rgba(0, 0, 0, 0.35);
  --radius: 14px;
  --radius-sm: 8px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { color-scheme: dark; }

body {
  background: var(--bg);
  color: var(--ink);
  font-family: 'Space Grotesk', sans-serif;
  line-height: 1.5;
  padding-bottom: 80px;
  -webkit-font-smoothing: antialiased;
}

.mono { font-family: 'DM Mono', monospace; }

a { color: inherit; text-decoration: none; }

button {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 14px;
  padding: 11px 20px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  transition: transform 0.1s ease, opacity 0.15s ease, background 0.15s ease;
}
button:active { transform: scale(0.97); }
button:disabled { opacity: 0.45; cursor: default; }

.btn-signal { background: var(--signal); color: #1a0d06; }
.btn-signal:hover:not(:disabled) { background: #ff7d4d; }
.btn-ghost { background: transparent; color: var(--ink-soft); border: 1px solid var(--line-bright); }
.btn-ghost:hover { border-color: var(--ink-soft); color: var(--ink); }
.btn-small { padding: 6px 12px; font-size: 12px; border-radius: 6px; }
.btn-danger-ghost { background: transparent; color: var(--alert); border: 1px solid #5c2e26; }
.btn-danger-ghost:hover { background: var(--alert-dim); }

.rbt-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1080px;
  margin: 0 auto;
  padding: 20px 24px;
}
.rbt-nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
}
.rbt-nav-mark {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--signal);
  flex-shrink: 0;
}
.rbt-nav-links { display: flex; gap: 4px; }
.rbt-nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-soft);
}
.rbt-nav-link svg { width: 16px; height: 16px; }
.rbt-nav-link:hover { color: var(--ink); background: var(--bg-raised); }
.rbt-nav-link.active { color: var(--signal); background: var(--signal-dim); }

.relief-hero {
  position: relative;
  max-width: 1080px;
  margin: 0 auto 8px;
  padding: 8px 24px 36px;
  overflow: hidden;
}
.relief-svg {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  width: 100%;
  height: 90px;
  opacity: 0.5;
  pointer-events: none;
}
.relief-content { position: relative; z-index: 1; }
.relief-eyebrow {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--signal);
  margin-bottom: 10px;
}
.relief-title {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 6px;
}
.relief-sub { color: var(--ink-soft); font-size: 15px; }

.status-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  flex-wrap: wrap;
}
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--moss); flex-shrink: 0; }
.dot.off { background: var(--ink-faint); }

main { max-width: 1080px; margin: 0 auto; padding: 8px 24px 24px; }

.empty-state { text-align: center; padding: 90px 24px; color: var(--ink-soft); }
.empty-state h2 { color: var(--ink); font-size: 22px; margin-bottom: 8px; font-weight: 600; }

.loading-msg { text-align: center; padding: 70px; color: var(--ink-faint); font-family: 'DM Mono', monospace; font-size: 13px; }

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 16px 18px;
}
.stat-card .label {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: 8px;
}
.stat-card .value { font-size: 28px; font-weight: 700; line-height: 1; font-family: 'DM Mono', monospace; }
.stat-card .value .unit { font-size: 13px; font-weight: 500; color: var(--ink-soft); margin-left: 4px; font-family: 'Space Grotesk', sans-serif; }

.panel {
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 20px;
}
.panel h3 { font-size: 17px; font-weight: 600; margin-bottom: 4px; }
.panel .panel-sub { color: var(--ink-soft); font-size: 13px; margin-bottom: 18px; }
.panel-head-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }

.activity-row {
  display: grid;
  grid-template-columns: 84px 1fr 76px 70px 70px 64px 70px 90px;
  gap: 10px;
  align-items: center;
  padding: 13px 0;
  border-bottom: 1px solid var(--line);
  font-size: 14px;
}
.activity-row:last-child { border-bottom: none; }
.activity-row.excluded { opacity: 0.35; }
.activity-row .date {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: var(--ink-soft);
  cursor: pointer;
  border-bottom: 1px dashed var(--ink-faint);
  width: fit-content;
}
.activity-row .date:hover { color: var(--signal); border-color: var(--signal); }
.activity-row .name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.activity-row .metric { font-family: 'DM Mono', monospace; font-size: 13px; text-align: right; color: var(--ink-soft); }
.activity-row .metric strong { color: var(--ink); font-weight: 500; }
.activity-row .source {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  color: var(--ink-faint);
  text-align: center;
  padding: 3px 4px;
  border-radius: 5px;
  background: var(--bg-raised);
}
.activity-row .action { text-align: right; }

.row-head {
  display: grid;
  grid-template-columns: 84px 1fr 76px 70px 70px 64px 70px 90px;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line-bright);
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-faint);
}
.row-head .metric { text-align: right; }
.row-head .action { text-align: right; }

@media (max-width: 720px) {
  .activity-row, .row-head { grid-template-columns: 64px 1fr 56px 70px; }
  .activity-row > *:nth-child(3), .activity-row > *:nth-child(4),
  .activity-row > *:nth-child(6),
  .row-head > *:nth-child(3), .row-head > *:nth-child(4),
  .row-head > *:nth-child(6) { display: none; }
}

.insight { display: flex; gap: 14px; padding: 16px; border-radius: var(--radius-sm); margin-bottom: 12px; align-items: flex-start; }
.insight.up { background: var(--moss-dim); }
.insight.down { background: var(--alert-dim); }
.insight.neutral { background: var(--bg-raised); }
.insight .icon {
  font-family: 'DM Mono', monospace;
  font-size: 20px;
  font-weight: 700;
  width: 26px;
  text-align: center;
  flex-shrink: 0;
}
.insight.up .icon { color: var(--moss); }
.insight.down .icon { color: var(--alert); }
.insight.neutral .icon { color: var(--ink-faint); }
.insight .text { font-size: 14px; }
.insight .text strong { font-weight: 600; }
.insight .text .detail { color: var(--ink-soft); font-size: 13px; margin-top: 3px; }
.insight .tag {
  display: inline-block;
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 4px;
  margin-left: 6px;
  background: var(--amber);
  color: #2e1f04;
  vertical-align: middle;
}

.coach-panel { border-color: var(--signal-dim); background: linear-gradient(135deg, var(--bg-card) 0%, #241f1a 100%); }
.coach-text { font-size: 15px; line-height: 1.7; white-space: pre-wrap; color: var(--ink); }
.coach-text strong { font-weight: 600; color: var(--signal); }
.coach-meta { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--ink-faint); margin-top: 16px; }
.coach-vigilance {
  margin-top: 16px;
  padding: 12px 14px;
  background: var(--alert-dim);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: #f3c4bc;
  display: flex;
  gap: 10px;
}

.timeline { position: relative; padding-left: 36px; }
.timeline::before {
  content: '';
  position: absolute;
  left: 11px; top: 6px; bottom: 6px;
  width: 2px;
  background: var(--line-bright);
}
.timeline-item { position: relative; padding-bottom: 22px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot {
  position: absolute;
  left: -36px; top: 2px;
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--bg-raised);
  border: 2px solid var(--line-bright);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.timeline-dot:hover { border-color: var(--signal); }
.timeline-dot.done { background: var(--moss); border-color: var(--moss); }
.timeline-dot svg { width: 13px; height: 13px; color: var(--bg); opacity: 0; transition: opacity 0.15s; }
.timeline-dot.done svg { opacity: 1; }
.timeline-card {
  background: var(--bg-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
}
.timeline-item.done .timeline-card { opacity: 0.5; }
.timeline-item.done .timeline-title { text-decoration: line-through; }
.timeline-title { font-weight: 600; font-size: 14.5px; margin-bottom: 4px; }
.timeline-meta {
  display: flex;
  gap: 10px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--ink-faint);
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.timeline-meta span { display: flex; align-items: center; gap: 4px; }
.timeline-badge {
  padding: 1px 7px;
  border-radius: 4px;
  background: var(--bg-card);
  border: 1px solid var(--line-bright);
}
.timeline-objectif { font-size: 13px; color: var(--ink-soft); }

.map-search-row { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.map-search-row input[type="text"] {
  flex: 1;
  min-width: 180px;
  background: var(--bg-raised);
  border: 1px solid var(--line-bright);
  color: var(--ink);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
}
.map-search-row input[type="text"]:focus { outline: none; border-color: var(--signal); }
#map-canvas {
  width: 100%;
  height: 360px;
  border-radius: var(--radius-sm);
  background: var(--bg-raised);
  margin-bottom: 12px;
}
.map-result-list { display: flex; flex-direction: column; gap: 8px; }
.map-result-item {
  background: var(--bg-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.map-result-name { font-weight: 500; font-size: 14px; }
.map-result-meta { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--ink-faint); }

.rbt-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
  padding: 20px;
}
.rbt-modal {
  background: var(--bg-card);
  border: 1px solid var(--line-bright);
  border-radius: var(--radius);
  padding: 24px;
  max-width: 360px;
  width: 100%;
}
.rbt-modal h4 { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.rbt-modal .modal-sub { font-size: 13px; color: var(--ink-soft); margin-bottom: 16px; }
.rbt-modal input[type="date"] {
  width: 100%;
  background: var(--bg-raised);
  border: 1px solid var(--line-bright);
  color: var(--ink);
  font-family: 'DM Mono', monospace;
  font-size: 14px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
}
.rbt-modal-actions { display: flex; gap: 8px; justify-content: flex-end; }

canvas { width: 100% !important; max-height: 320px; }

@media (max-width: 640px) {
  .rbt-nav-link span { display: none; }
  .relief-title { font-size: 26px; }
}
