// ==========================================================================
// SPACE SHOOTER: NOOD-HERSTEL SCRIPT (DIRECTE START)
// ==========================================================================

const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

let player = { x: 385, y: 500, size: 32, speed: 5 };
let enemies = [];
let keys = {};

function spawnEnemy() {
  if (Math.random() < 0.02) {
    enemies.push({ x: Math.random() * 760, y: -20, size: 24, speed: 2 });
  }
}

function update() {
  // Besturing
  if (keys["w"] || keys["arrowup"]) player.y -= player.speed;
  if (keys["s"] || keys["arrowdown"]) player.y += player.speed;
  if (keys["a"] || keys["arrowleft"]) player.x -= player.speed;
  if (keys["d"] || keys["arrowright"]) player.x += player.speed;

  // Vijanden bewegen
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].y += enemies[i].speed;
    if (enemies[i].y > 600) enemies.splice(i, 1);
  }
  spawnEnemy();
}

function draw() {
  if (!ctx) return;
  // Achtergrond
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, 800, 600);

  // Speler (Neon blauw)
  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // Vijanden (Rood)
  ctx.fillStyle = "#ff304f";
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.size, e.size));
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Direct starten zonder te wachten op inlogschermen
window.addEventListener("DOMContentLoaded", () => {
  console.log("Game-engine succesvol opgestart!");
  
  // Verberg handmatig het login-scherm mocht dat in de weg zitten
  const loginScreen = document.getElementById("login-screen");
  if (loginScreen) loginScreen.style.display = "none";
  
  const hud = document.getElementById("hud");
  if (hud) hud.classList.remove("hidden");

  window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  loop();
});
