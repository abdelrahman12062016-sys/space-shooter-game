// ==========================================================================
// SPACE SHOOTER: COMPLETE ARCHITECTUUR DEEL 1 V3.2 (GEFIXTE VERSIE)
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

// --- 2. GAME STATE (DIRECT INLOGGED ALS ADMIN NET ALS GISTEREN) ---
let isAdmin = true;                           
let isLoggedIn = true;                        
let currentLoggedInUser = "abdullahminihoofd"; 
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
let activeWeapon = "normal";    
let weaponExpiresAt = 0;        
let activePowerUp = null;       
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
  { username: "darianmeyer", score: 2200, date: "2026-06-17" },
  { username: "Nebula", score: 1100, date: "2026-06-10" },
  { username: "CosmoNoob", score: 150, date: "2026-06-16" }
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
        osc.frequency.linearRampToValueAtTime(1046.50, now + 0.3); 
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

  // FIX: Sla het nieuwe account direct op in het lokale object VOORDAT logInUser wordt aangeroepen
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

  const adminButton = document.getElementById("admin-touch-button");
  const adminPanelTitle = document.getElementById("admin-panel-user");

  if (isAdmin) {
    if (adminButton) adminButton.style.display = "block";
    if (adminPanelTitle) adminPanelTitle.innerText = username + " (ROOT)";
  } else {
    if (adminButton) adminButton.style.display = "none";
    document.getElementById("hacker-admin-panel").style.display = "none";
  }

  updateLeaderboardsUI();
  playSound("powerup");
}

// FIX: Forceer de UI direct bij het laden van de pagina om te synchroniseren met de opstart-state (abdullahminihoofd als actieve admin)
window.addEventListener("DOMContentLoaded", () => {
  if (isLoggedIn && isAdmin) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("hud-username").innerText = currentLoggedInUser;
    const adminButton = document.getElementById("admin-touch-button");
    if (adminButton) adminButton.style.display = "block";
    const adminPanelTitle = document.getElementById("admin-panel-user");
    if (adminPanelTitle) adminPanelTitle.innerText = currentLoggedInUser + " (ROOT)";
  }
});
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
// ==========================================================================
// SPACE SHOOTER: RENDERING, ADMIN CHEATS & LOOP CONTROLS (DEEL 3)
// ==========================================================================

// --- 9. GAME OVER & WIN TRIGGER LOGICA ---
function playerHit() {
  if (player.invulnerable || activePowerUp === "shield") {
    // Shield vangt de klap op
    if (activePowerUp === "shield") {
      activePowerUp = null;
      document.getElementById("power-up-status").innerText = "None";
      player.invulnerable = true;
      player.invulnTimer = Date.now() + 1000;
      playSound("hit");
    }
    return;
  }

  lives--;
  document.getElementById("lives").innerText = lives;
  createExplosion(player.x + player.size/2, player.y + player.size/2, "#ff304f", 20);
  playSound("explosion");

  if (lives <= 0) {
    endGame();
  } else {
    // Geef speler tijdelijke onkwetsbaarheid na crash
    player.invulnerable = true;
    player.invulnTimer = Date.now() + CONFIG.PLAYER_INVULN_DURATION;
    player.x = canvas.width / 2 - player.size / 2;
    player.y = canvas.height - 100;
  }
}

function destroyBoss() {
  createExplosion(currentBoss.x + currentBoss.size/2, currentBoss.y + currentBoss.size/2, "#a855f7", 40);
  playSound("explosion");
  score += 500;
  addScore(0); // Update HUD
  currentBoss = null;
  nextBossScore += 300; // Volgende boss vereist hogere score
  currentLevel++;
  
  // Start vuurwerk show bij level up / boss defeat!
  victoryAchieved = true;
  setTimeout(() => { victoryAchieved = false; }, 4000);
}

function addScore(points) {
  score += points;
  document.getElementById("score").innerText = score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("space_shooter_master_hs", highScore);
  }
  
  // Check of er een Boss moet spawnen
  if (score >= nextBossScore && !currentBoss) {
    currentBoss = {
      x: canvas.width / 2 - 40,
      y: -100,
      size: 80,
      hp: CONFIG.BOSS_HP_PER_LEVEL * currentLevel,
      maxHp: CONFIG.BOSS_HP_PER_LEVEL * currentLevel,
      speed: 2 + (currentLevel * 0.5),
      shootInterval: Math.max(500, 1500 - (currentLevel * 100))
    };
    playSound("boss_spawn");
  }
}

function endGame() {
  gameOver = true;
  document.getElementById("game-over-screen").classList.remove("hidden");
  document.getElementById("final-score").innerText = score;
  document.getElementById("high-score").innerText = highScore;

  // Sla score op in het leaderboard object
  leaderboard.push({
    username: currentLoggedInUser || "Guest",
    score: score,
    date: new Date().toISOString().split('T')[0]
  });
  leaderboard.sort((a, b) => b.score - a.score);
  localStorage.setItem("space_leaderboard_db", JSON.stringify(leaderboard));
  updateLeaderboardsUI();
}

// --- 10. LEADERBOARD RENDERING ENGINE ---
function updateLeaderboardsUI() {
  const html = leaderboard.slice(0, 5).map((entry, index) => {
    return `<li><span class="rank">#${index+1}</span> ${entry.username} - <strong>${entry.score}</strong></li>`;
  }).join("");
  
  const l1 = document.getElementById("start-leaderboard");
  const l2 = document.getElementById("gameover-leaderboard");
  if (l1) l1.innerHTML = html;
  if (l2) l2.innerHTML = html;
}

// --- 11. HACKER/ADMIN DASHBOARD TRIGGER CODES ---
function toggleAdminPanel() {
  if (!isAdmin) return;
  const panel = document.getElementById("hacker-admin-panel");
  panel.style.display = (panel.style.display === "block") ? "none" : "block";
}
window.toggleAdminPanel = toggleAdminPanel;

function triggerCheat(type) {
  if (!isAdmin) return;
  
  switch (type) {
    case 'godmode':
      player.invulnerable = !player.invulnerable;
      if(player.invulnerable) player.invulnTimer = Date.now() + 999999999;
      else player.invulnTimer = Date.now();
      alert("HACK: Godmode ingesteld op " + player.invulnerable);
      break;
    case 'score':
      addScore(1000);
      break;
    case 'freeze':
      timeFrozen = !timeFrozen;
      alert("HACK: Vijandentijd bevroren = " + timeFrozen);
      break;
    case 'nuke':
      createExplosion(canvas.width/2, canvas.height/2, "#ff304f", 50);
      enemies = [];
      enemyBullets = [];
      if(currentBoss) currentBoss.hp -= 25;
      playSound("explosion");
      break;
  }
}
window.triggerCheat = triggerCheat;

// --- 12. MENU & BESTURING INTERFACES ---
function startGame() {
  gameStarted = true; gameOver = false; gamePaused = false; victoryAchieved = false;
  score = 0; lives = 3; currentLevel = 1; nextBossScore = 100;
  enemies = []; bullets = []; enemyBullets = []; particles = []; currentBoss = null;
  player.x = canvas.width / 2 - player.size / 2;
  player.y = canvas.height - 100;
  player.invulnerable = false;

  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-over-screen").classList.add("hidden");
  document.getElementById("pause-screen").classList.add("hidden");
  document.getElementById("hud").classList.remove("hidden");
  
  document.getElementById("lives").innerText = lives;
  document.getElementById("score").innerText = score;
  playSound("powerup");
}
window.startGame = startGame;

function togglePause() {
  if (!gameStarted || gameOver) return;
  gamePaused = !gamePaused;
  document.getElementById("pause-screen").classList.toggle("hidden", !gamePaused);
}
window.togglePause = togglePause;

function leaveGame() { location.reload(); }
window.leaveGame = leaveGame;

function openSettings() { document.getElementById("settings-screen").classList.remove("hidden"); }
window.openSettings = openSettings;

function closeSettings() { document.getElementById("settings-screen").classList.add("hidden"); }
window.closeSettings = closeSettings;

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}
window.toggleFullscreen = toggleFullscreen;

// --- 13. HTML DOM EVENT LISTENERS (DE BUTTONS CONNECTIE) ---
window.addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true; if(e.key === " ") fireWeapon(); });
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function initControls() {
  document.getElementById("start-button").addEventListener("click", startGame);
  document.getElementById("play-again-button").addEventListener("click", startGame);
  document.getElementById("pause-button").addEventListener("click", togglePause);
  document.getElementById("stay-button").addEventListener("click", togglePause);
  document.getElementById("pause-leave-button").addEventListener("click", leaveGame);
  document.getElementById("game-over-leave-button").addEventListener("click", leaveGame);
  document.getElementById("settings-button").addEventListener("click", openSettings);
  document.getElementById("close-settings-button").addEventListener("click", closeSettings);
  document.getElementById("fullscreen-button").addEventListener("click", toggleFullscreen);
  document.getElementById("admin-touch-button").addEventListener("click", toggleAdminPanel);
  
  // D-Pad mobiel
  document.querySelectorAll("[data-move]").forEach(button => {
    const moveKey = button.dataset.move;
    button.addEventListener("pointerdown", e => { e.preventDefault(); keys[moveKey] = true; });
    button.addEventListener("pointerup", e => { e.preventDefault(); keys[moveKey] = false; });
    button.addEventListener("pointerleave", e => { e.preventDefault(); keys[moveKey] = false; });
  });
  document.getElementById("mobile-shoot-button").addEventListener("click", fireWeapon);
}

// --- 14. VISUELE RENDER ENGINE (DRAW MODULE) ---
function draw() {
  // Clear canvas met deep-space kleur
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Teken sterren
  ctx.fillStyle = "#ffffff";
  stars.forEach(s => ctx.fillRect(s.x, s.y, 2, 2));

  // Teken deeltjes/explosies
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  });

  // Teken vuurwerk (Victory)
  fireworks.forEach(f => {
    ctx.save();
    ctx.globalAlpha = f.alpha;
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  if (!gameStarted || gameOver) return;

  // Teken speler (Kippert als hij onkwetsbaar is)
  if (!(player.invulnerable && Math.floor(Date.now() / 100) % 2 === 0)) {
    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(player.x, player.y, player.size, player.size);
    
    // Shield Aura indicator
    if (activePowerUp === "shield") {
      ctx.strokeStyle = "#fff176";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size, 0, Math.PI*2);
      ctx.stroke();
    }
  }

  // Teken gewone vijanden
  ctx.fillStyle = "#ff304f";
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.size, e.size));

  // Teken de grote Boss
  if (currentBoss) {
    ctx.fillStyle = "#a855f7";
    ctx.fillRect(currentBoss.x, currentBoss.y, currentBoss.size, currentBoss.size);
    
    // Boss Health Bar
    const barWidth = currentBoss.size;
    const hpRatio = currentBoss.hp / currentBoss.maxHp;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(currentBoss.x, currentBoss.y - 15, barWidth, 6);
    ctx.fillStyle = "#28a745";
    ctx.fillRect(currentBoss.x, currentBoss.y - 15, barWidth * hpRatio, 6);
  }

  // Teken speler-kogels
  bullets.forEach(b => {
    ctx.fillStyle = b.isBeam ? "#00e5ff" : "#fff176";
    ctx.fillRect(b.x, b.y, b.size, b.isBeam ? 25 : b.size);
  });

  // Teken vijand-kogels
  ctx.fillStyle = "#f43f5e";
  enemyBullets.forEach(eb => {
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, eb.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Teken zwevende combat text / damage numbers
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  damageNumbers.forEach(dn => {
    ctx.save();
    ctx.globalAlpha = dn.alpha;
    ctx.fillStyle = dn.color;
    ctx.fillText(dn.text, dn.x, dn.y);
    ctx.restore();
  });
  ctx.textAlign = "left"; // Reset alignment
}

// --- 15. CORE RUNTIME ENGINE LOOP ---
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// --- 16. GENERATIE VAN STATISCHE ASSETS BIJ OPSTART ---
for (let i = 0; i < 75; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: 0.4 + Math.random() * 1.8
  });
}

// Automatische spawn generator loop (elke seconde check)
setInterval(() => {
  if (!gameStarted || gamePaused || gameOver || timeFrozen || currentBoss) return;
  // Kans op spawnen stijgt naarmate je level omhoog gaat
  if (Math.random() < 0.6 + (currentLevel * 0.05)) {
    enemies.push({
      x: Math.random() * (canvas.width - 24),
      y: -30,
      size: 24,
      speed: CONFIG.ENEMY_MIN_SPEED + Math.random() * (CONFIG.ENEMY_MAX_SPEED - CONFIG.ENEMY_MIN_SPEED)
    });
  }
}, 1000);

// Run!
initControls();
updateLeaderboardsUI();
loop();
