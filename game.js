// ==========================================
// SPACE SHOOTER: DEFENITIEVE VERSIE
// ==========================================
let isAdmin = false;
let isLoggedIn = false;
let currentLoggedInUser = ""; 
let timeFrozen = false; 

let currentBoss = null;
let nextBossScore = 100;
let enemyBullets = [];   
let victoryAchieved = false; 
let fireworks = [];          
let damageNumbers = [];      

const victoryScreen = document.getElementById("victory-screen");
const victoryKeepPlayingButton = document.getElementById("victory-keep-playing-button");
const victoryLeaveButton = document.getElementById("victory-leave-button");

// ... [Hier de rest van de Login/Admin/Audio logica van de vorige versie] ...
// (Deze functies blijven gelijk voor stabiliteit)

// ==========================================
// GAME CORE LOGICA & ENGINE (GEFIXED)
// ==========================================
function update() {
  // 1. Vuurwerk update
  fireworks.forEach((f, index) => {
    f.x += f.dx; f.y += f.dy;
    f.dy += 0.05; f.alpha -= f.decay;
    if (f.alpha <= 0) fireworks.splice(index, 1);
  });

  if (victoryAchieved && Math.random() < 0.05) createFirework();

  if (!gameStarted || gameOver || gamePaused) return;

  // 2. Sterren bewegen
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) { star.y = 0; star.x = Math.random() * canvas.width; }
  });

  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;
  clampPlayer();

  // 3. Kogels bewegen
  bullets.forEach(b => { b.x += b.dx; b.y += b.dy; });
  bullets = bullets.filter(b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);

  // 4. Boss logica
  if (currentBoss && !timeFrozen) {
    if (currentBoss.y < 80) currentBoss.y += 1;
    currentBoss.x += Math.sin(Date.now() / 600) * currentBoss.speed;

    if (Date.now() - currentBoss.lastShot > currentBoss.shootInterval) {
      currentBoss.lastShot = Date.now();
      for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI / 3)) {
        enemyBullets.push({ x: currentBoss.x + currentBoss.size / 2, y: currentBoss.y + currentBoss.size / 2, dx: Math.cos(angle) * 3, dy: Math.sin(angle) * 3, size: 6 });
      }
      playTone({ frequency: 300, duration: 0.15, type: "sawtooth", gain: 0.08 });
    }
  }

  // 5. CRASH-FREE VIJAND BOTSINGEN (Achteruit lussen)
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    let bulletRemoved = false;
    
    // Boss raak
    if (currentBoss && b.x > currentBoss.x && b.x < currentBoss.x + currentBoss.size && b.y > currentBoss.y && b.y < currentBoss.y + currentBoss.size) {
      let d = b.isBeam ? 3 : 1;
      currentBoss.hp -= d;
      damageNumbers.push({ x: b.x, y: b.y, text: "-" + d, color: "#ff5500", alpha: 1, life: 30 });
      if (!b.isBeam) { bullets.splice(bi, 1); bulletRemoved = true; } 
      if (currentBoss.hp <= 0) destroyBoss();
      if (bulletRemoved) continue;
    }

    // Vijand raak
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (e && b.x < e.x + e.size && b.x + b.size > e.x && b.y < e.y + e.size && b.y + b.size > e.y) {
        enemies.splice(ei, 1);
        addScore(1);
        damageNumbers.push({ x: e.x, y: e.y, text: "-1", color: "#fff176", alpha: 1, life: 25 });
        if (!b.isBeam) { bullets.splice(bi, 1); bulletRemoved = true; }
        break;
      }
    }
  }

  // 6. Vijanden beweging en speler botsing
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];
    if (!e) continue;
    if (!timeFrozen) {
      let dx = player.x - e.x; let dy = player.y - e.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      e.x += (dx / dist) * e.speed; e.y += (dy / dist) * e.speed;
      if (dist < player.size) { enemies.splice(ei, 1); if(!player.invulnerable) lives--; if(lives<=0) endGame(); }
    }
  }

  // 7. Schade-cijfers update
  damageNumbers.forEach((dn, i) => { dn.y -= 0.8; dn.life--; dn.alpha = dn.life/30; if(dn.life <= 0) damageNumbers.splice(i, 1); });
}
