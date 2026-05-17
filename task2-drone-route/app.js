// ── Дані маршруту ────────────────────────────────────────────────────
const WAYPOINTS = [
  { id: 0, x: 80,  y: 420, label: 'Старт', alt: 0,   speed: 0   },
  { id: 1, x: 160, y: 300, label: 'Т-1',   alt: 30,  speed: 8   },
  { id: 2, x: 280, y: 200, label: 'Т-2',   alt: 60,  speed: 10  },
  { id: 3, x: 420, y: 160, label: 'Т-3',   alt: 80,  speed: 12  },
  { id: 4, x: 560, y: 240, label: 'Т-4',   alt: 50,  speed: 9   },
  { id: 5, x: 620, y: 380, label: 'Фініш', alt: 0,   speed: 5   },
];

const MODES = { auto: 'Авто', manual: 'Ручний', return: 'Повернення' };

// ── Стан застосунку ──────────────────────────────────────────────────
const appState = {
  status: 'idle',        // idle | flying | paused | done | error
  mode: 'auto',
  currentWpIndex: 0,
  selectedWpId: null,
  animationId: null,
  animProgress: 0,       // 0..1 між поточною та наступною точкою
  visitedWps: new Set([0]),
  errorMsg: '',
};

// ── DOM-посилання ────────────────────────────────────────────────────
const svg         = document.getElementById('droneMap');
const droneObj    = document.getElementById('droneObject');
const activeLine  = document.getElementById('activeRouteLine');
const statusBox   = document.getElementById('statusBox');
const droneStatus = document.getElementById('droneStatus');
const droneMode   = document.getElementById('droneMode');
const currentWpEl = document.getElementById('currentWp');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const selectedWpInfo = document.getElementById('selectedWpInfo');
const flyBtn      = document.getElementById('flyBtn');
const resetBtn    = document.getElementById('resetBtn');
const mapTooltip  = document.getElementById('mapTooltip');

const NS = 'http://www.w3.org/2000/svg';

// ── Утиліти ──────────────────────────────────────────────────────────
function setStatus(msg, type = '') {
  statusBox.textContent = msg;
  statusBox.className = 'status-box' + (type ? ` is-${type}` : '');
  statusBox.classList.remove('is-hidden');
  clearTimeout(setStatus._t);
  if (type !== 'error') setStatus._t = setTimeout(() => statusBox.classList.add('is-hidden'), 4000);
}

function lerp(a, b, t) { return a + (b - a) * t; }

// ── Рендеринг стану UI ───────────────────────────────────────────────
function updateInfoPanel() {
  const wp = WAYPOINTS[appState.currentWpIndex];
  droneMode.textContent = MODES[appState.mode];
  currentWpEl.textContent = `${wp.label} (${wp.id})`;

  const pct = Math.round((appState.currentWpIndex / (WAYPOINTS.length - 1)) * 100);
  progressFill.style.width = pct + '%';
  progressText.textContent = pct + '%';

  const statusMap = {
    idle: 'Очікування',
    flying: 'Виконує маршрут',
    paused: 'Пауза',
    done: 'Завершено',
    error: 'Помилка',
  };
  droneStatus.textContent = statusMap[appState.status] ?? appState.status;
}

function renderWaypoints() {
  document.querySelectorAll('.waypoint').forEach(el => {
    const id = Number(el.dataset.wp);
    el.classList.remove('is-selected', 'is-visited', 'is-current');
    if (appState.visitedWps.has(id) && id !== appState.currentWpIndex) el.classList.add('is-visited');
    if (id === appState.currentWpIndex) el.classList.add('is-current');
    if (id === appState.selectedWpId) el.classList.add('is-selected');
  });
}

function moveDrone(x, y) {
  droneObj.setAttribute('transform', `translate(${x},${y})`);
}

// Малюємо прогрес активної лінії по сегментах
function renderActiveLine() {
  if (appState.currentWpIndex === 0) {
    activeLine.setAttribute('stroke-dasharray', '0 2000');
    activeLine.setAttribute('opacity', '0');
    return;
  }
  activeLine.setAttribute('opacity', '1');
  // Підраховуємо довжину пройденого маршруту
  let totalLen = 0;
  const totalPoints = WAYPOINTS.length - 1;
  for (let i = 0; i < appState.currentWpIndex && i < totalPoints; i++) {
    const a = WAYPOINTS[i], b = WAYPOINTS[i + 1];
    totalLen += Math.hypot(b.x - a.x, b.y - a.y);
  }
  // Додаємо поточний прогрес між точками
  if (appState.currentWpIndex < totalPoints) {
    const a = WAYPOINTS[appState.currentWpIndex - 1] ?? WAYPOINTS[0];
    const b = WAYPOINTS[appState.currentWpIndex];
    totalLen += Math.hypot(b.x - a.x, b.y - a.y) * appState.animProgress;
  }
  activeLine.setAttribute('stroke-dasharray', `${totalLen} 2000`);
}

// ── Анімація польоту ─────────────────────────────────────────────────
const FLIGHT_SPEED = 0.008; // прогрес за кадр (0-1)

function animateFlight() {
  if (appState.status !== 'flying') return;

  const fromIdx = appState.currentWpIndex;
  const toIdx = fromIdx + 1;

  if (toIdx >= WAYPOINTS.length) {
    finishFlight();
    return;
  }

  appState.animProgress += FLIGHT_SPEED;

  if (appState.animProgress >= 1) {
    appState.animProgress = 0;
    appState.currentWpIndex = toIdx;
    appState.visitedWps.add(toIdx);
    renderWaypoints();
    moveDrone(WAYPOINTS[toIdx].x, WAYPOINTS[toIdx].y);
    renderActiveLine();
    updateInfoPanel();
    setStatus(`Досягнуто: ${WAYPOINTS[toIdx].label}`, 'success');
  } else {
    const from = WAYPOINTS[fromIdx];
    const to   = WAYPOINTS[toIdx];
    const x = lerp(from.x, to.x, appState.animProgress);
    const y = lerp(from.y, to.y, appState.animProgress);
    moveDrone(x, y);
    renderActiveLine();
  }

  appState.animationId = requestAnimationFrame(animateFlight);
}

function startFlight() {
  if (appState.status === 'flying') { setStatus('Дрон вже виконує маршрут', 'warn'); return; }
  if (appState.status === 'done') { setStatus('Маршрут завершено. Спочатку скиньте стан.', 'warn'); return; }
  if (appState.mode === 'manual') { setStatus('Ручний режим: керування вручну недоступне в демо', 'warn'); return; }

  appState.status = 'flying';
  flyBtn.disabled = true;
  updateInfoPanel();
  setStatus('Виконується маршрут…');
  appState.animationId = requestAnimationFrame(animateFlight);
}

function finishFlight() {
  appState.status = 'done';
  cancelAnimationFrame(appState.animationId);
  appState.animationId = null;
  flyBtn.disabled = true;
  updateInfoPanel();
  setStatus('Маршрут завершено успішно! ✓', 'success');
}

function resetFlight() {
  cancelAnimationFrame(appState.animationId);
  appState.animationId = null;
  appState.status = 'idle';
  appState.currentWpIndex = 0;
  appState.animProgress = 0;
  appState.visitedWps = new Set([0]);
  appState.selectedWpId = null;

  moveDrone(WAYPOINTS[0].x, WAYPOINTS[0].y);
  activeLine.setAttribute('stroke-dasharray', '0 2000');
  activeLine.setAttribute('opacity', '0');
  flyBtn.disabled = false;
  renderWaypoints();
  updateInfoPanel();
  selectedWpInfo.innerHTML = '<p class="info-placeholder">Натисніть на точку маршруту</p>';
  setStatus('Стан скинуто');
}

// ── Інтерактивність вейпоінтів ───────────────────────────────────────
function showSelectedWpInfo(wp) {
  selectedWpInfo.innerHTML = `
    <div class="wp-info-row"><span>Назва:</span><span>${wp.label}</span></div>
    <div class="wp-info-row"><span>Координати:</span><span>${wp.x}, ${wp.y}</span></div>
    <div class="wp-info-row"><span>Висота:</span><span>${wp.alt} м</span></div>
    <div class="wp-info-row"><span>Швидкість:</span><span>${wp.speed} м/с</span></div>
    <div class="wp-info-row"><span>Статус:</span><span>${
      appState.visitedWps.has(wp.id) ? 'Пройдено' : (wp.id === appState.currentWpIndex ? 'Поточна' : 'Очікує')
    }</span></div>
  `;
}

document.querySelectorAll('.waypoint').forEach(el => {
  const id = Number(el.dataset.wp);
  const x = Number(el.dataset.x);
  const y = Number(el.dataset.y);

  el.addEventListener('click', () => {
    if (appState.status === 'flying') {
      setStatus('Неможливо вибрати точку під час польоту', 'warn');
      return;
    }
    appState.selectedWpId = id;
    renderWaypoints();
    showSelectedWpInfo(WAYPOINTS[id]);
  });

  el.addEventListener('mouseenter', e => {
    const svgRect = svg.getBoundingClientRect();
    const scaleX = svgRect.width / 700;
    const scaleY = svgRect.height / 480;
    const left = svgRect.left + x * scaleX;
    const top  = svgRect.top  + y * scaleY - 52;
    mapTooltip.textContent = `${WAYPOINTS[id].label} | Вис.: ${WAYPOINTS[id].alt} м`;
    mapTooltip.style.left = `${left - svgRect.left}px`;
    mapTooltip.style.top  = `${top - svgRect.top}px`;
    mapTooltip.classList.add('is-visible');
  });

  el.addEventListener('mouseleave', () => mapTooltip.classList.remove('is-visible'));
});

// ── Режими польоту ───────────────────────────────────────────────────
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (appState.status === 'flying') { setStatus('Зміна режиму під час польоту заборонена', 'warn'); return; }
    appState.mode = btn.dataset.mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('is-active', b === btn));
    updateInfoPanel();
    setStatus(`Режим змінено: ${MODES[appState.mode]}`);
  });
});

// ── Кнопки ───────────────────────────────────────────────────────────
flyBtn.addEventListener('click', startFlight);
resetBtn.addEventListener('click', resetFlight);

// ── Ініціалізація ────────────────────────────────────────────────────
moveDrone(WAYPOINTS[0].x, WAYPOINTS[0].y);
renderWaypoints();
updateInfoPanel();
