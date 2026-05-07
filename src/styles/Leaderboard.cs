/* =========================================
   MANIFIX ELITE: THE 1% CLUB LEADERBOARD
   ========================================= */

:root {
  --gold: #D4AF37;
  --gold-glow: rgba(212, 175, 55, 0.3);
  --bg-deep: #050505;
  --card-bg: #0d0d0d;
}

.leaderboard-pro-container {
  background: var(--bg-deep);
  min-height: 100vh;
  padding-bottom: 120px; /* Space for sticky bar */
  color: white;
  font-family: 'Inter', sans-serif;
}

/* --- HEADER & TABS --- */
.leaderboard-header {
  text-align: center;
  padding: 60px 20px 30px;
}

.leaderboard-header h1 {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #fff 0%, var(--gold) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.filter-tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 30px;
}

.filter-tabs button {
  background: #111;
  border: 1px solid #222;
  color: #666;
  padding: 10px 25px;
  border-radius: 50px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.3s;
}

.filter-tabs button.active {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(212, 175, 55, 0.05);
}

/* --- PODIUM (TOP 3) --- */
.podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20px;
  padding: 40px 20px;
  max-width: 600px;
  margin: 0 auto;
}

.podium-spot {
  text-align: center;
  flex: 1;
}

.avatar-ring {
  width: 70px;
  height: 70px;
  margin: 0 auto 15px;
  border-radius: 50%;
  border: 2px solid var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111;
  box-shadow: 0 0 20px var(--gold-glow);
  position: relative;
}

.rank-1 .avatar-ring { width: 90px; height: 90px; border-width: 4px; }

.country-flag { font-size: 24px; }

.streak-badge {
  background: var(--gold);
  color: black;
  font-size: 10px;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 50px;
  display: inline-block;
}

/* --- THE MAIN LIST --- */
.leaderboard-list {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.user-row {
  display: flex;
  align-items: center;
  background: var(--card-bg);
  padding: 15px 20px;
  border-radius: 16px;
  margin-bottom: 12px;
  border: 1px solid rgba(255,255,255,0.03);
  transition: 0.3s;
}

.user-row:hover {
  border-color: var(--gold-glow);
  transform: scale(1.01);
}

.rank-num {
  font-weight: 900;
  color: #444;
  width: 40px;
}

.user-info { flex: 1; }
.user-name { font-weight: 700; display: block; }
.pro-check { color: var(--gold); margin-left: 5px; }
.user-stats { font-size: 11px; color: #666; }
.user-streak { font-weight: 900; color: var(--gold); }

/* --- STICKY STATUS BAR --- */
.my-status-sticky {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(13, 13, 13, 0.9);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--gold-glow);
  padding: 20px;
  z-index: 100;
}

.inner {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank-label { display: block; font-size: 10px; color: #666; letter-spacing: 1px; }
.rank-val { font-size: 20px; font-weight: 900; color: white; }

.upgrade-prompt {
  background: var(--gold);
  color: black;
  text-decoration: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 900;
  font-size: 12px;
  transition: 0.3s;
}

.upgrade-prompt:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px var(--gold-glow);
}

/* MOBILE OPTIMIZATION */
@media (max-width: 480px) {
  .podium { gap: 10px; }
  .avatar-ring { width: 50px; height: 50px; }
  .rank-1 .avatar-ring { width: 70px; height: 70px; }
  .inner { padding: 0 10px; }
}
