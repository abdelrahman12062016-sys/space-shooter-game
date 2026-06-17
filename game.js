// ==========================================================================
// SPACE SHOOTER: COMPLETE MASTER ARCHITECTUUR (ALLES INTEGRATIE)
// ==========================================================================

// --- 1. GLOBALE CONFIGURATIE ---
const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PLAYER_BASE_SPEED: 5,
  PLAYER_INVULN_DURATION: 2000, 
  BULLET_NORMAL_SPEED: -8,
  BULLET_SPREAD_SPEED: -7,
  BULLET_BEAM_SPEED: -16,
  ENEMY_MIN_SPEED: 1.5,
  ENEMY_MAX_SPEED: 3.5,
  BOSS_HP_PER_LEVEL: 50,
  PARTICLE_DECAY_MIN: 0.01,
  PARTICLE_DECAY_MAX: 0.03
};

// --- 2. GAME STATE ---
let isAdmin = false;                           
let isLoggedIn = false;                        
let currentLoggedInUser = ""; 
let timeFrozen = false;

let gameStarted = false;
let gameOver = false;
let gamePaused = false;
let victoryAchieved = false;

let score = 0;
let lives = 3;
let currentLevel = 1;
let highScore = parseInt(localStorage.getItem("space_shooter_master_hs")) || 0;

// Entities & Object Pools
let player = {
  x: 385,
  y: 500,
  size: 32,
  speed: CONFIG.PLAYER_BASE_SPEED,
  invulnerable: false,
  invulnTimer: 0,
  width: 32,
  height: 32
};

let bullets = [];       
let enemyBullets = [];  
let enemies = [];       
let stars = [];         
let fireworks = [];     
let damageNumbers = []; 
let powerUps = [];      
let particles = [];     

// Weapon & Power-up Mechanics
let activeWeapon = "normal";    // 'normal', 'spread', 'beam'
let weaponExpiresAt = 0;        
let activePowerUp = null;       // 'shield', 'multiplier'
let powerUpExpiresAt = 0;       
let controlMode = localStorage.getItem("controlMode") || "pc"; 

let keys = {};
let mouse = { x: 0, y: 0 };

// Spawner Intervals & Timers
let timers = {
  enemySpawn: 0,
  enemyInterval: 1200,      
  powerUpSpawn: 0,
  powerUpInterval: 15000,   
  lastBossShot: 0
};

let currentBoss = null;
let nextBossScore = 100;    

// --- 3. LOCAL STORAGE DATABASE (EXACTE ADMINS & WACHTWOORDEN) ---
let accounts = JSON.parse(localStorage.getItem("space_accounts_db")) || {
  "abdelamr": { password: "abdelamradmin6767", isAdmin: true },
  "darianmeyer": { password: "darianadmim6767", isAdmin: true },
  "abdullahminihoofd": { password: "abdull123admin", isAdmin: true }
};

let leaderboard = JSON.parse(localStorage.getItem("space_leaderboard_db")) || [
  { username: "abdullahminihoofd", score: 5000, date: "2026-06-17" },
  { username: "abdelamr", score: 3500, date: "2026-06-17" },
  { username: "darianmeyer", score: 2200, date: "2026-06-17" }
];

// --- 4. ADVANCED SYNTHESIZER AUDIO ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    switch (type) {
      case "shoot":
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); 
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case "spread":
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now); 
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case "beam":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, now); 
        osc.frequency.linearRampToValueAtTime(660, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case "hit":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case "explosion":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case "powerup":
        osc.type = "sine";
        osc.frequency.setValueAtTime(261.63, now); 
        osc.frequency.linearRampToValueAtTime(523.25, now + 0.15); 
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case "boss_spawn":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        break;
    }
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

// --- 5. INTERACTIEF ACCOUNT SYSTEEM ---
function showSignUp() {
  document.getElementById("login-box").style.display = "none";
  document.getElementById("signup-box").style.display = "flex";
  document.getElementById("login-error").innerText = "";
}
window.showSignUp = showSignUp;

function showLogin() {
  document.getElementById("signup-box").style.display = "none";
  document.getElementById("login-box").style.display = "flex";
  document.getElementById("login-error").innerText = "";
}
window.showLogin = showLogin;

function updateLeaderboardsUI() {
  const html = leaderboard.slice(0, 5).map((entry, index) => {
    return `<li><span class="rank">#${index+1}</span> ${entry.username} - <strong>${entry.score}</strong></li>`;
  }).join("");
  
  const l1 = document.getElementById("start-leaderboard");
  const l2 = document.getElementById("gameover-leaderboard");
  if (l1) l1.innerHTML = html;
  if (l2) l2.innerHTML = html;
}

function logInUser(username, adminStatus) {
  isLoggedIn = true;
  currentLoggedInUser = username;
  isAdmin = adminStatus;

  document.getElementById("login-screen").style.display = "none";
  document.getElementById("hud-username").innerText = username;

  const adminButton = document.getElementById("admin-touch-button");
  if (isAdmin) {
    if (adminButton) adminButton.style.display = "block";
    const adminPanelTitle = document.getElementById("admin-panel-user");
    if (adminPanelTitle) adminPanelTitle.innerText = username + " (ROOT)";
  } else {
    if (adminButton) adminButton.style.display = "none";
    document.getElementById("hacker-admin-panel").style.display = "none";
  }

  updateLeaderboardsUI();
  playSound("powerup");
}

function checkLogin() {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;
  const err = document.getElementById("login-error");

  if (!u || !p) { return err.innerText = "Velden mogen niet leeg zijn!"; }

  if (accounts[u] && accounts[u].password === p) {
    logInUser(u, accounts[u].isAdmin);
  } else {
    err.innerText = "Ongeldige logingegevens.";
  }
}
window.checkLogin = checkLogin;

// --- 6. PARTICLES & VUURWERK ENGINE ---
function createExplosion(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    particles.push({
      x: x, y: y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      color: color,
      alpha: 1,
      decay: CONFIG.PARTICLE_DECAY_MIN + Math.random() * (CONFIG.PARTICLE_DECAY_MAX - CONFIG.PARTICLE_DECAY_MIN)
    });
  }
}

// --- 7. WEAPON MECHANICS ---
function fireWeapon() {
  if (!gameStarted || gamePaused || gameOver) return;

  if (activeWeapon !== "normal" && Date.now() > weaponExpiresAt) {
    activeWeapon = "normal";
    document.getElementById("power-up-status").innerText = "None";
  }

  const pX = player.x + player.size / 2;
  const pY = player.y;

  if (activeWeapon === "normal") {
    bullets.push({ x: pX - 2, y: pY, dx: 0, dy: CONFIG.BULLET_NORMAL_SPEED, size: 4, isBeam: false });
    playSound("shoot");
  } else if (activeWeapon === "spread") {
    bullets.push({ x: pX - 2, y: pY, dx: 0, dy: CONFIG.BULLET_SPREAD_SPEED, size: 4, isBeam: false });
    bullets.push({ x: pX - 8, y: pY, dx: -2, dy: CONFIG.BULLET_SPREAD_SPEED, size: 4, isBeam: false });
    bullets.push({ x: pX + 4, y: pY, dx: 2, dy: CONFIG.BULLET_SPREAD_SPEED, size: 4, isBeam: false });
    playSound("spread");
  } else if (activeWeapon === "beam") {
    bullets.push({ x: pX - 5, y: pY, dx: 0, dy: CONFIG.BULLET_BEAM_SPEED, size: 10, isBeam: true });
    playSound("beam");
  }
}

// --- 8. GAME UPDATE ENGINE ---
function update() {
  if (!gameStarted || gameOver || gamePaused) return;

  if (player.invulnerable && Date.now() > player.invulnTimer) player.invulnerable = false;

  // Parallax Sterren
  stars.forEach(star => { star.y += star.speed; if (star.y > CONFIG.CANVAS_HEIGHT) star.y = 0; });

  // Speler bewegen
  if ((keys["w"] || keys["arrowup"]) && player.y > 0) player.y -= player.speed;
  if ((keys["s"] || keys["arrowdown"]) && player.y < CONFIG.CANVAS_HEIGHT - player.size) player.y += player.speed;
  if ((keys["a"] || keys["arrowleft"]) && player.x > 0) player.x -= player.speed;
  if ((keys["d"] || keys["arrowright"]) && player.x < CONFIG.CANVAS_WIDTH - player.size) player.x += player.speed;

  // Deeltjes updaten
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i]; p.x += p.dx; p.y += p.dy; p.alpha -= p.decay;
    if (p.alpha <= 0) particles.splice(i, 1);
  }

  // Boss Logica
  if (currentBoss && !timeFrozen) {
    if (currentBoss.y < 75) currentBoss.y += 1.5;
    currentBoss.x += Math.sin(Date.now() / 600) * currentBoss.speed;
    if (Date.now() - currentBoss.lastShot > currentBoss.shootInterval) {
      currentBoss.lastShot = Date.now();
      for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI / 4)) {
        enemyBullets.push({ x: currentBoss.x + currentBoss.size / 2, y: currentBoss.y + currentBoss.size / 2, dx: Math.cos(angle) * 3, dy: Math.sin(angle) * 3, size: 7 });
      }
    }
  }

  // Kogels versus Vijanden
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    let b = bullets[bi]; b.y += b.dy;
    if (b.y < 0) { bullets.splice(bi, 1); continue; }

    if (currentBoss && b.x > currentBoss.x && b.x < currentBoss.x + currentBoss.size && b.y > currentBoss.y && b.y < currentBoss.y + currentBoss.size) {
      currentBoss.hp--; bullets.splice(bi, 1);
      if (currentBoss.hp <= 0) { createExplosion(currentBoss.x+40, currentBoss.y+40, "#a855f7", 30); currentBoss = null; score += 500; currentLevel++; }
      continue;
    }

    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      let e = enemies[ei];
      if (b.x < e.x + e.size && b.x + b.size > e.x && b.y < e.y + e.size && b.y + b.size > e.y) {
        createExplosion(e.x + 12, e.y + 12, "#fff176", 8);
        enemies.splice(ei, 1); bullets.splice(bi, 1);
        score += 10; document.getElementById("score").innerText = score;
        if (score >= nextBossScore && !currentBoss) { currentBoss = { x: 360, y: -100, size: 80, hp: 50, maxHp: 50, speed: 2, lastShot: Date.now(), shootInterval: 1200 }; playSound("boss_spawn"); }
        break;
      }
    }
  }

  // Vijanden bewegen
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    let e = enemies[ei]; if (!timeFrozen) e.y += e.speed;
    if (e.y > CONFIG.CANVAS_HEIGHT) { enemies.splice(ei, 1); continue; }
    if (e.x < player.x + player.size && e.x + e.size > player.x && e.y < player.y + player.size && e.y + e.size > player.y) {
      enemies.splice(ei, 1); playerHit();
    }
  }
}

function playerHit() {
  if (player.invulnerable) return;
  lives--; document.getElementById("lives").innerText = lives;
  createExplosion(player.x + 16, player.y + 16, "#ff304f", 20); playSound("explosion");
  if (lives <= 0) { gameOver = true; document.getElementById("game-over-screen").classList.remove("hidden"); }
  else { player.invulnerable = true; player.invulnTimer = Date.now() + CONFIG.PLAYER_INVULN_DURATION; player.x = 385; player.y = 500; }
}

// --- 9. ADMIN ACTIONS ---
function toggleAdminPanel() { if(isAdmin) { const p = document.getElementById("hacker-admin-panel"); p.style.display = p.style.display === "block" ? "none" : "block"; } }
window.toggleAdminPanel = toggleAdminPanel;

function triggerCheat(type) {
  if (!isAdmin) return;
  if (type === 'godmode') { player.invulnerable = !player.invulnerable; player.invulnTimer = player.invulnerable ? Date.now() + 9999999 : Date.now(); }
  if (type === 'score') { score += 1000; document.getElementById("score").innerText = score; }
  if (type === 'nuke') { enemies = []; enemyBullets = []; createExplosion(400, 300, "#ff304f", 40); }
}
window.triggerCheat = triggerCheat;

// --- 10. INTERFACE CONTROLS ---
function startGame() {
  gameStarted = true; gameOver = false; gamePaused = false; score = 0; lives = 3; enemies = []; bullets = []; currentBoss = null;
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-over-screen").classList.add("hidden");
  document.getElementById("hud").classList.remove("hidden");
}
window.startGame = startGame;

// --- 11. RENDERING ---
const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

function draw() {
  if (!ctx) return;
  ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff"; stars.forEach(s => ctx.fillRect(s.x, s.y, 2, 2)); 
  particles.forEach(p => { ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.restore(); });

  if (!gameStarted || gameOver) return;
  ctx.fillStyle = "#00e5ff"; ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.fillStyle = "#ff304f"; enemies.forEach(e => ctx.fillRect(e.x, e.y, e.size, e.size));
  ctx.fillStyle = "#fff176"; bullets.forEach(b => ctx.fillRect(b.x, b.y, b.size, b.size));
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

// --- 12. INITIALISATIE SYSTEM START ---
window.addEventListener("DOMContentLoaded", () => {
  for (let i = 0; i < 60; i++) stars.push({ x: Math.random() * CONFIG.CANVAS_WIDTH, y: Math.random() * CONFIG.CANVAS_HEIGHT, speed: 0.5 + Math.random() * 1.5 });
  
  // Handmatige veilige element checks voor knoppen
  const lBtn = document.getElementById("login-submit-button");
  if (lBtn) lBtn.addEventListener("click", checkLogin);
  
  const sBtn = document.getElementById("start-button");
  if (sBtn) sBtn.addEventListener("click", startGame);

  const aBtn = document.getElementById("admin-touch-button");
  if (aBtn) aBtn.addEventListener("click", toggleAdminPanel);
  
  window.addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true; if(e.key === " ") fireWeapon(); });
  window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  setInterval(() => { if (gameStarted && !gamePaused && !gameOver) enemies.push({ x: Math.random() * (CONFIG.CANVAS_WIDTH - 24), y: -24, size: 24, speed: 2 }); }, 1200);

  updateLeaderboardsUI();
  loop();
});
