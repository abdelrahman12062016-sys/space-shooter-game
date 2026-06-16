// ==========================================
// GEAVANCEERDE LOG IN, SIGN UP & LEADERBOARD
// ==========================================
let isAdmin = false;
let isLoggedIn = false;
let currentLoggedInUser = ""; 

// Wisselen tussen schermen
function showSignUp() {
  document.getElementById("login-box").style.display = "none";
  document.getElementById("signup-box").style.display = "flex";
  document.getElementById("login-error").innerText = "";
}

function showLogin() {
  document.getElementById("signup-box").style.display = "none";
  document.getElementById("login-box").style.display = "flex";
  document.getElementById("login-error").innerText = "";
}

// UPDATE EN TOON HET LEADERBOARD
function renderLeaderboards() {
  let scoresData = JSON.parse(localStorage.getItem("spaceGameLeaderboard")) || {};
  let sortableScores = [];
  for (let player in scoresData) {
    sortableScores.push({ name: player, score: scoresData[player] });
  }
  sortableScores.sort((a, b) => b.score - a.score);
  let topFive = sortableScores.slice(0, 5);

  const startList = document.getElementById("start-leaderboard");
  startList.innerHTML = "";
  if (topFive.length === 0) {
    startList.innerHTML = "<li>Nog geen scores!</li>";
  } else {
    topFive.forEach(item => {
      startList.innerHTML += `<li><strong>${item.name}</strong>: ${item.score}</li>`;
    });
  }

  const gameOverList = document.getElementById("gameover-leaderboard");
  gameOverList.innerHTML = "";
  if (topFive.length === 0) {
    gameOverList.innerHTML = "<li>Nog geen scores!</li>";
  } else {
    topFive.forEach(item => {
      gameOverList.innerHTML += `<li><strong>${item.name}</strong>: ${item.score}</li>`;
    });
  }
}

// SAVE SCORE NA GAME OVER
function savePlayerScore(finalScore) {
  if (!currentLoggedInUser) return;

  let scoresData = JSON.parse(localStorage.getItem("spaceGameLeaderboard")) || {};
  let currentHighScore = scoresData[currentLoggedInUser] || 0;

  if (finalScore > currentHighScore) {
    scoresData[currentLoggedInUser] = finalScore;
    localStorage.setItem("spaceGameLeaderboard", JSON.stringify(scoresData));
  }
  renderLeaderboards();
}

// SIGN UP (REGISTREREN) FUNCTION
function checkSignUp() {
  const newUser = document.getElementById("new-username").value.trim().toLowerCase();
  const newPass = document.getElementById("new-password").value.trim();
  const errorText = document.getElementById("login-error");

  if (newUser === "" || newPass === "") {
    errorText.innerText = "Vul alle velden in, domy!";
    return;
  }

  if (newUser === "darianmeyer" || newUser === "abdelamr" || newUser === "abdullahminihoofd") {
    errorText.innerText = "Deze legendarische admin naam kun je niet stelen!";
    return;
  }

  let registeredUsers = JSON.parse(localStorage.getItem("spaceGameUsers")) || {};

  if (registeredUsers[newUser]) {
    errorText.innerText = "Deze gebruikersnaam bestaat al!";
    return;
  }

  registeredUsers[newUser] = newPass;
  localStorage.setItem("spaceGameUsers", JSON.stringify(registeredUsers));

  errorText.style.color = "#00e5ff";
  errorText.innerText = "Account succesvol gemaakt! Log nu in.";
  
  document.getElementById("new-username").value = "";
  document.getElementById("new-password").value = "";
  setTimeout(showLogin, 1500);
}

// LOG IN FUNCTION
function checkLogin() {
  const user = document.getElementById("username").value.trim().toLowerCase();
  const pass = document.getElementById("password").value.trim();
  const errorText = document.getElementById("login-error");
  errorText.style.color = "red"; 

  function loginSuccess(username, adminStatus, welcomeMessage) {
    isAdmin = adminStatus;
    isLoggedIn = true;
    currentLoggedInUser = username;
    document.getElementById("hud-username").innerText = username;
    
    if (adminStatus) {
      document.getElementById("admin-touch-button").style.display = "block";
    }

    if (welcomeMessage) alert(welcomeMessage);
    document.getElementById("login-screen").style.display = "none";
    renderLeaderboards(); 
  }

  if (user === "darianmeyer" && pass === "darianadmin6767") {
    loginSuccess("darianmeyer", true, "Welkom Darian! Admin menu geactiveerd. Klik op de rode M-knop.");
    return;
  } 
  if (user === "abdelamr" && pass === "abdelamradmin6767") {
    loginSuccess("abdelamr", true, "Welkom Abdelamr! Admin menu geactiveerd. Klik op de rode M-knop.");
    return;
  } 
  if (user === "abdullahminihoofd" && pass === "abdull123admin") {
    loginSuccess("abdullahminihoofd", true, "Welkom Abdullah! Admin menu geactiveerd. Klik op de rode M-knop.");
    return;
  } 

  let registeredUsers = JSON.parse(localStorage.getItem("spaceGameUsers")) || {};
  
  if (registeredUsers[user] && registeredUsers[user] === pass) {
    loginSuccess(user, false, null);
    return;
  }

  errorText.innerText = "Onjuiste gebruikersnaam of wachtwoord, domy!";
}

// ADMIN INTERFACE INTERACTIE LOGICA
function toggleAdminPanel() {
  if (!isAdmin) return;
  const panel = document.getElementById("hacker-admin-panel");
  
  if (panel.style.display === "none" || panel.style.display === "") {
    panel.style.display = "block";
    document.getElementById("admin-panel-user").innerText = currentLoggedInUser;
    if (gameStarted && !gamePaused && !gameOver) {
      togglePause();
    }
  } else {
    panel.style.display = "none";
    if (gameStarted && gamePaused && !gameOver) {
      togglePause();
    }
  }
}

document.getElementById("admin-touch-button").addEventListener("click", (e) => {
  e.preventDefault();
  toggleAdminPanel();
});

function triggerCheat(cheatName) {
  if (!isAdmin) return;

  switch (cheatName) {
    case "godmode":
      lives = 9999;
      activePowerUp = { type: "shield", expiresAt: Date.now() + 999999999 };
      player.invulnerable = true;
      updateHud();
      break;
    case "score":
      addScore(5000);
      break;
  }
}

// ==========================================
// GAME CORE LOGICA & ENGINE
// ==========================================
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

const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
const audioContext = AudioContextConstructor ? new AudioContextConstructor() : null;

function resumeAudioContext() {
  if (!audioContext || audioContext.state !== "suspended") return;
  audioContext.resume().catch(() => {});
}

function playTone({ frequency = 440, duration = 0.1, type = "sine", gain = 0.2, detune = 0 }) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const amplifier = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.detune.value = detune;
  amplifier.gain.value = gain;
  oscillator.connect(amplifier);
  amplifier.connect(audioContext.destination);
  const now = audioContext.currentTime;
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playAudio(name) {
  resumeAudioContext();
  if (name === "start") {
    playTone({ frequency: 220, duration: 0.18, type: "triangle", gain: 0.16 });
    setTimeout(() => playTone({ frequency: 330, duration: 0.12, type: "triangle", gain: 0.14 }), 120);
  } else if (name === "shoot") {
    playTone({ frequency: 880, duration: 0.08, type: "square", gain: 0.09, detune: -120 });
  } else if (name === "gameover") {
    playTone({ frequency: 120, duration: 0.35, type: "sawtooth", gain: 0.24 });
    setTimeout(() => playTone({ frequency: 180, duration: 0.2, type: "sine", gain: 0.12 }), 140);
  }
}

let backgroundMusicGain = null;
let backgroundMusicInterval = null;
let musicRootIndex = 0;

function stopBackgroundMusic() {
  if (!audioContext || !backgroundMusicGain) return;
  if (backgroundMusicInterval) {
    clearInterval(backgroundMusicInterval);
    backgroundMusicInterval = null;
  }
  const now = audioContext.currentTime;
  backgroundMusicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  setTimeout(() => {
    if (backgroundMusicGain) {
      backgroundMusicGain.disconnect();
      backgroundMusicGain = null;
    }
  }, 600);
}

function playAmbientChord() {
  if (!audioContext || !backgroundMusicGain) return;
  const chords = [[220, 277, 329], [196, 247, 294], [174, 220, 262], [185, 247, 311]];
  const chord = chords[musicRootIndex % chords.length];
  musicRootIndex += 1;
  chord.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = index === 0 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.0;
    oscillator.connect(gain);
    gain.connect(backgroundMusicGain);
    const now = audioContext.currentTime;
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.04 / (index + 1), now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.4);
    oscillator.start(now);
    oscillator.stop(now + 4.5);
  });
}

function startBackgroundMusic() {
  if (!audioContext || backgroundMusicGain) return;
  resumeAudioContext();
  backgroundMusicGain = audioContext.createGain();
  backgroundMusicGain.gain.value = 0.08;
  backgroundMusicGain.connect(audioContext.destination);
  playAmbientChord();
  backgroundMusicInterval = setInterval(playAmbientChord, 3200);
}

function resizeCanvas() {
  const width = Math.max(600, Math.min(1000, window.innerWidth - 40));
  const height = Math.max(450, Math.min(700, window.innerHeight - 40));
  canvas.width = width;
  canvas.height = height;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  if (stars.length === 0) {
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.4 + 0.15
      });
    }
  } else {
    stars.forEach(star => {
      star.x = Math.random() * canvas.width;
      star.y = Math.random() * canvas.height;
    });
  }
}

window.addEventListener("resize", resizeCanvas);

const player = { x: 0, y: 0, size: 20, speed: 4 };
function getPlayerCenter() { return { x: player.x + player.size / 2, y: player.y + player.size / 2 }; }

let lives = 3;
let score = 0;
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
  let scoresData = JSON.parse(localStorage.getItem("spaceGameLeaderboard")) || {};
  let userHighScore = scoresData[currentLoggedInUser] || 0;
  highScoreElement.textContent = userHighScore;

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
  updateHud();
}

function startGame() {
  if (!isLoggedIn) {
    alert("Je moet eerst inloggen bro!");
    return;
  }
  lives = 3; score = 0; gameOver = false; gameStarted = true; gamePaused = false;
  bullets = []; enemies = []; powerUps = []; activePowerUp = null;
  player.speed = 4; player.invulnerable = false;
  player.x = canvas.width / 2; player.y = canvas.height / 2;
  hud.classList.remove("hidden");
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  pauseButton.classList.remove("hidden");
  pauseButton.classList.remove("paused");
  settingsScreen.classList.add("hidden");
  updateHud();
  updateMobileControls();

  if (enemySpawnTimer) clearInterval(enemySpawnTimer);
  if (powerUpSpawnTimer) clearInterval(powerUpSpawnTimer);

  playAudio("start");
  startBackgroundMusic();

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
  if (gamePaused) stopBackgroundMusic(); else startBackgroundMusic();
}

pauseButton.addEventListener("click", togglePause);
stayButton.addEventListener("click", togglePause);

function leaveGame() {
  gameStarted = false; gameOver = false; gamePaused = false;
  bullets = []; enemies = []; lives = 3; score = 0;
  startScreen.classList.remove("hidden");
  hud.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  settingsScreen.classList.add("hidden");
  pauseButton.classList.add("hidden");
  pauseButton.classList.remove("paused");
  updateHud();
  updateMobileControls();
  renderLeaderboards();
  stopBackgroundMusic();
  if (enemySpawnTimer) { clearInterval(enemySpawnTimer); enemySpawnTimer = null; }
  if (powerUpSpawnTimer) { clearInterval(powerUpSpawnTimer); powerUpSpawnTimer = null; }
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
    document.documentElement.requestFullscreen().catch((err) => console.error(err));
  } else {
    document.exitFullscreen();
  }
}

function endGame() {
  gameOver = true; gameStarted = false; gamePaused = false;
  finalScoreElement.textContent = score;
  savePlayerScore(score);
  hud.classList.add("hidden");
  gameOverScreen.classList.remove("hidden");
  pauseScreen.classList.add("hidden");
  settingsScreen.classList.add("hidden");
  pauseButton.classList.add("hidden");
  pauseButton.classList.remove("paused");
  updateMobileControls();
  stopBackgroundMusic();
  if (enemySpawnTimer) { clearInterval(enemySpawnTimer); enemySpawnTimer = null; }
  if (powerUpSpawnTimer) { clearInterval(powerUpSpawnTimer); powerUpSpawnTimer = null; }
  playAudio("gameover");
}

let keys = {};
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (isAdmin && e.key.toLowerCase() === "m") {
    toggleAdminPanel();
  }
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

let mouse = { x: 0, y: 0 };
let bullets = [];
let enemies = [];
const stars = [];

resizeCanvas();

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener("click", () => {
  if (!gameStarted || gameOver || gamePaused) return;
  shootAt(mouse.x, mouse.y);
});

function shootAt(targetX, targetY) {
  const center = getPlayerCenter();
  const angle = Math.atan2(targetY - center.y, targetX - center.x);
  bullets.push({ x: center.x, y: center.y, dx: Math.cos(angle) * 8, dy: Math.sin(angle) * 8, size: 5 });
  playAudio("shoot");
}

function shootNearestEnemy() {
  if (!gameStarted || gameOver || gamePaused) return;
  const center = getPlayerCenter();
  let target = enemies[0];
  let closestDistance = Infinity;
  enemies.forEach(enemy => {
    const dx = (enemy.x + enemy.size / 2) - center.x;
    const dy = (enemy.y + enemy.size / 2) - center.y;
    const distance = dx * dx + dy * dy;
    if (distance < closestDistance) { closestDistance = distance; target = enemy; }
  });
  if (target) shootAt(target.x + target.size / 2, target.y + target.size / 2);
  else shootAt(center.x, center.y - 100);
}

document.querySelectorAll("[data-move]").forEach(button => {
  const key = button.dataset.move;
  button.addEventListener("pointerdown", (e) => { e.preventDefault(); keys[key] = true; });
  button.addEventListener("pointerup", (e) => { e.preventDefault(); keys[key] = false; });
  button.addEventListener("pointerleave", (e) => { e.preventDefault(); keys[key] = false; });
});

mobileShootButton.addEventListener("click", (e) => { e.preventDefault(); shootNearestEnemy(); });

function spawnEnemy() {
  if (!gameStarted || gameOver || gamePaused) return;
  const side = Math.floor(Math.random() * 4);
  let x = 0; let y = 0;
  if (side === 0) { x = Math.random() * canvas.width; y = -20; }
  else if (side === 1) { x = canvas.width + 20; y = Math.random() * canvas.height; }
  else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 20; }
  else { x = -20; y = Math.random() * canvas.height; }
  enemies.push({ x: x, y: y, size: 20, speed: 1.5 });
}

function spawnPowerUp() {
  if (!gameStarted || gameOver || gamePaused) return;
  if (powerUps.length > 0) return;
  const type = Math.random() < 0.5 ? "speed" : "shield";
  powerUps.push({ x: Math.random() * (canvas.width - 60) + 30, y: Math.random() * (canvas.height - 60) + 30, size: 28, type, duration: 5000 });
}

function applyPowerUp(powerUp) {
  activePowerUp = { ...powerUp, expiresAt: Date.now() + powerUp.duration };
  if (powerUp.type === "speed") { player.speed = 7; addScore(2); }
  else if (powerUp.type === "shield") { player.invulnerable = true; addScore(3); }
}

function clampPlayer() {
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
}

function update() {
  if (!gameStarted || gameOver || gamePaused) return;

  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) { star.y = 0; star.x = Math.random() * canvas.width; }
  });

  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  clampPlayer();

  bullets.forEach(b => { b.x += b.dx; b.y += b.dy; });
  bullets = bullets.filter(b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);

  enemies.forEach((e, ei) => {
    let dx = player.x - e.x; let dy = player.y - e.y;
    let dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;

    e.x += (dx / dist) * e.speed; 
    e.y += (dy / dist) * e.speed;

    if (dist < player.size) {
      enemies.splice(ei, 1);
      if (!activePowerUp || activePowerUp.type !== "shield") {
        lives -= 1; if (lives <= 0) endGame();
      }
    }
  });

  const playerCenter = getPlayerCenter();
  powerUps = powerUps.filter((powerUp) => {
    const dx = powerUp.x - playerCenter.x; const dy = powerUp.y - playerCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < powerUp.size / 2 + player.size / 2) { applyPowerUp(powerUp); return false; }
    return true;
  });

  if (activePowerUp && Date.now() > activePowerUp.expiresAt) {
    activePowerUp = null; player.speed = 4; player.invulnerable = false;
  }

  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (b.x < e.x + e.size && b.x + b.size > e.x && b.y < e.y + e.size && b.y + b.size > e.y) {
        enemies.splice(ei, 1); bullets.splice(bi, 1); addScore(1); break;
      }
    }
  }
}

function draw() {
  const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, "#07122e"); background.addColorStop(1, "#050505");
  ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach(star => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
  });

  const center = getPlayerCenter();
  const lookX = Math.sign(mouse.x - center.x); const lookY = Math.sign(mouse.y - center.y);

  ctx.fillStyle = "#00e5ff"; ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.strokeRect(player.x, player.y, player.size, player.size);

  ctx.fillStyle = "white";
  ctx.beginPath(); ctx.arc(player.x + 7, player.y + 8, 4, 0, Math.PI * 2); ctx.arc(player.x + 15, player.y + 8, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "black";
  ctx.beginPath(); ctx.arc(player.x + 7 + lookX, player.y + 8 + lookY, 1.5, 0, Math.PI * 2); ctx.arc(player.x + 15 + lookX, player.y + 8 + lookY, 1.5, 0, Math.PI * 2);
  ctx.fill();

  enemies.forEach(e => {
    ctx.fillStyle = "#ff304f"; ctx.beginPath(); ctx.arc(e.x + e.size / 2, e.y + e.size / 2, e.size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#ffb3c1"; ctx.lineWidth = 2; ctx.stroke();
  });

  bullets.forEach(b => {
    ctx.fillStyle = "#fff176"; ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill();
  });

  powerUps.forEach(powerUp => {
    ctx.save(); ctx.translate(powerUp.x, powerUp.y); ctx.shadowBlur = 18; ctx.shadowColor = powerUp.type === "shield" ? "#03a9f4" : "#76ff03";
    if (powerUp.type === "speed") {
      ctx.fillStyle = "#76ff03"; ctx.beginPath(); ctx.moveTo(0, -powerUp.size / 2); ctx.lineTo(powerUp.size / 2, 0); ctx.lineTo(0, powerUp.size / 2); ctx.lineTo(-powerUp.size / 2, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
    } else {
      ctx.fillStyle = "#03a9f4"; ctx.beginPath(); ctx.arc(0, 0, powerUp.size / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "white"; ctx.font = "bold 18px Arial"; ctx.fillText("S", -6, 7);
    }
    ctx.shadowBlur = 0; ctx.restore();
  });

  if (activePowerUp) {
    ctx.font = "18px Arial"; ctx.fillStyle = activePowerUp.type === "shield" ? "#03a9f4" : "#76ff03";
    ctx.fillText(activePowerUp.type === "shield" ? "Shield Active!" : "Speed Boost!", 10, 60);
  }

  ctx.font = "16px Arial"; ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 10, 20);
  
  let scoresData = JSON.parse(localStorage.getItem("spaceGameLeaderboard")) || {};
  let userHighScore = scoresData[currentLoggedInUser] || 0;
  ctx.fillText("High Score: " + userHighScore, 10, 40);
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

loop();
updateControlModeButtons();
