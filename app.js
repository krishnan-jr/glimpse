// Glimpse of Today - WhatsApp Template Generator Application Engine

(function() {
  'use strict';

  // Generic Master List of Default Subjects (Empty by default for complete customization)
  const GENERIC_DEFAULT_SUBJECTS = [];

  const GENERIC_DEFAULT_TIMETABLE = {
    'Monday': [],
    'Tuesday': [],
    'Wednesday': [],
    'Thursday': [],
    'Friday': [],
    'Saturday': [],
    'Sunday': []
  };

  // Secret Preset Data for 2G Class
  const PRESET_2G_SUBJECTS = [
    { id: 'sub_1', badge: '🟥', icon: '🔤', name: 'English', suffix: '', notes: '' },
    { id: 'sub_2', badge: '🟠', icon: '🧮', name: 'C. E.', suffix: '', notes: '' },
    { id: 'sub_3', badge: '💛', icon: '✒️', name: 'Montessori', suffix: '', notes: '' },
    { id: 'sub_4', badge: '🟩', icon: '📖', name: 'Malayalam', suffix: '', notes: '' },
    { id: 'sub_4_cw', badge: '🟩', icon: '📖', name: 'Malayalam', suffix: 'C. W.', notes: '' },
    { id: 'sub_5', badge: '🩵', icon: '🔢', name: 'M. A.', suffix: '', notes: '' },
    { id: 'sub_6', badge: '🔵', icon: '🦁', name: 'G. K.', suffix: '', notes: '' },
    { id: 'sub_7', badge: '💜', icon: '🎵', name: 'P. E.', suffix: '', notes: '' },
    { id: 'sub_8', badge: '🤎', icon: '🌙', name: 'Arabic/MRI', suffix: '', notes: '' },
    { id: 'sub_9', badge: '🟧', icon: '📐', name: 'Maths', suffix: '', notes: '' },
    { id: 'sub_10', badge: '💖', icon: '📝', name: 'Hindi', suffix: '', notes: '' },
    { id: 'sub_10_cw', badge: '💖', icon: '📝', name: 'Hindi', suffix: 'C. W.', notes: '' },
    { id: 'sub_1_cw', badge: '🟥', icon: '🔤', name: 'English', suffix: 'C. W.', notes: '' },
    { id: 'sub_11', badge: '🟢', icon: '🧘🏻‍♀️', name: 'Yoga', suffix: '', notes: '' },
    { id: 'sub_12', badge: '🟦', icon: '📚', name: 'Library', suffix: '', notes: '' },
    { id: 'sub_13', badge: '🩵', icon: '💻', name: 'I. T.', suffix: '', notes: '' },
    { id: 'sub_14', badge: '🤍', icon: '💡', name: 'V. E.', suffix: '', notes: '' },
    { id: 'sub_15', badge: '💜', icon: '🎨', name: 'Arts', suffix: '', notes: '' },
    { id: 'sub_16', badge: '💖', icon: '🎼', name: 'Music', suffix: '', notes: '' }
  ];

  const PRESET_2G_TIMETABLE = {
    'Monday': ['sub_1', 'sub_9', 'sub_4', 'sub_10', 'sub_11', 'sub_12', 'sub_13', 'sub_9'],
    'Tuesday': ['sub_1', 'sub_4', 'sub_13', 'sub_10', 'sub_9', 'sub_3', 'sub_7', 'sub_10'],
    'Wednesday': ['sub_1', 'sub_8', 'sub_4_cw', 'sub_3', 'sub_2', 'sub_5', 'sub_7', 'sub_6'],
    'Thursday': ['sub_1', 'sub_9', 'sub_10_cw', 'sub_14', 'sub_4', 'sub_9', 'sub_1_cw', 'sub_2'],
    'Friday': ['sub_1', 'sub_10', 'sub_15', 'sub_16', 'sub_9', 'sub_4', 'sub_8', 'sub_1'],
    'Saturday': ['sub_1', 'sub_2', 'sub_3', 'sub_4', 'sub_5', 'sub_6', 'sub_7', 'sub_8'],
    'Sunday': ['sub_1', 'sub_2', 'sub_3', 'sub_4', 'sub_5', 'sub_6', 'sub_7', 'sub_8']
  };

  const KEYCAP_EMOJIS = {
    '0': '0️⃣',
    '1': '1️⃣',
    '2': '2️⃣',
    '3': '3️⃣',
    '4': '4️⃣',
    '5': '5️⃣',
    '6': '6️⃣',
    '7': '7️⃣',
    '8': '8️⃣',
    '9': '9️⃣'
  };

  const DAYS_OF_WEEK = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // State Variables
  let subjects = [];
  let timetable = {}; // Day -> array of 8 subjectIds
  let currentNotes = {}; // slotKey -> string
  let currentEnabled = {}; // slotKey -> boolean
  let selectedDate = new Date();
  let selectedEditorDay = 'Monday';
  let classAndDiv = '2G';
  let isDarkMode = false;

  const RANDOM_HEADER_EMOJIS_100 = [
    '🪁', '🪂', '✨', '🌟', '🎨', '🚀', '📌', '🎈', '🌺', '🎯',
    '🌈', '⭐', '🔥', '⚡', '🎉', '🏆', '🎓', '📚', '🌻', '🎁',
    '🍀', '💡', '🔔', '🎗️', '🏅', '🥇', '👑', '🥳', '🪄', '🔮',
    '🧸', '🧩', '🎭', '🎪', '🎤', '🎧', '🎷', '🎺', '🎸', '🪕',
    '🎻', '🎲', '♟️', '🎳', '🎮', '🏎️', '🛹', '🛼', '⛵', '🛸',
    '🪐', '💫', '🌌', '🌞', '🌝', '🌸', '💐', '🌷', '🌹', '🥀',
    '🌼', '🪷', '🍁', '🍂', '🍃', '🌿', '🌱', '🌴', '🌳', '🌲',
    '🍉', '🍓', '🍒', '🍎', '🍍', '🧃', '🍿', '🧁', '🍦', '🍩',
    '🍪', '🍫', '🍬', '🍭', '💌', '💎', '🤍', '🧡', '💛', '💚',
    '💙', '💜', '🤎', '💖', '🎏', '🔮', '🏖️', '🎠', '🎆', '🔮'
  ];

  // DOM Elements
  const glimpseDateInput = document.getElementById('glimpseDate');
  const classDivInput = document.getElementById('classDiv');
  const headerEmojiInput = document.getElementById('headerEmoji');
  const randomEmojiBtn = document.getElementById('randomEmojiBtn');
  const todayFormattedDateEl = document.getElementById('todayFormattedDate');
  const todayFormattedDayEl = document.getElementById('todayFormattedDay');
  const subjectEntryListEl = document.getElementById('subjectEntryList');
  const subjectsManagerListEl = document.getElementById('subjectsManagerList');
  const whatsappOutputTextEl = document.getElementById('whatsappOutputText');
  const activeCountBadgeEl = document.getElementById('activeCountBadge');
  const waTimeStampEl = document.getElementById('waTimeStamp');

  // Timetable DOM Elements
  const daySelectorPills = document.getElementById('daySelectorPills');
  const currentEditorDayTitle = document.getElementById('currentEditorDayTitle');
  const daySubjectCount = document.getElementById('daySubjectCount');
  const timetablePeriodSlots = document.getElementById('timetablePeriodSlots');
  const resetTimetableBtn = document.getElementById('resetTimetableBtn');
  const reapplyTimetableBtn = document.getElementById('reapplyTimetableBtn');

  // Buttons & Modals
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const clearNotesBtn = document.getElementById('clearNotesBtn');
  const addSubjectBtn = document.getElementById('addSubjectBtn');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const copyMessageBtn = document.getElementById('copyMessageBtn');
  const copyMessageBtn2 = document.getElementById('copyMessageBtn2');
  const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');

  // Modal Controls
  const subjectModal = document.getElementById('subjectModal');
  const subjectForm = document.getElementById('subjectForm');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const modalTitle = document.getElementById('modalTitle');
  const editSubjectId = document.getElementById('editSubjectId');
  const subName = document.getElementById('subName');
  const subEmoji = document.getElementById('subEmoji');
  const subBadge = document.getElementById('subBadge');
  const subSuffix = document.getElementById('subSuffix');

  // Toast
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // Secret URL preset detector (/2G or #2G or ?2G)
  function checkUrlForSecretPreset() {
    try {
      const pathname = decodeURIComponent(window.location.pathname).toUpperCase();
      const hash = decodeURIComponent(window.location.hash).toUpperCase();
      const search = decodeURIComponent(window.location.search).toUpperCase();

      const is2G = pathname.includes('/2G') || pathname.endsWith('2G') || hash.includes('2G') || search.includes('2G');

      if (is2G) {
        loadPreset2G();
        return true;
      }
    } catch (e) {
      console.error('URL parse error:', e);
    }
    return false;
  }

  function loadPreset2G() {
    subjects = JSON.parse(JSON.stringify(PRESET_2G_SUBJECTS));
    timetable = JSON.parse(JSON.stringify(PRESET_2G_TIMETABLE));
    classAndDiv = '2G';
    if (classDivInput) classDivInput.value = '2G';
    currentNotes = {};
    currentEnabled = {};

    for (let i = 0; i < 8; i++) {
      currentEnabled[getSlotKey(i)] = true;
    }

    saveSubjectsToStorage();
    saveTimetableToStorage();
    saveNotesToStorage();
    saveEnabledToStorage();
    saveSettingsToStorage();

    setTimeout(() => {
      showToast('Loaded Class Timetable & Subjects! 🏫');
    }, 400);
  }

  function applyRandomTitleEmojiOnRefresh() {
    if (!headerEmojiInput) return;

    const manualOverride = localStorage.getItem('glimpse_manual_title_override_v11');
    if (manualOverride && manualOverride.trim() !== '') {
      headerEmojiInput.value = manualOverride.trim();
    } else {
      const randomIndex = Math.floor(Math.random() * RANDOM_HEADER_EMOJIS_100.length);
      const freshRandomEmoji = RANDOM_HEADER_EMOJIS_100[randomIndex];
      headerEmojiInput.value = freshRandomEmoji;
    }
  }

  // --- PWA SERVICE WORKER & INSTALL PROMPT ---
  let deferredInstallPrompt = null;
  const pwaInstallBtn = document.getElementById('pwaInstallBtn');

  function setupPWA() {
    // 1. Register Service Worker for Offline Mode
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then((registration) => {
          console.log('ServiceWorker registered successfully with scope:', registration.scope);
        }).catch((error) => {
          console.warn('ServiceWorker registration failed:', error);
        });
      });
    }

    // 2. Listen for Browser PWA Install Prompt Event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (pwaInstallBtn) {
        pwaInstallBtn.style.display = 'inline-flex';
      }
    });

    if (pwaInstallBtn) {
      pwaInstallBtn.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const choiceResult = await deferredInstallPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          showToast('App installed successfully! 📲');
        }
        deferredInstallPrompt = null;
        pwaInstallBtn.style.display = 'none';
      });
    }

    window.addEventListener('appinstalled', () => {
      console.log('Glimpse App installed!');
      if (pwaInstallBtn) pwaInstallBtn.style.display = 'none';
      deferredInstallPrompt = null;
    });
  }

  // Initialize App
  function init() {
    const isSecretPresetTriggered = checkUrlForSecretPreset();
    if (!isSecretPresetTriggered) {
      loadStateFromStorage();
    }
    applyRandomTitleEmojiOnRefresh();
    applyRandomDayEmojiOnRefresh();
    setupDatePicker();
    setupTheme();
    setupTabNavigation();
    setupPWA();
    setupEventListeners();
    
    // Apply timetable for selected date
    applyTimetableForDate(selectedDate);
    renderAll();
  }

  // --- LOCAL STORAGE HELPERS ---
  function loadStateFromStorage() {
    try {
      const savedSubjects = localStorage.getItem('glimpse_subjects_v10');
      if (savedSubjects) {
        subjects = JSON.parse(savedSubjects);
      } else {
        subjects = JSON.parse(JSON.stringify(GENERIC_DEFAULT_SUBJECTS));
      }

      const savedTimetable = localStorage.getItem('glimpse_timetable_v10');
      if (savedTimetable) {
        timetable = JSON.parse(savedTimetable);
      } else {
        timetable = JSON.parse(JSON.stringify(GENERIC_DEFAULT_TIMETABLE));
      }

      const savedClassDiv = localStorage.getItem('glimpse_class_div_v10');
      if (savedClassDiv) {
        classAndDiv = savedClassDiv;
        if (classDivInput) classDivInput.value = classAndDiv;
      } else {
        classAndDiv = '';
        if (classDivInput) classDivInput.value = '';
      }

      const savedNotes = localStorage.getItem('glimpse_notes_v10');
      if (savedNotes) {
        currentNotes = JSON.parse(savedNotes);
      } else {
        currentNotes = {};
      }

      const savedEnabled = localStorage.getItem('glimpse_enabled_v10');
      if (savedEnabled) {
        currentEnabled = JSON.parse(savedEnabled);
      }

      const savedTheme = localStorage.getItem('glimpse_theme');
      isDarkMode = savedTheme === 'dark';
    } catch (e) {
      console.error('Error loading storage:', e);
      subjects = JSON.parse(JSON.stringify(GENERIC_DEFAULT_SUBJECTS));
      timetable = JSON.parse(JSON.stringify(GENERIC_DEFAULT_TIMETABLE));
      currentNotes = {};
      classAndDiv = '';
    }
  }

  function saveSubjectsToStorage() {
    localStorage.setItem('glimpse_subjects_v10', JSON.stringify(subjects));
  }

  function saveTimetableToStorage() {
    localStorage.setItem('glimpse_timetable_v10', JSON.stringify(timetable));
  }

  function saveNotesToStorage() {
    localStorage.setItem('glimpse_notes_v10', JSON.stringify(currentNotes));
  }

  function saveEnabledToStorage() {
    localStorage.setItem('glimpse_enabled_v10', JSON.stringify(currentEnabled));
  }

  function saveSettingsToStorage() {
    localStorage.setItem('glimpse_class_div_v10', classAndDiv);
  }

  // --- THEME ---
  function setupTheme() {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeIcon.textContent = '☀️';
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeIcon.textContent = '🌙';
    }
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('glimpse_theme', isDarkMode ? 'dark' : 'light');
    setupTheme();
  }

  // --- TIMETABLE ENGINE ---
  function getSlotKey(slotIndex) {
    return `slot_${slotIndex}`;
  }

  function applyTimetableForDate(dateObj) {
    const dayName = DAYS_OF_WEEK[dateObj.getDay()];
    let activeSubjectIds = timetable[dayName];
    if (!activeSubjectIds || activeSubjectIds.length === 0) {
      activeSubjectIds = subjects.slice(0, 8).map(s => s.id);
    }

    // Ensure 8 slots are active by default for scheduled subjects
    for (let i = 0; i < 8; i++) {
      const slotKey = getSlotKey(i);
      if (i < activeSubjectIds.length && activeSubjectIds[i]) {
        if (currentEnabled[slotKey] === undefined) {
          currentEnabled[slotKey] = true;
        }
      } else {
        currentEnabled[slotKey] = false;
      }
    }

    saveEnabledToStorage();
  }

  // --- BLOCK ACTION HELPERS (PASTE & CLEAR) ---
  async function pasteFromClipboard(slotKey, textareaEl) {
    try {
      let pastedText = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        pastedText = await navigator.clipboard.readText();
      } else {
        pastedText = prompt('Paste your copied notes text below:');
      }

      if (pastedText !== null && pastedText !== undefined) {
        textareaEl.value = pastedText;
        currentNotes[slotKey] = pastedText;
        saveNotesToStorage();
        renderWhatsAppPreview();
        showToast('Pasted notes from clipboard! 📋');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
      const fallbackText = prompt('Paste your copied notes text below:');
      if (fallbackText !== null && fallbackText !== undefined) {
        textareaEl.value = fallbackText;
        currentNotes[slotKey] = fallbackText;
        saveNotesToStorage();
        renderWhatsAppPreview();
        showToast('Pasted notes! 📋');
      }
    }
  }

  function clearBlockNotes(slotKey, textareaEl) {
    textareaEl.value = '';
    currentNotes[slotKey] = '';
    saveNotesToStorage();
    renderWhatsAppPreview();
    showToast('Cleared notes for block! 🧹');
  }

  // --- DATE & KEYCAP FORMATTING ---
  function setupDatePicker() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    glimpseDateInput.value = `${yyyy}-${mm}-${dd}`;
    selectedDate = today;
    selectedEditorDay = DAYS_OF_WEEK[today.getDay()];
  }

  function getFormattedKeycapDate(dateObj) {
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = String(dateObj.getFullYear());

    const toKeycap = (str) => {
      let res = '';
      for (let char of str) {
        res += KEYCAP_EMOJIS[char] || char;
      }
      return res;
    };

    const ddKeycap = toKeycap(dd);
    const mmKeycap = toKeycap(mm);
    const yyyyKeycap = toKeycap(yyyy);

    return `📆 ${ddKeycap}-${mmKeycap}-${yyyyKeycap}`;
  }

  let currentDayEmoji = '🪂';

  function applyRandomDayEmojiOnRefresh() {
    const randomIndex = Math.floor(Math.random() * RANDOM_HEADER_EMOJIS_100.length);
    currentDayEmoji = RANDOM_HEADER_EMOJIS_100[randomIndex];
  }

  function getFormattedDayOfWeek(dateObj) {
    const dayName = DAYS_OF_WEEK[dateObj.getDay()];
    return `*${currentDayEmoji} ${dayName}*`;
  }

  // --- RENDER FUNCTIONS ---
  function renderAll() {
    renderDateAndDayHeader();
    renderSubjectEntryCards();
    renderSubjectManagerCards();
    renderTimetableEditor();
    renderWhatsAppPreview();
    updateTimeStamp();
  }

  function renderDateAndDayHeader() {
    const keycapDateStr = getFormattedKeycapDate(selectedDate);
    const dayStr = getFormattedDayOfWeek(selectedDate);

    todayFormattedDateEl.textContent = keycapDateStr;
    todayFormattedDayEl.textContent = dayStr.replace(/\*/g, '');
  }

  function getActiveDaySlots() {
    const dayName = DAYS_OF_WEEK[selectedDate.getDay()];
    let periodSubjectIds = timetable[dayName];
    if (!periodSubjectIds || periodSubjectIds.length === 0) {
      periodSubjectIds = subjects.slice(0, 8).map(s => s.id);
    }
    
    const slots = [];
    periodSubjectIds.forEach((subId, index) => {
      const subject = subjects.find(s => s.id === subId);
      if (subject) {
        const slotKey = getSlotKey(index);
        const isEnabled = currentEnabled[slotKey] !== false;
        
        let noteText = currentNotes[slotKey];
        if (noteText === undefined) {
          noteText = '';
        }

        slots.push({
          slotIndex: index,
          slotKey: slotKey,
          subject: subject,
          enabled: isEnabled,
          notes: noteText
        });
      }
    });
    return slots;
  }

  function renderSubjectEntryCards() {
    subjectEntryListEl.innerHTML = '';

    const daySlots = getActiveDaySlots();
    if (daySlots.length === 0) {
      subjectEntryListEl.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">📝</div>
          <h3>No Subjects for Today</h3>
          <p>Click <strong>+ Add Subject</strong> under Subjects tab or configure your weekly <strong>Timetable</strong> to get started.</p>
        </div>
      `;
      activeCountBadgeEl.textContent = '0';
      return;
    }

    let activeCount = 0;

    daySlots.forEach((slot, index) => {
      if (slot.enabled) activeCount++;

      const subject = slot.subject;
      const card = document.createElement('div');
      card.className = `subject-card ${slot.enabled ? '' : 'disabled'}`;

      const fullName = subject.suffix ? `${subject.name} ${subject.suffix}` : subject.name;
      const periodNum = index + 1;

      card.innerHTML = `
        <div class="card-top">
          <div class="subject-header-info">
            <span class="badge-box">${subject.badge}</span>
            <div class="subject-title-wrap">
              <span class="subject-title">${subject.icon} ${subject.name}</span>
              ${subject.suffix ? `<span class="subject-suffix">${subject.suffix}</span>` : ''}
              <span class="card-period-tag">Period #${periodNum}</span>
            </div>
          </div>
          <label class="switch" title="Toggle this period for today">
            <input type="checkbox" data-slot="${slot.slotKey}" class="toggle-subject-btn" ${slot.enabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        <div class="card-body">
          <textarea 
            class="notes-input" 
            data-slot="${slot.slotKey}" 
            placeholder="Type notes for Period #${periodNum} (${fullName})..." 
            ${slot.enabled ? '' : 'disabled'}
          >${escapeHtml(slot.notes)}</textarea>
          <div class="bullet-hint">
            <span>💡 Separate points with new lines</span>
            <div class="card-actions-bar">
              <button type="button" class="btn-block-action paste-notes-btn" data-slot="${slot.slotKey}" ${slot.enabled ? '' : 'disabled'} title="Paste text from clipboard">
                📋 Paste
              </button>
              <button type="button" class="btn-block-action clear-notes-btn" data-slot="${slot.slotKey}" ${slot.enabled ? '' : 'disabled'} title="Clear notes for this block">
                🧹 Clear
              </button>
            </div>
          </div>
        </div>
      `;

      subjectEntryListEl.appendChild(card);
    });

    activeCountBadgeEl.textContent = activeCount;
  }

  function renderSubjectManagerCards() {
    subjectsManagerListEl.innerHTML = '';

    if (subjects.length === 0) {
      subjectsManagerListEl.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">📚</div>
          <h3>No Subjects Created Yet</h3>
          <p>Tap the <strong>+ Add Subject</strong> button above to create custom subjects.</p>
        </div>
      `;
      return;
    }

    subjects.forEach((subject, index) => {
      const card = document.createElement('div');
      card.className = 'manager-card';

      card.innerHTML = `
        <div class="manager-left">
          <span class="badge-box">${subject.badge}</span>
          <div>
            <div class="subject-title">${subject.icon} ${subject.name}</div>
            ${subject.suffix ? `<span class="subject-suffix">${subject.suffix}</span>` : ''}
          </div>
        </div>
        <div class="manager-actions">
          <button class="action-icon-btn move-up" data-index="${index}" title="Move Up" ${index === 0 ? 'disabled' : ''}>⬆️</button>
          <button class="action-icon-btn move-down" data-index="${index}" title="Move Down" ${index === subjects.length - 1 ? 'disabled' : ''}>⬇️</button>
          <button class="action-icon-btn edit-sub" data-id="${subject.id}" title="Edit Subject">✏️</button>
          <button class="action-icon-btn delete delete-sub" data-id="${subject.id}" title="Delete Subject">🗑️</button>
        </div>
      `;

      subjectsManagerListEl.appendChild(card);
    });
  }

  function renderTimetableEditor() {
    // Render Day Selector Pills
    const pills = daySelectorPills.querySelectorAll('.day-pill');
    pills.forEach(pill => {
      const day = pill.getAttribute('data-day');
      if (day === selectedEditorDay) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    currentEditorDayTitle.textContent = `📅 ${selectedEditorDay} Schedule (8 Periods)`;

    const periodSubjectIds = timetable[selectedEditorDay] || [];
    daySubjectCount.textContent = `${periodSubjectIds.length} Period Slots`;

    timetablePeriodSlots.innerHTML = '';

    for (let i = 0; i < 8; i++) {
      const currentSubId = periodSubjectIds[i] || '';
      
      const slotCard = document.createElement('div');
      slotCard.className = 'period-slot-card';

      let optionsHtml = `<option value="">-- Free / No Class --</option>`;
      subjects.forEach(sub => {
        const fullName = sub.suffix ? `${sub.name} ${sub.suffix}` : sub.name;
        const selected = sub.id === currentSubId ? 'selected' : '';
        optionsHtml += `<option value="${sub.id}" ${selected}>${sub.badge} ${sub.icon} ${fullName}</option>`;
      });

      slotCard.innerHTML = `
        <span class="period-number-badge">Period #${i + 1}</span>
        <select class="input-control period-select" data-slot-index="${i}">
          ${optionsHtml}
        </select>
      `;

      timetablePeriodSlots.appendChild(slotCard);
    }
  }

  // --- WHATSAPP MESSAGE GENERATOR ENGINE ---
  function generateWhatsAppMessage() {
    const keycapDateStr = getFormattedKeycapDate(selectedDate);
    const dayStr = getFormattedDayOfWeek(selectedDate);
    const classDivStr = classDivInput.value.trim() || '2G';
    const titleEmoji = headerEmojiInput ? (headerEmojiInput.value.trim() || '🪁') : '🪁';

    const lines = [];

    // Title line with custom header emojis (No top/bottom circles)
    lines.push(`*${titleEmoji} GLIMPSE OF TODAY'S SESSION ${titleEmoji}*`);
    lines.push('');
    lines.push(keycapDateStr);
    lines.push(dayStr);
    lines.push('');
    lines.push(`_*👩🏻‍🏫 CLASS & DIV. :  ${classDivStr}*_`);
    lines.push('-----------------------------------------------------');

    const daySlots = getActiveDaySlots();
    let itemNumber = 1;

    daySlots.forEach(slot => {
      if (!slot.enabled) return;

      const subject = slot.subject;
      const fullName = subject.suffix ? `${subject.name} ${subject.suffix}` : subject.name;
      
      const subjectHeader = `${subject.badge}${itemNumber}. *_${subject.icon}${fullName}_*`;
      lines.push(subjectHeader);

      const notesRaw = slot.notes || '';
      const rawLines = notesRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      if (rawLines.length === 0) {
        lines.push('* Session completed');
      } else {
        rawLines.forEach(rLine => {
          if (rLine.startsWith('*') || rLine.startsWith('•') || rLine.startsWith('-')) {
            lines.push(rLine);
          } else {
            lines.push(`* ${rLine}`);
          }
        });
      }

      lines.push('-----------------------------------------------------');
      itemNumber++;
    });

    return lines.join('\n');
  }

  function renderWhatsAppPreview() {
    const message = generateWhatsAppMessage();
    whatsappOutputTextEl.textContent = message;
  }

  function updateTimeStamp() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    waTimeStampEl.textContent = `${hours}:${minutes} ${ampm} ✓✓`;
  }

  // --- TAB NAVIGATION ---
  function setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        tabBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        document.getElementById(targetTab).classList.add('active');

        if (targetTab === 'tab-preview') {
          renderWhatsAppPreview();
          updateTimeStamp();
        }
      });
    });
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Hashchange listener for secret 2G route (#2G)
    window.addEventListener('hashchange', () => {
      if (checkUrlForSecretPreset()) {
        applyTimetableForDate(selectedDate);
        renderAll();
      }
    });

    // Date change
    glimpseDateInput.addEventListener('change', (e) => {
      if (e.target.value) {
        selectedDate = new Date(e.target.value + 'T00:00:00');
        const dayName = DAYS_OF_WEEK[selectedDate.getDay()];
        selectedEditorDay = dayName;

        // Auto apply timetable for newly selected day
        applyTimetableForDate(selectedDate);

        renderAll();
        showToast(`Loaded timetable for ${dayName}`);
      }
    });

    // Class/Div change
    classDivInput.addEventListener('input', (e) => {
      classAndDiv = e.target.value;
      saveSettingsToStorage();
      renderWhatsAppPreview();
    });

    // Title Emoji Input & Random Pick
    if (headerEmojiInput) {
      headerEmojiInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.trim() === '') {
          localStorage.removeItem('glimpse_manual_title_override_v11');
        } else {
          localStorage.setItem('glimpse_manual_title_override_v11', val);
        }
        renderWhatsAppPreview();
      });
    }

    if (randomEmojiBtn) {
      randomEmojiBtn.addEventListener('click', () => {
        localStorage.removeItem('glimpse_manual_title_override_v11');
        const randomIndex = Math.floor(Math.random() * RANDOM_HEADER_EMOJIS_100.length);
        const freshEmoji = RANDOM_HEADER_EMOJIS_100[randomIndex];
        headerEmojiInput.value = freshEmoji;
        applyRandomDayEmojiOnRefresh();
        renderAll();
        showToast(`New random emojis applied! ✨`);
      });
    }

    // Re-apply Timetable Button
    reapplyTimetableBtn.addEventListener('click', () => {
      const dayName = DAYS_OF_WEEK[selectedDate.getDay()];
      
      // Reset toggles to enabled for today
      for (let i = 0; i < 8; i++) {
        currentEnabled[getSlotKey(i)] = true;
      }
      saveEnabledToStorage();

      renderSubjectEntryCards();
      renderWhatsAppPreview();
      showToast(`Re-applied timetable for ${dayName}`);
    });

    // Timetable Day Selector Pills
    daySelectorPills.addEventListener('click', (e) => {
      const pill = e.target.closest('.day-pill');
      if (pill) {
        selectedEditorDay = pill.getAttribute('data-day');
        renderTimetableEditor();
      }
    });

    // Timetable Period Select Delegation
    timetablePeriodSlots.addEventListener('change', (e) => {
      if (e.target.classList.contains('period-select')) {
        const slotIndex = parseInt(e.target.getAttribute('data-slot-index'));
        const subId = e.target.value;

        if (!timetable[selectedEditorDay]) {
          timetable[selectedEditorDay] = ['', '', '', '', '', '', '', ''];
        }

        timetable[selectedEditorDay][slotIndex] = subId;
        saveTimetableToStorage();

        // If currently editing the same day as selectedDate, auto refresh
        const currentDayName = DAYS_OF_WEEK[selectedDate.getDay()];
        if (selectedEditorDay === currentDayName) {
          renderSubjectEntryCards();
          renderWhatsAppPreview();
        }

        renderTimetableEditor();
        showToast(`Period #${slotIndex + 1} updated!`);
      }
    });

    // Reset Timetable
    resetTimetableBtn.addEventListener('click', () => {
      if (confirm('Reset timetable schedule to original 8-period defaults?')) {
        timetable = JSON.parse(JSON.stringify(DEFAULT_TIMETABLE));
        saveTimetableToStorage();
        applyTimetableForDate(selectedDate);
        renderAll();
        showToast('Timetable reset to 8-period defaults');
      }
    });

    // Notes Input delegation & Subject Toggle delegation
    subjectEntryListEl.addEventListener('input', (e) => {
      if (e.target.classList.contains('notes-input')) {
        const slotKey = e.target.getAttribute('data-slot');
        currentNotes[slotKey] = e.target.value;
        saveNotesToStorage();
        renderWhatsAppPreview();
      }
    });

    subjectEntryListEl.addEventListener('change', (e) => {
      if (e.target.classList.contains('toggle-subject-btn')) {
        const slotKey = e.target.getAttribute('data-slot');
        currentEnabled[slotKey] = e.target.checked;
        saveEnabledToStorage();
        
        const card = e.target.closest('.subject-card');
        const textarea = card.querySelector('.notes-input');
        if (e.target.checked) {
          card.classList.remove('disabled');
          textarea.removeAttribute('disabled');
        } else {
          card.classList.add('disabled');
          textarea.setAttribute('disabled', 'true');
        }

        renderSubjectEntryCards();
        renderWhatsAppPreview();
      }
    });

    // Paste & Clear Block Actions Delegation
    subjectEntryListEl.addEventListener('click', (e) => {
      const pasteBtn = e.target.closest('.paste-notes-btn');
      if (pasteBtn && !pasteBtn.disabled) {
        const slotKey = pasteBtn.getAttribute('data-slot');
        const card = pasteBtn.closest('.subject-card');
        const textarea = card ? card.querySelector('.notes-input') : null;
        if (slotKey && textarea) {
          pasteFromClipboard(slotKey, textarea);
        }
        return;
      }

      const clearBtn = e.target.closest('.clear-notes-btn');
      if (clearBtn && !clearBtn.disabled) {
        const slotKey = clearBtn.getAttribute('data-slot');
        const card = clearBtn.closest('.subject-card');
        const textarea = card ? card.querySelector('.notes-input') : null;
        if (slotKey && textarea) {
          clearBlockNotes(slotKey, textarea);
        }
        return;
      }
    });

    // Clear Notes
    clearNotesBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all notes for today?')) {
        for (let i = 0; i < 8; i++) {
          currentNotes[getSlotKey(i)] = '';
        }
        saveNotesToStorage();
        renderSubjectEntryCards();
        renderWhatsAppPreview();
        showToast('All notes cleared!');
      }
    });

    // Manager Actions Delegation
    subjectsManagerListEl.addEventListener('click', (e) => {
      const moveUpBtn = e.target.closest('.move-up');
      const moveDownBtn = e.target.closest('.move-down');
      const editBtn = e.target.closest('.edit-sub');
      const deleteBtn = e.target.closest('.delete-sub');

      if (moveUpBtn) {
        const index = parseInt(moveUpBtn.getAttribute('data-index'));
        if (index > 0) {
          const temp = subjects[index];
          subjects[index] = subjects[index - 1];
          subjects[index - 1] = temp;
          saveSubjectsToStorage();
          renderAll();
        }
      }

      if (moveDownBtn) {
        const index = parseInt(moveDownBtn.getAttribute('data-index'));
        if (index < subjects.length - 1) {
          const temp = subjects[index];
          subjects[index] = subjects[index + 1];
          subjects[index + 1] = temp;
          saveSubjectsToStorage();
          renderAll();
        }
      }

      if (editBtn) {
        const subId = editBtn.getAttribute('data-id');
        openSubjectModal(subId);
      }

      if (deleteBtn) {
        const subId = deleteBtn.getAttribute('data-id');
        if (confirm('Delete this subject?')) {
          subjects = subjects.filter(s => s.id !== subId);
          
          saveSubjectsToStorage();
          renderAll();
          showToast('Subject deleted');
        }
      }
    });

    // Reset Defaults
    resetDefaultsBtn.addEventListener('click', () => {
      if (confirm('Reset subjects and timetable to original defaults?')) {
        subjects = JSON.parse(JSON.stringify(DEFAULT_SUBJECTS));
        timetable = JSON.parse(JSON.stringify(DEFAULT_TIMETABLE));
        currentNotes = {};
        currentEnabled = {};
        saveSubjectsToStorage();
        saveTimetableToStorage();
        applyTimetableForDate(selectedDate);
        renderAll();
        showToast('Reset to default subjects & timetable');
      }
    });

    // Add Subject Button
    addSubjectBtn.addEventListener('click', () => {
      openSubjectModal();
    });

    // Modal Form Submit & Cancel
    closeModalBtn.addEventListener('click', closeSubjectModal);
    cancelModalBtn.addEventListener('click', closeSubjectModal);
    subjectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveModalSubject();
    });

    // Copy to Clipboard Buttons
    const handleCopy = () => {
      const msg = generateWhatsAppMessage();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(msg).then(() => {
          showToast('WhatsApp Message Copied! 📋');
        }).catch(err => {
          fallbackCopyText(msg);
        });
      } else {
        fallbackCopyText(msg);
      }
    };

    if (copyMessageBtn) copyMessageBtn.addEventListener('click', handleCopy);
    const copyMessageBtn2 = document.getElementById('copyMessageBtn2');
    if (copyMessageBtn2) copyMessageBtn2.addEventListener('click', handleCopy);

    // Direct Share via WhatsApp
    shareWhatsAppBtn.addEventListener('click', () => {
      const msg = generateWhatsAppMessage();
      const encoded = encodeURIComponent(msg);
      
      if (navigator.share) {
        navigator.share({
          title: "Glimpse of Today's Session",
          text: msg
        }).catch(err => {
          window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
        });
      } else {
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
      }
    });
  }

  // --- MODAL CONTROLS ---
  function openSubjectModal(subId = null) {
    if (subId) {
      modalTitle.textContent = 'Edit Subject';
      const sub = subjects.find(s => s.id === subId);
      if (sub) {
        editSubjectId.value = sub.id;
        subName.value = sub.name;
        subEmoji.value = sub.icon;
        subBadge.value = sub.badge;
        subSuffix.value = sub.suffix || '';
      }
    } else {
      modalTitle.textContent = 'Add Subject';
      editSubjectId.value = '';
      subName.value = '';
      subEmoji.value = '🔤';
      subBadge.value = '🟥';
      subSuffix.value = '';
    }

    subjectModal.classList.add('active');
    subjectModal.setAttribute('aria-hidden', 'false');
    subName.focus();
  }

  function closeSubjectModal() {
    subjectModal.classList.remove('active');
    subjectModal.setAttribute('aria-hidden', 'true');
  }

  function saveModalSubject() {
    const name = subName.value.trim();
    const icon = subEmoji.value.trim() || '📚';
    const badge = subBadge.value;
    const suffix = subSuffix.value.trim();
    const id = editSubjectId.value;

    if (!name) return;

    if (id) {
      const subIndex = subjects.findIndex(s => s.id === id);
      if (subIndex !== -1) {
        subjects[subIndex].name = name;
        subjects[subIndex].icon = icon;
        subjects[subIndex].badge = badge;
        subjects[subIndex].suffix = suffix;
      }
    } else {
      const newId = 'sub_' + Date.now();
      const newSubject = {
        id: newId,
        badge: badge,
        icon: icon,
        name: name,
        suffix: suffix,
        notes: ''
      };
      subjects.push(newSubject);
    }

    saveSubjectsToStorage();
    closeSubjectModal();
    renderAll();
    showToast(id ? 'Subject updated!' : 'New subject added!');
  }

  // --- FALLBACK COPY & TOAST ---
  function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('WhatsApp Message Copied! 📋');
    } catch (err) {
      alert('Failed to copy message automatically. Please select text and copy manually.');
    }
    document.body.removeChild(textArea);
  }

  function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
