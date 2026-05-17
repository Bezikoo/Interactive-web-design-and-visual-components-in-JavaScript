// ── Константи ─────────────────────────────────────────────────────────
const W = 720, H = 450;
const PAD_W = 12, PAD_H = 80;
const BALL_R = 9;
const PAD_MARGIN = 18;
const WIN_SCORE = 7;

const AI_SPEED = { easy: 3, medium: 5, hard: 8 };

// ── Стан застосунку ───────────────────────────────────────────────────
const appState = {
  status: 'idle',   // idle | playing | paused | won | lost
  round: 0,
  scorePlayer: 0,
  scoreAI: 0,
  difficulty: 'easy',
  controlMode: 'mouse',
  animId: null,
  errorMsg: '',
};

// ── Ігрові об'єкти ────────────────────────────────────────────────────
const player = { x: PAD_MARGIN, y: H / 2 - PAD_H / 2, dy: 0 };
const ai     = { x: W - PAD_MARGIN - PAD_W, y: H / 2 - PAD_H / 2 };

const ball = {
  x: W / 2, y: H / 2,
  vx: 0, vy: 0,
  speed: 5,
  lastHitBy: null,
  trail: [],
};

const keys = {};

// ── Canvas ────────────────────────────────────────────────────────────
const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');
const overlay = document.getElementById('canvasOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySub   = document.getElementById('overlaySub');

// ── DOM-елементи ──────────────────────────────────────────────────────
const startBtn     = document.getElementById('startBtn');
const pauseBtn     = document.getElementById('pauseBtn');
const resetBtn     = document.getElementById('resetBtn');
const scorePlayerEl = document.getElementById('scorePlayer');
const scoreAIEl    = document.getElementById('scoreAI');
const gameStatusEl = document.getElementById('gameStatusEl');
const roundEl      = document.getElementById('roundEl');
const ballSpeedEl  = document.getElementById('ballSpeedEl');
const msgBox       = document.getElementById('msgBox');

// ── Утиліти ───────────────────────────────────────────────────────────
function setMsg(msg, type = '') {
  msgBox.textContent = msg;
  msgBox.className = 'msg-box' + (type ? ` is-${type}` : '');
  msgBox.classList.remove('is-hidden');
  clearTimeout(setMsg._t);
  if (type !== 'error') setMsg._t = setTimeout(() => msgBox.classList.add('is-hidden'), 3500);
}

function updateUI() {
  const statusMap = { idle: 'Очікування', playing: 'Гра', paused: 'Пауза', won: 'Перемога!', lost: 'Поразка' };
  gameStatusEl.textContent = statusMap[appState.status] ?? appState.status;
  roundEl.textContent = appState.round || '—';
  ballSpeedEl.textContent = appState.status === 'playing' ? ball.speed.toFixed(1) : '—';
  scorePlayerEl.textContent = appState.scorePlayer;
  scoreAIEl.textContent = appState.scoreAI;
}

function showOverlay(title, sub) {
  overlayTitle.textContent = title;
  overlaySub.textContent = sub;
  overlay.classList.remove('is-hidden');
}
function hideOverlay() { overlay.classList.add('is-hidden'); }

// ── Скидання м'яча ────────────────────────────────────────────────────
function launchBall(towardAI = true) {
  ball.x = W / 2;
  ball.y = H / 2;
  ball.speed = 5;
  ball.trail = [];
  const angle = (Math.random() * Math.PI / 3) - Math.PI / 6;
  const dir = towardAI ? 1 : -1;
  ball.vx = dir * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);
}

// ── Малювання ─────────────────────────────────────────────────────────
function draw() {
  // Фон
  ctx.fillStyle = '#010810';
  ctx.fillRect(0, 0, W, H);

  // Центральна лінія
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = 'rgba(0,229,255,0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Слід м'яча
  ball.trail.forEach((pos, i) => {
    const alpha = (i / ball.trail.length) * 0.4;
    const r = BALL_R * (i / ball.trail.length) * 0.7;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,229,255,${alpha})`;
    ctx.fill();
  });

  // М'яч
  const gradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, BALL_R);
  gradient.addColorStop(0, '#80ffff');
  gradient.addColorStop(1, '#00e5ff');
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ракетка гравця
  const pGrad = ctx.createLinearGradient(player.x, 0, player.x + PAD_W, 0);
  pGrad.addColorStop(0, '#00e5ff');
  pGrad.addColorStop(1, '#0090aa');
  ctx.fillStyle = pGrad;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 8;
  drawRoundRect(player.x, player.y, PAD_W, PAD_H, 4);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ракетка AI
  const aGrad = ctx.createLinearGradient(ai.x, 0, ai.x + PAD_W, 0);
  aGrad.addColorStop(0, '#aa0050');
  aGrad.addColorStop(1, '#ff6b6b');
  ctx.fillStyle = aGrad;
  ctx.shadowColor = '#ff6b6b';
  ctx.shadowBlur = 8;
  drawRoundRect(ai.x, ai.y, PAD_W, PAD_H, 4);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Рахунок на canvas
  ctx.font = 'bold 36px "Segoe UI", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,229,255,0.18)';
  ctx.fillText(appState.scorePlayer, W / 2 - 80, 50);
  ctx.fillText(appState.scoreAI, W / 2 + 80, 50);
}

function drawRoundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Оновлення логіки ──────────────────────────────────────────────────
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function updatePlayer() {
  if (appState.controlMode === 'keyboard') {
    if (keys['ArrowUp'] || keys['w'] || keys['W']) player.y -= 7;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) player.y += 7;
  }
  player.y = clamp(player.y, 0, H - PAD_H);
}

function updateAI() {
  const speed = AI_SPEED[appState.difficulty];
  const targetY = ball.y - PAD_H / 2;
  const diff = targetY - ai.y;
  ai.y += clamp(diff, -speed, speed);
  ai.y = clamp(ai.y, 0, H - PAD_H);
}

function updateBall() {
  // Слід
  ball.trail.push({ x: ball.x, y: ball.y });
  if (ball.trail.length > 10) ball.trail.shift();

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Відбиття від верху/низу
  if (ball.y - BALL_R <= 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }
  if (ball.y + BALL_R >= H) { ball.y = H - BALL_R; ball.vy = -Math.abs(ball.vy); }

  // Зіткнення з ракеткою гравця
  if (
    ball.x - BALL_R <= player.x + PAD_W &&
    ball.x - BALL_R >= player.x &&
    ball.y >= player.y && ball.y <= player.y + PAD_H
  ) {
    ball.x = player.x + PAD_W + BALL_R;
    const hitPos = (ball.y - (player.y + PAD_H / 2)) / (PAD_H / 2);
    const angle = hitPos * (Math.PI / 3.5);
    ball.speed = Math.min(ball.speed + 0.25, 15);
    ball.vx = ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);
    ball.lastHitBy = 'player';
    setMsg('Відбито! 💥');
  }

  // Зіткнення з ракеткою AI
  if (
    ball.x + BALL_R >= ai.x &&
    ball.x + BALL_R <= ai.x + PAD_W &&
    ball.y >= ai.y && ball.y <= ai.y + PAD_H
  ) {
    ball.x = ai.x - BALL_R;
    const hitPos = (ball.y - (ai.y + PAD_H / 2)) / (PAD_H / 2);
    const angle = hitPos * (Math.PI / 3.5);
    ball.speed = Math.min(ball.speed + 0.15, 15);
    ball.vx = -ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);
    ball.lastHitBy = 'ai';
  }

  // М'яч вийшов за ліву межу — очко AI
  if (ball.x - BALL_R < 0) {
    appState.scoreAI++;
    scoreAIEl.textContent = appState.scoreAI;
    if (appState.scoreAI >= WIN_SCORE) { endGame(false); return; }
    setMsg('Пропущено! -1 очко', 'error');
    launchBall(false);
  }

  // М'яч вийшов за праву межу — очко гравця
  if (ball.x + BALL_R > W) {
    appState.scorePlayer++;
    scorePlayerEl.textContent = appState.scorePlayer;
    if (appState.scorePlayer >= WIN_SCORE) { endGame(true); return; }
    setMsg('Очко! +1 🎯', '');
    launchBall(true);
  }
}

// ── Ігровий цикл ──────────────────────────────────────────────────────
function gameLoop() {
  if (appState.status !== 'playing') return;

  updatePlayer();
  updateAI();
  updateBall();
  draw();
  updateUI();

  appState.animId = requestAnimationFrame(gameLoop);
}

// ── Керування грою ────────────────────────────────────────────────────
function startGame() {
  if (appState.status === 'playing') { setMsg('Гра вже запущена', 'warn'); return; }
  if (appState.status === 'won' || appState.status === 'lost') {
    fullReset();
  }
  appState.status = 'playing';
  appState.round++;
  hideOverlay();
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  launchBall(true);
  updateUI();
  appState.animId = requestAnimationFrame(gameLoop);
}

function pauseGame() {
  if (appState.status !== 'playing') return;
  appState.status = 'paused';
  cancelAnimationFrame(appState.animId);
  appState.animId = null;
  showOverlay('⏸ Пауза', 'Натисніть «Старт» або пробіл для продовження');
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  updateUI();
}

function resumeGame() {
  if (appState.status !== 'paused') return;
  appState.status = 'playing';
  hideOverlay();
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  updateUI();
  appState.animId = requestAnimationFrame(gameLoop);
}

function endGame(playerWon) {
  appState.status = playerWon ? 'won' : 'lost';
  cancelAnimationFrame(appState.animId);
  appState.animId = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  updateUI();
  if (playerWon) {
    showOverlay('🏆 Перемога!', `Ви перемогли з рахунком ${appState.scorePlayer}:${appState.scoreAI}`);
    setMsg('Ви перемогли! Чудова гра!', '');
  } else {
    showOverlay('💀 Поразка', `AI переміг: ${appState.scoreAI}:${appState.scorePlayer}`);
    setMsg('AI переміг. Спробуйте ще!', 'error');
  }
}

function fullReset() {
  cancelAnimationFrame(appState.animId);
  appState.animId = null;
  appState.status = 'idle';
  appState.scorePlayer = 0;
  appState.scoreAI = 0;
  appState.round = 0;
  player.y = H / 2 - PAD_H / 2;
  ai.y = H / 2 - PAD_H / 2;
  ball.x = W / 2;
  ball.y = H / 2;
  ball.vx = 0;
  ball.vy = 0;
  ball.trail = [];
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  showOverlay('Pong', 'Натисніть «Старт» або пробіл для початку');
  updateUI();
  draw();
  setMsg('Гру скинуто');
}

// ── Обробники подій ───────────────────────────────────────────────────
startBtn.addEventListener('click', () => {
  if (appState.status === 'paused') resumeGame();
  else startGame();
});

pauseBtn.addEventListener('click', pauseGame);
resetBtn.addEventListener('click', fullReset);

// Миша
canvas.addEventListener('mousemove', e => {
  if (appState.controlMode !== 'mouse') return;
  const rect = canvas.getBoundingClientRect();
  const scaleY = H / rect.height;
  const mouseY = (e.clientY - rect.top) * scaleY;
  player.y = clamp(mouseY - PAD_H / 2, 0, H - PAD_H);
});

// Клавіатура
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ') {
    e.preventDefault();
    if (appState.status === 'playing') pauseGame();
    else if (appState.status === 'paused') resumeGame();
    else startGame();
  }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// Складність
document.querySelectorAll('[data-diff]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (appState.status === 'playing') { setMsg('Не можна змінити складність під час гри', 'warn'); return; }
    appState.difficulty = btn.dataset.diff;
    document.querySelectorAll('[data-diff]').forEach(b => b.classList.toggle('is-active', b === btn));
    setMsg(`Складність: ${btn.textContent}`);
  });
});

// Керування
document.querySelectorAll('[data-ctrl]').forEach(btn => {
  btn.addEventListener('click', () => {
    appState.controlMode = btn.dataset.ctrl;
    document.querySelectorAll('[data-ctrl]').forEach(b => b.classList.toggle('is-active', b === btn));
    setMsg(`Керування: ${btn.textContent}`);
  });
});

// ── Ініціалізація ─────────────────────────────────────────────────────
draw();
updateUI();
showOverlay('Pong', 'Натисніть «Старт» або пробіл для початку');
