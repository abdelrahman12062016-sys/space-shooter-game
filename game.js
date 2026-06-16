// ==========================================
// SPACE SHOOTER: VOLLEDIGE STABIELE VERSIE
// ==========================================
let isAdmin = false;
let isLoggedIn = false;
let currentLoggedInUser = ""; 
let timeFrozen = false; 

// GAME CORE VARIABELEN
let currentBoss = null;
let nextBossScore = 100;
let enemyBullets = [];   
let victoryAchieved = false; 
let fireworks = [];          
let damageNumbers = [];      
let bullets = [];
let enemies = [];
let stars = [];
let lives = 3;
let score = 0;
let gameOver = false;
let gameStarted = false;
let gamePaused = false;
let activeWeapon = "normal";
let weaponExpiresAt = 0;
let activePowerUp = null;
let controlMode = localStorage.getItem("controlMode") || "pc";
let enemySpawnTimer = null;
let powerUpSpawnTimer = null;

// DOM ELEMENTEN & CANVAS
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const player = { x: 300, y: 300, size: 20, speed: 4, invulnerable: false };
let keys = {};
let mouse = { x: 0, y: 0 };

// ... [Voeg hier je login-functies, playTone, startBackgroundMusic, etc. in] ...
// Zorg dat deze functies (die je al had) onder dit blok staan.

// ==========================================
// CRASH-FREE UPDATE FUNCTIE
// ==========================================
function update() {
  if (!gameStarted || gameOver || gamePaused) return;

  // 1. Sterren bewegen
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) { star.y = 0; star.x = Math.random() * canvas.width; }
  });

  // 2. Speler beweging
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;
  
  // 3. Kogels & Botsingen (ACHTERUIT LUSSEN VOOR STABILITEIT)
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    let b = bullets[bi];
    b.x += b.dx; b.y += b.dy;
    
    // Boss raak
    if (currentBoss && b.x > currentBoss.x && b.x < currentBoss.x + currentBoss.size && b.y > currentBoss.y && b.y < currentBoss.y + currentBoss.size) {
      let d = b.isBeam ? 3 : 1;
      currentBoss.hp -= d;
      damageNumbers.push({ x: b.x, y: b.y, text: "-" + d, color: "#ff5500", alpha: 1, life: 30 });
      if (!b.isBeam) { bullets.splice(bi, 1); continue; }
    }
    
    // Vijand raak
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      let e = enemies[ei];
      if (b.x < e.x + e.size && b.x + b.size > e.x && b.y < e.y + e.size && b.y + b.size > e.y) {
        enemies.splice(ei, 1);
        addScore(1);
        damageNumbers.push({ x: b.x, y: b.y, text: "-1", color: "#fff176", alpha: 1, life: 25 });
        if (!b.isBeam) { bullets.splice(bi, 1); break; }
      }
    }
  }

  // 4. Vijanden beweging
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    let e = enemies[ei];
    let dx = player.x - e.x; let dy = player.y - e.y;
    let dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    if (!timeFrozen) {
      e.x += (dx / dist) * e.speed; e.y += (dy / dist) * e.speed;
    }
    if (dist < player.size) { enemies.splice(ei, 1); if(!player.invulnerable) lives--; }
  }

  // 5. Schade-cijfers update
  damageNumbers.forEach((dn, i) => { dn.y -= 0.8; dn.life--; dn.alpha = dn.life/30; if(dn.life <= 0) damageNumbers.splice(i, 1); });
}

// ==========================================
// INITIALISATIE
// ==========================================
function loop() {
  update();
  // draw(); // Zorg dat je draw functie hier ook wordt aangeroepen
  requestAnimationFrame(loop);
}

// Zorg dat deze lijnen onderaan staan om de game te starten:
resizeCanvas(); 
loop();
