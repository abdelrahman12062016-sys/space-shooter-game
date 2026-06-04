console.log("GAME STARTED");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");
const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const highScoreElement = document.getElementById("high-score");
const powerUpStatusElement = document.getElementById("power-up-status");
const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreElement = document.getElementById("final-score");
const finalHighScoreElement = document.getElementById("final-high-score");
const playAgainButton = document.getElementById("play-again-button");
const gameOverLeaveButton = document.getElementById("game-over-leave-button");
const pauseButton = document.getElementById("pause-button");
const pauseScreen = document.getElementById("pause-screen");
const stayButton = document.getElementById("stay-button");
const pauseLeaveButton = document.getElementById("pause-leave-button");
const settingsButton = document.getElementById("settings-button");
const fullscreenButton = document.getElementById("fullscreen-button");
const settingsScreen = document.getElementById("settings-screen");
const closeSettingsButton = document.getElementById("close-settings-button");
const pcModeButton = document.getElementById("pc-mode-button");
const mobileModeButton = document.getElementById("mobile-mode-button");
const mobileControls = document.getElementById("mobile-controls");
const mobileShootButton = document.getElementById("mobile-shoot-button");

canvas.width = 800;
canvas.height = 600;

// PLAYER
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 20,
  speed: 4
};

function getPlayerCenter() {
  return {
    x: player.x + player.size / 2,
    y: player.y + player.size / 2
  };
}

// GAME STATE
let lives = 3;
let score = 0;
let highScore = Number(localStorage.getItem("highScore")) || 0;
let gameOver = false;
let gameStarted = false;
let gamePaused = false;
let controlMode = localStorage.getItem("controlMode") || "pc";
let enemySpawnTimer = null;
let powerUpSpawnTimer = null;
let powerUps = [];
let activePowerUp = null;

function updateHud() {
  scoreElement.textContent = score;
  livesElement.textContent = lives;
  highScoreElement.textContent = highScore;

  if (activePowerUp) {
    powerUpStatusElement.textContent = activePowerUp.type === "shield" ? "Shield active" : "Speed active";
  } else if (powerUps.length > 0) {
    powerUpStatusElement.textContent = powerUps[0].type === "shield" ? "Shield nearby" : "Speed nearby";
  } else {
    powerUpStatusElement.textContent = "None";
  }
}

function updateMobileControls() {
  const showMobileControls = controlMode === "mobile" && gameStarted && !gameOver;
  mobileControls.classList.toggle("hidden", !showMobileControls);
}

function addScore(points) {
  score += points;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }

  updateHud();
}

function startGame() {
  lives = 3;
  score = 0;
  gameOver = false;
  gameStarted = true;
  gamePaused = false;
  bullets = [];
  enemies = [];
  powerUps = [];
  activePowerUp = null;
  player.speed = 4;
  player.invulnerable = false;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  hud.classList.remove("hidden");
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  pauseButton.classList.remove("hidden");
  pauseButton.classList.remove("paused");
  settingsScreen.classList.add("hidden");
  updateHud();
  updateMobileControls();

  if (enemySpawnTimer) {
    clearInterval(enemySpawnTimer);
  }

  if (powerUpSpawnTimer) {
    clearInterval(powerUpSpawnTimer);
  }

  enemySpawnTimer = setInterval(spawnEnemy, 1500);
  powerUpSpawnTimer = setInterval(spawnPowerUp, 10000);
}

startButton.addEventListener("click", startGame);
playAgainButton.addEventListener("click", startGame);
gameOverLeaveButton.addEventListener("click", leaveGame);

function togglePause() {
  if (!gameStarted || gameOver) return;

  gamePaused = !gamePaused;
  pauseScreen.classList.toggle("hidden", !gamePaused);
  pauseButton.classList.toggle("paused", gamePaused);
  updateMobileControls();
}

pauseButton.addEventListener("click", togglePause);
stayButton.addEventListener("click", togglePause);

function leaveGame() {
  gameStarted = false;
  gameOver = false;
  gamePaused = false;
  bullets = [];
  enemies = [];
  lives = 3;
  score = 0;
  startScreen.classList.remove("hidden");
  hud.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  settingsScreen.classList.add("hidden");
  pauseButton.classList.add("hidden");
  pauseButton.classList.remove("paused");
  updateHud();
  updateMobileControls();

  if (enemySpawnTimer) {
    clearInterval(enemySpawnTimer);
    enemySpawnTimer = null;
  }

  if (powerUpSpawnTimer) {
    clearInterval(powerUpSpawnTimer);
    powerUpSpawnTimer = null;
  }
}

pauseLeaveButton.addEventListener("click", leaveGame);

function updateControlModeButtons() {
  pcModeButton.classList.toggle("active", controlMode === "pc");
  mobileModeButton.classList.toggle("active", controlMode === "mobile");
  updateMobileControls();
}

function openSettings() {
  settingsScreen.classList.remove("hidden");

  if (gameStarted && !gameOver) {
    gamePaused = true;
    pauseScreen.classList.add("hidden");
    pauseButton.classList.add("paused");
  }

  updateControlModeButtons();
}

function closeSettings() {
  settingsScreen.classList.add("hidden");

  if (gameStarted && gamePaused && !gameOver) {
    pauseScreen.classList.remove("hidden");
  }
}

function setControlMode(mode) {
  controlMode = mode;
  localStorage.setItem("controlMode", controlMode);
  updateControlModeButtons();
}

settingsButton.addEventListener("click", openSettings);
fullscreenButton.addEventListener("click", toggleFullscreen);
closeSettingsButton.addEventListener("click", closeSettings);
pcModeButton.addEventListener("click", () => setControlMode("pc"));
mobileModeButton.addEventListener("click", () => setControlMode("mobile"));

document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    fullscreenButton.textContent = "🗗";
    fullscreenButton.title = "Exit Full Screen";
  } else {
    fullscreenButton.textContent = "⛶";
    fullscreenButton.title = "Full Screen";
  }
});

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((error) => {
      console.error("Fullscreen error:", error);
    });
  } else {
    document.exitFullscreen();
  }
}

function endGame() {
  gameOver = true;
  gameStarted = false;
  gamePaused = false;
  finalScoreElement.textContent = score;
  finalHighScoreElement.textContent = highScore;
  hud.classList.add("hidden");
  gameOverScreen.classList.remove("hidden");
  pauseScreen.classList.add("hidden");
  settingsScreen.classList.add("hidden");
  pauseButton.classList.add("hidden");
  pauseButton.classList.remove("paused");
  updateMobileControls();

  if (enemySpawnTimer) {
    clearInterval(enemySpawnTimer);
    enemySpawnTimer = null;
  }

  if (powerUpSpawnTimer) {
    clearInterval(powerUpSpawnTimer);
    powerUpSpawnTimer = null;
  }
}

// INPUT
let keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// MOUSE + SHOOT
let mouse = { x: 0, y: 0 };
let bullets = [];
let enemies = [];
const stars = Array.from({ length: 90 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 2 + 1,
  speed: Math.random() * 0.4 + 0.15
}));

// MOUSE POSITION
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

// SHOOT
canvas.addEventListener("click", () => {
  if (!gameStarted || gameOver || gamePaused) return;

  shootAt(mouse.x, mouse.y);
});

function shootAt(targetX, targetY) {
  const center = getPlayerCenter();
  const angle = Math.atan2(targetY - center.y, targetX - center.x);

  bullets.push({
    x: center.x,
    y: center.y,
    dx: Math.cos(angle) * 8,
    dy: Math.sin(angle) * 8,
    size: 5
  });
}

function shootNearestEnemy() {
  if (!gameStarted || gameOver || gamePaused) return;

  const center = getPlayerCenter();
  let target = enemies[0];
  let closestDistance = Infinity;

  enemies.forEach(enemy => {
    const enemyCenterX = enemy.x + enemy.size / 2;
    const enemyCenterY = enemy.y + enemy.size / 2;
    const dx = enemyCenterX - center.x;
    const dy = enemyCenterY - center.y;
    const distance = dx * dx + dy * dy;

    if (distance < closestDistance) {
      closestDistance = distance;
      target = enemy;
    }
  });

  if (target) {
    shootAt(target.x + target.size / 2, target.y + target.size / 2);
  } else {
    shootAt(center.x, center.y - 100);
  }
}

document.querySelectorAll("[data-move]").forEach(button => {
  const key = button.dataset.move;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    keys[key] = true;
  });

  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    keys[key] = false;
  });

  button.addEventListener("pointerleave", (event) => {
    event.preventDefault();
    keys[key] = false;
  });
});

mobileShootButton.addEventListener("click", (event) => {
  event.preventDefault();
  shootNearestEnemy();
});

// ENEMY SPAWN
function spawnEnemy() {
  if (!gameStarted || gameOver || gamePaused) return;

  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = Math.random() * canvas.width;
    y = -20;
  } else if (side === 1) {
    x = canvas.width + 20;
    y = Math.random() * canvas.height;
  } else if (side === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height + 20;
  } else {
    x = -20;
    y = Math.random() * canvas.height;
  }

  enemies.push({
    x: x,
    y: y,
    size: 20,
    speed: 1.5
  });
}

function spawnPowerUp() {
  if (!gameStarted || gameOver || gamePaused) return;
  if (powerUps.length > 0) return;

  const type = Math.random() < 0.5 ? "speed" : "shield";

  powerUps.push({
    x: Math.random() * (canvas.width - 60) + 30,
    y: Math.random() * (canvas.height - 60) + 30,
    size: 28,
    type,
    duration: 5000
  });
}

function applyPowerUp(powerUp) {
  activePowerUp = {
    ...powerUp,
    expiresAt: Date.now() + powerUp.duration
  };

  if (powerUp.type === "speed") {
    player.speed = 7;
    addScore(2);
  } else if (powerUp.type === "shield") {
    player.invulnerable = true;
    addScore(3);
  }
}

// CLAMP (NO OUT MAP)
function clampPlayer() {
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
}

// UPDATE
function update() {
  if (!gameStarted || gameOver || gamePaused) return;

  stars.forEach(star => {
    star.y += star.speed;

    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });

  // MOVE
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  clampPlayer();

  // BULLETS
  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
  });

  bullets = bullets.filter(b =>
    b.x > 0 && b.x < canvas.width &&
    b.y > 0 && b.y < canvas.height
  );

  // ENEMIES MOVE + HIT PLAYER
  enemies.forEach((e, ei) => {
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    e.x += (dx / dist) * e.speed;
    e.y += (dy / dist) * e.speed;

    // HIT PLAYER
    if (dist < player.size) {
      enemies.splice(ei, 1);

      if (!activePowerUp || activePowerUp.type !== "shield") {
        lives -= 1;

        if (lives <= 0) {
          endGame();
        }
      }
    }
  });

  const playerCenter = getPlayerCenter();
  powerUps = powerUps.filter((powerUp) => {
    const dx = powerUp.x - playerCenter.x;
    const dy = powerUp.y - playerCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < powerUp.size / 2 + player.size / 2) {
      applyPowerUp(powerUp);
      return false;
    }

    return true;
  });

  if (activePowerUp && Date.now() > activePowerUp.expiresAt) {
    activePowerUp = null;
    player.speed = 4;
    player.invulnerable = false;
  }

  // BULLET HIT ENEMY
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];

    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];

      if (
        b.x < e.x + e.size &&
        b.x + b.size > e.x &&
        b.y < e.y + e.size &&
        b.y + b.size > e.y
      ) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        addScore(1);
        break;
      }
    }
  }
}

// DRAW
function draw() {
  const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, "#07122e");
  background.addColorStop(1, "#050505");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach(star => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // PLAYER
  const center = getPlayerCenter();
  const lookX = Math.sign(mouse.x - center.x);
  const lookY = Math.sign(mouse.y - center.y);

  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(player.x, player.y, player.size, player.size);

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(player.x + 7, player.y + 8, 4, 0, Math.PI * 2);
  ctx.arc(player.x + 15, player.y + 8, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(player.x + 7 + lookX, player.y + 8 + lookY, 1.5, 0, Math.PI * 2);
  ctx.arc(player.x + 15 + lookX, player.y + 8 + lookY, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // ENEMIES
  enemies.forEach(e => {
    ctx.fillStyle = "#ff304f";
    ctx.beginPath();
    ctx.arc(e.x + e.size / 2, e.y + e.size / 2, e.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffb3c1";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // BULLETS
  bullets.forEach(b => {
    ctx.fillStyle = "#fff176";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();
  });

  powerUps.forEach(powerUp => {
    ctx.save();
    ctx.translate(powerUp.x, powerUp.y);
    ctx.shadowBlur = 18;
    ctx.shadowColor = powerUp.type === "shield" ? "#03a9f4" : "#76ff03";

    if (powerUp.type === "speed") {
      ctx.fillStyle = "#76ff03";
      ctx.beginPath();
      ctx.moveTo(0, -powerUp.size / 2);
      ctx.lineTo(powerUp.size / 2, 0);
      ctx.lineTo(0, powerUp.size / 2);
      ctx.lineTo(-powerUp.size / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = "#03a9f4";
      ctx.beginPath();
      ctx.arc(0, 0, powerUp.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "white";
      ctx.font = "bold 18px Arial";
      ctx.fillText("S", -6, 7);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  });

  if (activePowerUp) {
    ctx.font = "18px Arial";
    ctx.fillStyle = activePowerUp.type === "shield" ? "#03a9f4" : "#76ff03";
    ctx.fillText(activePowerUp.type === "shield" ? "Shield Active!" : "Speed Boost!", 10, 60);
  }

  // 👇 FONT FIX (BELANGRIJK)
  ctx.font = "16px Arial";
  ctx.fillStyle = "white";

  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Lives: " + lives, 10, 40);
  updateHud();

}

// LOOP
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
updateHud();
updateControlModeButtons();
 
 
