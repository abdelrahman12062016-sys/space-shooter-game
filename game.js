// ==========================================
// GEAVANCEERDE LOG IN, SIGN UP & LEADERBOARD
// ==========================================
let isAdmin = false;
let isLoggedIn = false;
let currentLoggedInUser = ""; 
let timeFrozen = false; 

// BOSS FIGHT VARIABELEN
let currentBoss = null;
let nextBossScore = 100; // Eerste baas komt bij 100 punten
let enemyBullets = [];   // Kogels afgeschoten door de baas

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

function toggleAdminPanel() {
  if (!isAdmin) return;
  const panel = document.getElementById("hacker-admin-panel");
  if (panel.style.display === "none" || panel.style.display === "") {
    panel.style.display = "block";
    document.getElementById("admin-panel-user").innerText = currentLoggedInUser;
  } else {
    panel.style.display = "none";
  }
}

document.getElementById("admin-touch-button").addEventListener("click", (e) => {
  e.preventDefault();
  toggleAdminPanel();
});

function triggerCheat(cheatName) {
  if (!isAdmin) return;

  if (cheatName === "godmode") {
    lives = 9999;
    activePowerUp = { type: "shield", expiresAt: Date.now() + 999999999 };
    player.invulnerable = true;
    updateHud();
  } else if (cheatName === "score") {
    addScore(5000);
  } else if (cheatName === "nuke") {
    enemies = []; 
    if (currentBoss) {
      currentBoss = null; 
      enemyBullets = []; 
      nextBossScore = (Math.floor(score / 100) + 1) * 100;
    }
    playTone({ frequency: 80, duration: 0.6, type: "sawtooth", gain: 0.3 });
  } else if (cheatName === "freeze") {
    timeFrozen = !timeFrozen;
    if (timeFrozen) {
      playTone({ frequency: 600, duration: 0.3, type: "sine", gain: 0.1 });
      setTimeout(() => { timeFrozen = false; }, 8000); 
    } else {
      playTone({ frequency: 300, duration: 0.2, type: "sine", gain: 0.1 });
    }
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
  if (backgroundMusicInterval) { clearInterval(backgroundMusicInterval); backgroundMusicInterval = null; }
  const now = audioContext.currentTime;
  backgroundMusicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  setTimeout(() => { if (backgroundMusicGain) { backgroundMusicGain.disconnect(); backgroundMusicGain = null; } }, 600);
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
    oscillator.start(now); oscillator.stop(now + 4.5);
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
  canvas.width = width; canvas.height = height;
  player.x = canvas.width / 2; player.y = canvas.height / 2;

  if (stars.length === 0) {
    for (let i = 0; i < 90; i++) {
      stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 1, speed: Math.random() * 0.4 + 0.15 });
    }
  } else {
    stars.forEach(star => { star.x = Math.random() * canvas.width; star.y = Math.random() * canvas.height; });
  }
}

window.addEventListener("resize", resizeCanvas);

const player = { x: 0, y: 0, size: 20, speed: 4 };
function getPlayerCenter() { return { x: player.x + player.size / 2, y: player.y + player.size / 2 }; }

let lives = 3; let score = 0; let gameOver = false; let gameStarted = false; let gamePaused = false;
let controlMode = localStorage.getItem("controlMode") || "pc";
let enemySpawnTimer = null; let powerUpSpawnTimer = null;
let powerUps = []; let activePowerUp = null;
let activeWeapon = "normal"; // Kan zijn: "normal", "spread", "beam"
let weaponExpiresAt = 0;

function updateHud() {
  scoreElement.textContent = score;
  livesElement.textContent = lives;
  let scoresData = JSON.parse(localStorage.getItem("spaceGameLeaderboard")) || {};
  let userHighScore = scoresData[currentLoggedInUser] || 0;
  highScoreElement.textContent = userHighScore;

  // Update HUD status voor actieve effecten
  if (Date.now() < weaponExpiresAt) {
    powerUpStatusElement.textContent = activeWeapon.toUpperCase() + " SHOT!";
  } else if (activePowerUp) {
    powerUpStatusElement.textContent = activePowerUp.type === "shield" ? "Shield active" : "Speed active";
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
  
  if (score >= nextBossScore && !currentBoss) {
    nextBossScore = (Math.floor(score / 100) + 1) * 100;
    spawnBoss();
  }
}

function spawnBoss() {
  enemies = []; 
  enemyBullets = [];
  const levelMultiplier = Math.floor(score / 100) || 1;
  currentBoss = {
    x: canvas.width / 2 - 35,
    y: -80, 
    size: 70,
    hp: 10 + (levelMultiplier * 5), 
    maxHp: 10 + (levelMultiplier * 5),
    speed: 1.0,
    lastShot: Date.now(),
    shootInterval: Math.max(800, 2000 - (levelMultiplier * 150)) 
  };
  playTone({ frequency: 150, duration: 0.8, type: "sawtooth", gain: 0.25 });
}

function destroyBoss() {
  currentBoss = null;
  enemyBullets = [];
  score += 25; 
  updateHud();
  playTone({ frequency: 400, duration: 0.5, type: "triangle", gain: 0.2 });
}

function startGame() {
  if (!isLoggedIn) { alert("Je moet eerst inloggen bro!"); return; }
  lives = 3; score = 0; gameOver = false; gameStarted = true; gamePaused = false; timeFrozen = false;
  bullets = []; enemies = []; powerUps = []; activePowerUp = null; enemyBullets = []; currentBoss = null;
  activeWeapon = "normal"; weaponExpiresAt = 0;
  nextBossScore = 100;
  player.speed = 4; player.invulnerable = false;
  player.x = canvas.width / 2; player.y = canvas.height / 2;
  hud.classList.remove("hidden"); startScreen.classList.add("hidden"); gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden"); pauseButton.classList.remove("hidden"); pauseButton.classList.remove("paused");
  settingsScreen.classList.add("hidden");
  updateHud(); updateMobileControls();

  if (enemySpawnTimer) clearInterval(enemySpawnTimer);
  if (powerUpSpawnTimer) clearInterval(powerUpSpawnTimer);

  playAudio("start"); startBackgroundMusic();
  enemySpawnTimer = setInterval(spawnEnemy, 1500);
  powerUpSpawnTimer = setInterval(spawnPowerUp, 7000); // Iets vaker spawnen voor actie!
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
  gameStarted = false; gameOver = false; gamePaused = false; timeFrozen = false;
  bullets = []; enemies = []; enemyBullets = []; currentBoss = null; lives = 3; score = 0;
  activeWeapon = "normal"; weaponExpiresAt = 0;
  startScreen.classList.remove("hidden"); hud.classList.add("hidden"); gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden"); settingsScreen.classList.add("hidden"); pauseButton.classList.add("hidden");
  pauseButton.classList.remove("paused");
  updateHud(); updateMobileControls(); renderLeaderboards(); stopBackgroundMusic();
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
  if (gameStarted && !gameOver) { gamePaused = true; pauseScreen.classList.add("hidden"); pauseButton.classList.add("paused"); }
  updateControlModeButtons();
}

function closeSettings() {
  settingsScreen.classList.add("hidden");
  if (gameStarted && gamePaused && !gameOver) pauseScreen.classList.remove("hidden");
}

function setControlMode(mode) { controlMode = mode; localStorage.setItem("controlMode", controlMode); updateControlModeButtons(); }

settingsButton.addEventListener("click", openSettings);
fullscreenButton.addEventListener("click", toggleFullscreen);
closeSettingsButton.addEventListener("click", closeSettings);
pcModeButton.addEventListener("click", () => setControlMode("pc"));
mobileModeButton.addEventListener("click", () => setControlMode("mobile"));

document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) { fullscreenButton.textContent = "🗗"; fullscreenButton.title = "Exit Full Screen"; }
  else { fullscreenButton.textContent = "⛶"; fullscreenButton.title = "Full Screen"; }
});

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch((err) => console.error(err));
  else document.exitFullscreen();
}

function endGame() {
  gameOver = true; gameStarted = false; gamePaused = false; timeFrozen = false;
  finalScoreElement.textContent = score;
  savePlayerScore(score);
  hud.classList.add("hidden"); gameOverScreen.classList.remove("hidden"); pauseScreen.classList.add("hidden");
  settingsScreen.classList.add("hidden"); pauseButton.classList.add("hidden"); pauseButton.classList.remove("paused");
  updateMobileControls(); stopBackgroundMusic();
  if (enemySpawnTimer) { clearInterval(enemySpawnTimer); enemySpawnTimer = null; }
  if (powerUpSpawnTimer) { clearInterval(powerUpSpawnTimer); powerUpSpawnTimer = null; }
  playAudio("gameover");
}

let keys = {};
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (isAdmin && e.key.toLowerCase() === "m") toggleAdminPanel();
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

let mouse = { x: 0, y: 0 }; let bullets = []; let enemies = []; const stars = [];
resizeCanvas();

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
});

canvas.addEventListener("click", () => {
  if (!gameStarted || gameOver || gamePaused) return;
  shootAt(mouse.x, mouse.y);
});

// NIEUWE GEAVANCEERDE SCHIET LOGICA (WAPEN TYPES)
function shootAt(targetX, targetY) {
  const center = getPlayerCenter();
  const baseAngle = Math.atan2(targetY - center.y, targetX - center.x);
  
  // Controleer of wapen-tijd voorbij is
  if (Date.now() > weaponExpiresAt) {
    activeWeapon = "normal";
  }

  if (activeWeapon === "normal") {
    // Normaal schot: 1 gele kogel
    bullets.push({ x: center.x, y: center.y, dx: Math.cos(baseAngle) * 8, dy: Math.sin(baseAngle) * 8, size: 5, isBeam: false });
    playAudio("shoot");
  } 
  else if (activeWeapon === "spread") {
    // Spread shot: 3 kogels in een waaier-vorm (-0.2 rad, 0 rad, +0.2 rad)
    const angles = [baseAngle - 0.2, baseAngle, baseAngle + 0.2];
    angles.forEach(angle => {
      bullets.push({ x: center.x, y: center.y, dx: Math.cos(angle) * 8, dy: Math.sin(angle) * 8, size: 6, isBeam: false });
    });
    playTone({ frequency: 700, duration: 0.08, type: "square", gain: 0.1 });
  } 
  else if (activeWeapon === "beam") {
    // Plasma Beam: 1 gigantische, dikke kogel die dwars door vijanden heen vliegt
    bullets.push({ x: center.x, y: center.y, dx: Math.cos(baseAngle) * 11, dy: Math.sin(baseAngle) * 11, size: 24, isBeam: true });
    playTone({ frequency: 400, duration: 0.15, type: "sawtooth", gain: 0.12 });
  }
}

function shootNearestEnemy() {
  if (!gameStarted || gameOver || gamePaused) return;
  const center = getPlayerCenter();
  let target = currentBoss ? currentBoss : enemies[0];
  if (!currentBoss && enemies.length > 0) {
    let closestDistance = Infinity;
    enemies.forEach(enemy => {
      const dx = (enemy.x + enemy.size / 2) - center.x; const dy = (enemy.y + enemy.size / 2) - center.y;
      const distance = dx * dx + dy * dy;
      if (distance < closestDistance) { closestDistance = distance; target = enemy; }
    });
  }
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
  if (!gameStarted || gameOver || gamePaused || currentBoss) return; 
  const side = Math.floor(Math.random() * 4);
  let x = 0; let y = 0;
  if (side === 0) { x = Math.random() * canvas.width; y = -20; }
  else if (side === 1) { x = canvas.width + 20; y = Math.random() * canvas.height; }
  else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 20; }
  else { x = -20; y = Math.random() * canvas.height; }
  enemies.push({ x: x, y: y, size: 20, speed: 1.5 });
}

// GEAVANCEERDE POWER-UP SPAWNS MET WAPENS
function spawnPowerUp() {
  if (!gameStarted || gameOver || gamePaused) return;
  if (powerUps.length > 0) return;
  
  // Kansen verdeeld over 4 verschillende opties!
  const rand = Math.random();
  let type = "speed";
  if (rand < 0.25) type = "speed";
  else if (rand < 0.50) type = "shield";
  else if (rand < 0.75) type = "spread";
  else type = "beam";

  powerUps.push({ x: Math.random() * (canvas.width - 60) + 30, y: Math.random() * (canvas.height - 60) + 30, size: 28, type, duration: 6000 });
}

function applyPowerUp(powerUp) {
  if (powerUp.type === "spread" || powerUp.type === "beam") {
    activeWeapon = powerUp.type;
    weaponExpiresAt = Date.now() + powerUp.duration;
    addScore(5);
    playTone({ frequency: 900, duration: 0.25, type: "sine", gain: 0.15 });
  } else {
    activePowerUp = { ...powerUp, expiresAt: Date.now() + powerUp.duration };
    if (powerUp.type === "speed") { player.speed = 7; addScore(2); }
    else if (powerUp.type === "shield") { player.invulnerable = true; addScore(3); }
  }
  updateHud();
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

  // UPDATE BOSS LOGICA
  if (currentBoss && !timeFrozen) {
    if (currentBoss.y < 80) currentBoss.y += 1;
    currentBoss.x += Math.sin(Date.now() / 600) * currentBoss.speed;

    if (Date.now() - currentBoss.lastShot > currentBoss.shootInterval) {
      currentBoss.lastShot = Date.now();
      for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI / 3)) {
        enemyBullets.push({
          x: currentBoss.x + currentBoss.size / 2,
          y: currentBoss.y + currentBoss.size / 2,
          dx: Math.cos(angle) * 3,
          dy: Math.sin(angle) * 3,
          size: 6
        });
      }
      playTone({ frequency: 300, duration: 0.15, type: "sawtooth", gain: 0.08 });
    }

    let bdx = player.x - (currentBoss.x + currentBoss.size/2);
    let bdy = player.y - (currentBoss.y + currentBoss.size/2);
    let bdist = Math.sqrt(bdx * bdx + bdy * bdy);
    if (bdist < currentBoss.size / 2 + player.size) {
      if (!activePowerUp || activePowerUp.type !== "shield") { 
        lives -= 1; 
        player.x = canvas.width/2; player.y = canvas.height - 50; 
        if (lives <= 0) endGame(); 
      }
    }
  }

  // UPDATE BOSS KOGELS
  enemyBullets.forEach((eb, ebi) => {
    if (!timeFrozen) { eb.x += eb.dx; eb.y += eb.dy; }
    
    let pdx = player.x + player.size/2 - eb.x;
    let pdy = player.y + player.size/2 - eb.y;
    let pdist = Math.sqrt(pdx * pdx + pdy * pdy);
    if (pdist < player.size / 2 + eb.size) {
      enemyBullets.splice(ebi, 1);
      if (!activePowerUp || activePowerUp.type !== "shield") { lives -= 1; if (lives <= 0) endGame(); }
    }
  });
  enemyBullets = enemyBullets.filter(eb => eb.x > 0 && eb.x < canvas.width && eb.y > 0 && eb.y < canvas.height);

  // UPDATE KLEINE VIJANDEN
  enemies.forEach((e, ei) => {
    let dx = player.x - e.x; let dy = player.y - e.y;
    let dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    
    if (!timeFrozen) {
      e.x += (dx / dist) * e.speed; 
      e.y += (dy / dist) * e.speed;
    }

    if (dist < player.size) {
      enemies.splice(ei, 1);
      if (!activePowerUp || activePowerUp.type !== "shield") { lives -= 1; if (lives <= 0) endGame(); }
    }
  });

  const playerCenter = getPlayerCenter();
  powerUps = powerUps.filter((powerUp) => {
    const dx = powerUp.x - playerCenter.x; const dy = powerUp.y - playerCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < powerUp.size / 2 + player.size / 2) { applyPowerUp(powerUp); return false; }
    return true;
  });

  // Reset powerup verlopen checks
  if (activePowerUp && Date.now() > activePowerUp.expiresAt) { activePowerUp = null; player.speed = 4; player.invulnerable = false; }
  if (activeWeapon !== "normal" && Date.now() > weaponExpiresAt) { activeWeapon = "normal"; }

  // KOGEL HIT LOGICA (AANGEPAST VOOR DE LASER BEAM)
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    let bulletRemoved = false;
    
    // Check hit op Boss
    if (currentBoss && b.x > currentBoss.x && b.x < currentBoss.x + currentBoss.size && b.y > currentBoss.y && b.y < currentBoss.y + currentBoss.size) {
      currentBoss.hp -= b.isBeam ? 3 : 1; // Laser beam doet 3x zoveel schade aan de baas!
      playTone({ frequency: 450, duration: 0.05, type: "sine", gain: 0.1 });
      
      if (!b.isBeam) { bullets.splice(bi, 1); bulletRemoved = true; } // Laser snijdt door de baas heen!
      if (currentBoss.hp <= 0) { destroyBoss(); }
      if (bulletRemoved) continue;
    }

    // Check hit op kleine aliens
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (b.x < e.x + e.size && b.x + b.size > e.x && b.y < e.y + e.size && b.y + b.size > e.y) {
        enemies.splice(ei, 1); 
        addScore(1); 
        
        if (!b.isBeam) { // Alleen normale/spread kogels verdwijnen bij impact, de beam vliegt door!
          bullets.splice(bi, 1); 
          bulletRemoved = true; 
        }
        break;
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

  // SPELER KLEUR VERANDERT OP BASIS VAN WAPEN
  if (Date.now() < weaponExpiresAt) {
    ctx.fillStyle = activeWeapon === "spread" ? "#ff007f" : "#ffaa00"; // Roze voor spread, oranje voor beam
  } else {
    ctx.fillStyle = "#00e5ff"; // Normaal blauw
  }
  
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.strokeRect(player.x, player.y, player.size, player.size);

  ctx.fillStyle = "white";
  ctx.beginPath(); ctx.arc(player.x + 7, player.y + 8, 4, 0, Math.PI * 2); ctx.arc(player.x + 15, player.y + 8, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "black";
  ctx.beginPath(); ctx.arc(player.x + 7 + lookX, player.y + 8 + lookY, 1.5, 0, Math.PI * 2); ctx.arc(player.x + 15 + lookX, player.y + 8 + lookY, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // BOSS TEKENEN
  if (currentBoss) {
    ctx.fillStyle = "#aa00ff"; 
    ctx.fillRect(currentBoss.x, currentBoss.y, currentBoss.size, currentBoss.size);
    ctx.strokeStyle = "#ff00e5"; ctx.lineWidth = 3; 
    ctx.strokeRect(currentBoss.x, currentBoss.y, currentBoss.size, currentBoss.size);

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(currentBoss.x + 20, currentBoss.y + 25, 8, 0, Math.PI*2);
    ctx.arc(currentBoss.x + 50, currentBoss.y + 25, 8, 0, Math.PI*2);
    ctx.fill();

    const barWidth = 200;
    const barHeight = 14;
    const barX = canvas.width / 2 - barWidth / 2;
    const barY = 50;
    
    ctx.fillStyle = "#333"; ctx.fillRect(barX, barY, barWidth, barHeight); 
    const hpPercentage = Math.max(0, currentBoss.hp / currentBoss.maxHp);
    ctx.fillStyle = "#ff304f"; ctx.fillRect(barX, barY, barWidth * hpPercentage, barHeight); 
    ctx.strokeStyle = "white"; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.font = "12px Arial"; ctx.fillStyle = "white";
    ctx.fillText("BOSS ALIEN HP", barX + 55, barY - 5);
  }

  enemyBullets.forEach(eb => { ctx.fillStyle = "#ff9100"; ctx.beginPath(); ctx.arc(eb.x, eb.y, eb.size, 0, Math.PI*2); ctx.fill(); });

  enemies.forEach(e => {
    ctx.fillStyle = "#ff304f"; ctx.beginPath(); ctx.arc(e.x + e.size / 2, e.y + e.size / 2, e.size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#ffb3c1"; ctx.lineWidth = 2; ctx.stroke();
  });

  // BULLETS TEKENEN MET EFFECTEN
  bullets.forEach(b => { 
    if (b.isBeam) {
      ctx.fillStyle = "#ff5500"; // Dikke vuorige plasma straal
      ctx.shadowBlur = 15; ctx.shadowColor = "#ff1a00";
    } else {
      ctx.fillStyle = activeWeapon === "spread" ? "#ff007f" : "#fff176"; 
    }
    ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); 
    ctx.shadowBlur = 0;
  });

  // POWERUPS DESIGN
  powerUps.forEach(powerUp => {
    ctx.save(); ctx.translate(powerUp.x, powerUp.y); ctx.shadowBlur = 18;
    
    if (powerUp.type === "speed") {
      ctx.shadowColor = "#76ff03"; ctx.fillStyle = "#76ff03"; ctx.beginPath(); ctx.moveTo(0, -powerUp.size / 2); ctx.lineTo(powerUp.size / 2, 0); ctx.lineTo(0, powerUp.size / 2); ctx.lineTo(-powerUp.size / 2, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
    } else if (powerUp.type === "shield") {
      ctx.shadowColor = "#03a9f4"; ctx.fillStyle = "#03a9f4"; ctx.beginPath(); ctx.arc(0, 0, powerUp.size / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "white"; ctx.font = "bold 18px Arial"; ctx.fillText("S", -6, 7);
    } else if (powerUp.type === "spread") {
      // Waaier symbool (W)
      ctx.shadowColor = "#ff007f"; ctx.fillStyle = "#ff007f"; ctx.beginPath(); ctx.arc(0, 0, powerUp.size / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "white"; ctx.font = "bold 16px Arial"; ctx.fillText("W", -8, 6);
    } else if (powerUp.type === "beam") {
      // Laser symbool (L)
      ctx.shadowColor = "#ffaa00"; ctx.fillStyle = "#ffaa00"; ctx.beginPath(); ctx.arc(0, 0, powerUp.size / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "white"; ctx.font = "bold 16px Arial"; ctx.fillText("L", -5, 6);
    }
    ctx.restore();
  });

  if (Date.now() < weaponExpiresAt) {
    ctx.font = "18px Arial"; ctx.fillStyle = activeWeapon === "spread" ? "#ff007f" : "#ffaa00";
    ctx.fillText(activeWeapon === "spread" ? "🔥 SPREAD SHOT!" : "⚡ PLASMA BEAM!", 10, 60);
  } else if (activePowerUp) {
    ctx.font = "18px Arial"; ctx.fillStyle = activePowerUp.type === "shield" ? "#03a9f4" : "#76ff03";
    ctx.fillText(activePowerUp.type === "shield" ? "Shield Active!" : "Speed Boost!", 10, 60);
  }

  if (timeFrozen) {
    ctx.font = "20px Arial"; ctx.fillStyle = "#00e5ff";
    ctx.fillText("❄ TIME FROZEN ❄", canvas.width / 2 - 80, 30);
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
