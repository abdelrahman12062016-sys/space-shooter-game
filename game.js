// ==========================================================================
// SPACE SHOOTER: ULTIEME ALLES-MODUS V4.0 (ALL FEATURES INTEGRATED)
// ==========================================================================

// --- 1. CONFIGURATIE ---
const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PLAYER_BASE_SPEED: 6,
  PLAYER_INVULN_DURATION: 2000, 
  BULLET_NORMAL_SPEED: -9,
  BULLET_SPREAD_SPEED: -8,
  BULLET_BEAM_SPEED: -18,
  ENEMY_MIN_SPEED: 1.8,
  ENEMY_MAX_SPEED: 3.8,
  BOSS_HP_PER_LEVEL: 60,
  PARTICLE_DECAY_MIN: 0.015,
  PARTICLE_DECAY_MAX: 0.035
};

// --- 2. GAME STATE (DIRECT GEKOSTUMEERD ALS ADMIN) ---
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

let player = {
  x: 385, y: 500, size: 32, speed: CONFIG.PLAYER_BASE_SPEED,
  invulnerable: false, invulnTimer: 0, width: 32, height: 32
};

// Object Pools
let bullets = [], enemyBullets = [], enemies = [], stars = [], fireworks = [], damageNumbers = [], particles = [], powerUps = [];     

// Weapon & Power-up Mechanics
let activeWeapon = "normal";    // 'normal', 'spread', 'beam'
let weaponExpiresAt = 0;        
let activePowerUp = null;       // 'shield', 'multiplier'
let powerUpExpiresAt = 0;       
let keys = {};

let currentBoss = null;
let nextBossScore = 150;    

// --- 3. DATABASE (DE 3 ADMINS) ---
let accounts = JSON.parse(localStorage.getItem("space_accounts_db")) || {
  "abdelamr": { password: "abdelamradmin6767", isAdmin: true },
  "darianmeyer": { password: "darianadmim6767", isAdmin: true },
  "abdullahminihoofd": { password: "abdull123admin", isAdmin: true }
};

let leaderboard = JSON.parse(localStorage.getItem("space_leaderboard_db")) || [
  { username: "abdullahminihoofd", score: 7500 },
  { username: "abdelamr", score: 5500 },
  { username: "darianmeyer", score: 4200 }
];

// --- 4. AUDIO ENGINE (WEB AUDIO SYNTHESIZER) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === "shoot") {
      osc.frequency.setValueAtTime(587.33, now); osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
      gain.gain.setValueAtTime(0.06, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.start(now); osc.stop(now + 0.12);
    } else if (type === "spread") {
      osc.type = "triangle"; osc.frequency.setValueAtTime(440, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === "beam") {
      osc.type = "sawtooth"; osc.frequency.setValueAtTime(880, now); osc.frequency.linearRampToValueAtTime(660, now + 0.08);
      gain.gain.setValueAtTime(0.03, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === "hit") {
      osc.frequency.setValueAtTime(140, now); gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === "explosion") {
      osc.type = "sawtooth"; osc.frequency.setValueAtTime(80, now); gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === "powerup" || type === "boss_spawn") {
      osc.frequency.setValueAtTime(440, now); osc.frequency.linearRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.12, now); osc.start(now); osc.stop(now + 0.25);
    }
  } catch (e) {}
}

// --- 5. UI CONTROLS ---
function updateLeaderboardsUI() {
  const html = leaderboard.slice(0, 5).map((entry, index) => `<li><span class="rank">#${index+1}</span> ${entry.username} - <strong>${entry.score}</strong></li>`).join("");
  const l1 = document.getElementById("start-leaderboard"), l2 = document.getElementById("gameover-leaderboard");
  if (l1) l1.innerHTML = html; if (l2) l2.innerHTML = html;
}

function logInUser(username, adminStatus) {
  isLoggedIn = true; currentLoggedInUser = username; isAdmin = adminStatus;
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("hud-username").innerText = username;
  const adminButton = document.getElementById("admin-touch-button");
  if (adminButton) adminButton.style.display = isAdmin ? "block" : "none";
  updateLeaderboardsUI();
  playSound("powerup");
}

function checkLogin() {
  const u = document.getElementById("username").value.trim(), p = document.getElementById("password").value;
  if (accounts[u] && accounts[u].password === p) logInUser(u, accounts[u].isAdmin);
  else document.getElementById("login-error").innerText = "Ongeldige logingegevens.";
}
window.checkLogin = checkLogin;

// --- 6. PARTICLES & VUURWERK GENERATORS ---
function createExplosion(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2, speed = 1 + Math.random() * 4;
    particles.push({
      x: x, y: y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3, color: color, alpha: 1,
      decay: CONFIG.PARTICLE_DECAY_MIN + Math.random() * (CONFIG.PARTICLE_DECAY_MAX - CONFIG.PARTICLE_DECAY_MIN)
    });
  }
}

function createFirework() {
  const x = Math.random() * CONFIG.CANVAS_WIDTH, y = Math.random() * (CONFIG.CANVAS_HEIGHT / 2);
  const colors = ["#ff304f", "#00e5ff", "#fff176", "#a855f7", "#28a745"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2, speed = 2 + Math.random() * 4;
    fireworks.push({ x: x, y: y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, decay: 0.015 + Math.random() * 0.02, alpha: 1, color: color });
  }
  playSound("spread");
}

// --- 7. WEAPON HANDLING ---
function fireWeapon() {
  if (!gameStarted || gamePaused || gameOver) return;

  if (activeWeapon !== "normal" && Date.now() > weaponExpiresAt) {
    activeWeapon = "normal";
    document.getElementById("power-up-status").innerText = "None";
  }

  const pX = player.x + player.size / 2, pY = player.y;

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

function addScore(points) {
  score += points;
  document.getElementById("score").innerText = score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("space_shooter_master_hs", highScore);
  }
}

// --- 8. ENGINE RUNTIME UPDATE Loop ---
function update() {
  // Vuurwerk effecten (Victory)
  for (let i = fireworks.length - 1; i >= 0; i--) {
    let f = fireworks[i]; f.x += f.dx; f.y += f.dy; f.dy += 0.04; f.alpha -= f.decay;
    if (f.alpha <= 0) fireworks.splice(i, 1);
  }
  if (victoryAchieved && Math.random() < 0.05) createFirework();

  if (!gameStarted || gameOver || gamePaused) return;

  if (player.invulnerable && Date.now() > player.invulnTimer) player.invulnerable = false;
  if (activePowerUp && Date.now() > powerUpExpiresAt) { activePowerUp = null; document.getElementById("power-up-status").innerText = "None"; }

  // Sterren scrollen
  stars.forEach(star => { star.y += star.speed; if (star.y > CONFIG.CANVAS_HEIGHT) star.y = 0; });

  // Besturing
  if ((keys["w"] || keys["arrowup"]) && player.y > 0) player.y -= player.speed;
  if ((keys["s"] || keys["arrowdown"]) && player.y < CONFIG.CANVAS_HEIGHT - player.size) player.y += player.speed;
  if ((keys["a"] || keys["arrowleft"]) && player.x > 0) player.x -= player.speed;
  if ((keys["d"] || keys["arrowright"]) && player.x < CONFIG.CANVAS_WIDTH - player.size) player.x += player.speed;

  // Explosie deeltjes
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i]; p.x += p.dx; p.y += p.dy; p.alpha -= p.decay;
    if (p.alpha <= 0) particles.splice(i, 1);
  }

  // Power-ups verplaatsen & oppakken
  for (let i = powerUps.length - 1; i >= 0; i--) {
    let pu = powerUps[i]; pu.y += 2;
    if (pu.y > CONFIG.CANVAS_HEIGHT) { powerUps.splice(i, 1); continue; }
    
    // Check collision met speler
    if (pu.x < player.x + player.size && pu.x + 18 > player.x && pu.y < player.y + player.size && pu.y + 18 > player.y) {
      playSound("powerup");
      if (pu.type === "spread" || pu.type === "beam") {
        activeWeapon = pu.type; weaponExpiresAt = Date.now() + 8000;
        document.getElementById("power-up-status").innerText = pu.type.toUpperCase() + " LASER";
      } else {
        activePowerUp = pu.type; powerUpExpiresAt = Date.now() + 10000;
        document.getElementById("power-up-status").innerText = pu.type.toUpperCase();
      }
      powerUps.splice(i, 1);
    }
  }

  // Boss Engine AI
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

  // Kogels versus Enemies & Boss
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    let b = bullets[bi]; b.y += b.dy; b.x += b.dx;
    if (b.y < 0 || b.x < 0 || b.x > CONFIG.CANVAS_WIDTH) { bullets.splice(bi, 1); continue; }

    if (currentBoss && b.x > currentBoss.x && b.x < currentBoss.x + currentBoss.size && b.y > currentBoss.y && b.y < currentBoss.y + currentBoss.size) {
      let dmg = b.isBeam ? 3 : 1; currentBoss.hp -= dmg;
      damageNumbers.push({ x: b.x, y: b.y, text: "-" + dmg, color: "#ff5500", alpha: 1, life: 25 });
      if (!b.isBeam) bullets.splice(bi, 1);
      
      if (currentBoss.hp <= 0) {
        createExplosion(currentBoss.x+40, currentBoss.y+40, "#a855f7", 35);
        currentBoss = null; addScore(500); currentLevel++; victoryAchieved = true;
        setTimeout(() => victoryAchieved = false, 4000);
      }
      continue;
    }

    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      let e = enemies[ei];
      if (b.x < e.x + e.size && b.x + b.size > e.x && b.y < e.y + e.size && b.y + b.size > e.y) {
        createExplosion(e.x + e.size/2, e.y + e.size/2, "#fff176", 8);
        enemies.splice(ei, 1); if (!b.isBeam) bullets.splice(bi, 1);
        
        let pts = (activePowerUp === "multiplier") ? 20 : 10;
        addScore(pts); playSound("hit");
        damageNumbers.push({ x: e.x, y: e.y, text: "+" + pts, color: "#fff176", alpha: 1, life: 25 });

        // Kans op spawnen van power-up bij dood vijand
        if (Math.random() < 0.25) {
          const types = ["spread", "beam", "shield", "multiplier"];
          powerUps.push({ x: e.x, y: e.y, type: types[Math.floor(Math.random() * types.length)] });
        }

        if (score >= nextBossScore && !currentBoss) {
          currentBoss = { x: 360, y: -100, size: 80, hp: CONFIG.BOSS_HP_PER_LEVEL * currentLevel, maxHp: CONFIG.BOSS_HP_PER_LEVEL * currentLevel, speed: 2, lastShot: Date.now(), shootInterval: 1200 };
          playSound("boss_spawn");
          nextBossScore += 300;
        }
        break;
      }
    }
  }

  // Vijanden AI achtervolging
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    let e = enemies[ei]; 
    if (!timeFrozen) {
      let dx = player.x - e.x, dy = player.y - e.y, dist = Math.sqrt(dx*dx + dy*dy) || 0.1;
      e.x += (dx / dist) * e.speed; e.y += (dy / dist) * e.speed;
    }
    if (e.x < player.x + player.size && e.x + e.size > player.x && e.y < player.y + player.size && e.y + e.size > player.y) {
      enemies.splice(ei, 1); playerHit();
    }
  }

  // Enemy Kogels
  for (let ebi = enemyBullets.length - 1; ebi >= 0; ebi--) {
    let eb = enemyBullets[ebi]; eb.x += eb.dx; eb.y += eb.dy;
    if (eb.y > CONFIG.CANVAS_HEIGHT || eb.x < 0 || eb.x > CONFIG.CANVAS_WIDTH) { enemyBullets.splice(ebi, 1); continue; }
    if (eb.x > player.x && eb.x < player.x + player.size && eb.y > player.y && eb.y < player.y + player.size) {
      enemyBullets.splice(ebi, 1); playerHit();
    }
  }

  // Tekst effecten vervagen
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    let dn = damageNumbers[i]; dn.y -= 0.8; dn.life--; dn.alpha = dn.life / 25;
    if (dn.life <= 0) damageNumbers.splice(i, 1);
  }
}

function playerHit() {
  if (player.invulnerable) return;
  if (activePowerUp === "shield") { activePowerUp = null; document.getElementById("power-up-status").innerText = "None"; player.invulnerable = true; player.invulnTimer = Date.now() + 1000; playSound("hit"); return; }

  lives--; document.getElementById("lives").innerText = lives;
  createExplosion(player.x + 16, player.y + 16, "#ff304f", 20); playSound("explosion");
  
  if (lives <= 0) {
    gameOver = true; document.getElementById("game-over-screen").classList.remove("hidden");
    document.getElementById("final-score").innerText = score; leaderboard.push({ username: currentLoggedInUser, score: score });
    leaderboard.sort((a,b)=>b.score-a.score); localStorage.setItem("space_leaderboard_db", JSON.stringify(leaderboard)); updateLeaderboardsUI();
  } else {
    player.invulnerable = true; player.invulnTimer = Date.now() + CONFIG.PLAYER_INVULN_DURATION; player.x = 385; player.y = 500;
  }
}

// --- 9. CHEAT ENGINE ---
function toggleAdminPanel() { if(isAdmin) { const p = document.getElementById("hacker-admin-panel"); p.style.display = p.style.display === "block" ? "none" : "block"; } }
window.toggleAdminPanel = toggleAdminPanel;

function triggerCheat(type) {
  if (!isAdmin) return;
  if (type === 'godmode') { player.invulnerable = !player.invulnerable; player.invulnTimer = player.invulnerable ? Date.now() + 99999999 : Date.now(); alert("Godmode Active: " + player.invulnerable); }
  if (type === 'score') { addScore(1000); }
  if (type === 'freeze') { timeFrozen = !timeFrozen; alert("Time Freeze: " + timeFrozen); }
  if (type === 'nuke') { enemies = []; enemyBullets = []; createExplosion(400, 300, "#ff304f", 50); playSound("explosion"); }
}
window.triggerCheat = triggerCheat;

// --- 10. INTERFACE CONTROLERS ---
function startGame() {
  gameStarted = true; gameOver = false; gamePaused = false; score = 0; lives = 3; enemies = []; bullets = []; enemyBullets = []; currentBoss = null; powerUps = []; activeWeapon = "normal"; activePowerUp = null;
  player.x = 385; player.y = 500; player.invulnerable = false;
  document.getElementById("start-screen").classList.add("hidden"); document.getElementById("game-over-screen").classList.add("hidden"); document.getElementById("hud").classList.remove("hidden");
  document.getElementById("lives").innerText = lives; document.getElementById("score").innerText = score;
}
window.startGame = startGame;
function togglePause() { gamePaused = !gamePaused; document.getElementById("pause-screen").classList.toggle("hidden", !gamePaused); }
window.togglePause = togglePause;
function leaveGame() { location.reload(); }
window.leaveGame = leaveGame;

// --- 11. VISUELE RENDER ENGINE ---
const canvas = document.getElementById("game"), ctx = canvas.getContext("2d");
function draw() {
  ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff"; stars.forEach(s => ctx.fillRect(s.x, s.y, 2, 2));
  particles.forEach(p => { ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.restore(); });
  fireworks.forEach(f => { ctx.save(); ctx.globalAlpha = f.alpha; ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, 3, 0, Math.PI*2); ctx.fill(); ctx.restore(); });

  // Draw Power-ups
  powerUps.forEach(pu => {
    ctx.fillStyle = (pu.type === "spread" || pu.type === "beam") ? "#a855f7" : "#fff176";
    ctx.fillRect(pu.x, pu.y, 16, 16);
    ctx.fillStyle = "#000000"; ctx.font = "10px sans-serif"; ctx.fillText(pu.type[0].toUpperCase(), pu.x+4, pu.y+12);
  });

  if (!gameStarted || gameOver) return;

  // Draw Speler + Shield Aura
  if (!(player.invulnerable && Math.floor(Date.now() / 100) % 2 === 0)) {
    ctx.fillStyle = "#00e5ff"; ctx.fillRect(player.x, player.y, player.size, player.size);
    if (activePowerUp === "shield") { ctx.strokeStyle = "#fff176"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(player.x+16, player.y+16, 26, 0, Math.PI*2); ctx.stroke(); }
  }
  
  ctx.fillStyle = "#ff304f"; enemies.forEach(e => ctx.fillRect(e.x, e.y, e.size, e.size));
  if (currentBoss) { ctx.fillStyle = "#a855f7"; ctx.fillRect(currentBoss.x, currentBoss.y, currentBoss.size, currentBoss.size); ctx.fillStyle = "#1e293b"; ctx.fillRect(currentBoss.x, currentBoss.y - 12, currentBoss.size, 5); ctx.fillStyle = "#28a745"; ctx.fillRect(currentBoss.x, currentBoss.y - 12, currentBoss.size * (currentBoss.hp/currentBoss.maxHp), 5); }
  
  // Draw Kogels
  bullets.forEach(b => { ctx.fillStyle = b.isBeam ? "#00e5ff" : "#fff176"; ctx.fillRect(b.x, b.y, b.size, b.isBeam ? 25 : b.size); });
  ctx.fillStyle = "#f43f5e"; enemyBullets.forEach(eb => { ctx.beginPath(); ctx.arc(eb.x, eb.y, eb.size/2, 0, Math.PI*2); ctx.fill(); });

  ctx.font = "bold 14px sans-serif"; damageNumbers.forEach(dn => { ctx.save(); ctx.globalAlpha = dn.alpha; ctx.fillStyle = dn.color; ctx.fillText(dn.text, dn.x, dn.y); ctx.restore(); });
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

// --- 12. INITIALISATIE SYSTEM START ---
window.addEventListener("DOMContentLoaded", () => {
  for (let i = 0; i < 60; i++) stars.push({ x: Math.random() * CONFIG.CANVAS_WIDTH, y: Math.random() * CONFIG.CANVAS_HEIGHT, speed: 0.5 + Math.random() * 1.5 });
  
  document.getElementById("start-button").addEventListener("click", startGame);
  document.getElementById("play-again-button").addEventListener("click", startGame);
  document.getElementById("pause-button").addEventListener("click", togglePause);
  document.getElementById("stay-button").addEventListener("click", togglePause);
  document.getElementById("pause-leave-button").addEventListener("click", leaveGame);
  document.getElementById("game-over-leave-button").addEventListener("click", leaveGame);
  document.getElementById("admin-touch-button").addEventListener("click", toggleAdminPanel);
  
  // Mobiele knoppen D-Pad koppeling
  document.querySelectorAll("[data-move]").forEach(btn => {
    const k = btn.dataset.move;
    btn.addEventListener("pointerdown", e => { e.preventDefault(); keys[k] = true; });
    btn.addEventListener("pointerup", e => { e.preventDefault(); keys[k] = false; });
    btn.addEventListener("pointerleave", e => { e.preventDefault(); keys[k] = false; });
  });
  const mobShoot = document.getElementById("mobile-shoot-button");
  if(mobShoot) mobShoot.addEventListener("click", fireWeapon);

  window.addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true; if(e.key === " ") fireWeapon(); });
  window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  setInterval(() => { if (gameStarted && !gamePaused && !gameOver && !timeFrozen && !currentBoss) enemies.push({ x: Math.random() * (CONFIG.CANVAS_WIDTH - 24), y: -24, size: 24, speed: CONFIG.ENEMY_MIN_SPEED + Math.random()*2 }); }, 1000);

  // Synchroniseer HTML met admin-rechten direct bij opstarten
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("hud-username").innerText = currentLoggedInUser;
  document.getElementById("admin-touch-button").style.display = "block";
  document.getElementById("admin-panel-user").innerText = currentLoggedInUser + " (ROOT)";
  
  updateLeaderboardsUI();
  loop();
});
