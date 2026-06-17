// ==========================================================================
// SPACE SHOOTER: VOLLEDIG GEKOPPELD EN RECONSTRUEERD
// ==========================================================================

// --- 1. CONFIGURATIE ---
const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PLAYER_BASE_SPEED: 5,
  ENEMY_SPEED: 2
};

// --- 2. GAME STATE ---
let isAdmin = false;                           
let isLoggedIn = false;                        
let currentLoggedInUser = ""; 

let gameStarted = false;
let gameOver = false;
let gamePaused = false;

let score = 0;
let lives = 3;

let player = { x: 385, y: 500, size: 32, speed: CONFIG.PLAYER_BASE_SPEED };
let bullets = [], enemies = [], stars = [], keys = {};

// --- 3. DATABASE (DE 3 ADMINS) ---
let accounts = JSON.parse(localStorage.getItem("space_accounts_db")) || {
  "abdelamr": { password: "abdelamradmin6767", isAdmin: true },
  "darianmeyer": { password: "darianadmim6767", isAdmin: true },
  "abdullahminihoofd": { password: "abdull123admin", isAdmin: true }
};

// --- 4. INTERFACE EN LOGIN LOGICA ---
function logInUser(username, adminStatus) {
  isLoggedIn = true;
  currentLoggedInUser = username;
  isAdmin = adminStatus;

  // Schakel schermen om
  document.getElementById("login-screen").style.display = "none";
  
  // Zorg dat het start-scherm of HUD te voorschijn komt
  const startScreen = document.getElementById("start-screen");
  if (startScreen) {
    startScreen.classList.remove("hidden");
  } else {
    // Als je geen start-scherm hebt, start de game dan meteen!
    startGame();
  }

  // Toon admin knop als de user admin is
  const adminButton = document.getElementById("admin-touch-button");
  if (adminButton) adminButton.style.display = isAdmin ? "block" : "none";

  const hudUser = document.getElementById("hud-username");
  if (hudUser) hudUser.innerText = username;
}

function checkLogin() {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;
  const err = document.getElementById("login-error");

  if (accounts[u] && accounts[u].password === p) {
    logInUser(u, accounts[u].isAdmin);
  } else {
    if (err) err.innerText = "Ongeldige logingegevens.";
  }
}
window.checkLogin = checkLogin;

// --- 5. GAME ENGINE ACTIES ---
function startGame() {
  gameStarted = true;
  gameOver = false;
  gamePaused = false;
  score = 0;
  lives = 3;
  enemies = [];
  bullets = [];
  
  player.x = 385;
  player.y = 500;

  // HTML HUD updates
  const startScr = document.getElementById("start-screen");
  if (startScr) startScr.classList.add("hidden");
  
  const goScr = document.getElementById("game-over-screen");
  if (goScr) goScr.classList.add("hidden");
  
  const hud = document.getElementById("hud");
  if (hud) hud.classList.remove("hidden");

  const scoreEl = document.getElementById("score");
  if (scoreEl) scoreEl.innerText = score;

  const livesEl = document.getElementById("lives");
  if (livesEl) livesEl.innerText = lives;
}
window.startGame = startGame;

function fireWeapon() {
  if (!gameStarted || gamePaused || gameOver) return;
  bullets.push({ x: player.x + player.size / 2 - 2, y: player.y, size: 4, speed: -8 });
}

// --- 6. RENDER & UPDATE LOOPS ---
function update() {
  if (!gameStarted || gameOver || gamePaused) return;

  // Sterren scrollen
  stars.forEach(star => { star.y += star.speed; if (star.y > CONFIG.CANVAS_HEIGHT) star.y = 0; });

  // Speler bewegen
  if ((keys["w"] || keys["arrowup"]) && player.y > 0) player.y -= player.speed;
  if ((keys["s"] || keys["arrowdown"]) && player.y < CONFIG.CANVAS_HEIGHT - player.size) player.y += player.speed;
  if ((keys["a"] || keys["arrowleft"]) && player.x > 0) player.x -= player.speed;
  if ((keys["d"] || keys["arrowright"]) && player.x < CONFIG.CANVAS_WIDTH - player.size) player.x += player.speed;

  // Kogels bewegen
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y += bullets[i].speed;
    if (bullets[i].y < 0) bullets.splice(i, 1);
  }

  // Vijanden bewegen & Collisions
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.y += e.speed;

    if (e.y > CONFIG.CANVAS_HEIGHT) {
      enemies.splice(i, 1);
      continue;
    }

    // Kogel raakt vijand
    for (let j = bullets.length - 1; j >= 0; j--) {
      let b = bullets[j];
      if (b.x < e.x + e.size && b.x + b.size > e.x && b.y < e.y + e.size && b.y + b.size > e.y) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score += 10;
        const scoreEl = document.getElementById("score");
        if (scoreEl) scoreEl.innerText = score;
        break;
      }
    }
  }
}

const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

function draw() {
  if (!ctx) return;
  ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff"; stars.forEach(s => ctx.fillRect(s.x, s.y, 2, 2)); 

  if (!gameStarted || gameOver) return;

  // Speler (Blauw)
  ctx.fillStyle = "#00e5ff"; ctx.fillRect(player.x, player.y, player.size, player.size);
  // Vijanden (Rood)
  ctx.fillStyle = "#ff304f"; enemies.forEach(e => ctx.fillRect(e.x, e.y, e.size, e.size));
  // Kogels (Geel)
  ctx.fillStyle = "#fff176"; bullets.forEach(b => ctx.fillRect(b.x, b.y, b.size, b.size));
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// --- 7. INITIALISATIE ---
window.addEventListener("DOMContentLoaded", () => {
  // Vul de sterrenhemel
  for (let i = 0; i < 40; i++) stars.push({ x: Math.random() * CONFIG.CANVAS_WIDTH, y: Math.random() * CONFIG.CANVAS_HEIGHT, speed: 1 });
  
  // Koppel de inlogknop uit je HTML
  const lBtn = document.getElementById("login-submit-button");
  if (lBtn) lBtn.addEventListener("click", checkLogin);
  
  // Koppel de startknop (voor het geval je eerst een startscherm ziet)
  const sBtn = document.getElementById("start-button");
  if (sBtn) sBtn.addEventListener("click", startGame);

  // Keyboard inputs
  window.addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true; if(e.key === " ") fireWeapon(); });
  window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  // Spawnen van vijanden elke 1.2 seconden
  setInterval(() => {
    if (gameStarted && !gamePaused && !gameOver) {
      enemies.push({ x: Math.random() * (CONFIG.CANVAS_WIDTH - 24), y: -24, size: 24, speed: CONFIG.ENEMY_SPEED });
    }
  }, 1200);

  // Start de teken-loop direct op de achtergrond
  loop();
});
