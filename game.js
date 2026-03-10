const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const levelEl = document.getElementById("level");
const waveEl = document.getElementById("wave");
const hpEl = document.getElementById("hp");
const finalScoreEl = document.getElementById("finalScore");
const finalHighScoreEl = document.getElementById("finalHighScore");

const startOverlay = document.getElementById("startOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const upgradeOverlay = document.getElementById("upgradeOverlay");
const upgradeText = document.getElementById("upgradeText");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const gnomeImg = new Image();
gnomeImg.src = "gnome-main.png";

const roosterImg = new Image();
roosterImg.src = "rooster.png";

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const keys = {};
let running = false;
let animationId = null;
let lastTime = 0;
let lastSpawn = 0;
let lastCast = 0;
let lastTouch = 0;
let highScore = Number(localStorage.getItem("lost-realm-high-score") || 0);

const state = {
  score: 0,
  hp: 10,
  player: { x: WIDTH / 2, y: HEIGHT / 2, facing: 1, size: 118 },
  enemies: [],
  projectiles: [],
  effects: [],
  titleFloat: 0,
  milestoneLevel: 0
};

function getLevel() {
  return Math.min(100, Math.floor(state.score / 250) + 1);
}

function getWave() {
  return Math.floor(state.score / 500) + 1;
}

function getPowerTier() {
  return Math.floor((getLevel() - 1) / 5);
}

function getEnemySpeed() {
  return 0.75 + getWave() * 0.18;
}

function getSpawnRate() {
  return Math.max(320, 1500 - getWave() * 145);
}

function getAutoCastRate() {
  return Math.max(90, 430 - getLevel() * 2 - getWave() * 10);
}

function updateHUD() {
  scoreEl.textContent = state.score;
  highScoreEl.textContent = highScore;
  levelEl.textContent = getLevel();
  waveEl.textContent = getWave();
  hpEl.textContent = state.hp;
}

function resetGame() {
  state.score = 0;
  state.hp = 10;
  state.player = { x: WIDTH / 2, y: HEIGHT / 2, facing: 1, size: 118 };
  state.enemies = [];
  state.projectiles = [];
  state.effects = [];
  state.titleFloat = 0;
  state.milestoneLevel = 0;

  lastTime = 0;
  lastSpawn = 0;
  lastCast = 0;
  lastTouch = 0;

  running = true;
  startOverlay.classList.remove("show");
  gameOverOverlay.classList.remove("show");
  upgradeOverlay.classList.remove("show");

  updateHUD();

  if (animationId) cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
}

function endGame() {
  running = false;
  finalScoreEl.textContent = state.score;
  finalHighScoreEl.textContent = highScore;
  gameOverOverlay.classList.add("show");
}

function addScore(points) {
  state.score += points;
  if (state.score > highScore) {
    highScore = state.score;
    localStorage.setItem("lost-realm-high-score", String(highScore));
  }
  updateHUD();
}

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = -50;
    y = Math.random() * HEIGHT;
  } else if (side === 1) {
    x = WIDTH + 50;
    y = Math.random() * HEIGHT;
  } else if (side === 2) {
    x = Math.random() * WIDTH;
    y = -50;
  } else {
    x = Math.random() * WIDTH;
    y = HEIGHT + 50;
  }

  state.enemies.push({
    x,
    y,
    size: 68
  });
}

function nearestEnemies() {
  return [...state.enemies].sort((a, b) => {
    const da = Math.hypot(a.x - state.player.x, a.y - state.player.y);
    const db = Math.hypot(b.x - state.player.x, b.y - state.player.y);
    return da - db;
  });
}

function fireShot(target, config) {
  if (!target) return;

  const startX = state.player.x + (state.player.facing === 1 ? 42 : -42);
  const startY = state.player.y - 14;

  const dx = target.x - startX;
  const dy = target.y - startY;
  const dist = Math.max(1, Math.hypot(dx, dy));

  state.projectiles.push({
    x: startX,
    y: startY,
    vx: (dx / dist) * config.speed,
    vy: (dy / dist) * config.speed,
    size: config.size,
    life: config.life,
    splash: config.splash || 0,
    style: config.style
  });
}

function castSpell() {
  const targets = nearestEnemies();
  const target = targets[0];
  if (!target) return;

  const tier = getPowerTier();

  if (tier === 0) {
    fireShot(target, { speed: 8.8, size: 20, life: 42, style: "orb" });
    return;
  }

  if (tier === 1) {
    fireShot(targets[0], { speed: 9.1, size: 22, life: 44, style: "dual" });
    fireShot(targets[1] || targets[0], { speed: 9.1, size: 22, life: 44, style: "dual" });
    return;
  }

  if (tier === 2) {
    fireShot(targets[0], { speed: 9.6, size: 24, life: 46, style: "lightning", splash: 120 });
    fireShot(targets[1] || targets[0], { speed: 9.6, size: 24, life: 46, style: "lightning", splash: 120 });
    return;
  }

  if (tier === 3) {
    fireShot(targets[0], { speed: 10.1, size: 28, life: 48, style: "flare", splash: 140 });
    return;
  }

  if (tier === 4) {
    for (let i = 0; i < 3; i++) {
      fireShot(targets[i] || targets[0], { speed: 10.2 + i * 0.15, size: 24, life: 48, style: "triad", splash: 120 });
    }
    return;
  }

  if (tier === 5) {
    for (let i = 0; i < 4; i++) {
      fireShot(targets[i] || targets[0], { speed: 10.5, size: 26, life: 50, style: "storm", splash: 140 });
    }
    return;
  }

  if (tier === 6) {
    for (let i = 0; i < 5; i++) {
      fireShot(targets[i] || targets[0], { speed: 10.8, size: 30, life: 52, style: "beam", splash: 150 });
    }
    return;
  }

  if (tier === 7) {
    for (let i = 0; i < 6; i++) {
      fireShot(targets[i] || targets[0], { speed: 11.2, size: 32, life: 56, style: "nova", splash: 170 });
    }
    return;
  }

  if (tier === 8) {
    for (let i = 0; i < 7; i++) {
      fireShot(targets[i] || targets[0], { speed: 11.5, size: 34, life: 58, style: "spore", splash: 180 });
    }
    return;
  }

  for (let i = 0; i < Math.min(10, 4 + tier); i++) {
    fireShot(targets[i] || targets[0], { speed: 12 + i * 0.08, size: 36, life: 60, style: "apocalypse", splash: 200 });
  }
}

function triggerAscension(level) {
  state.milestoneLevel = level;
  state.enemies = [];
  state.effects.push({
    x: WIDTH / 2,
    y: HEIGHT / 2,
    r: 0,
    max: 700,
    life: 40,
    style: "screen"
  });

  upgradeText.textContent = `LEVEL ${level} ASCENSION`;
  upgradeOverlay.classList.add("show");

  setTimeout(() => {
    upgradeOverlay.classList.remove("show");
  }, 900);
}

function updatePlayer(delta, time) {
  const p = state.player;
  const speed = 4.4 * delta;

  if (keys["ArrowLeft"] || keys["KeyA"]) {
    p.x -= speed;
    p.facing = -1;
  }
  if (keys["ArrowRight"] || keys["KeyD"]) {
    p.x += speed;
    p.facing = 1;
  }
  if (keys["ArrowUp"] || keys["KeyW"]) p.y -= speed;
  if (keys["ArrowDown"] || keys["KeyS"]) p.y += speed;

  p.x = Math.max(45, Math.min(WIDTH - 45, p.x));
  p.y = Math.max(70, Math.min(HEIGHT - 45, p.y));

  state.titleFloat += 0.03 * delta;

  if (time - lastCast > getAutoCastRate()) {
    lastCast = time;
    castSpell();
  }
}

function updateProjectiles(delta) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.life -= 1;

    if (p.life <= 0 || p.x < -100 || p.x > WIDTH + 100 || p.y < -100 || p.y > HEIGHT + 100) {
      state.projectiles.splice(i, 1);
    }
  }
}

function removeEnemyAt(index, projectile) {
  const enemy = state.enemies[index];
  addScore(25);

  state.effects.push({
    x: enemy.x,
    y: enemy.y,
    r: 10,
    max: projectile.splash ? projectile.splash * 0.5 : 36,
    life: 18,
    style: projectile.style
  });

  if (projectile.splash > 0) {
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      if (j === index) continue;
      const other = state.enemies[j];
      const d = Math.hypot(other.x - enemy.x, other.y - enemy.y);
      if (d < projectile.splash) {
        addScore(25);
        state.effects.push({
          x: other.x,
          y: other.y,
          r: 10,
          max: 30,
          life: 12,
          style: projectile.style
        });
        state.enemies.splice(j, 1);
      }
    }
  }

  state.enemies.splice(index, 1);
}

function updateEnemies(delta, time) {
  if (time - lastSpawn > getSpawnRate()) {
    lastSpawn = time;
    spawnEnemy();
  }

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    const dx = state.player.x - e.x;
    const dy = state.player.y - e.y;
    const dist = Math.max(1, Math.hypot(dx, dy));

    e.x += (dx / dist) * getEnemySpeed() * delta;
    e.y += (dy / dist) * getEnemySpeed() * delta;

    const contact = Math.hypot(e.x - state.player.x, e.y - state.player.y);
    if (contact < 54 && time - lastTouch > 450) {
      lastTouch = time;
      state.hp -= 1;
      updateHUD();
      if (state.hp <= 0) {
        endGame();
        return;
      }
    }
  }

  for (let p = state.projectiles.length - 1; p >= 0; p--) {
    const proj = state.projectiles[p];
    for (let e = state.enemies.length - 1; e >= 0; e--) {
      const enemy = state.enemies[e];
      const hit = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
      if (hit < enemy.size * 0.42 + proj.size * 0.5) {
        removeEnemyAt(e, proj);
        state.projectiles.splice(p, 1);
        break;
      }
    }
  }

  const level = getLevel();
  if (level % 10 === 0 && level !== 0 && level !== state.milestoneLevel) {
    triggerAscension(level);
  }
}

function updateEffects() {
  for (let i = state.effects.length - 1; i >= 0; i--) {
    const fx = state.effects[i];
    fx.life -= 1;
    fx.r += (fx.max - fx.r) * 0.2;
    if (fx.life <= 0) state.effects.splice(i, 1);
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(10, 30, 14, 0.35)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "rgba(158,255,158,0.06)";
  ctx.strokeRect(16, 16, WIDTH - 32, HEIGHT - 32);
}

function drawPlayer() {
  const p = state.player;
  const w = p.size;
  const h = p.size;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.facing, 1);
  ctx.drawImage(gnomeImg, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawEnemies() {
  for (const e of state.enemies) {
    ctx.drawImage(roosterImg, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
  }
}

function drawProjectile(p) {
  ctx.save();

  if (p.style === "lightning" || p.style === "beam") {
    ctx.fillStyle = "rgba(120, 235, 255, 0.95)";
    ctx.shadowColor = "rgba(120,235,255,1)";
    ctx.shadowBlur = 18;
  } else if (p.style === "flare" || p.style === "nova") {
    ctx.fillStyle = "rgba(255, 120, 240, 0.92)";
    ctx.shadowColor = "rgba(255,120,240,1)";
    ctx.shadowBlur = 18;
  } else {
    ctx.fillStyle = "rgba(190, 255, 100, 0.95)";
    ctx.shadowColor = "rgba(190,255,100,1)";
    ctx.shadowBlur = 18;
  }

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawProjectiles() {
  for (const p of state.projectiles) drawProjectile(p);
}

function drawEffects() {
  for (const fx of state.effects) {
    ctx.save();

    if (fx.style === "screen") {
      ctx.strokeStyle = `rgba(210,160,255,${fx.life / 40})`;
      ctx.lineWidth = 10;
    } else if (fx.style === "lightning" || fx.style === "beam") {
      ctx.strokeStyle = `rgba(120,235,255,${fx.life / 18})`;
      ctx.lineWidth = 6;
    } else if (fx.style === "flare" || fx.style === "nova") {
      ctx.strokeStyle = `rgba(255,120,240,${fx.life / 18})`;
      ctx.lineWidth = 6;
    } else {
      ctx.strokeStyle = `rgba(190,255,100,${fx.life / 18})`;
      ctx.lineWidth = 5;
    }

    ctx.beginPath();
    ctx.arc(fx.x, fx.y, fx.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function loop(time) {
  if (!running) return;

  if (!lastTime) lastTime = time;
  const delta = (time - lastTime) / 16.666;
  lastTime = time;

  updatePlayer(delta, time);
  updateProjectiles(delta);
  updateEnemies(delta, time);
  updateEffects();

  drawBackground();
  drawPlayer();
  drawEnemies();
  drawProjectiles();
  drawEffects();

  animationId = requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

startBtn.addEventListener("click", resetGame);
restartBtn.addEventListener("click", resetGame);

updateHUD();
