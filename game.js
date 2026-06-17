// ==========================================================================
// SPACE SHOOTER: COMPLETE ARCHITECTUUR DEEL 1 V3.0 (STABIEL & CRASH-FREE)
// ==========================================================================

// --- 1. GLOBALE CONFIGURATIE ---
const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PLAYER_BASE_SPEED: 5,
  PLAYER_INVULN_DURATION: 2000, // ms na geraakt te worden
  BULLET_NORMAL_SPEED: -8,
  BULLET_SPREAD_SPEED: -7,
  BULLET_BEAM_SPEED: -16,
  ENEMY_MIN_SPEED: 1.5,
  ENEMY_MAX_SPEED: 3.5,
  BOSS_HP_PER_LEVEL: 50,
  PARTICLE_DECAY_MIN: 0.01,
  PARTICLE_DECAY_MAX: 0.03
};

// --- 2. GAME STATE (HET CENTRALE BREIN) ---
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

let bullets = [];       // Speler kogels
let enemyBullets = [];  // Boss / Special enemy kogels
let enemies = [];       // Gewone vijanden
let stars = [];         // Parallax achtergrond sterren
let fireworks = [];     // Victory particles
let damageNumbers = []; // Zwevende combat-text (-1, -3, etc.)
let powerUps = [];      // Vallende power-ups op het scherm
let particles = [];     // Explosie deeltjes

// Weapon & Power-up Mechanics
let activeWeapon = "normal";    // 'normal', 'spread', 'beam'
let weaponExpiresAt = 0;        // Timestamp wanneer wapen verloopt
let activePowerUp = null;       // 'shield', 'multiplier'
let powerUpExpiresAt = 0;       // Timestamp wanneer powerup verloopt
let controlMode = localStorage.getItem("controlMode") || "pc"; // 'pc' of 'mobile'

let keys = {};
let mouse = { x: 0, y: 0 };

// Spawner Intervals & Timers
let timers = {
  enemySpawn: 0,
  enemyInterval: 1200,      // Spawntijd in ms
  powerUpSpawn: 0,
  powerUpInterval: 15000,   // Spawntijd in ms
  lastBossShot: 0
};

let currentBoss = null;
let nextBossScore = 100;    // Score nodig voor de eerste Boss spawn

// --- 3. LOCAL STORAGE DATABASE (ACCOUNTS & LEADERBOARD) ---
let accounts = JSON.parse(localStorage.getItem("space_accounts_db")) || {
  "admin": { password: "masteradminpassword", isAdmin: true },
  "hacker": { password: "root", isAdmin: true },
  "player": { password: "123", isAdmin: false }
};

let leaderboard = JSON.parse(localStorage.getItem("space_leaderboard_db")) || [
  { username: "Admin", score: 5000, date: "2026-06-15" },
  { username: "StarFighter", score: 3500, date: "2026-05-20" },
  { username: "GalaxyQuest", score: 2200, date: "2026-06-01" },
  { username: "Nebula", score: 1100, date: "2026-06-10" },
  { username: "CosmoNoob", score: 150, date: "2026-06-16" }
];

// --- 4. ADVANCED SYNTHESIZER AUDIO ENGINE (WEB AUDIO API) ---
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
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case "spread":
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case "beam":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, now); // A5
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
        // Genereert ruis-achtig effect met sawtooth laag in frequentie
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
        osc.frequency.setValueAtTime(261.63, now); // C4
        osc.frequency.linearRampToValueAtTime(523.25, now + 0.15); // C5
        osc.frequency.linearRampToValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case "boss_spawn":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.4);
        osc.frequency.linearRampToValueAtTime(60, now + 0.8);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        break;
    }
  } catch (e) {
    console.warn("Audio Context init/play error:", e);
  }
}

// --- 5. INTERACTIEF ACCOUNT SYSTEEM ---
function showSignUp() {
  document.getElementById("login-box").style.display = "none";
  document.getElementById("signup-box").style.display = "flex";
  document.getElementById("login-error").innerText = "";
}

// Wordt aangeroepen vanuit HTML link
window.showSignUp = showSignUp;

function showLogin() {
  document.getElementById("signup-box").style.display = "none";
  document.getElementById("login-box").style.display = "flex";
  document.getElementById("login-error").innerText = "";
}
window.showLogin = showLogin;

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

function checkSignUp() {
  const u = document.getElementById("new-username").value.trim();
  const p = document.getElementById("new-password").value;
  const err = document.getElementById("login-error");

  if (!u || !p) { return err.innerText = "Kies een naam & wachtwoord!"; }
  if (accounts[u]) { return err.innerText = "Gebruikersnaam bestaat al!"; }

  accounts[u] = { password: p, isAdmin: false };
  localStorage.setItem("space_accounts_db", JSON.stringify(accounts));
  logInUser(u, false);
}
window.checkSignUp = checkSignUp;

function logInUser(username, adminStatus) {
  isLoggedIn = true;
  currentLoggedInUser = username;
  isAdmin = adminStatus;

  document.getElementById("login-screen").style.display = "none";
  document.getElementById("hud-username").innerText = username;

  if (isAdmin) {
    document.getElementById("admin-touch-button").style.display = "block";
    document.getElementById("admin-panel-user").innerText = username + " (ROOT)";
  }

  updateLeaderboardsUI();
  playSound("powerup");
}
// ==========================================================================
// SPACE SHOOTER: ENGINE LOGICA & BOTSINGEN (DEEL 2)
// ==========================================================================

// --- 6. PARTICLES & EFFECTEN GENERATORS ---
function createExplosion(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    particles.push({
      x: x,
      y: y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      color: color,
      alpha: 1,
      decay: CONFIG.PARTICLE_DECAY_MIN + Math.random() * (CONFIG.PARTICLE_DECAY_MAX - CONFIG.PARTICLE_DECAY_MIN)
    });
  }
}

function createFirework() {
  const x = Math.random() * canvas.width;
  const y = Math.random() * (canvas.height / 2);
  const colors = ["#ff304f", "#00e5ff", "#fff176", "#a855f7", "#28a745"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    fireworks.push({
      x: x, y: y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      decay: 0.015 + Math.random() * 0.02,
      alpha: 1,
      color: color
    });
  }
  playSound("spread");
}

// --- 7. WEAPON TRIGGERS (VUURKRACHT) ---
function fireWeapon() {
  if (!gameStarted || gamePaused || gameOver) return;

  // Check of wapen-timer is verlopen
  if (activeWeapon !== "normal" && Date.now() > weaponExpiresAt) {
    activeWeapon = "normal";
    document.getElementById("power-up-status").innerText = "None";
  }

  const pX = player.x + player.size / 2;
  const pY = player.y;

  switch (activeWeapon) {
    case "normal":
      bullets.push({ x: pX - 2, y: pY, dx: 0, dy: CONFIG.BULLET_NORMAL_SPEED, size: 4, isBeam: false });
      playSound("shoot");
      break;
    case "spread":
      bullets.push({ x: pX - 2, y: pY, dx: 0, dy: CONFIG.BULLET_SPREAD_SPEED, size: 4, isBeam: false });
      bullets.push({ x: pX - 6, y: pY, dx: -2, dy: CONFIG.BULLET_SPREAD_SPEED, size: 4, isBeam: false });
      bullets.push({ x: pX + 2, y: pY, dx: 2, dy: CONFIG.BULLET_SPREAD_SPEED, size: 4, isBeam: false });
      playSound("spread");
      break;
    case "beam":
      // Een dikke laserstraal die doorloopt
      bullets.push({ x: pX - 6, y: pY, dx: 0, dy: CONFIG.BULLET_BEAM_SPEED, size: 12, isBeam: true });
      playSound("beam");
      break;
  }
}

// --- 8. GAME UPDATE ENGINE (CRASH-FREE RED ZONE) ---
function update() {
  // Update vuurwerk (draait ook op het overwinningsscherm)
  for (let i = fireworks.length - 1; i >= 0; i--) {
    let f = fireworks[i];
    f.x += f.dx; f.y += f.dy;
    f.dy += 0.04; // Zwaartekracht effect
    f.alpha -= f.decay;
    if (f.alpha <= 0) fireworks.splice(i, 1);
  }

  if (victoryAchieved && Math.random() < 0.04) createFirework();
  if (!gameStarted || gameOver || gamePaused) return;

  // 1. Onkwetsbaarheid timer verwerken
  if (player.invulnerable && Date.now() > player.invulnTimer) {
    player.invulnerable = false;
  }

  // 2. Parallax Sterren bewegen
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });

  // 3. Speler beweging + grenzen bewaken (Clamping)
  if (keys["w"] || keys["arrowup"]) player.y -= player.speed;
  if (keys["s"] || keys["arrowdown"]) player.y += player.speed;
  if (keys["a"] || keys["arrowleft"]) player.x -= player.speed;
  if (keys["d"] || keys["arrowright"]) player.x += player.speed;

  if (player.x < 0) player.x = 0;
  if (player.x > canvas.width - player.size) player.x = canvas.width - player.size;
  if (player.y < 0) player.y = 0;
  if (player.y > canvas.height - player.size) player.y = canvas.height - player.size;

  // 4. Deeltjes/Explosies update
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.dx; p.y += p.dy; p.alpha -= p.decay;
    if (p.alpha <= 0) particles.splice(i, 1);
  }

  // 5. Boss AI & Aanvalspatronen
  if (currentBoss && !timeFrozen) {
    if (currentBoss.y < 75) currentBoss.y += 1.5; // Komt rustig naar binnen gevlogen
    currentBoss.x += Math.sin(Date.now() / 600) * currentBoss.speed;

    // Boss schiet interval check
    if (Date.now() - timers.lastBossShot > currentBoss.shootInterval) {
      timers.lastBossShot = Date.now();
      // Genereer 360-graden cirkel van kogels
      for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI / 4)) {
        enemyBullets.push({
          x: currentBoss.x + currentBoss.size / 2,
          y: currentBoss.y + currentBoss.size / 2,
          dx: Math.cos(angle) * 3,
          dy: Math.sin(angle) * 3,
          size: 7
        });
      }
      playSound("hit");
    }
  }

  // 6. Kogels verplaatsen & filteren binnen het scherm
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.x += b.dx; b.y += b.dy;
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(i, 1);
    }
  }

  // Enemy bullets verplaatsen
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let eb = enemyBullets[i];
    eb.x += eb.dx; eb.y += eb.dy;
    if (eb.x < 0 || eb.x > canvas.width || eb.y < 0 || eb.y > canvas.height) {
      enemyBullets.splice(i, 1);
    }
  }

  // 7. GIGANTISCHE CRASH-FREE BOTSINGENCHECK (Achterwaartse lussen)
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    let bulletRemoved = false;

    // Check: Raakt kogel de Boss?
    if (currentBoss && b.x > currentBoss.x && b.x < currentBoss.x + currentBoss.size && b.y > currentBoss.y && b.y < currentBoss.y + currentBoss.size) {
      let damage = b.isBeam ? 3 : 1;
      currentBoss.hp -= damage;
      damageNumbers.push({ x: b.x, y: b.y, text: "-" + damage, color: "#ff5500", alpha: 1, life: 25 });
      
      createExplosion(b.x, b.y, "#ffaa00", 4);
      if (!b.isBeam) { bullets.splice(bi, 1); bulletRemoved = true; }

      if (currentBoss.hp <= 0) {
        destroyBoss();
      }
      if (bulletRemoved) continue;
    }

    // Check: Raakt kogel gewone vijand?
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (b.x < e.x + e.size && b.x + b.size > e.x && b.y < e.y + e.size && b.y + b.size > e.y) {
        createExplosion(e.x + e.size/2, e.y + e.size/2, "#fff176", 8);
        enemies.splice(ei, 1);
        
        let points = (activePowerUp === "multiplier") ? 2 : 1;
        addScore(points);

        damageNumbers.push({ x: e.x, y: e.y, text: "+" + points, color: "#fff176", alpha: 1, life: 25 });
        playSound("hit");

        if (!b.isBeam) { bullets.splice(bi, 1); bulletRemoved = true; }
        break;
      }
    }
  }

  // 8. Vijanden bewegen + Botsing met speler-ruimteschip
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];
    if (!timeFrozen) {
      // AI: Vijand achtervolgt de x-as en y-as van de speler heel langzaam
      let dx = player.x - e.x;
      let dy = player.y - e.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;
    }

    // Botsing vijand -> speler
    if (e.x < player.x + player.size && e.x + e.size > player.x && e.y < player.y + player.size && e.y + e.size > player.y) {
      enemies.splice(ei, 1);
      playerHit();
    }
  }

  // 9. Enemy bullets botsing met speler-ruimteschip
  for (let ebi = enemyBullets.length - 1; ebi >= 0; ebi--) {
    const eb = enemyBullets[ebi];
    if (eb.x > player.x && eb.x < player.x + player.size && eb.y > player.y && eb.y < player.y + player.size) {
      enemyBullets.splice(ebi, 1);
      playerHit();
    }
  }

  // 10. Schade-cijfers updaten en laten vervagen
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    let dn = damageNumbers[i];
    dn.y -= 0.8;
    dn.life--;
    dn.alpha = dn.life / 25;
    if (dn.life <= 0) damageNumbers.splice(i, 1);
  }
}
