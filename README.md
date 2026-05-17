# Практична робота №6 — Інтерактивний вебдизайн та візуальні компоненти на JavaScript

## Варіанти

| Завдання | Варіант | Тема |
|---|---|---|
| Завдання 1 — Інтерактивні UI-компоненти | **Варіант 3** | Панель керування розумним будинком |
| Завдання 2 — Анімації, візуальні стани та інтерактивна SVG-графіка | **Варіант 2** | Візуалізація маршруту дрона |
| Завдання 3 — Програмна графіка та інтерактивна анімація на Canvas | **Варіант 2** | Міні-гра типу Pong |

---

## Зміст

1. [Загальна структура проєкту](#загальна-структура-проєкту)
2. [Завдання 1 — Панель керування розумним будинком](#завдання-1--панель-керування-розумним-будинком)
3. [Завдання 2 — Візуалізація маршруту дрона](#завдання-2--візуалізація-маршруту-дрона)
4. [Завдання 3 — Міні-гра Pong на Canvas](#завдання-3--міні-гра-pong-на-canvas)

---

## Загальна структура проєкту

```
Interactive-web-design-and-visual-components-in-JavaScript/
│
├── task1-smart-home/          # Завдання 1 — UI-компоненти (Варіант 3)
│   ├── index.html             # Розмітка: модал, dropdown, tabs, accordion, tooltip
│   ├── style.css              # Стилі + CSS-класи станів + transitions
│   └── app.js                 # JS-логіка, розбита на модулі (IIFE-патерн)
│
├── task2-drone-route/         # Завдання 2 — SVG-анімація (Варіант 2)
│   ├── index.html             # SVG-карта, точки, зони ризику, UI-панель
│   ├── style.css              # Стилі для SVG, анімації @keyframes
│   └── app.js                 # Логіка польоту, рендеринг SVG, стан, події
│
├── task3-pong/                # Завдання 3 — Canvas-гра (Варіант 2)
│   ├── index.html             # Canvas, панель рахунку, налаштування
│   ├── style.css              # Стилі інтерфейсу
│   └── game.js                # Повна ігрова логіка: фізика, рендер, стан
│
└── README.md                  # Цей файл
```

Кожне завдання — самостійна папка з власним `index.html`, яку можна відкрити у браузері без будь-якого сервера або збірника.

---

## Завдання 1 — Панель керування розумним будинком

**Файли:** `task1-smart-home/index.html`, `style.css`, `app.js`

### Загальна ідея

Односторінковий застосунок для керування пристроями розумного будинку. Уся інтерактивність реалізована на чистому JavaScript без жодних бібліотек. Розмітка описує структуру, CSS відповідає за вигляд і анімації переходів, а JavaScript керує станом і оновлює DOM.

### Структура `appState` — центральний об'єкт стану

```js
const appState = {
  activeRoom: null,         // поточно вибрана кімната ('living', 'bedroom', ...)
  activeTab: 'lighting',    // яка вкладка активна ('lighting', 'climate', ...)
  openAccordionItem: null,  // id пристрою, чия секція розгорнута
  isDropdownOpen: false,    // чи відкрите меню вибору кімнати
  isModalOpen: false,       // чи відкрите модальне вікно
  currentDeviceId: null,    // id пристрою, налаштування якого відкриті в модалі
  statusMessage: '',        // текст поточного статусного повідомлення
  statusIsError: false,     // тип повідомлення (помилка чи інфо)
};
```

Будь-яка зміна стану відбувається **лише через функції модулів**, а не напряму. Після зміни стану функція оновлює DOM: додає або прибирає CSS-класи, змінює `textContent`, вмикає/вимикає елементи.

---

### Компонент 1 — Dropdown (вибір кімнати)

#### Де в HTML

```html
<div class="dropdown" id="roomDropdown">
  <button class="dropdown-toggle" id="roomDropdownBtn">...</button>
  <ul class="dropdown-menu" id="roomDropdownMenu">
    <li class="dropdown-item" data-room="living">Вітальня</li>
    ...
  </ul>
</div>
```

Атрибут `data-room` зберігає машинний ідентифікатор кімнати прямо в розмітці — JavaScript читає його через `element.dataset.room`.

#### Як працює JavaScript

Модуль `DropdownModule` — це IIFE (Immediately Invoked Function Expression), тобто функція, яка виконується одразу та повертає публічний об'єкт з методами `open` і `close`. Внутрішні змінні (`dropdown`, `btn`, `menu`) недоступні ззовні — це аналог приватних полів класу.

```js
const DropdownModule = (() => {
  // внутрішні змінні — "приватні"
  const dropdown = document.getElementById('roomDropdown');
  ...

  function open() {
    appState.isDropdownOpen = true;
    dropdown.classList.add('is-open');        // CSS-клас відкриває меню
    btn.setAttribute('aria-expanded', 'true'); // доступність
  }

  function close() { ... }
  function toggle() { appState.isDropdownOpen ? close() : open(); }

  function selectRoom(room) {
    appState.activeRoom = room;
    label.textContent = roomNames[room]; // оновлення тексту кнопки
    // позначаємо активний пункт
    menu.querySelectorAll('.dropdown-item').forEach(item =>
      item.classList.toggle('is-active', item.dataset.room === room)
    );
    setStatus(`Кімнату змінено: ${roomNames[room]}`);
    close();
  }

  return { open, close }; // публічний API
})();
```

#### Стани dropdown та CSS

| Стан | CSS-клас на `.dropdown` | Що відбувається |
|---|---|---|
| Закрито (за замовчуванням) | — | Меню приховане (`opacity: 0`, `pointer-events: none`) |
| Відкрито | `is-open` | Меню з'являється зі зміщенням, стрілка обертається на 180° |
| Пункт вибрано | `is-active` на `<li>` | Пункт підсвічується кольором `--clr-accent2` |

```css
.dropdown-menu {
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.dropdown.is-open .dropdown-menu {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}
.dropdown-arrow { transition: transform 0.22s ease; }
.dropdown.is-open .dropdown-arrow { transform: rotate(180deg); }
```

#### Оброблювані події

- `click` на кнопці → `toggle()`, зупиняємо `e.stopPropagation()` щоб не спрацював закриваючий обробник на `document`
- `click` на пункті меню → `selectRoom(room)`
- `click` на `document` (поза dropdown) → `close()`, якщо `appState.isDropdownOpen === true`
- `keydown` з `Escape` → `close()`

---

### Компонент 2 — Tabs (вкладки підсистем)

#### Де в HTML

```html
<nav class="tabs" role="tablist">
  <button class="tab-btn is-active" data-tab="lighting">💡 Освітлення</button>
  <button class="tab-btn" data-tab="climate">🌡 Клімат</button>
  ...
</nav>
<section class="tab-panel is-active" id="tab-lighting" role="tabpanel">...</section>
<section class="tab-panel" id="tab-climate" role="tabpanel">...</section>
```

Зв'язок кнопки і панелі — через `data-tab` і `id="tab-{значення}"`. JavaScript шукає панель за `id`, тому жодного масиву відповідностей не потрібно.

#### Як працює JavaScript

```js
const TabsModule = (() => {
  function activate(tabId) {
    if (appState.activeTab === tabId) return; // вже активна — нічого не робимо
    appState.activeTab = tabId;

    // Всі кнопки: знімаємо is-active, виставляємо для потрібної
    tabBtns.forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    // Всі панелі: показуємо лише потрібну
    tabPanels.forEach(panel => {
      panel.classList.toggle('is-active', panel.id === `tab-${tabId}`);
    });
  }
  ...
})();
```

#### Стани tabs та CSS

| Стан | CSS-клас | Що робить |
|---|---|---|
| Неактивна вкладка | — | `display: none` на панелі, сіра кнопка |
| Активна вкладка | `is-active` | Кнопка — синя рамка знизу; панель — `display: block` + анімація |

```css
.tab-panel { display: none; }
.tab-panel.is-active {
  display: block;
  animation: fadeIn 0.25s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

При кожній активації панель запускає `fadeIn` — плавна поява з невеликим зміщенням знизу.

---

### Компонент 3 — Accordion (налаштування пристроїв)

Акордеон дозволяє розгортати по одній секції в межах одного акордеона (режим «один відкритий»).

#### Де в HTML

```html
<div class="accordion-item" data-device="main-light">
  <button class="accordion-header">
    <span>Основне світло</span>
    <span class="device-status status-on">Увімк.</span>
    <span class="accordion-icon">▾</span>
  </button>
  <div class="accordion-body">
    <!-- елементи керування пристроєм -->
  </div>
</div>
```

Секція `is-disabled` — заблокована. Клас виставляється в HTML прямо, і JavaScript перевіряє його перед відкриттям.

#### Як працює JavaScript

```js
function toggle(item) {
  // Блокована секція — показуємо помилку, виходимо
  if (item.classList.contains('is-disabled')) {
    setStatus('Пристрій недоступний', true);
    return;
  }

  const isOpen = item.classList.contains('is-open');

  // Закриваємо всі інші відкриті секції в тому ж акордеоні
  const parentAccordion = item.closest('.accordion');
  parentAccordion.querySelectorAll('.accordion-item.is-open').forEach(other => {
    if (other !== item) other.classList.remove('is-open');
  });

  // Перемикаємо поточну секцію
  item.classList.toggle('is-open', !isOpen);
  appState.openAccordionItem = isOpen ? null : item.dataset.device;
}
```

#### Анімація розгортання через `max-height`

Справжній `display: none → block` не можна анімувати. Замість нього використовується трюк з `max-height: 0 → 300px`:

```css
.accordion-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, padding 0.22s ease;
  padding: 0 1rem;
}
.accordion-item.is-open .accordion-body {
  max-height: 300px;   /* більше реального вмісту — браузер анімує до фактичної висоти */
  padding: 0.75rem 1rem 1rem;
}
```

Стрілка `▾` обертається через `transform: rotate(180deg)` з `transition`.

---

### Компонент 4 — Tooltip (спливаючі підказки)

#### Де в HTML

```html
<span class="sensor-value tooltip-trigger"
      data-tooltip="Поточна яскравість у люксах"
      tabindex="0">420 лк</span>
```

Атрибут `data-tooltip` містить текст підказки. `tabindex="0"` дозволяє отримати фокус з клавіатури — підказка з'являється і при `:focus`.

Один спільний елемент-підказка для всієї сторінки:
```html
<div class="tooltip-box" id="tooltipBox" role="tooltip"></div>
```

#### Як працює JavaScript

```js
function show(target) {
  const text = target.dataset.tooltip;
  if (!text) return;
  box.textContent = text;
  box.classList.add('is-visible'); // робить opacity: 1
  position(target);
}

function position(target) {
  const rect = target.getBoundingClientRect();
  const bw = box.offsetWidth || 200;
  // Центруємо по горизонталі відносно елемента
  let left = rect.left + rect.width / 2 - bw / 2;
  // Розміщуємо під елементом
  let top = rect.bottom + 8;
  // Захист від виходу за межі екрану
  left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
  if (top + 60 > window.innerHeight) top = rect.top - 60; // перевертаємо вгору
  box.style.left = `${left}px`;
  box.style.top = `${top}px`;
}
```

#### Оброблювані події

- `mouseenter` → `show()` — з'являється при наведенні
- `mouseleave` → `hide()` з таймаутом 120 мс
- `focus` → `show()` — з'являється при фокусі (Tab-навігація)
- `blur` → `hide()`

---

### Компонент 5 — Modal (налаштування обладнання)

#### Де в HTML

```html
<div class="modal-overlay" id="settingsModal" aria-modal="true" role="dialog">
  <div class="modal-window">
    <button class="modal-close">✕</button>
    <h2 class="modal-title">Налаштування пристрою</h2>
    <div class="modal-body"><!-- форма --></div>
    <div class="modal-footer">
      <button id="modalCancelBtn">Скасувати</button>
      <button id="modalSaveBtn">Зберегти</button>
    </div>
  </div>
</div>
```

Overlay (`modal-overlay`) — це напівпрозорий фон на весь екран. `modal-window` — само вікно всередині overlay.

#### Як відкривається

Кожна кнопка «Налаштування» в акордеоні має `data-action="settings"` і `data-device="thermostat"` (або інший id пристрою). JavaScript збирає всі такі кнопки і вішає обробник:

```js
document.querySelectorAll('[data-action="settings"]').forEach(btn => {
  btn.addEventListener('click', () => open(btn.dataset.device));
});
```

#### Як працює `open(deviceId)`

```js
function open(deviceId) {
  if (!deviceId) { setStatus('Оберіть пристрій', true); return; }
  appState.isModalOpen = true;
  appState.currentDeviceId = deviceId;
  titleEl.textContent = `Налаштування: ${deviceLabels[deviceId]}`;
  nameInput.value = deviceLabels[deviceId] || '';
  overlay.classList.add('is-open'); // CSS-клас показує overlay
  document.getElementById('modalCloseBtn').focus(); // фокус на закриваючу кнопку
}
```

#### Три способи закрити модальне вікно

```js
// 1. Кнопка ✕ або "Скасувати"
document.getElementById('modalCloseBtn').addEventListener('click', close);
document.getElementById('modalCancelBtn').addEventListener('click', close);

// 2. Клік поза вікном (на overlay)
overlay.addEventListener('click', e => {
  if (e.target === overlay) close(); // перевіряємо, що клік саме на overlay, не на вікно
});

// 3. Клавіша Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && appState.isModalOpen) close();
});
```

#### Валідація при збереженні

```js
function save() {
  const name = nameInput.value.trim();
  if (!name) {
    setStatus('Назва пристрою не може бути порожньою', true); // помилка
    return; // не закриваємо модал
  }
  setStatus(`Налаштування "${name}" збережено`);
  close();
}
```

#### CSS-анімація модального вікна

```css
.modal-overlay {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}
.modal-overlay.is-open { opacity: 1; pointer-events: all; }

.modal-window {
  transform: scale(0.95); /* трохи менший при закритому стані */
  transition: transform 0.25s ease;
}
.modal-overlay.is-open .modal-window { transform: scale(1); }
```

---

### Функція `setStatus` — статусний рядок

```js
function setStatus(msg, isError = false) {
  appState.statusMessage = msg;
  appState.statusIsError = isError;
  const el = document.getElementById('statusMessage');
  el.textContent = msg;
  el.classList.toggle('has-error', isError); // червоний або зелений текст
  el.classList.remove('is-hidden');
  clearTimeout(setStatus._timer);
  // Автоматично ховаємо через 3.5 секунди
  setStatus._timer = setTimeout(() => el.classList.add('is-hidden'), 3500);
}
```

`setStatus._timer` — властивість на самій функції (функції в JS — об'єкти). Це дозволяє скинути попередній таймер без зовнішньої змінної.

---

## Завдання 2 — Візуалізація маршруту дрона

**Файли:** `task2-drone-route/index.html`, `style.css`, `app.js`

### Загальна ідея

SVG-карта з точками маршруту, зонами ризику та об'єктом-дрона. Дрон анімовано переміщується між точками через `requestAnimationFrame`. Вся SVG-сцена управляється через JavaScript: зміна CSS-класів на SVG-елементах і атрибута `transform` на об'єкті дрона.

### Дані маршруту

```js
const WAYPOINTS = [
  { id: 0, x: 80,  y: 420, label: 'Старт', alt: 0,  speed: 0  },
  { id: 1, x: 160, y: 300, label: 'Т-1',   alt: 30, speed: 8  },
  { id: 2, x: 280, y: 200, label: 'Т-2',   alt: 60, speed: 10 },
  { id: 3, x: 420, y: 160, label: 'Т-3',   alt: 80, speed: 12 },
  { id: 4, x: 560, y: 240, label: 'Т-4',   alt: 50, speed: 9  },
  { id: 5, x: 620, y: 380, label: 'Фініш', alt: 0,  speed: 5  },
];
```

Координати `x`, `y` — у системі координат SVG (viewBox 700×480). Вони ж використовуються для позиціювання кіл-вейпоінтів у розмітці і для обчислення траєкторії дрона в JS.

### Структура `appState`

```js
const appState = {
  status: 'idle',          // idle | flying | paused | done | error
  mode: 'auto',            // auto | manual | return
  currentWpIndex: 0,       // індекс точки, з якої летить дрон
  selectedWpId: null,      // id точки, вибраної кліком
  animationId: null,       // id requestAnimationFrame (для скасування)
  animProgress: 0,         // прогрес між двома точками від 0 до 1
  visitedWps: new Set([0]),// множина пройдених точок
  errorMsg: '',
};
```

---

### SVG-структура карти

```html
<svg id="droneMap" viewBox="0 0 700 480" preserveAspectRatio="xMidYMid meet">
  <defs>
    <!-- градієнт фону, фільтри glow, маркер стрілки для маршруту -->
    <radialGradient id="bgGrad">...</radialGradient>
    <filter id="glow"><feGaussianBlur .../><feMerge .../></filter>
    <marker id="arrowMarker">...</marker>
  </defs>

  <rect fill="url(#bgGrad)"/>          <!-- фон -->
  <g class="grid">...</g>              <!-- сітка -->
  <g id="riskZones">                   <!-- зони ризику -->
    <ellipse class="risk-zone" .../>   <!-- CSS-анімація riskPulse -->
  </g>
  <polyline id="routeLine" .../>       <!-- пунктирна лінія маршруту -->
  <polyline id="activeRouteLine" .../>  <!-- анімована пройдена лінія -->
  <g id="waypointsGroup">
    <g class="waypoint" data-wp="0" data-x="80" data-y="420">
      <circle class="wp-ring" .../>    <!-- анімоване кільце -->
      <circle class="wp-dot" .../>     <!-- кружок-точка -->
      <text class="wp-label" .../>     <!-- підпис -->
    </g>
    ...
  </g>
  <g id="droneObject" transform="translate(80,420)">
    <circle .../>                      <!-- фон дрона з glow -->
    <text>🚁</text>                    <!-- іконка -->
  </g>
</svg>
```

`viewBox="0 0 700 480"` забезпечує масштабування: SVG завжди займає 100% ширини контейнера, а координати залишаються 0–700 по горизонталі і 0–480 по вертикалі незалежно від реального розміру.

---

### Стани вейпоінтів та CSS

Кожна точка маршруту (`<g class="waypoint">`) може мати один з таких класів:

| CSS-клас | Значення | Візуальний ефект |
|---|---|---|
| — (жоден) | Ще не відвідана | Синя точка без додаткових ефектів |
| `is-selected` | Вибрана кліком | Кільце стає яскравішим (opacity 0.8) |
| `is-visited` | Дрон вже пролетів | Точка стає червоною (`fill: #f87171`) |
| `is-current` | Тут зараз дрон | Точка стає бірюзовою, більшою, кільце пульсує |

```css
.waypoint.is-current .wp-dot {
  fill: #4ecdc4;
  r: 12; /* SVG-атрибут через CSS */
  filter: url(#glowStrong);
}
.waypoint.is-current .wp-ring {
  stroke: #4ecdc4;
  animation: pulseRing 1.4s ease-in-out infinite;
}

@keyframes pulseRing {
  0%, 100% { r: 18; opacity: 0.6; }
  50%       { r: 26; opacity: 0.15; }
}
```

Анімація `pulseRing` — SVG-атрибут `r` (радіус) змінюється через CSS `@keyframes`. Це особливість SVG: геометричні атрибути (`r`, `cx`, `cy`, `fill`, `stroke`) можна анімувати через CSS так само, як `width`, `opacity` у звичайного HTML.

---

### Анімація польоту дрона через `requestAnimationFrame`

#### Лінійна інтерполяція (`lerp`)

```js
function lerp(a, b, t) { return a + (b - a) * t; }
```

`t` — число від 0 до 1. При `t = 0` повертає `a`, при `t = 1` повертає `b`, між ними — плавний перехід. Використовується для обчислення поточної позиції дрона між двома точками.

#### Цикл анімації

```js
const FLIGHT_SPEED = 0.008; // на скільки прогрес збільшується щокадру (~8 секунд між точками)

function animateFlight() {
  if (appState.status !== 'flying') return; // зупинка при зміні стану

  const fromIdx = appState.currentWpIndex;
  const toIdx = fromIdx + 1;

  if (toIdx >= WAYPOINTS.length) { finishFlight(); return; } // досягли кінця

  appState.animProgress += FLIGHT_SPEED;

  if (appState.animProgress >= 1) {
    // Досягли наступної точки
    appState.animProgress = 0;
    appState.currentWpIndex = toIdx;
    appState.visitedWps.add(toIdx);
    renderWaypoints();
    moveDrone(WAYPOINTS[toIdx].x, WAYPOINTS[toIdx].y);
    ...
  } else {
    // Між точками — обчислюємо поточну позицію
    const from = WAYPOINTS[fromIdx];
    const to   = WAYPOINTS[toIdx];
    const x = lerp(from.x, to.x, appState.animProgress);
    const y = lerp(from.y, to.y, appState.animProgress);
    moveDrone(x, y);
    renderActiveLine();
  }

  appState.animationId = requestAnimationFrame(animateFlight); // наступний кадр
}
```

#### Переміщення дрона в SVG

```js
function moveDrone(x, y) {
  droneObj.setAttribute('transform', `translate(${x},${y})`);
}
```

SVG-атрибут `transform="translate(x,y)"` переміщує групу елементів дрона. Це набагато ефективніше ніж змінювати `cx`/`cy` кожного елемента окремо.

#### Анімована лінія пройденого маршруту

```js
function renderActiveLine() {
  let totalLen = 0;
  // Сумуємо довжини пройдених відрізків
  for (let i = 0; i < appState.currentWpIndex; i++) {
    const a = WAYPOINTS[i], b = WAYPOINTS[i + 1];
    totalLen += Math.hypot(b.x - a.x, b.y - a.y);
  }
  // Додаємо частковий прогрес до наступної точки
  if (appState.currentWpIndex < WAYPOINTS.length - 1) {
    const a = WAYPOINTS[appState.currentWpIndex - 1] ?? WAYPOINTS[0];
    const b = WAYPOINTS[appState.currentWpIndex];
    totalLen += Math.hypot(b.x - a.x, b.y - a.y) * appState.animProgress;
  }
  activeLine.setAttribute('stroke-dasharray', `${totalLen} 2000`);
}
```

`stroke-dasharray: "довжина 2000"` — перший сегмент (пофарбований) дорівнює пройденому шляху, другий (прозорий) — 2000, що більше будь-якого можливого маршруту. Результат: кольорова лінія «росте» за дроном у реальному часі.

---

### Обробка некоректних сценаріїв

```js
function startFlight() {
  if (appState.status === 'flying') {
    setStatus('Дрон вже виконує маршрут', 'warn'); return;
  }
  if (appState.status === 'done') {
    setStatus('Маршрут завершено. Спочатку скиньте стан.', 'warn'); return;
  }
  if (appState.mode === 'manual') {
    setStatus('Ручний режим: керування вручну недоступне в демо', 'warn'); return;
  }
  ...
}

// Вибір точки під час польоту
el.addEventListener('click', () => {
  if (appState.status === 'flying') {
    setStatus('Неможливо вибрати точку під час польоту', 'warn');
    return;
  }
  ...
});
```

---

### Tooltip на карті

При наведенні на вейпоінт tooltip позиціонується в системі координат SVG-контейнера:

```js
el.addEventListener('mouseenter', e => {
  const svgRect = svg.getBoundingClientRect(); // розміри SVG у пікселях
  const scaleX = svgRect.width / 700;          // масштаб: SVG-одиниці → пікселі
  const scaleY = svgRect.height / 480;
  const left = svgRect.left + x * scaleX;
  const top  = svgRect.top  + y * scaleY - 52;
  // Позиція відносно контейнера (position: relative)
  mapTooltip.style.left = `${left - svgRect.left}px`;
  mapTooltip.style.top  = `${top - svgRect.top}px`;
  mapTooltip.classList.add('is-visible');
});
```

Оскільки SVG масштабується, потрібно перевести координати вейпоінта (у SVG-одиницях) у пікселі на екрані через масштабний коефіцієнт.

---

## Завдання 3 — Міні-гра Pong на Canvas

**Файли:** `task3-pong/index.html`, `style.css`, `game.js`

### Загальна ідея

Класична гра Pong: м'яч рухається полем, відбивається від верхньої та нижньої меж, від ракетки гравця та ракетки AI. Рахунок до 7 очок. Вся графіка — Canvas API, стан — об'єкт `appState`, UI (рахунок, кнопки) — HTML-елементи.

### Константи та ігрові об'єкти

```js
const W = 720, H = 450;         // розмір полотна
const PAD_W = 12, PAD_H = 80;  // розмір ракетки
const BALL_R = 9;               // радіус м'яча
const WIN_SCORE = 7;            // рахунок для перемоги

const AI_SPEED = { easy: 3, medium: 5, hard: 8 }; // швидкість AI в пікселях/кадр
```

Canvas не зберігає окремі об'єкти — це просто піксельний буфер. Тому всі ігрові об'єкти існують як звичайні JS-об'єкти і малюються заново кожен кадр:

```js
const player = { x: PAD_MARGIN, y: H/2 - PAD_H/2, dy: 0 };
const ai     = { x: W - PAD_MARGIN - PAD_W, y: H/2 - PAD_H/2 };
const ball   = { x: W/2, y: H/2, vx: 0, vy: 0, speed: 5,
                 lastHitBy: null, trail: [] };
```

---

### `appState` — стан гри

```js
const appState = {
  status: 'idle',       // idle | playing | paused | won | lost
  round: 0,             // номер поточного раунду
  scorePlayer: 0,       // очки гравця
  scoreAI: 0,           // очки AI
  difficulty: 'easy',   // easy | medium | hard
  controlMode: 'mouse', // mouse | keyboard
  animId: null,         // requestAnimationFrame id
  errorMsg: '',
};
```

---

### Стани гри та переходи між ними

```
idle ──[startGame()]──► playing ──[pauseGame()]──► paused
                           │                          │
                           │                      [resumeGame()]
                           │                          │
                           ▼                          ▼
                    won / lost ◄──────────────── playing
                           │
                      [fullReset()]
                           │
                           ▼
                          idle
```

Кожен стан відображається у HTML через `gameStatusEl.textContent` та керує доступністю кнопок:

```js
function updateUI() {
  const statusMap = { idle: 'Очікування', playing: 'Гра',
                      paused: 'Пауза', won: 'Перемога!', lost: 'Поразка' };
  gameStatusEl.textContent = statusMap[appState.status];
  // ...
}
```

Стан `paused` також показує Canvas-overlay (напівпрозоре перекриття поверх Canvas із текстом «Пауза»).

---

### Ігровий цикл — `gameLoop`

```js
function gameLoop() {
  if (appState.status !== 'playing') return; // зупинка при зміні стану

  updatePlayer(); // рух ракетки гравця
  updateAI();     // рух ракетки AI
  updateBall();   // рух і фізика м'яча
  draw();         // малювання кадру
  updateUI();     // оновлення HTML-панелі

  appState.animId = requestAnimationFrame(gameLoop); // наступний кадр (~60 разів/с)
}
```

Порядок виклику функцій важливий: спочатку оновлення логіки, потім малювання.

---

### Фізика м'яча

#### Відбиття від верху/низу

```js
if (ball.y - BALL_R <= 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }
if (ball.y + BALL_R >= H) { ball.y = H - BALL_R; ball.vy = -Math.abs(ball.vy); }
```

Замість `ball.vy *= -1` використовується `Math.abs()` — це захист від "прилипання" до стінки, якщо м'яч опинився за межею.

#### Відбиття від ракетки гравця

```js
if (
  ball.x - BALL_R <= player.x + PAD_W &&  // м'яч досяг лівого краю ракетки
  ball.x - BALL_R >= player.x &&           // м'яч ще не пройшов наскрізь
  ball.y >= player.y &&                    // м'яч у вертикальній зоні ракетки
  ball.y <= player.y + PAD_H
) {
  ball.x = player.x + PAD_W + BALL_R;   // виштовхуємо м'яч, щоб не застряг
  
  // Кут залежить від місця потрапляння (від центру ракетки)
  const hitPos = (ball.y - (player.y + PAD_H / 2)) / (PAD_H / 2); // від -1 до +1
  const angle = hitPos * (Math.PI / 3.5); // максимальний кут ≈ 51°
  
  ball.speed = Math.min(ball.speed + 0.25, 15); // прискорення, але не більше 15
  ball.vx = ball.speed * Math.cos(angle);        // горизонтальна складова
  ball.vy = ball.speed * Math.sin(angle);        // вертикальна складова
}
```

Якщо м'яч потрапляє в центр ракетки — летить прямо. Якщо у верхній/нижній край — під кутом.

#### Гол і скидання м'яча

```js
if (ball.x - BALL_R < 0) {       // вийшов за ліву межу
  appState.scoreAI++;
  if (appState.scoreAI >= WIN_SCORE) { endGame(false); return; }
  launchBall(false); // новий м'яч летить у бік гравця
}
```

---

### Логіка AI

```js
function updateAI() {
  const speed = AI_SPEED[appState.difficulty]; // 3, 5 або 8 px/кадр
  const targetY = ball.y - PAD_H / 2;          // хочемо, щоб центр ракетки = м'яч
  const diff = targetY - ai.y;                 // різниця між ціллю і поточним
  ai.y += clamp(diff, -speed, speed);          // рухаємось не швидше за `speed`
  ai.y = clamp(ai.y, 0, H - PAD_H);
}
```

`clamp(diff, -speed, speed)` — якщо різниця більша за `speed`, ракетка рухається з максимальною швидкістю. Це робить AI «не ідеальним» на легкому рівні: він просто не може досягти будь-якого м'яча за кадр.

---

### Малювання (Canvas API)

Кожен кадр: **очистити → намалювати фон → намалювати об'єкти**.

```js
function draw() {
  // 1. Фон
  ctx.fillStyle = '#010810';
  ctx.fillRect(0, 0, W, H);

  // 2. Центральна пунктирна лінія
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = 'rgba(0,229,255,0.15)';
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]); // скидаємо пунктир

  // 3. Слід м'яча (масив позицій попередніх кадрів)
  ball.trail.forEach((pos, i) => {
    const alpha = (i / ball.trail.length) * 0.4;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, BALL_R * (i / ball.trail.length) * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,229,255,${alpha})`;
    ctx.fill();
  });

  // 4. М'яч з радіальним градієнтом та glow
  const gradient = ctx.createRadialGradient(ball.x-2, ball.y-2, 1, ball.x, ball.y, BALL_R);
  gradient.addColorStop(0, '#80ffff'); // центр — яскравий
  gradient.addColorStop(1, '#00e5ff'); // край — темніший
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.shadowColor = '#00e5ff'; // ефект свічення
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.shadowBlur = 0; // скидаємо тінь, щоб не впливала на інші об'єкти

  // 5. Ракетки (округлений прямокутник + градієнт + glow)
  drawRoundRect(player.x, player.y, PAD_W, PAD_H, 4);
  ...
}
```

#### Слід м'яча

```js
ball.trail.push({ x: ball.x, y: ball.y }); // додаємо поточну позицію
if (ball.trail.length > 10) ball.trail.shift(); // зберігаємо лише 10 останніх
```

Масив `trail` — «ковзне вікно» з 10 позицій. Найстаріші позиції малюються менш прозорими та меншими, що дає ефект хвоста.

#### Округлений прямокутник

Canvas не має вбудованого `roundRect` у старих браузерах, тому реалізуємо вручну через `quadraticCurveTo`:

```js
function drawRoundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); // верхній правий кут
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); // нижній правий кут
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); // нижній лівий кут
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); // верхній лівий кут
  ctx.closePath();
}
```

---

### Керування гравцем

#### Миша

```js
canvas.addEventListener('mousemove', e => {
  if (appState.controlMode !== 'mouse') return;
  const rect = canvas.getBoundingClientRect();
  const scaleY = H / rect.height; // Canvas може бути масштабований CSS
  const mouseY = (e.clientY - rect.top) * scaleY; // позиція в координатах Canvas
  player.y = clamp(mouseY - PAD_H / 2, 0, H - PAD_H);
});
```

`scaleY` потрібен тому, що Canvas має внутрішню роздільну здатність 720×450, але CSS може розтягнути його до іншого розміру. Координати миші — у CSS-пікселях, тому потрібно масштабувати.

#### Клавіатура

```js
const keys = {}; // словник натиснутих клавіш

document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup',   e => { keys[e.key] = false; });

function updatePlayer() {
  if (appState.controlMode !== 'keyboard') return;
  if (keys['ArrowUp'] || keys['w'] || keys['W']) player.y -= 7;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) player.y += 7;
  player.y = clamp(player.y, 0, H - PAD_H);
}
```

Словник `keys` дозволяє одночасно обробляти декілька клавіш без конфліктів. Перевірка відбувається в `gameLoop` щокадру.

---

### Обробка некоректних сценаріїв

| Ситуація | Обробка |
|---|---|
| Натиснути «Старт» під час гри | `setMsg('Гра вже запущена', 'warn')`, return |
| Натиснути «Пауза» поза грою | `if (appState.status !== 'playing') return` |
| Змінити складність під час гри | Повідомлення, параметр не змінюється |
| М'яч виходить за межу | Автоматично нараховується очко, м'яч скидається |
| Рахунок досягає WIN_SCORE | `endGame()`, анімація зупиняється, показується overlay |

---

## Загальні принципи реалізації

### Зміна DOM через CSS-класи

У жодному місці не використовується `element.style.display = 'none'` або пряме маніпулювання стилями. Замість цього — CSS-класи станів:

```js
// ✗ Погано
modal.style.display = 'flex';
modal.style.opacity = '1';

// ✓ Добре — вся візуалізація в CSS
modal.classList.add('is-open');
```

Це дає змогу CSS контролювати анімації та transitions без втручання JavaScript.

### Стандартні CSS-класи станів

| Клас | Значення |
|---|---|
| `is-open` | Елемент відкритий (dropdown, modal, accordion) |
| `is-active` | Елемент активний (tab, dropdown item) |
| `is-hidden` | Елемент прихований (status message після таймера) |
| `is-disabled` | Дія недоступна (accordion item) |
| `is-selected` | Вибраний елемент (SVG waypoint) |
| `is-visited` | Пройдений елемент (SVG waypoint) |
| `is-current` | Поточний елемент (SVG waypoint з дроном) |
| `has-error` | Стан помилки (статусне повідомлення) |
| `is-visible` | Видимий (tooltip) |

### Модульна організація коду

У `task1-smart-home/app.js` кожен компонент — IIFE-модуль:

```js
const DropdownModule = (() => { ... return { open, close }; })();
const TabsModule     = (() => { ... return { activate }; })();
const AccordionModule = (() => { ... return { toggle }; })();
const TooltipModule   = (() => { ... return { show, hide }; })();
const ModalModule     = (() => { ... return { open, close }; })();
```

Спільний стан — `appState` — глобальний об'єкт. Кожен модуль читає і пише лише свою частину стану. Це аналог архітектури з централізованим сховищем (як Vuex чи Redux), але без фреймворку.
