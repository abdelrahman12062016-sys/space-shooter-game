// --- 1. VARIABELEN & INITIALISATIE ---
let isAdmin = false, isLoggedIn = false, currentLoggedInUser = "", timeFrozen = false;
let currentBoss = null, nextBossScore = 100, enemyBullets = [], victoryAchieved = false;
let fireworks = [], damageNumbers = [], bullets = [], enemies = [], stars = [];
let lives = 3, score = 0, gameOver = false, gameStarted = false, gamePaused = false;
let activeWeapon = "normal", weaponExpiresAt = 0, activePowerUp = null;
let controlMode = localStorage.getItem("controlMode") || "pc";
let enemySpawnTimer = null, powerUpSpawnTimer = null;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const player = { x: 300, y: 300, size: 20, speed: 4, invulnerable: false };
let keys = {};
let mouse = { x: 0, y: 0 };

// --- 2. GAME ENGINE ---
function update() {
    if (!gameStarted || gameOver || gamePaused) return;

    // Sterren
    stars.forEach(s => { s.y += s.speed; if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; } });

    // Input
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // Botsingen (CRASH-FREE REVERSE LOOPS)
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
        let b = bullets[bi]; b.x += b.dx; b.y += b.dy;
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
            let e = enemies[ei];
            if (b.x < e.x + e.size && b.x + b.size > e.x && b.y < e.y + e.size && b.y + b.size > e.y) {
                enemies.splice(ei, 1); addScore(1);
                damageNumbers.push({ x: b.x, y: b.y, text: "-1", color: "#fff176", alpha: 1, life: 25 });
                if (!b.isBeam) { bullets.splice(bi, 1); break; }
            }
        }
    }
    
    // Vijanden bewegen
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
        let e = enemies[ei];
        let dx = player.x - e.x; let dy = player.y - e.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        if (!timeFrozen) { e.x += (dx / dist) * e.speed; e.y += (dy / dist) * e.speed; }
        if (dist < player.size) { enemies.splice(ei, 1); if(!player.invulnerable) lives--; if(lives <= 0) endGame(); }
    }
    
    damageNumbers.forEach((dn, i) => { dn.y -= 0.8; dn.life--; dn.alpha = dn.life/30; if(dn.life <= 0) damageNumbers.splice(i, 1); });
}

function draw() {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Teken speler
    ctx.fillStyle = "#00e5ff"; ctx.fillRect(player.x, player.y, player.size, player.size);
    // Teken vijanden
    enemies.forEach(e => { ctx.fillStyle = "#ff304f"; ctx.fillRect(e.x, e.y, e.size, e.size); });
    // Teken kogels
    bullets.forEach(b => { ctx.fillStyle = "#fff176"; ctx.fillRect(b.x, b.y, 5, 5); });
    // Teken schade
    damageNumbers.forEach(dn => { ctx.fillStyle = dn.color; ctx.globalAlpha = dn.alpha; ctx.fillText(dn.text, dn.x, dn.y); });
    ctx.globalAlpha = 1;
}

// --- 3. CONTROLS & SETUP ---
function startGame() { 
    gameStarted = true; lives = 3; score = 0; enemies = []; bullets = []; 
    document.getElementById("start-screen").classList.add("hidden"); 
    document.getElementById("hud").classList.remove("hidden");
}

function leaveGame() { location.reload(); }
function togglePause() { gamePaused = !gamePaused; }
function shootNearestEnemy() { /* Logica om kogel toe te voegen */ bullets.push({x: player.x, y: player.y, dx: 0, dy: -10}); }

// Events
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

document.getElementById("start-button").addEventListener("click", startGame);
document.getElementById("pause-button").addEventListener("click", togglePause);
document.getElementById("mobile-shoot-button").addEventListener("click", shootNearestEnemy);

// --- 4. GAME LOOP ---
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Initialisatie
for(let i=0; i<100; i++) stars.push({x:Math.random()*800, y:Math.random()*600, size:2, speed:Math.random()});
loop();
