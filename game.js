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
