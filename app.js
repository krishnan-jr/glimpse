// Glimpse Application Engine

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

  // Secret Preset Data for ENG Attendance Program
  const PRESET_ENG_ATTENDEES = [
    'Ms. Bhagya',
    'Ms. Susan',
    'Ms. Preetha S',
    'Ms. Sheela A R',
    'Ms. Divya Laxmi P S',
    'Ms. Arya Mohan',
    'Ms. Reshmi R',
    'Ms. Sabeena S',
    'Ms. Thasleena',
    'Ms. Fathima Rani',
    'Ms. Zeena Beevi',
    'Ms. Anciya',
    'Ms. Saleela',
    'Ms. Sumayya Mol',
    'Ms. Lina',
    'Ms. Shabnam',
    'Ms. Suja N',
    'Ms. Shahnaz',
    'Mr. Vineeth'
  ];

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
  let isDarkMode = true;

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

  // Secret URL preset detector (/2G or #2G or ?2G, /ENG or #ENG or ?ENG)
  function checkUrlForSecretPreset() {
    try {
      const pathname = decodeURIComponent(window.location.pathname).toUpperCase();
      const hash = decodeURIComponent(window.location.hash).toUpperCase();
      const search = decodeURIComponent(window.location.search).toUpperCase();

      const is2G = pathname === '/2G' || pathname.endsWith('/2G') || hash === '#2G' || hash === '#/2G' || search === '?2G' || search === '?2G/';
      const isENG = pathname === '/ENG' || pathname.endsWith('/ENG') || hash === '#ENG' || hash === '#/ENG' || search === '?ENG' || search === '?ENG/';

      if (is2G) {
        loadPreset2G();
        return true;
      }
      if (isENG) {
        loadPresetENG();
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

    try {
      localStorage.setItem('glimpse_last_active_route_v1', '#/dashboard');
    } catch (e) {}

    // Navigate to homepage and reload webapp
    const cleanUrl = window.location.origin + window.location.pathname + '#/dashboard';
    window.location.href = cleanUrl;
    window.location.reload();
  }

  function loadPresetENG() {
    loadAttendanceDataFromStorage();
    if (!attendanceData.programs) attendanceData.programs = [];

    const engProgramId = 'prog_eng_improvement';
    let existingProg = attendanceData.programs.find(p => p.id === engProgramId || (p.name && p.name.toUpperCase() === 'ENGLISH LANGUAGE IMPROVEMENT'));

    const participantsList = PRESET_ENG_ATTENDEES.map((name, index) => ({
      id: `part_eng_${index + 1}`,
      name: name,
      rollNo: String(index + 1)
    }));

    if (existingProg) {
      existingProg.id = engProgramId;
      existingProg.name = 'English Language Improvement';
      existingProg.description = 'Team D';
      existingProg.participants = participantsList;
      if (!existingProg.sessions) existingProg.sessions = [];
    } else {
      existingProg = {
        id: engProgramId,
        name: 'English Language Improvement',
        description: 'Team D',
        createdAt: new Date().toISOString(),
        participants: participantsList,
        sessions: []
      };
      attendanceData.programs.unshift(existingProg);
    }

    saveAttendanceDataToStorage();

    try {
      localStorage.setItem('glimpse_last_active_route_v1', '#/dashboard');
    } catch (e) {}

    // Navigate to homepage and reload webapp
    const cleanUrl = window.location.origin + window.location.pathname + '#/dashboard';
    window.location.href = cleanUrl;
    window.location.reload();
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

  // --- 100 FEELGOOD MESSAGES, QUOTES, AND QUESTIONS ---
  const FEELGOOD_MESSAGES_100 = [
    "Believe you can and you're halfway there. — Theodore Roosevelt",
    "Every day is a fresh start and a new chance to shine.",
    "What small win brought a smile to your face today?",
    "Keep your face always toward the sunshine—and shadows will fall behind you. — Walt Whitman",
    "You are capable of amazing things.",
    "What is one thing you are grateful for right now?",
    "Small steps every day lead to big results over time.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "Your energy is contagious—spread kindness today.",
    "What exciting project are you looking forward to working on today?",
    "Do what you can, with what you have, where you are. — Theodore Roosevelt",
    "Happiness is not something readymade. It comes from your own actions. — Dalai Lama",
    "What's a new skill or idea you'd love to explore this week?",
    "Start where you are. Use what you have. Do what you can. — Arthur Ashe",
    "You are stronger and wiser than you think.",
    "What made you laugh recently?",
    "The secret of getting ahead is getting started. — Mark Twain",
    "Act as if what you do makes a difference. It does. — William James",
    "What's a cozy moment you enjoyed today?",
    "Dream big and dare to fail. — Norman Vaughan",
    "Your speed doesn't matter; forward progress is forward progress.",
    "Who is someone that brightened your day recently?",
    "Focus on the beauty in tiny moments.",
    "Make today so awesome that yesterday gets jealous!",
    "What's one good deed you can do today?",
    "Wherever you go, go with all your heart. — Confucius",
    "Turn your obstacles into stepping stones for success.",
    "What hobby or activity brings you pure peace?",
    "Light tomorrow with today. — Elizabeth Barrett Browning",
    "You make the world a better place just by being in it.",
    "What is your favorite way to unwind after a productive day?",
    "Great things never come from comfort zones.",
    "Embrace the journey, enjoy the process, and celebrate the small wins.",
    "What's a song that instantly lifts your mood?",
    "Write it on your heart that every day is the best day in the year. — Ralph Waldo Emerson",
    "Be the reason someone smiles today.",
    "What positive message would you share with your past self?",
    "Peace comes from within; nurture it every day.",
    "Strive for progress, not perfection.",
    "What is one goal you feel super passionate about?",
    "You are standard-issue awesome!",
    "Calculated risks and curiosity lead to wondrous discoveries.",
    "What's the best piece of advice you've ever received?",
    "Magic happens when you don't give up.",
    "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
    "What is something that made you feel proud of yourself recently?",
    "Radiate positivity and watch good things manifest around you.",
    "Every mistake is just a lesson leading to growth.",
    "What place brings you the most peaceful thoughts?",
    "Kindness is a language which the deaf can hear and the blind can see. — Mark Twain",
    "Your potential is unlimited—keep building!",
    "What's a simple pleasure that never fails to delight you?",
    "Today is a great day to learn something new.",
    "Be yourself; everyone else is already taken. — Oscar Wilde",
    "What accomplishment are you celebrating this month?",
    "Positive mind, positive vibes, positive life.",
    "Don't count the days, make the days count. — Muhammad Ali",
    "What delicious food made your day extra special?",
    "Opportunities don't happen, you create them. — Chris Grosser",
    "Take a deep breath; you're doing great!",
    "What is a creative idea you've been pondering lately?",
    "Stay curious, stay humble, and keep exploring.",
    "Spread love everywhere you go. — Mother Teresa",
    "What's a book or story that inspired you deeply?",
    "Clear minds make great decisions.",
    "The only limit to our realization of tomorrow is our doubts of today. — Franklin D. Roosevelt",
    "What acts of kindness have you noticed around you?",
    "Happiness grows when shared with others.",
    "Everything you can imagine is real. — Pablo Picasso",
    "What's a milestone you are working toward right now?",
    "Choose joy today, no matter how small.",
    "In the middle of every difficulty lies opportunity. — Albert Einstein",
    "What makes you feel energized and ready to take on the world?",
    "Doubt kills more dreams than failure ever will. — Suzy Kassem",
    "You are creating your own story—make it inspiring!",
    "What is a funny memory that still makes you chuckle?",
    "Life is short, make every moment count.",
    "When you focus on the good, the good gets better.",
    "What is something beautiful you saw today?",
    "Never shrink yourself for someone else's comfort.",
    "Small acts of kindness make a giant splash.",
    "What's your favorite way to spend a quiet morning?",
    "It always seems impossible until it's done. — Nelson Mandela",
    "Courage is grace under pressure. — Ernest Hemingway",
    "What quote inspires you whenever you feel challenged?",
    "Growth begins at the end of your comfort zone.",
    "You are an original—there is nobody else like you!",
    "What is a dream destination on your bucket list?",
    "Smile—it's free therapy!",
    "Success is the sum of small efforts repeated day in and day out. — Robert Collier",
    "What's your secret power when tackling a tough task?",
    "There are so many reasons to be happy.",
    "Shine your light bright and inspire others to do the same.",
    "What is a tradition or ritual that brings you joy?",
    "The best is yet to come!",
    "Believe in your inner strength and resilience.",
    "What is one thing you can do today for your self-care?",
    "Happiness is a state of mind—choose joy today.",
    "Every accomplishment starts with the decision to try.",
    "What exciting adventure awaits you next?"
  ];

  const VIBRANT_NAME_COLORS = [
    '#FF4757', '#2ED573', '#1E90FF', '#FFA502', '#9B59B6',
    '#00D2D3', '#FF6B81', '#70A1FF', '#7BED9F', '#FFA801',
    '#E056FD', '#686DE0', '#00BEC4', '#BE2EDD', '#48DBFB',
    '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6',
    '#EF4444', '#14B8A6', '#F97316', '#D946EF', '#06B6D4'
  ];

  function updateLandingPageHero() {
    const heroTitle = document.getElementById('heroTitle');
    const heroSubMessage = document.getElementById('heroSubMessage');
    const dashboardHeaderTitle = document.getElementById('dashboardHeaderTitle');

    if (dashboardHeaderTitle) {
      dashboardHeaderTitle.textContent = 'Dashboard';
    }

    const userName = localStorage.getItem('glimpse_user_name');
    if (heroTitle) {
      if (userName && userName.trim() !== '') {
        const randomColor = VIBRANT_NAME_COLORS[Math.floor(Math.random() * VIBRANT_NAME_COLORS.length)];
        heroTitle.innerHTML = `Welcome, <span id="heroUserNameSpan" style="color: ${randomColor}; font-weight: 800;">${escapeHtml(userName.trim())}</span>`;
      } else {
        heroTitle.textContent = 'Welcome to Studio';
      }
    }

    if (heroSubMessage) {
      const randomIndex = Math.floor(Math.random() * FEELGOOD_MESSAGES_100.length);
      heroSubMessage.textContent = FEELGOOD_MESSAGES_100[randomIndex];
    }
  }

  // --- SECRET BACKUP & RESTORE FEATURE ---
  function setupBackupSecretFeature() {
    let clickCount = 0;
    let resetTimer = null;

    const pill = document.getElementById('madeWithLovePill');
    if (pill) {
      pill.addEventListener('click', () => {
        clickCount++;
        if (resetTimer) clearTimeout(resetTimer);

        if (clickCount >= 10) {
          clickCount = 0;
          openBackupModal();
          showToast('Unlocked Secret Hub! 🔑');
        } else {
          if (clickCount >= 5) {
            showToast(`${10 - clickCount} click${10 - clickCount === 1 ? '' : 's'} to open Secret Hub`);
          }
          resetTimer = setTimeout(() => {
            clickCount = 0;
          }, 4000);
        }
      });
    }

    const saveNameBtn = document.getElementById('saveUserNameBtn');
    const userNameInput = document.getElementById('userNameInput');

    function saveUserName() {
      if (!userNameInput) return;
      const val = userNameInput.value.trim();
      if (val) {
        localStorage.setItem('glimpse_user_name', val);
        showToast(`Name saved! Welcome, ${val} ✨`);
      } else {
        localStorage.removeItem('glimpse_user_name');
        showToast('Name cleared.');
      }
      updateLandingPageHero();
    }

    if (saveNameBtn) {
      saveNameBtn.addEventListener('click', saveUserName);
    }

    if (userNameInput) {
      userNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveUserName();
        }
      });
    }

    const backupModal = document.getElementById('backupModal');
    if (backupModal) {
      backupModal.addEventListener('click', (e) => {
        if (e.target === backupModal) closeBackupModal();
      });
    }

    const closeBtn = document.getElementById('closeBackupModalBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeBackupModal);
    }

    const exportBtn = document.getElementById('backupExportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        exportLocalStorageAsJson();
      });
    }

    const importBtn = document.getElementById('backupImportBtn');
    const importInput = document.getElementById('backupImportFileInput');

    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => {
        importInput.click();
      });

      importInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          importLocalStorageFromJson(file);
          e.target.value = '';
        }
      });
    }
  }

  function openBackupModal() {
    const modal = document.getElementById('backupModal');
    if (!modal) return;
    const nameInput = document.getElementById('userNameInput');
    if (nameInput) {
      nameInput.value = localStorage.getItem('glimpse_user_name') || '';
    }
    modal.inert = false;
    modal.classList.add('active');
    modal.removeAttribute('aria-hidden');
    if (nameInput) {
      setTimeout(() => nameInput.focus(), 100);
    }
  }

  function closeBackupModal() {
    const modal = document.getElementById('backupModal');
    if (!modal) return;
    if (document.activeElement && modal.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    modal.inert = true;
  }

  function exportLocalStorageAsJson() {
    try {
      const dump = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        dump[key] = localStorage.getItem(key);
      }
      const jsonStr = JSON.stringify(dump, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `glimpse-backup-${dateStr}.json`);
      showToast('Backup JSON exported successfully!');
    } catch (err) {
      console.error('Backup export failed:', err);
      showAlertDialog('Backup Error', 'Failed to export application backup.');
    }
  }

  function importLocalStorageFromJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        let data;
        try {
          data = JSON.parse(content);
        } catch (pErr) {
          showAlertDialog('Invalid File', 'The uploaded file is not a valid JSON document.');
          return;
        }

        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          showAlertDialog('Invalid Backup', 'JSON backup file must contain a key-value object.');
          return;
        }

        const keysCount = Object.keys(data).length;
        if (keysCount === 0) {
          showAlertDialog('Empty Backup', 'The selected JSON backup file contains no data.');
          return;
        }

        const confirmed = await showConfirmDialog({
          title: 'Restore Backup',
          message: `Are you sure you want to restore ${keysCount} item${keysCount === 1 ? '' : 's'} to localStorage? The page will reload to apply changes.`,
          confirmText: 'Restore & Reload',
          cancelText: 'Cancel'
        });

        if (confirmed) {
          Object.keys(data).forEach(key => {
            const val = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
            localStorage.setItem(key, val);
          });
          showToast('Backup restored! Reloading...');
          closeBackupModal();
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      } catch (err) {
        console.error('Backup import failed:', err);
        showAlertDialog('Invalid File', 'An error occurred while reading the JSON backup file.');
      }
    };
    reader.onerror = () => {
      showAlertDialog('File Error', 'Could not read the uploaded JSON file.');
    };
    reader.readAsText(file);
  }

  // Initialize App
  function init() {
    const isSecretPresetTriggered = checkUrlForSecretPreset();
    if (!isSecretPresetTriggered) {
      loadStateFromStorage();
    }
    loadAttendanceDataFromStorage();
    applyRandomTitleEmojiOnRefresh();
    applyRandomDayEmojiOnRefresh();
    setupDatePicker();
    setupTheme();
    setupTabNavigation();
    setupPWA();
    setupEventListeners();
    setupAttendanceEventListeners();
    setupBackupSecretFeature();
    updateLandingPageHero();
    
    // Apply timetable for selected date
    applyTimetableForDate(selectedDate);
    renderAll();

    // SPA Router Setup & Route Restoration on refresh / load
    let currentHash = window.location.hash;
    if (!currentHash || currentHash === '#' || currentHash === '#/') {
      try {
        const savedRoute = localStorage.getItem('glimpse_last_active_route_v1');
        if (savedRoute && savedRoute !== '#/dashboard' && savedRoute !== '#') {
          currentHash = savedRoute;
          window.history.replaceState(null, '', savedRoute);
        }
      } catch (e) {}
    }

    if (currentHash) {
      handleRoute(currentHash);
    }
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
      isDarkMode = savedTheme !== 'light';
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
  const SUN_SVG = `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`;
  const MOON_SVG = `<svg viewBox="0 0 24 24"><path d="M12.3 2C6.5 2 1.8 6.7 1.8 12.5S6.5 23 12.3 23c4.8 0 8.8-3.2 10.1-7.7-.6.2-1.3.3-2 .3-5.2 0-9.5-4.3-9.5-9.5 0-1.4.3-2.7.8-3.9-1.3-.2-2.5-.2-3.7-.2z"/></svg>`;

  function setupTheme() {
    const themeSpans = document.querySelectorAll('.theme-icon-span');
    if (isDarkMode) {
      document.documentElement.removeAttribute('data-theme');
      themeSpans.forEach(span => { span.innerHTML = SUN_SVG; });
      if (themeIcon) themeIcon.innerHTML = SUN_SVG;
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      themeSpans.forEach(span => { span.innerHTML = MOON_SVG; });
      if (themeIcon) themeIcon.innerHTML = MOON_SVG;
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
    const dayName = DAYS_OF_WEEK[selectedDate.getDay()];
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const yyyy = String(selectedDate.getFullYear());

    if (todayFormattedDateEl) {
      todayFormattedDateEl.textContent = `${dd} / ${mm} / ${yyyy}`;
    }
    if (todayFormattedDayEl) {
      todayFormattedDayEl.textContent = dayName;
    }
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
            <span>Separate points with new lines</span>
            <div class="card-actions-bar">
              <button type="button" class="btn-block-action paste-notes-btn" data-slot="${slot.slotKey}" ${slot.enabled ? '' : 'disabled'} title="Paste text from clipboard">
                Paste
              </button>
              <button type="button" class="btn-block-action clear-notes-btn" data-slot="${slot.slotKey}" ${slot.enabled ? '' : 'disabled'} title="Clear notes for this block">
                Clear
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
          <button class="action-icon-btn move-up" data-index="${index}" title="Move Up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="action-icon-btn move-down" data-index="${index}" title="Move Down" ${index === subjects.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="action-icon-btn edit-sub" data-id="${subject.id}" title="Edit Subject">✎</button>
          <button class="action-icon-btn delete delete-sub" data-id="${subject.id}" title="Delete Subject">✕</button>
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

    currentEditorDayTitle.textContent = `${selectedEditorDay} Schedule (8 Periods)`;

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

        const subName = targetTab.replace('tab-', '');
        navigateToRoute('#/glimpse/' + subName);
      });
    });
  }

  // --- APP VIEWS ROUTER & DASHBOARD PORTAL ---
  const viewDashboard = document.getElementById('view-dashboard');
  const viewGlimpseApp = document.getElementById('view-glimpse-app');
  const viewAttendanceApp = document.getElementById('view-attendance-app');
  const tileGlimpseApp = document.getElementById('tileGlimpseApp');
  const tileAttendanceApp = document.getElementById('tileAttendanceApp');
  const backToDashboardBtn = document.getElementById('backToDashboardBtn');
  const attBackToDashboardBtn = document.getElementById('attBackToDashboardBtn');

  let isNavigatingFromRouter = false;

  function navigateToRoute(routeHash, pushState = true) {
    if (pushState && window.location.hash !== routeHash) {
      window.history.pushState(null, '', routeHash);
    }
    try {
      localStorage.setItem('glimpse_last_active_route_v1', routeHash);
    } catch (e) {}
  }

  function parseHash(hashStr) {
    let hash = hashStr || window.location.hash || '';
    if (hash.startsWith('#')) hash = hash.substring(1);
    if (hash.startsWith('/')) hash = hash.substring(1);

    const parts = hash.split('?');
    const path = parts[0] || 'dashboard';
    const params = new URLSearchParams(parts[1] || '');

    return { path, params };
  }

  function handleRoute(hashStr) {
    if (isAttRecordSessionDirty() && !isCheckingDirtyNavigation) {
      isCheckingDirtyNavigation = true;
      const targetHash = hashStr;
      confirmUnsavedAttendanceChanges().then(confirmed => {
        isCheckingDirtyNavigation = false;
        if (confirmed) {
          attRecordInitialDate = null;
          attRecordInitialRoster = null;
          handleRoute(targetHash);
        } else {
          // Re-sync address bar hash to keep user on record screen
          if (attCurrentActiveProgramId) {
            const currentRoute = attEditingSessionDate 
              ? `#/attendance/record?id=${attCurrentActiveProgramId}&date=${attEditingSessionDate}`
              : `#/attendance/record?id=${attCurrentActiveProgramId}`;
            window.history.pushState(null, '', currentRoute);
          }
        }
      });
      return;
    }

    isNavigatingFromRouter = true;
    const { path, params } = parseHash(hashStr);

    const rawHash = (hashStr || '').toUpperCase();
    if (rawHash === '#2G' || rawHash === '#/2G' || rawHash === '2G') {
      loadPreset2G();
      isNavigatingFromRouter = false;
      return;
    }

    if (rawHash === '#ENG' || rawHash === '#/ENG' || rawHash === 'ENG') {
      loadPresetENG();
      isNavigatingFromRouter = false;
      return;
    }

    if (path.startsWith('glimpse')) {
      if (viewDashboard) viewDashboard.classList.remove('active');
      if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
      if (viewGlimpseApp) viewGlimpseApp.classList.add('active');

      const sub = path.split('/')[1];
      if (sub) {
        const tabMap = { 'entry': 'tab-entry', 'subjects': 'tab-subjects', 'timetable': 'tab-timetable', 'preview': 'tab-preview' };
        const targetTab = tabMap[sub] || ('tab-' + sub);
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
        if (tabBtn) {
          const tabBtns = document.querySelectorAll('.tab-btn');
          const tabPanes = document.querySelectorAll('.tab-pane');
          tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
          tabPanes.forEach(p => p.classList.remove('active'));
          tabBtn.classList.add('active');
          tabBtn.setAttribute('aria-selected', 'true');
          const pane = document.getElementById(targetTab);
          if (pane) pane.classList.add('active');
        }
      }
    } else if (path.startsWith('attendance')) {
      if (viewDashboard) viewDashboard.classList.remove('active');
      if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
      if (viewAttendanceApp) viewAttendanceApp.classList.add('active');

      const sub = path.split('/')[1] || 'programs';
      const progId = params.get('id');

      if (sub === 'program-form') {
        openProgramForm(progId, false);
      } else if (sub === 'matrix') {
        if (progId) {
          openProgramMatrix(progId, false);
        } else {
          showAttScreen('att-screen-programs');
          renderAttProgramsList();
        }
      } else if (sub === 'record') {
        if (progId) {
          attCurrentActiveProgramId = progId;
          const dateParam = params.get('date');
          openRecordSession(dateParam, false);
        } else {
          showAttScreen('att-screen-programs');
          renderAttProgramsList();
        }
      } else {
        showAttScreen('att-screen-programs');
        renderAttProgramsList();
      }
    } else {
      if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
      if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
      if (viewDashboard) viewDashboard.classList.add('active');
      updateLandingPageHero();
    }

    isNavigatingFromRouter = false;
  }

  function openGlimpseApp() {
    if (viewDashboard) viewDashboard.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
    if (viewGlimpseApp) viewGlimpseApp.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigateToRoute('#/glimpse');
  }

  function openAttendanceApp() {
    if (viewDashboard) viewDashboard.classList.remove('active');
    if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showAttScreen('att-screen-programs');
    renderAttProgramsList();
    navigateToRoute('#/attendance');
  }

  function openDashboard() {
    if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
    if (viewDashboard) viewDashboard.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateLandingPageHero();
    navigateToRoute('#/dashboard');
  }

  function setupViewNavigation() {
    if (tileGlimpseApp) {
      tileGlimpseApp.addEventListener('click', openGlimpseApp);
    }
    if (backToDashboardBtn) {
      backToDashboardBtn.addEventListener('click', openDashboard);
    }

    // In-app alert for coming-soon tiles
    const disabledTiles = document.querySelectorAll('.disabled-app-tile');
    disabledTiles.forEach(tile => {
      tile.addEventListener('click', () => {
        const appName = tile.getAttribute('data-app-name') || 'This app';
        showAlertDialog('Coming Soon 🚀', `${appName} is currently under development and will be available in an upcoming update!`);
      });
    });

    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
    themeToggleBtns.forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ATTENDANCE MODULE ENGINE

  let attendanceData = { programs: [] };
  let attCurrentActiveProgramId = null;
  let attFormEditingProgramId = null;
  let attFormParticipantsDraft = [];
  let attEditingSessionDate = null;
  let attRecordRosterDraft = {};
  let attMatrixSearchQuery = '';
  var attRecordSearchQuery = '';
  let attRecordInitialDate = null;
  let attRecordInitialRoster = null;
  let isCheckingDirtyNavigation = false;

  function isAttRecordSessionDirty() {
    const activeScreen = document.querySelector('.att-screen.active');
    if (!activeScreen || activeScreen.id !== 'att-screen-record-session') return false;

    const dateInput = document.getElementById('attSessionDate');
    const currentDate = dateInput ? dateInput.value : '';
    if (attRecordInitialDate !== null && currentDate !== attRecordInitialDate) return true;

    if (!attRecordInitialRoster || !attRecordRosterDraft) return false;

    const keys = Object.keys(attRecordRosterDraft);
    for (let id of keys) {
      if (attRecordRosterDraft[id] !== attRecordInitialRoster[id]) {
        return true;
      }
    }

    return false;
  }

  function confirmUnsavedAttendanceChanges() {
    if (!isAttRecordSessionDirty()) {
      return Promise.resolve(true);
    }

    return showConfirmDialog({
      title: 'Unsaved Attendance Changes',
      message: 'You have unsaved attendance changes. Are you sure you want to discard your changes and continue?',
      confirmText: 'Discard & Continue',
      cancelText: 'Stay on Page',
      isDanger: true
    });
  }
  let attViewMode = 'week'; // 'week' | 'month' | 'day' | 'custom'
  let attAnchorDate = new Date(); // Current date anchor for date range calculations

  function get30DaysAgoISOString() {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  let attCustomFromDate = get30DaysAgoISOString();
  let attCustomToDate = getTodayISOString();

  // --- DATE RANGE HELPERS FOR MATRIX FILTERING ---
  function getStartOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as 1st day
    return new Date(date.setDate(diff));
  }

  function getEndOfWeek(d) {
    const start = getStartOfWeek(d);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  }

  function formatShortDate(d) {
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = months[d.getMonth()];
    const y = d.getFullYear();
    return `${day} ${m} ${y}`;
  }

  function formatMonthYear(d) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function toISODateString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function updateDateFilterUI() {
    const rangeLabel = document.getElementById('attDateRangeLabel');
    const dateInput = document.getElementById('attDateNavInput');
    const customWrapper = document.getElementById('attCustomDateWrapper');
    const customFromInput = document.getElementById('attCustomFromInput');
    const customToInput = document.getElementById('attCustomToInput');
    const prevBtn = document.getElementById('attDateNavPrevBtn');
    const nextBtn = document.getElementById('attDateNavNextBtn');

    const resetDateFilterBtn = document.getElementById('attResetDateFilterBtn');
    const isTodayAnchor = toISODateString(attAnchorDate) === getTodayISOString();
    if (resetDateFilterBtn) {
      if (attViewMode === 'custom') {
        resetDateFilterBtn.style.display = 'none';
      } else {
        resetDateFilterBtn.style.display = '';
        if (isTodayAnchor) {
          resetDateFilterBtn.classList.add('active');
        } else {
          resetDateFilterBtn.classList.remove('active');
        }
      }
    }

    const segmentedBtns = document.querySelectorAll('.segmented-btn');
    segmentedBtns.forEach(btn => {
      const mode = btn.getAttribute('data-mode');
      if (mode === attViewMode) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    if (attViewMode === 'day') {
      if (prevBtn) prevBtn.style.display = 'inline-flex';
      if (nextBtn) nextBtn.style.display = 'inline-flex';
      if (rangeLabel) rangeLabel.style.display = 'none';
      if (customWrapper) customWrapper.style.display = 'none';
      if (dateInput) {
        dateInput.style.display = 'inline-block';
        dateInput.value = toISODateString(attAnchorDate);
      }
    } else if (attViewMode === 'custom') {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (rangeLabel) rangeLabel.style.display = 'none';
      if (dateInput) dateInput.style.display = 'none';
      if (customWrapper) customWrapper.style.display = 'inline-flex';
      if (customFromInput) customFromInput.value = attCustomFromDate;
      if (customToInput) customToInput.value = attCustomToDate;
    } else {
      if (prevBtn) prevBtn.style.display = 'inline-flex';
      if (nextBtn) nextBtn.style.display = 'inline-flex';
      if (dateInput) dateInput.style.display = 'none';
      if (customWrapper) customWrapper.style.display = 'none';
      if (rangeLabel) {
        rangeLabel.style.display = 'inline-block';
        if (attViewMode === 'week') {
          const start = getStartOfWeek(attAnchorDate);
          const end = getEndOfWeek(attAnchorDate);
          rangeLabel.textContent = `${formatShortDate(start)} - ${formatShortDate(end)}`;
        } else if (attViewMode === 'month') {
          rangeLabel.textContent = formatMonthYear(attAnchorDate);
        }
      }
    }
  }

  function handleDateNav(direction) {
    const current = new Date(attAnchorDate);

    if (attViewMode === 'day') {
      current.setDate(current.getDate() + direction);
    } else if (attViewMode === 'week') {
      current.setDate(current.getDate() + (direction * 7));
    } else if (attViewMode === 'month') {
      current.setMonth(current.getMonth() + direction);
    }

    attAnchorDate = current;
    updateDateFilterUI();
    renderAttMatrixTable();
  }

  // Storage Handlers
  function loadAttendanceDataFromStorage() {
    try {
      const saved = localStorage.getItem('glimpse_attendance_data_v1');
      if (saved) {
        attendanceData = JSON.parse(saved);
        if (!attendanceData.programs) attendanceData.programs = [];
      } else {
        attendanceData = { programs: [] };
        saveAttendanceDataToStorage();
      }
    } catch (e) {
      console.error('Error loading attendance data:', e);
      attendanceData = { programs: [] };
    }
  }

  function saveAttendanceDataToStorage() {
    try {
      localStorage.setItem('glimpse_attendance_data_v1', JSON.stringify(attendanceData));
    } catch (e) {
      console.error('Error saving attendance data:', e);
    }
  }

  // Attendance Screens Navigation Router
  function showAttScreen(screenId) {
    const screens = document.querySelectorAll('.att-screen');
    screens.forEach(s => s.classList.remove('active'));

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');

    const backTextEl = document.getElementById('attBackBtnText');
    if (backTextEl) {
      if (screenId === 'att-screen-programs') {
        backTextEl.textContent = 'Dashboard';
      } else if (screenId === 'att-screen-program-form' || screenId === 'att-screen-matrix') {
        backTextEl.textContent = 'Programs';
      } else if (screenId === 'att-screen-record-session') {
        backTextEl.textContent = 'Matrix';
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- SCREEN 1: PROGRAM MANAGEMENT (LIST) ---
  function renderAttProgramsList() {
    const container = document.getElementById('attProgramsList');
    if (!container) return;

    if (!attendanceData.programs || attendanceData.programs.length === 0) {
      container.innerHTML = `
        <div class="att-empty-state">
          <div class="att-empty-icon">📁</div>
          <h3>No Programs Found</h3>
          <p>Create your first program to start tracking attendance for your class or group.</p>
          <button id="attEmptyCreateBtn" class="btn btn-primary btn-sm">+ Create Program</button>
        </div>
      `;
      const emptyBtn = document.getElementById('attEmptyCreateBtn');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openProgramForm(null));
      return;
    }

    container.innerHTML = attendanceData.programs.map(prog => {
      const pCount = prog.participants ? prog.participants.length : 0;
      const sCount = prog.sessions ? prog.sessions.length : 0;
      
      let lastDateText = 'No sessions yet';
      if (sCount > 0) {
        const sortedSessions = [...prog.sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
        lastDateText = 'Last: ' + formatDateLabel(sortedSessions[0].date);
      }

      return `
        <div class="att-program-card" data-program-id="${prog.id}">
          <div class="att-card-header">
            <div class="att-card-title-group">
              <h3>${escapeHtml(prog.name)}</h3>
              ${prog.description ? `<div class="att-card-subtitle">${escapeHtml(prog.description)}</div>` : ''}
            </div>
            <button type="button" class="btn-round-arrow att-open-prog-btn" data-id="${prog.id}" title="Open ${escapeHtml(prog.name)}" aria-label="Open Program">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          <div class="att-card-stats">
            <span class="att-stat-badge">👥 ${pCount} ${pCount === 1 ? 'Attendee' : 'Attendees'}</span>
            <span class="att-stat-badge">📅 ${sCount} ${sCount === 1 ? 'Session' : 'Sessions'}</span>
            <span class="att-stat-badge">🕒 ${lastDateText}</span>
          </div>

          <div class="att-card-actions">
            <button class="btn btn-subtle btn-sm att-edit-prog-btn" data-id="${prog.id}">✎ Edit</button>
            <button class="btn btn-subtle btn-sm att-delete-prog-btn" data-id="${prog.id}" style="color: var(--danger);">✕ Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners
    container.querySelectorAll('.att-open-prog-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openProgramMatrix(id);
      });
    });

    container.querySelectorAll('.att-edit-prog-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openProgramForm(id);
      });
    });

    container.querySelectorAll('.att-delete-prog-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteProgram(id);
      });
    });
  }

  function deleteProgram(programId) {
    const prog = attendanceData.programs.find(p => p.id === programId);
    if (!prog) return;

    showConfirmDialog({
      title: 'Delete Program',
      message: `Are you sure you want to delete "${prog.name}" and all of its attendance records? This action cannot be undone.`,
      confirmText: 'Delete Program',
      cancelText: 'Cancel',
      isDanger: true
    }).then(confirmed => {
      if (confirmed) {
        attendanceData.programs = attendanceData.programs.filter(p => p.id !== programId);
        saveAttendanceDataToStorage();
        renderAttProgramsList();
        showToast('Program deleted');
      }
    });
  }

  // --- SCREEN 2: CREATE / EDIT PROGRAM & PARTICIPANTS ---
  function openProgramForm(programId = null, updateHash = true) {
    if (updateHash) {
      navigateToRoute(programId ? `#/attendance/program-form?id=${programId}` : '#/attendance/program-form');
    }
    attFormEditingProgramId = programId;
    const titleEl = document.getElementById('attProgramFormTitle');
    const nameInput = document.getElementById('attProgName');
    const descInput = document.getElementById('attProgDesc');
    const editIdInput = document.getElementById('attEditProgramId');

    if (editIdInput) editIdInput.value = programId || '';

    if (programId) {
      const prog = attendanceData.programs.find(p => p.id === programId);
      if (prog) {
        if (titleEl) titleEl.textContent = 'Edit Program';
        if (nameInput) nameInput.value = prog.name || '';
        if (descInput) descInput.value = prog.description || '';
        attFormParticipantsDraft = prog.participants ? JSON.parse(JSON.stringify(prog.participants)) : [];
        attFormParticipantsDraft.forEach((p, idx) => {
          const rNo = getParticipantRollNo(p, idx + 1);
          p.rollNo = rNo;
          delete p.rollno;
        });
      }
    } else {
      if (titleEl) titleEl.textContent = 'Create New Program';
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      attFormParticipantsDraft = [];
    }

    renderAttFormParticipants();
    showAttScreen('att-screen-program-form');
  }

  function getParticipantRollNo(p, fallbackIndex = 1) {
    if (!p) return String(fallbackIndex);
    if (p.rollNo !== undefined && p.rollNo !== null && String(p.rollNo).trim() !== '') {
      return String(p.rollNo).trim();
    }
    if (p.rollno !== undefined && p.rollno !== null && String(p.rollno).trim() !== '') {
      return String(p.rollno).trim();
    }
    return String(fallbackIndex);
  }

  function getNextSuggestedRollNo() {
    if (!attFormParticipantsDraft || attFormParticipantsDraft.length === 0) {
      return '1';
    }

    let maxNum = 0;
    let hasNumeric = false;

    attFormParticipantsDraft.forEach((p, idx) => {
      const rNo = getParticipantRollNo(p, idx + 1);
      const parsed = parseInt(rNo, 10);
      if (!isNaN(parsed) && String(parsed) === rNo.trim()) {
        hasNumeric = true;
        if (parsed > maxNum) maxNum = parsed;
      }
    });

    if (hasNumeric && maxNum > 0) {
      return String(maxNum + 1);
    }

    return String(attFormParticipantsDraft.length + 1);
  }

  function updateSuggestedRollNoInput() {
    const rollNoInput = document.getElementById('attNewParticipantRollNo');
    if (rollNoInput) {
      rollNoInput.value = getNextSuggestedRollNo();
    }
  }

  function renderAttFormParticipants() {
    const badgeEl = document.getElementById('attParticipantCountBadge');
    if (badgeEl) badgeEl.textContent = attFormParticipantsDraft.length;

    updateSuggestedRollNoInput();

    const container = document.getElementById('attParticipantsList');
    if (!container) return;

    if (attFormParticipantsDraft.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--muted); padding: 12px; font-size: var(--text-xs);">No attendees added yet. Enter full name above to build your roster.</div>`;
      return;
    }

    container.innerHTML = attFormParticipantsDraft.map((p, index) => {
      const rollNo = getParticipantRollNo(p, index + 1);
      return `
        <div class="att-participant-item" data-id="${p.id}">
          <span class="name-text"><strong>${escapeHtml(rollNo)}.</strong> ${escapeHtml(p.name)}</span>
          <div class="item-actions">
            <button type="button" class="action-icon-btn edit-participant-btn" data-id="${p.id}" title="Edit Attendee Details">✎</button>
            <button type="button" class="action-icon-btn delete delete-participant-btn" data-id="${p.id}" title="Remove Attendee">✕</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.edit-participant-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const pIndex = attFormParticipantsDraft.findIndex(item => item.id === id);
        if (pIndex !== -1) {
          const p = attFormParticipantsDraft[pIndex];
          const currentRollNo = getParticipantRollNo(p, pIndex + 1);
          const updated = await showParticipantEditModal({
            rollNo: currentRollNo,
            name: p.name
          });
          if (updated) {
            p.rollNo = updated.rollNo;
            delete p.rollno;
            p.name = updated.name;
            renderAttFormParticipants();
          }
        }
      });
    });

    container.querySelectorAll('.delete-participant-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        attFormParticipantsDraft = attFormParticipantsDraft.filter(item => item.id !== id);
        renderAttFormParticipants();
      });
    });
  }

  function handleAddParticipantFromInput() {
    const rollNoInput = document.getElementById('attNewParticipantRollNo');
    const input = document.getElementById('attNewParticipantInput');
    if (!input) return;

    const val = input.value.trim();
    if (!val) return;

    const specifiedRollNo = rollNoInput ? rollNoInput.value.trim() : '';

    const names = val.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 0);
    names.forEach((name, idx) => {
      let rollNo = specifiedRollNo;
      if (!rollNo) {
        rollNo = getNextSuggestedRollNo();
      } else if (idx > 0 && !isNaN(parseInt(specifiedRollNo, 10))) {
        rollNo = String(parseInt(specifiedRollNo, 10) + idx);
      }

      attFormParticipantsDraft.push({
        id: 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + idx,
        name: name,
        rollNo: rollNo
      });
    });

    input.value = '';
    input.focus();
    renderAttFormParticipants();
  }

  function saveProgramForm(e) {
    if (e) e.preventDefault();

    // Auto-add any attendee currently typed in input before saving
    const input = document.getElementById('attNewParticipantInput');
    if (input && input.value.trim() !== '') {
      handleAddParticipantFromInput();
    }

    const nameInput = document.getElementById('attProgName');
    const descInput = document.getElementById('attProgDesc');

    const name = nameInput ? nameInput.value.trim() : '';
    const desc = descInput ? descInput.value.trim() : '';

    if (!name) {
      showToast('Please enter a program name');
      return;
    }

    let savedProgramId = attFormEditingProgramId;

    if (attFormEditingProgramId) {
      const prog = attendanceData.programs.find(p => p.id === attFormEditingProgramId);
      if (prog) {
        prog.name = name;
        prog.description = desc;
        prog.participants = JSON.parse(JSON.stringify(attFormParticipantsDraft));
      }
    } else {
      savedProgramId = 'prog_' + Date.now();
      const newProgram = {
        id: savedProgramId,
        name: name,
        description: desc,
        createdAt: new Date().toISOString(),
        participants: JSON.parse(JSON.stringify(attFormParticipantsDraft)),
        sessions: []
      };
      attendanceData.programs.push(newProgram);
    }

    saveAttendanceDataToStorage();
    showToast(attFormEditingProgramId ? 'Program updated!' : 'Program created!');
    renderAttProgramsList();

    if (savedProgramId) {
      openProgramMatrix(savedProgramId);
    } else {
      showAttScreen('att-screen-programs');
    }
  }

  // --- SCREEN 3: ATTENDANCE MATRIX DASHBOARD ---
  function openProgramMatrix(programId, updateHash = true) {
    if (updateHash) {
      navigateToRoute(`#/attendance/matrix?id=${programId}`);
    }
    attCurrentActiveProgramId = programId;
    attMatrixSearchQuery = '';
    const searchInput = document.getElementById('attMatrixSearchInput');
    if (searchInput) searchInput.value = '';

    renderAttMatrixTable();
    showAttScreen('att-screen-matrix');
  }

  function renderAttMatrixTable() {
    const prog = attendanceData.programs.find(p => p.id === attCurrentActiveProgramId);
    if (!prog) {
      showAttScreen('att-screen-programs');
      return;
    }

    updateDateFilterUI();

    const titleEl = document.getElementById('attMatrixProgramTitle');
    const descEl = document.getElementById('attMatrixProgramDesc');
    if (titleEl) titleEl.textContent = prog.name;
    if (descEl) descEl.textContent = prog.description || 'Attendance matrix overview';

    const container = document.getElementById('attMatrixTableContainer');
    const statsSummary = document.getElementById('attMatrixStatsSummary');
    if (!container) return;

    // Filter participants by search query
    let filteredParticipants = prog.participants || [];
    if (attMatrixSearchQuery.trim() !== '') {
      const q = attMatrixSearchQuery.toLowerCase().trim();
      filteredParticipants = filteredParticipants.filter(p => p.name.toLowerCase().includes(q));
    }

    // Determine date range filter based on attViewMode and attAnchorDate
    let sortedSessions = [...(prog.sessions || [])];

    if (attViewMode === 'week') {
      const start = toISODateString(getStartOfWeek(attAnchorDate));
      const end = toISODateString(getEndOfWeek(attAnchorDate));
      sortedSessions = sortedSessions.filter(s => s.date >= start && s.date <= end);
    } else if (attViewMode === 'month') {
      const year = attAnchorDate.getFullYear();
      const month = String(attAnchorDate.getMonth() + 1).padStart(2, '0');
      const monthPrefix = `${year}-${month}`;
      sortedSessions = sortedSessions.filter(s => s.date.startsWith(monthPrefix));
    } else if (attViewMode === 'day') {
      const targetDay = toISODateString(attAnchorDate);
      sortedSessions = sortedSessions.filter(s => s.date === targetDay);
    } else if (attViewMode === 'custom') {
      sortedSessions = sortedSessions.filter(s => {
        if (attCustomFromDate && s.date < attCustomFromDate) return false;
        if (attCustomToDate && s.date > attCustomToDate) return false;
        return true;
      });
    }

    // Sort filtered sessions chronologically by date
    sortedSessions.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (statsSummary) {
      const totalSessionsCount = (prog.sessions || []).length;
      statsSummary.textContent = `Attendees: ${filteredParticipants.length} | Sessions in Range: ${sortedSessions.length} (Total Recorded: ${totalSessionsCount})`;
    }

    if (filteredParticipants.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px; color: var(--muted);">
          ${prog.participants && prog.participants.length > 0 ? 'No participants match your search query.' : 'No participants in this program yet. Click Edit to add participants.'}
        </div>
      `;
      return;
    }

    if (sortedSessions.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">📅</div>
          <div style="font-size: var(--text-sm); font-weight: 600; color: var(--fg); margin-bottom: 4px;">No Attendance Recorded for Selected Date Range</div>
          <div style="font-size: var(--text-xs); color: var(--muted);">Use the arrow buttons above to change dates, or click <strong>+ Add Attendance</strong> to record a session.</div>
        </div>
      `;
      return;
    }

    // Construct Matrix HTML
    let tableHtml = `<table class="att-table">`;

    // Header Row
    tableHtml += `<thead><tr>`;
    tableHtml += `<th class="col-participant">Attendee (${filteredParticipants.length})</th>`;

    sortedSessions.forEach(sess => {
      tableHtml += `
        <th class="col-date">
          <div class="date-header-content">
            <span>${formatDateLabel(sess.date)}</span>
            <div class="date-header-actions">
              <button class="action-icon-btn att-edit-sess-btn" data-date="${sess.date}" title="Edit Session">✎</button>
              <button class="action-icon-btn delete att-delete-sess-btn" data-date="${sess.date}" title="Delete Session">✕</button>
            </div>
          </div>
        </th>
      `;
    });

    tableHtml += `<th class="col-summary">Attendance Summary</th>`;
    tableHtml += `</tr></thead>`;

    // Body Rows
    tableHtml += `<tbody>`;
    filteredParticipants.forEach((p, index) => {
      let presentCount = 0;
      const origIndex = (prog.participants || []).findIndex(item => item.id === p.id);
      const rollNo = getParticipantRollNo(p, origIndex >= 0 ? origIndex + 1 : index + 1);

      tableHtml += `<tr>`;
      tableHtml += `<td class="cell-participant">${escapeHtml(rollNo)}. ${escapeHtml(p.name)}</td>`;

      sortedSessions.forEach(sess => {
        const record = sess.records ? sess.records[p.id] : null;
        if (record === 'present') {
          presentCount++;
          tableHtml += `<td><span class="att-dot att-dot-present" title="Present"></span></td>`;
        } else if (record === 'absent') {
          tableHtml += `<td><span class="att-dot att-dot-absent" title="Absent"></span></td>`;
        } else {
          tableHtml += `<td><span class="att-dot-na" title="Not Recorded">—</span></td>`;
        }
      });

      const totalSessions = sortedSessions.length;
      let pct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
      
      tableHtml += `
        <td>
          <span class="summary-pill">${presentCount}/${totalSessions} (${pct}%)</span>
        </td>
      `;
      tableHtml += `</tr>`;
    });

    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;

    // Attach event listeners for session actions inside matrix table headers
    container.querySelectorAll('.att-edit-sess-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const date = e.currentTarget.getAttribute('data-date');
        openRecordSession(date);
      });
    });

    container.querySelectorAll('.att-delete-sess-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const date = e.currentTarget.getAttribute('data-date');
        deleteAttendanceSession(date);
      });
    });
  }

  function getAllDatesInRange(startIso, endIso) {
    if (!startIso || !endIso) return [];
    const parseLocalISO = (iso) => {
      const parts = iso.split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return null;
      return new Date(parts[0], parts[1] - 1, parts[2]);
    };
    const start = parseLocalISO(startIso);
    const end = parseLocalISO(endIso);
    if (!start || !end || start > end) return [];

    const dates = [];
    const cur = new Date(start);
    while (cur <= end) {
      dates.push(toISODateString(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }

  function getExportOptions() {
    const includeSummaryInput = document.getElementById('attExportIncludeSummary');
    const fillMissingDatesInput = document.getElementById('attExportFillMissingDates');
    return {
      includeSummary: includeSummaryInput ? includeSummaryInput.checked : true,
      fillMissingDates: fillMissingDatesInput ? fillMissingDatesInput.checked : false
    };
  }

  function getVisibleAttendanceMatrixData(options = {}) {
    const prog = attendanceData.programs.find(p => p.id === attCurrentActiveProgramId);
    if (!prog) return null;

    let participants = prog.participants || [];
    if (attMatrixSearchQuery.trim() !== '') {
      const q = attMatrixSearchQuery.toLowerCase().trim();
      participants = participants.filter(p => p.name.toLowerCase().includes(q));
    }

    let sessions = [...(prog.sessions || [])];
    let rangeStart = null;
    let rangeEnd = null;

    if (attViewMode === 'week') {
      rangeStart = toISODateString(getStartOfWeek(attAnchorDate));
      rangeEnd = toISODateString(getEndOfWeek(attAnchorDate));
      sessions = sessions.filter(s => s.date >= rangeStart && s.date <= rangeEnd);
    } else if (attViewMode === 'month') {
      const year = attAnchorDate.getFullYear();
      const monthIndex = attAnchorDate.getMonth();
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      rangeStart = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      rangeEnd = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      sessions = sessions.filter(s => s.date >= rangeStart && s.date <= rangeEnd);
    } else if (attViewMode === 'day') {
      rangeStart = toISODateString(attAnchorDate);
      rangeEnd = rangeStart;
      sessions = sessions.filter(s => s.date === rangeStart);
    } else if (attViewMode === 'custom') {
      rangeStart = attCustomFromDate || null;
      rangeEnd = attCustomToDate || null;
      sessions = sessions.filter(s => {
        if (rangeStart && s.date < rangeStart) return false;
        if (rangeEnd && s.date > rangeEnd) return false;
        return true;
      });
    }

    if (options.fillMissingDates) {
      let startIso = rangeStart;
      let endIso = rangeEnd;
      if (!startIso || !endIso) {
        const sortedAll = [...(prog.sessions || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
        if (sortedAll.length > 0) {
          if (!startIso) startIso = sortedAll[0].date;
          if (!endIso) endIso = sortedAll[sortedAll.length - 1].date;
        } else {
          startIso = toISODateString(attAnchorDate);
          endIso = startIso;
        }
      }

      if (startIso && endIso) {
        const datesInRange = getAllDatesInRange(startIso, endIso);
        const existingMap = new Map(sessions.map(s => [s.date, s]));
        sessions = datesInRange.map(dateStr => {
          if (existingMap.has(dateStr)) return existingMap.get(dateStr);
          return { id: 'unrecorded-' + dateStr, date: dateStr, isVirtual: true, records: {} };
        });
      }
    }

    sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

    const rows = participants.map((participant, index) => {
      const origIndex = (prog.participants || []).findIndex(item => item.id === participant.id);
      const rollNo = getParticipantRollNo(participant, origIndex >= 0 ? origIndex + 1 : index + 1);
      const participantNameWithNum = `${rollNo}. ${participant.name}`;
      let presentCount = 0;
      const statuses = sessions.map(session => {
        const rawStatus = session.records ? session.records[participant.id] : null;
        if (rawStatus === 'present') {
          presentCount++;
          return 'Present';
        }
        if (rawStatus === 'absent') return 'Absent';
        return '-';
      });

      return {
        participant,
        rollNo,
        participantNameWithNum,
        statuses,
        summary: sessions.length ? `${presentCount}/${sessions.length} (${Math.round((presentCount / sessions.length) * 100)}%)` : '0/0 (0%)'
      };
    });

    return { prog, participants, sessions, rows };
  }

  function updateExportModalMessage() {
    const exportMessage = document.getElementById('attExportModalMessage');
    const whatsappBtn = document.getElementById('attCopyWhatsAppBtn');
    const options = getExportOptions();
    const data = getVisibleAttendanceMatrixData(options);

    if (!data || data.participants.length === 0 || data.sessions.length === 0) {
      if (exportMessage) {
        exportMessage.textContent = 'The currently visible attendance table has no exportable rows.';
      }
      if (whatsappBtn) whatsappBtn.hidden = true;
      return;
    }

    if (exportMessage) {
      exportMessage.textContent = `Export ${data.participants.length} participants and ${data.sessions.length} visible session${data.sessions.length === 1 ? '' : 's'}.`;
    }

    if (whatsappBtn) {
      whatsappBtn.hidden = data.sessions.length !== 1;
    }
  }

  function openAttendanceExportDialog() {
    const exportModal = document.getElementById('attExportModal');
    const options = getExportOptions();
    const data = getVisibleAttendanceMatrixData(options);

    if (!data || data.participants.length === 0 || data.sessions.length === 0) {
      showAlertDialog('Nothing to Export', 'The currently visible attendance table has no exportable rows.');
      return;
    }

    updateExportModalMessage();

    if (!exportModal) return;

    exportModal.inert = false;
    exportModal.classList.add('active');
    exportModal.removeAttribute('aria-hidden');
  }

  function closeAttendanceExportDialog() {
    const exportModal = document.getElementById('attExportModal');
    if (!exportModal) return;
    if (document.activeElement && exportModal.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    exportModal.classList.remove('active');
    exportModal.setAttribute('aria-hidden', 'true');
    exportModal.inert = true;
  }

  function getFilterPillDateString() {
    if (attViewMode === 'week') {
      const start = getStartOfWeek(attAnchorDate);
      const end = getEndOfWeek(attAnchorDate);
      return `${formatShortDate(start)} - ${formatShortDate(end)}`;
    }
    if (attViewMode === 'month') {
      return formatMonthYear(attAnchorDate);
    }
    if (attViewMode === 'day') {
      return formatShortDate(attAnchorDate);
    }
    if (attViewMode === 'custom') {
      const parseLocalISO = (iso) => {
        if (!iso) return null;
        const parts = iso.split('-').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        return new Date(parts[0], parts[1] - 1, parts[2]);
      };
      const fromD = parseLocalISO(attCustomFromDate);
      const toD = parseLocalISO(attCustomToDate);
      if (fromD && toD) {
        return `${formatShortDate(fromD)} - ${formatShortDate(toD)}`;
      }
      if (fromD) {
        return `From ${formatShortDate(fromD)}`;
      }
      if (toD) {
        return `Until ${formatShortDate(toD)}`;
      }
      return 'All Dates';
    }
    return formatShortDate(attAnchorDate);
  }

  function getExportFilename(programName, extension) {
    const prog = (programName || 'Program').trim();
    const dateRange = getFilterPillDateString();
    const rawFilename = `${prog} - ${dateRange}`;
    const safeFilename = rawFilename
      .replace(/[\/\\:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/-+/g, '-')
      .trim();
    return `${safeFilename}.${extension}`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function inlineComputedStyles(source, target) {
    const computed = window.getComputedStyle(source);
    const properties = [
      'background-color', 'border', 'border-collapse', 'border-color', 'border-spacing',
      'border-style', 'border-width', 'box-sizing', 'color', 'display', 'font-family',
      'font-size', 'font-weight', 'height', 'letter-spacing', 'line-height', 'margin',
      'padding', 'text-align', 'text-transform', 'vertical-align', 'white-space', 'width'
    ];
    properties.forEach(prop => {
      target.style.setProperty(prop, computed.getPropertyValue(prop));
    });
    target.style.position = 'static';
    target.style.zIndex = 'auto';

    Array.from(source.children).forEach((child, index) => {
      if (target.children[index]) inlineComputedStyles(child, target.children[index]);
    });
  }

  async function exportVisibleAttendanceAsJpg() {
    const table = document.querySelector('#attMatrixTableContainer .att-table');
    const options = getExportOptions();
    const data = getVisibleAttendanceMatrixData(options);
    if (!data) {
      showAlertDialog('Nothing to Export', 'The attendance table is not available yet.');
      return;
    }

    const includeSummary = options.includeSummary !== false;
    const rootStyles = getComputedStyle(document.documentElement);
    const thEls = table ? Array.from(table.querySelectorAll('thead th')) : [];
    const bodyRows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];

    const headerLabels = [
      `Attendee (${data.participants.length})`,
      ...data.sessions.map(session => formatDateLabel(session.date))
    ];
    if (includeSummary) {
      headerLabels.push('Attendance Summary');
    }

    const nameColWidth = Math.max(220, thEls[0] ? Math.ceil(thEls[0].getBoundingClientRect().width) : 220);
    const dateColWidths = data.sessions.map((_, i) => thEls[i + 1] ? Math.ceil(thEls[i + 1].getBoundingClientRect().width) : 110);
    const columnWidths = [nameColWidth, ...dateColWidths];
    if (includeSummary) {
      const summaryColW = thEls[thEls.length - 1] ? Math.ceil(thEls[thEls.length - 1].getBoundingClientRect().width) : 150;
      columnWidths.push(summaryColW);
    }

    const rowHeights = data.rows.map((_, i) => bodyRows[i] ? Math.ceil(bodyRows[i].getBoundingClientRect().height) : 52);
    const headerHeight = (table && table.querySelector('thead tr')) ? Math.ceil(table.querySelector('thead tr').getBoundingClientRect().height) : 48;
    const width = columnWidths.reduce((sum, w) => sum + w, 0);
    const height = headerHeight + rowHeights.reduce((sum, h) => sum + h, 0);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const surface = rootStyles.getPropertyValue('--surface').trim() || '#ffffff';
    const surfaceWarm = rootStyles.getPropertyValue('--surface-warm').trim() || '#f4f4f4';
    const border = rootStyles.getPropertyValue('--border-soft').trim() || '#dddddd';
    const borderStrong = rootStyles.getPropertyValue('--border').trim() || '#cccccc';
    const fg = rootStyles.getPropertyValue('--fg').trim() || '#1f1f1f';
    const muted = rootStyles.getPropertyValue('--muted').trim() || '#6f6f6f';
    const presentColor = rootStyles.getPropertyValue('--success').trim() || '#12b981';
    const absentColor = rootStyles.getPropertyValue('--danger').trim() || '#ef4444';
    const fontFamily = rootStyles.getPropertyValue('--font-body').trim() || 'Arial, sans-serif';

    ctx.fillStyle = surface;
    ctx.fillRect(0, 0, width, height);

    const drawCell = (x, y, w, h, fill, stroke = border) => {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    };

    const drawText = (text, x, y, maxWidth, options = {}) => {
      ctx.fillStyle = options.color || fg;
      ctx.font = `${options.weight || 600} ${options.size || 14}px ${fontFamily}`;
      ctx.textAlign = options.align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y, maxWidth);
    };

    let x = 0;
    headerLabels.forEach((label, index) => {
      const w = columnWidths[index] || 120;
      drawCell(x, 0, w, headerHeight, surfaceWarm, borderStrong);
      drawText(label.toUpperCase(), x + (index === 0 ? 16 : w / 2), headerHeight / 2, w - 24, {
        align: index === 0 ? 'left' : 'center',
        size: 13,
        weight: 700
      });
      x += w;
    });

    let y = headerHeight;
    data.rows.forEach((row, rowIndex) => {
      const h = rowHeights[rowIndex] || 52;
      x = 0;

      drawCell(x, y, columnWidths[0] || 220, h, surface);
      drawText(row.participantNameWithNum || row.participant.name, x + 16, y + h / 2, (columnWidths[0] || 220) - 24, { align: 'left', size: 14, weight: 600 });
      x += columnWidths[0] || 220;

      row.statuses.forEach((status, statusIndex) => {
        const w = columnWidths[statusIndex + 1] || 110;
        drawCell(x, y, w, h, surface);
        if (status === 'Present' || status === 'Absent') {
          ctx.beginPath();
          ctx.arc(x + w / 2, y + h / 2, 8, 0, Math.PI * 2);
          ctx.fillStyle = status === 'Present' ? presentColor : absentColor;
          ctx.fill();
        } else {
          drawText('-', x + w / 2, y + h / 2, w - 24, { color: muted, size: 14, weight: 600 });
        }
        x += w;
      });

      if (includeSummary) {
        const summaryW = columnWidths[columnWidths.length - 1] || 150;
        drawCell(x, y, summaryW, h, surface);
        const pillW = Math.min(summaryW - 20, 118);
        const pillH = 26;
        const pillX = x + (summaryW - pillW) / 2;
        const pillY = y + (h - pillH) / 2;
        ctx.fillStyle = surfaceWarm;
        ctx.strokeStyle = border;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 13);
        ctx.fill();
        ctx.stroke();
        drawText(row.summary, x + summaryW / 2, y + h / 2, pillW - 12, { size: 12, weight: 700 });
      }

      y += h;
    });

    canvas.toBlob(blob => {
      if (!blob) {
        showAlertDialog('Export Failed', 'Could not create the JPG export.');
        return;
      }
      const filename = getExportFilename(data.prog ? data.prog.name : '', 'jpg');
      downloadBlob(blob, filename);
      showToast('JPG export downloaded');
    }, 'image/jpeg', 0.95);
  }

  function escapeXml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function columnName(index) {
    let name = '';
    let n = index + 1;
    while (n > 0) {
      const remainder = (n - 1) % 26;
      name = String.fromCharCode(65 + remainder) + name;
      n = Math.floor((n - 1) / 26);
    }
    return name;
  }

  function createSheetXml(data, options = {}) {
    const includeSummary = options.includeSummary !== false;
    const header = ['Attendee', ...data.sessions.map(s => formatDateLabel(s.date))];
    if (includeSummary) {
      header.push('Attendance Summary');
    }

    const rows = [
      header,
      ...data.rows.map(row => {
        const r = [row.participantNameWithNum || row.participant.name, ...row.statuses];
        if (includeSummary) {
          r.push(row.summary);
        }
        return r;
      })
    ];

    const sheetRows = rows.map((row, rowIndex) => {
      const cells = row.map((value, colIndex) => {
        const ref = `${columnName(colIndex)}${rowIndex + 1}`;
        return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
      }).join('');
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`;
  }

  function crc32(bytes) {
    if (!crc32.table) {
      crc32.table = Array.from({ length: 256 }, (_, n) => {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        return c >>> 0;
      });
    }
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = crc32.table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function uint16(value) {
    return [value & 0xff, (value >>> 8) & 0xff];
  }

  function uint32(value) {
    return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
  }

  function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    parts.forEach(part => {
      output.set(part, offset);
      offset += part.length;
    });
    return output;
  }

  function createZip(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach(file => {
      const nameBytes = encoder.encode(file.name);
      const dataBytes = encoder.encode(file.content);
      const crc = crc32(dataBytes);

      const localHeader = new Uint8Array([
        ...uint32(0x04034b50), ...uint16(20), ...uint16(0x0800), ...uint16(0),
        ...uint16(0), ...uint16(0), ...uint32(crc), ...uint32(dataBytes.length),
        ...uint32(dataBytes.length), ...uint16(nameBytes.length), ...uint16(0)
      ]);
      localParts.push(localHeader, nameBytes, dataBytes);

      const centralHeader = new Uint8Array([
        ...uint32(0x02014b50), ...uint16(20), ...uint16(20), ...uint16(0x0800),
        ...uint16(0), ...uint16(0), ...uint16(0), ...uint32(crc),
        ...uint32(dataBytes.length), ...uint32(dataBytes.length), ...uint16(nameBytes.length),
        ...uint16(0), ...uint16(0), ...uint16(0), ...uint16(0), ...uint32(0),
        ...uint32(offset)
      ]);
      centralParts.push(centralHeader, nameBytes);
      offset += localHeader.length + nameBytes.length + dataBytes.length;
    });

    const localData = concatBytes(localParts);
    const centralData = concatBytes(centralParts);
    const endRecord = new Uint8Array([
      ...uint32(0x06054b50), ...uint16(0), ...uint16(0), ...uint16(files.length),
      ...uint16(files.length), ...uint32(centralData.length), ...uint32(localData.length),
      ...uint16(0)
    ]);

    return concatBytes([localData, centralData, endRecord]);
  }

  function exportVisibleAttendanceAsXlsx() {
    const options = getExportOptions();
    const data = getVisibleAttendanceMatrixData(options);
    if (!data || data.participants.length === 0 || data.sessions.length === 0) {
      showAlertDialog('Nothing to Export', 'The currently visible attendance table has no exportable rows.');
      return;
    }

    const files = [
      {
        name: '[Content_Types].xml',
        content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'
      },
      {
        name: '_rels/.rels',
        content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
      },
      {
        name: 'xl/workbook.xml',
        content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Attendance" sheetId="1" r:id="rId1"/></sheets></workbook>'
      },
      {
        name: 'xl/_rels/workbook.xml.rels',
        content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'
      },
      {
        name: 'xl/worksheets/sheet1.xml',
        content: createSheetXml(data, options)
      }
    ];

    const zipBytes = createZip(files);
    const blob = new Blob([zipBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = getExportFilename(data.prog ? data.prog.name : '', 'xlsx');
    downloadBlob(blob, filename);
    showToast('XLSX export downloaded');
  }

  function formatFullDateLabel(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const year = parseInt(parts[0], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[monthIndex]} ${year}`;
  }

  function buildVisibleAttendanceWhatsAppMessage(data) {
    const session = data.sessions[0];
    const lines = [
      `The attendance for ${data.prog.name} for ${formatFullDateLabel(session.date)} is as follows`,
      ''
    ];

    data.rows.forEach(row => {
      const status = row.statuses[0] === 'Present' ? '🟢 Present' : row.statuses[0] === 'Absent' ? '🔴 Absent' : 'Not Recorded';
      lines.push(`${row.participantNameWithNum || row.participant.name}  ${status}`);
    });

    return lines.join('\n');
  }

  function copyTextToClipboard(text, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast(successMessage));
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    showToast(successMessage);
  }

  function copyVisibleAttendanceWhatsAppMessage() {
    const data = getVisibleAttendanceMatrixData();
    if (!data || data.sessions.length !== 1) {
      showAlertDialog('Single Date Required', 'Filter the table to one visible attendance date before copying a WhatsApp message.');
      return;
    }

    copyTextToClipboard(buildVisibleAttendanceWhatsAppMessage(data), 'WhatsApp attendance copied');
  }

  function deleteAttendanceSession(date) {
    const prog = attendanceData.programs.find(p => p.id === attCurrentActiveProgramId);
    if (!prog) return;

    showConfirmDialog({
      title: 'Delete Attendance Session',
      message: `Are you sure you want to delete the attendance session recorded for ${formatDateLabel(date)}?`,
      confirmText: 'Delete Session',
      cancelText: 'Cancel',
      isDanger: true
    }).then(confirmed => {
      if (confirmed) {
        prog.sessions = prog.sessions.filter(s => s.date !== date);
        saveAttendanceDataToStorage();
        renderAttMatrixTable();
        showToast('Attendance session deleted');
      }
    });
  }

  // --- SCREEN 4: ADD / EDIT ATTENDANCE SESSION ---
  function openRecordSession(sessionDate = null, updateHash = true) {
    if (updateHash && attCurrentActiveProgramId) {
      const route = sessionDate 
        ? `#/attendance/record?id=${attCurrentActiveProgramId}&date=${sessionDate}`
        : `#/attendance/record?id=${attCurrentActiveProgramId}`;
      navigateToRoute(route);
    }
    attEditingSessionDate = sessionDate;
    if (typeof attRecordSearchQuery === 'undefined') {
      window.attRecordSearchQuery = '';
    } else {
      attRecordSearchQuery = '';
    }

    const prog = attendanceData.programs.find(p => p.id === attCurrentActiveProgramId);
    if (!prog) return;

    const titleEl = document.getElementById('attRecordSessionTitle');
    const subtitleEl = document.getElementById('attRecordSessionSubtitle');
    const dateInput = document.getElementById('attSessionDate');
    const searchInput = document.getElementById('attRecordSearchInput');

    if (searchInput) searchInput.value = '';

    const todayStr = getTodayISOString();

    if (sessionDate) {
      if (titleEl) titleEl.textContent = 'Edit Attendance Session';
      if (subtitleEl) subtitleEl.textContent = `Modify attendance status for ${formatDateLabel(sessionDate)}`;
      if (dateInput) dateInput.value = sessionDate;

      // Load existing records
      const existingSession = prog.sessions ? prog.sessions.find(s => s.date === sessionDate) : null;
      attRecordRosterDraft = {};
      prog.participants.forEach(p => {
        attRecordRosterDraft[p.id] = (existingSession && existingSession.records && existingSession.records[p.id]) ? existingSession.records[p.id] : 'present';
      });
    } else {
      if (titleEl) titleEl.textContent = 'Add Attendance';
      if (subtitleEl) subtitleEl.textContent = 'Mark each participant as Present or Absent';
      if (dateInput) dateInput.value = todayStr;

      // Requirement: All participants should be marked Present by default for a new attendance session.
      attRecordRosterDraft = {};
      prog.participants.forEach(p => {
        attRecordRosterDraft[p.id] = 'present';
      });
    }

    renderAttRecordRoster();
    showAttScreen('att-screen-record-session');

    // Save baseline state for unsaved changes protection
    attRecordInitialDate = dateInput ? dateInput.value : '';
    attRecordInitialRoster = JSON.parse(JSON.stringify(attRecordRosterDraft));
  }

  function renderAttRecordRoster() {
    const prog = attendanceData.programs.find(p => p.id === attCurrentActiveProgramId);
    const container = document.getElementById('attRecordRosterList');
    if (!prog || !container) return;

    let searchQ = (typeof attRecordSearchQuery !== 'undefined' && attRecordSearchQuery) ? attRecordSearchQuery : '';
    let filtered = prog.participants || [];
    if (searchQ.trim() !== '') {
      const q = searchQ.toLowerCase().trim();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--muted);">No participants found matching "${escapeHtml(searchQ)}".</div>`;
      return;
    }

    container.innerHTML = filtered.map((p, index) => {
      const origIndex = (prog.participants || []).findIndex(item => item.id === p.id);
      const rollNo = getParticipantRollNo(p, origIndex >= 0 ? origIndex + 1 : index + 1);
      const status = attRecordRosterDraft[p.id] || 'present';
      const isPresent = status === 'present';

      return `
        <div class="att-record-item" data-id="${p.id}">
          <span class="participant-name">${escapeHtml(rollNo)}. ${escapeHtml(p.name)}</span>
          <button type="button" class="att-toggle-btn ${isPresent ? 'present' : 'absent'}" data-id="${p.id}">
            <span class="dot-icon">${isPresent ? '🟢' : '🔴'}</span>
            <span>${isPresent ? 'Present' : 'Absent'}</span>
          </button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.att-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const current = attRecordRosterDraft[id] || 'present';
        attRecordRosterDraft[id] = current === 'present' ? 'absent' : 'present';
        renderAttRecordRoster();
      });
    });
  }

  function saveAttendanceSession() {
    const prog = attendanceData.programs.find(p => p.id === attCurrentActiveProgramId);
    if (!prog) return;

    const dateInput = document.getElementById('attSessionDate');
    const targetDate = dateInput ? dateInput.value : '';

    if (!targetDate) {
      showToast('Please select a valid date');
      return;
    }

    if (!prog.sessions) prog.sessions = [];

    // Check if session already exists for targetDate
    const existingIndex = prog.sessions.findIndex(s => s.date === targetDate);

    // Block duplicate sessions on the same day when creating a new session or selecting an existing date
    if (existingIndex !== -1 && attEditingSessionDate !== targetDate) {
      showAlertDialog(
        'Attendance Already Recorded',
        `An attendance session for ${formatDateLabel(targetDate)} has already been recorded in "${prog.name}". Duplicate entries on the same date are not allowed. Please select a different date or edit the existing session from the matrix.`
      );
      return;
    }

    if (existingIndex !== -1) {
      // Overwrite/update existing session
      prog.sessions[existingIndex].records = JSON.parse(JSON.stringify(attRecordRosterDraft));
    } else {
      // Create new session
      prog.sessions.push({
        id: 'sess_' + Date.now(),
        date: targetDate,
        records: JSON.parse(JSON.stringify(attRecordRosterDraft))
      });
    }

    saveAttendanceDataToStorage();
    showToast('Attendance saved!');

    // Reset unsaved changes dirty baseline flags
    attRecordInitialDate = null;
    attRecordInitialRoster = null;

    renderAttMatrixTable();
    showAttScreen('att-screen-matrix');
  }

  // Helper Utility Functions for Dates
  function getTodayISOString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateLabel(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${months[monthIndex]}`;
      }
    } catch (e) {
      console.error(e);
    }
    return dateStr;
  }

  function handleAttMainBackClick() {
    const activeScreen = document.querySelector('.att-screen.active');
    const screenId = activeScreen ? activeScreen.id : 'att-screen-programs';

    if (screenId === 'att-screen-programs') {
      openDashboard();
    } else if (screenId === 'att-screen-program-form' || screenId === 'att-screen-matrix') {
      openAttendanceApp();
    } else if (screenId === 'att-screen-record-session') {
      confirmUnsavedAttendanceChanges().then(confirmed => {
        if (confirmed) {
          attRecordInitialDate = null;
          attRecordInitialRoster = null;
          if (attCurrentActiveProgramId) {
            openProgramMatrix(attCurrentActiveProgramId);
          } else {
            openAttendanceApp();
          }
        }
      });
    } else {
      openDashboard();
    }
  }

  // --- ATTENDANCE EVENT LISTENERS SETUP ---
  function setupAttendanceEventListeners() {
    // Tile & Navigation
    if (tileAttendanceApp) {
      tileAttendanceApp.addEventListener('click', openAttendanceApp);
    }

    if (attBackToDashboardBtn) {
      attBackToDashboardBtn.addEventListener('click', handleAttMainBackClick);
    }

    // Screen 1: Programs list
    const createProgBtn = document.getElementById('attCreateProgramBtn');
    if (createProgBtn) {
      createProgBtn.addEventListener('click', () => openProgramForm(null));
    }

    // Screen 2: Program Form
    const cancelFormBtn = document.getElementById('attCancelProgramFormBtn');
    const cancelFormBtn2 = document.getElementById('attCancelProgramFormBtn2');
    if (cancelFormBtn) cancelFormBtn.addEventListener('click', () => openAttendanceApp());
    if (cancelFormBtn2) cancelFormBtn2.addEventListener('click', () => openAttendanceApp());

    const addParticipantBtn = document.getElementById('attAddParticipantBtn');
    if (addParticipantBtn) {
      addParticipantBtn.addEventListener('click', handleAddParticipantFromInput);
    }

    const newParticipantRollNoInput = document.getElementById('attNewParticipantRollNo');
    if (newParticipantRollNoInput) {
      newParticipantRollNoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddParticipantFromInput();
        }
      });
    }

    const newParticipantInput = document.getElementById('attNewParticipantInput');
    if (newParticipantInput) {
      newParticipantInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddParticipantFromInput();
        }
      });
    }

    const programForm = document.getElementById('attProgramForm');
    if (programForm) {
      programForm.addEventListener('submit', saveProgramForm);
    }

    // Screen 3: Matrix Dashboard & Date Filtering Controls
    const segmentedBtns = document.querySelectorAll('.segmented-btn');
    segmentedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode) {
          attViewMode = mode;
          updateDateFilterUI();
          renderAttMatrixTable();
        }
      });
    });

    const prevDateBtn = document.getElementById('attDateNavPrevBtn');
    if (prevDateBtn) {
      prevDateBtn.addEventListener('click', () => handleDateNav(-1));
    }

    const nextDateBtn = document.getElementById('attDateNavNextBtn');
    if (nextDateBtn) {
      nextDateBtn.addEventListener('click', () => handleDateNav(1));
    }

    const dateNavInput = document.getElementById('attDateNavInput');
    if (dateNavInput) {
      dateNavInput.addEventListener('change', (e) => {
        if (e.target.value) {
          attAnchorDate = new Date(e.target.value + 'T00:00:00');
          renderAttMatrixTable();
        }
      });
    }

    const customFromInput = document.getElementById('attCustomFromInput');
    if (customFromInput) {
      customFromInput.addEventListener('change', (e) => {
        if (e.target.value) {
          attCustomFromDate = e.target.value;
          renderAttMatrixTable();
        }
      });
    }

    const customToInput = document.getElementById('attCustomToInput');
    if (customToInput) {
      customToInput.addEventListener('change', (e) => {
        if (e.target.value) {
          attCustomToDate = e.target.value;
          renderAttMatrixTable();
        }
      });
    }

    const resetDateFilterBtn = document.getElementById('attResetDateFilterBtn');
    if (resetDateFilterBtn) {
      resetDateFilterBtn.addEventListener('click', () => {
        attAnchorDate = new Date();
        updateDateFilterUI();
        renderAttMatrixTable();
        showToast('Reset date filter to current date range');
      });
    }

    const recordAttBtn = document.getElementById('attRecordAttendanceBtn');
    if (recordAttBtn) {
      recordAttBtn.addEventListener('click', () => openRecordSession(null));
    }

    const matrixSearchInput = document.getElementById('attMatrixSearchInput');
    if (matrixSearchInput) {
      matrixSearchInput.addEventListener('input', (e) => {
        attMatrixSearchQuery = e.target.value;
        renderAttMatrixTable();
      });
    }

    const exportMatrixBtn = document.getElementById('attExportMatrixBtn');
    if (exportMatrixBtn) {
      exportMatrixBtn.addEventListener('click', openAttendanceExportDialog);
    }

    const exportModal = document.getElementById('attExportModal');
    if (exportModal) {
      exportModal.addEventListener('click', (e) => {
        if (e.target === exportModal) closeAttendanceExportDialog();
      });
    }

    const includeSummaryInput = document.getElementById('attExportIncludeSummary');
    if (includeSummaryInput) {
      includeSummaryInput.addEventListener('change', updateExportModalMessage);
    }

    const fillMissingDatesInput = document.getElementById('attExportFillMissingDates');
    if (fillMissingDatesInput) {
      fillMissingDatesInput.addEventListener('change', updateExportModalMessage);
    }

    const cancelExportBtn = document.getElementById('attCancelExportBtn');
    if (cancelExportBtn) {
      cancelExportBtn.addEventListener('click', closeAttendanceExportDialog);
    }

    const exportJpgBtn = document.getElementById('attExportJpgBtn');
    if (exportJpgBtn) {
      exportJpgBtn.addEventListener('click', async () => {
        closeAttendanceExportDialog();
        try {
          await exportVisibleAttendanceAsJpg();
        } catch (error) {
          console.error(error);
          showAlertDialog('Export Failed', 'Could not create the JPG export.');
        }
      });
    }

    const exportXlsxBtn = document.getElementById('attExportXlsxBtn');
    if (exportXlsxBtn) {
      exportXlsxBtn.addEventListener('click', () => {
        closeAttendanceExportDialog();
        exportVisibleAttendanceAsXlsx();
      });
    }

    const copyWhatsAppBtn = document.getElementById('attCopyWhatsAppBtn');
    if (copyWhatsAppBtn) {
      copyWhatsAppBtn.addEventListener('click', () => {
        closeAttendanceExportDialog();
        copyVisibleAttendanceWhatsAppMessage();
      });
    }

    // Screen 4: Record Attendance
    const cancelRecordBtn2 = document.getElementById('attCancelRecordSessionBtn2');
    if (cancelRecordBtn2) {
      cancelRecordBtn2.addEventListener('click', () => {
        confirmUnsavedAttendanceChanges().then(confirmed => {
          if (confirmed) {
            attRecordInitialDate = null;
            attRecordInitialRoster = null;
            if (attCurrentActiveProgramId) {
              openProgramMatrix(attCurrentActiveProgramId);
            } else {
              showAttScreen('att-screen-matrix');
            }
          }
        });
      });
    }

    // Page Refresh / Tab Close Protection for Unsaved Attendance Changes
    window.addEventListener('beforeunload', (e) => {
      if (isAttRecordSessionDirty()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved attendance changes. Do you want to continue?';
        return e.returnValue;
      }
    });

    const markAllPresentBtn = document.getElementById('attMarkAllPresentBtn');
    if (markAllPresentBtn) {
      markAllPresentBtn.addEventListener('click', () => {
        Object.keys(attRecordRosterDraft).forEach(id => attRecordRosterDraft[id] = 'present');
        renderAttRecordRoster();
      });
    }

    const markAllAbsentBtn = document.getElementById('attMarkAllAbsentBtn');
    if (markAllAbsentBtn) {
      markAllAbsentBtn.addEventListener('click', () => {
        Object.keys(attRecordRosterDraft).forEach(id => attRecordRosterDraft[id] = 'absent');
        renderAttRecordRoster();
      });
    }

    const recordSearchInput = document.getElementById('attRecordSearchInput');
    if (recordSearchInput) {
      recordSearchInput.addEventListener('input', (e) => {
        attRecordSearchQuery = e.target.value;
        renderAttRecordRoster();
      });
    }

    const saveSessionBtn = document.getElementById('attSaveSessionBtn');
    if (saveSessionBtn) {
      saveSessionBtn.addEventListener('click', saveAttendanceSession);
    }
  }

  // --- IN-APP CONFIRMATION & ALERT MODAL ENGINE ---
  const confirmModal = document.getElementById('confirmModal');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMessage = document.getElementById('confirmMessage');
  const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
  const okConfirmBtn = document.getElementById('okConfirmBtn');

  function showConfirmDialog(options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Confirm Action',
        message = 'Are you sure you want to proceed?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        isDanger = true
      } = options;

      if (!confirmModal || !confirmTitle || !confirmMessage || !okConfirmBtn || !cancelConfirmBtn) {
        resolve(window.confirm(message));
        return;
      }

      confirmTitle.textContent = title;
      confirmMessage.textContent = message;
      okConfirmBtn.textContent = confirmText;
      cancelConfirmBtn.textContent = cancelText;

      if (isDanger) {
        okConfirmBtn.className = 'btn btn-primary';
      } else {
        okConfirmBtn.className = 'btn btn-secondary';
      }

      cancelConfirmBtn.style.display = cancelText ? 'inline-flex' : 'none';

      const cleanup = () => {
        if (document.activeElement && confirmModal.contains(document.activeElement)) {
          document.activeElement.blur();
        }
        confirmModal.classList.remove('active');
        confirmModal.setAttribute('aria-hidden', 'true');
        confirmModal.inert = true;

        okConfirmBtn.removeEventListener('click', onConfirm);
        cancelConfirmBtn.removeEventListener('click', onCancel);
        confirmModal.removeEventListener('click', onOverlayClick);
      };

      const onConfirm = () => {
        cleanup();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      const onOverlayClick = (e) => {
        if (e.target === confirmModal) {
          cleanup();
          resolve(false);
        }
      };

      okConfirmBtn.addEventListener('click', onConfirm);
      cancelConfirmBtn.addEventListener('click', onCancel);
      confirmModal.addEventListener('click', onOverlayClick);

      confirmModal.inert = false;
      confirmModal.classList.add('active');
      confirmModal.removeAttribute('aria-hidden');

      setTimeout(() => {
        okConfirmBtn.focus();
      }, 50);
    });
  }

  function showAlertDialog(title, message) {
    return showConfirmDialog({
      title: title || 'Notice',
      message: message || '',
      confirmText: 'OK',
      cancelText: null,
      isDanger: false
    });
  }

  function showPromptDialog(options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Enter Input',
        message = 'Please enter details:',
        defaultValue = '',
        confirmText = 'Save',
        cancelText = 'Cancel'
      } = options;

      const promptModal = document.getElementById('promptModal');
      const promptTitle = document.getElementById('promptTitle');
      const promptMessage = document.getElementById('promptMessage');
      const promptInput = document.getElementById('promptInput');
      const promptForm = document.getElementById('promptForm');
      const cancelPromptBtn = document.getElementById('cancelPromptBtn');
      const okPromptBtn = document.getElementById('okPromptBtn');

      if (!promptModal || !promptInput) {
        const res = window.prompt(message, defaultValue);
        resolve(res);
        return;
      }

      if (promptTitle) promptTitle.textContent = title;
      if (promptMessage) promptMessage.textContent = message;
      if (promptInput) promptInput.value = defaultValue;
      if (okPromptBtn) okPromptBtn.textContent = confirmText;
      if (cancelPromptBtn) cancelPromptBtn.textContent = cancelText;

      const cleanup = () => {
        promptModal.classList.remove('active');
        promptModal.setAttribute('aria-hidden', 'true');
        promptModal.inert = true;
        promptForm.removeEventListener('submit', onSubmit);
        cancelPromptBtn.removeEventListener('click', onCancel);
        promptModal.removeEventListener('click', onOverlayClick);
      };

      const onSubmit = (e) => {
        e.preventDefault();
        const val = promptInput.value.trim();
        cleanup();
        resolve(val);
      };

      const onCancel = () => {
        cleanup();
        resolve(null);
      };

      const onOverlayClick = (e) => {
        if (e.target === promptModal) {
          cleanup();
          resolve(null);
        }
      };

      promptForm.addEventListener('submit', onSubmit);
      cancelPromptBtn.addEventListener('click', onCancel);
      promptModal.addEventListener('click', onOverlayClick);

      promptModal.inert = false;
      promptModal.classList.add('active');
      promptModal.removeAttribute('aria-hidden');

      setTimeout(() => {
        promptInput.focus();
        promptInput.select();
      }, 50);
    });
  }

  function showParticipantEditModal(options = {}) {
    return new Promise((resolve) => {
      const {
        rollNo = '',
        name = ''
      } = options;

      const modal = document.getElementById('attParticipantModal');
      const rollNoInput = document.getElementById('attEditParticipantRollNo');
      const nameInput = document.getElementById('attEditParticipantName');
      const form = document.getElementById('attParticipantForm');
      const cancelBtn = document.getElementById('attCancelParticipantModalBtn');

      if (!modal || !form || !rollNoInput || !nameInput) {
        const newName = window.prompt('Enter attendee name:', name);
        if (newName !== null) {
          const newRoll = window.prompt('Enter roll number:', rollNo) || rollNo;
          resolve({ name: newName.trim(), rollNo: newRoll.trim() });
        } else {
          resolve(null);
        }
        return;
      }

      rollNoInput.value = rollNo;
      nameInput.value = name;

      modal.inert = false;
      modal.classList.add('active');
      modal.removeAttribute('aria-hidden');

      setTimeout(() => {
        nameInput.focus();
        nameInput.select();
      }, 50);

      const cleanup = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        modal.inert = true;
        form.removeEventListener('submit', onSubmit);
        cancelBtn.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onOverlayClick);
      };

      const onSubmit = (e) => {
        e.preventDefault();
        const rVal = rollNoInput.value.trim();
        const nVal = nameInput.value.trim();
        if (!nVal) return;
        cleanup();
        resolve({ rollNo: rVal || rollNo, name: nVal });
      };

      const onCancel = () => {
        cleanup();
        resolve(null);
      };

      const onOverlayClick = (e) => {
        if (e.target === modal) {
          cleanup();
          resolve(null);
        }
      };

      form.addEventListener('submit', onSubmit);
      cancelBtn.addEventListener('click', onCancel);
      modal.addEventListener('click', onOverlayClick);
    });
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    setupViewNavigation();

    // Theme toggle
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Hashchange and popstate listener for SPA Router & Back button navigation
    window.addEventListener('popstate', () => {
      handleRoute(window.location.hash);
    });

    window.addEventListener('hashchange', () => {
      if (checkUrlForSecretPreset()) {
        openGlimpseApp();
        applyTimetableForDate(selectedDate);
        renderAll();
      } else {
        handleRoute(window.location.hash);
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
    if (reapplyTimetableBtn) {
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
    }

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
    resetTimetableBtn.addEventListener('click', async () => {
      const confirmed = await showConfirmDialog({
        title: 'Reset Timetable',
        message: 'Reset timetable schedule to original 8-period defaults?',
        confirmText: 'Reset Schedule'
      });

      if (confirmed) {
        timetable = JSON.parse(JSON.stringify(GENERIC_DEFAULT_TIMETABLE));
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
    clearNotesBtn.addEventListener('click', async () => {
      const confirmed = await showConfirmDialog({
        title: 'Clear Today\'s Notes',
        message: 'Are you sure you want to clear all notes for today?',
        confirmText: 'Clear Notes'
      });

      if (confirmed) {
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
    subjectsManagerListEl.addEventListener('click', async (e) => {
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
        const targetSub = subjects.find(s => s.id === subId);
        const subName = targetSub ? targetSub.name : 'this subject';

        const confirmed = await showConfirmDialog({
          title: 'Delete Subject',
          message: `Are you sure you want to delete ${subName}?`,
          confirmText: 'Delete Subject'
        });

        if (confirmed) {
          subjects = subjects.filter(s => s.id !== subId);
          
          saveSubjectsToStorage();
          renderAll();
          showToast('Subject deleted');
        }
      }
    });

    // Reset Defaults
    resetDefaultsBtn.addEventListener('click', async () => {
      const confirmed = await showConfirmDialog({
        title: 'Reset All Defaults',
        message: 'Reset subjects and timetable to original default settings?',
        confirmText: 'Reset Defaults'
      });

      if (confirmed) {
        subjects = JSON.parse(JSON.stringify(GENERIC_DEFAULT_SUBJECTS));
        timetable = JSON.parse(JSON.stringify(GENERIC_DEFAULT_TIMETABLE));
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

    subjectModal.inert = false;
    subjectModal.classList.add('active');
    subjectModal.removeAttribute('aria-hidden');
    subName.focus();
  }

  function closeSubjectModal() {
    if (document.activeElement && subjectModal.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    subjectModal.classList.remove('active');
    subjectModal.setAttribute('aria-hidden', 'true');
    subjectModal.inert = true;
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
      showAlertDialog('Copy Notice', 'Failed to copy message automatically. Please select text and copy manually.');
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
