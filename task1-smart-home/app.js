// ── Стан застосунку ──────────────────────────────────────────────────
const appState = {
  activeRoom: null,
  activeTab: 'lighting',
  openAccordionItem: null,
  isDropdownOpen: false,
  isModalOpen: false,
  currentDeviceId: null,
  statusMessage: '',
  statusIsError: false,
};

// ── Допоміжні функції ────────────────────────────────────────────────
function setStatus(msg, isError = false) {
  appState.statusMessage = msg;
  appState.statusIsError = isError;
  const el = document.getElementById('statusMessage');
  el.textContent = msg;
  el.classList.toggle('has-error', isError);
  el.classList.remove('is-hidden');
  clearTimeout(setStatus._timer);
  setStatus._timer = setTimeout(() => el.classList.add('is-hidden'), 3500);
}

// ── Dropdown модуль ──────────────────────────────────────────────────
const DropdownModule = (() => {
  const dropdown = document.getElementById('roomDropdown');
  const btn = document.getElementById('roomDropdownBtn');
  const label = document.getElementById('roomDropdownLabel');
  const menu = document.getElementById('roomDropdownMenu');

  const roomNames = {
    living: 'Вітальня', bedroom: 'Спальня', kitchen: 'Кухня',
    bathroom: 'Ванна', garage: 'Гараж',
  };

  function open() {
    appState.isDropdownOpen = true;
    dropdown.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
  }

  function close() {
    appState.isDropdownOpen = false;
    dropdown.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }

  function toggle() {
    appState.isDropdownOpen ? close() : open();
  }

  function selectRoom(room) {
    appState.activeRoom = room;
    label.textContent = roomNames[room];
    menu.querySelectorAll('.dropdown-item').forEach(item => {
      item.classList.toggle('is-active', item.dataset.room === room);
    });
    setStatus(`Кімнату змінено: ${roomNames[room]}`);
    close();
  }

  btn.addEventListener('click', e => { e.stopPropagation(); toggle(); });

  menu.addEventListener('click', e => {
    const item = e.target.closest('.dropdown-item');
    if (!item) return;
    selectRoom(item.dataset.room);
  });

  document.addEventListener('click', e => {
    if (appState.isDropdownOpen && !dropdown.contains(e.target)) close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && appState.isDropdownOpen) close();
  });

  return { open, close };
})();

// ── Tabs модуль ──────────────────────────────────────────────────────
const TabsModule = (() => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  function activate(tabId) {
    if (appState.activeTab === tabId) return;
    appState.activeTab = tabId;

    tabBtns.forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    tabPanels.forEach(panel => {
      panel.classList.toggle('is-active', panel.id === `tab-${tabId}`);
    });

    setStatus(`Підсистема: ${document.querySelector(`[data-tab="${tabId}"]`).textContent.trim()}`);
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => activate(btn.dataset.tab));
  });

  return { activate };
})();

// ── Accordion модуль ─────────────────────────────────────────────────
const AccordionModule = (() => {
  function toggle(item) {
    if (item.classList.contains('is-disabled')) {
      setStatus('Пристрій недоступний', true);
      return;
    }
    const isOpen = item.classList.contains('is-open');

    // Закриваємо всі інші в тому ж акордеоні
    const parentAccordion = item.closest('.accordion');
    parentAccordion.querySelectorAll('.accordion-item.is-open').forEach(other => {
      if (other !== item) other.classList.remove('is-open');
    });

    item.classList.toggle('is-open', !isOpen);
    appState.openAccordionItem = isOpen ? null : item.dataset.device;
  }

  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => toggle(header.closest('.accordion-item')));
  });

  return { toggle };
})();

// ── Tooltip модуль ───────────────────────────────────────────────────
const TooltipModule = (() => {
  const box = document.getElementById('tooltipBox');
  let hideTimer;

  function show(target) {
    const text = target.dataset.tooltip;
    if (!text) return;
    clearTimeout(hideTimer);
    box.textContent = text;
    box.classList.add('is-visible');
    position(target);
  }

  function hide() {
    hideTimer = setTimeout(() => box.classList.remove('is-visible'), 120);
  }

  function position(target) {
    const rect = target.getBoundingClientRect();
    const bw = box.offsetWidth || 200;
    let left = rect.left + rect.width / 2 - bw / 2;
    let top = rect.bottom + 8;
    left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
    if (top + 60 > window.innerHeight) top = rect.top - 60;
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
  }

  document.querySelectorAll('.tooltip-trigger').forEach(el => {
    el.addEventListener('mouseenter', () => show(el));
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', () => show(el));
    el.addEventListener('blur', hide);
  });

  return { show, hide };
})();

// ── Modal модуль ─────────────────────────────────────────────────────
const ModalModule = (() => {
  const overlay = document.getElementById('settingsModal');
  const titleEl = document.getElementById('modalTitle');
  const nameInput = document.getElementById('deviceNameInput');

  const deviceLabels = {
    'main-light': 'Основне світло',
    'night-light': 'Нічник',
    'outdoor-light': 'Вулична лампа',
    'thermostat': 'Термостат',
    'ventilation': 'Вентиляція',
    'front-door': 'Вхідні двері',
    'camera': 'Камера #1',
    'solar': 'Сонячні панелі',
    'battery': 'Акумулятор',
  };

  function open(deviceId) {
    if (!deviceId) { setStatus('Оберіть пристрій', true); return; }
    appState.isModalOpen = true;
    appState.currentDeviceId = deviceId;
    titleEl.textContent = `Налаштування: ${deviceLabels[deviceId] || deviceId}`;
    nameInput.value = deviceLabels[deviceId] || '';
    overlay.classList.add('is-open');
    document.getElementById('modalCloseBtn').focus();
  }

  function close() {
    appState.isModalOpen = false;
    appState.currentDeviceId = null;
    overlay.classList.remove('is-open');
  }

  function save() {
    const name = nameInput.value.trim();
    if (!name) { setStatus('Назва пристрою не може бути порожньою', true); return; }
    setStatus(`Налаштування "${name}" збережено`);
    close();
  }

  document.getElementById('modalCloseBtn').addEventListener('click', close);
  document.getElementById('modalCancelBtn').addEventListener('click', close);
  document.getElementById('modalSaveBtn').addEventListener('click', save);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && appState.isModalOpen) close();
  });

  // Відкриття через кнопки "Налаштування" в акордеоні
  document.querySelectorAll('[data-action="settings"]').forEach(btn => {
    btn.addEventListener('click', () => open(btn.dataset.device));
  });

  return { open, close };
})();
