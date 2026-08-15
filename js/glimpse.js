// Glimpse Timetable, Notes & WhatsApp Generator Engine Module
(function(window) {
  'use strict';

  // State Variables
  let subjects = [];
  let timetable = {}; // Day -> array of 8 subjectIds
  let currentNotes = {}; // slotKey -> string
  let currentEnabled = {}; // slotKey -> boolean
  let selectedDate = new Date();
  let selectedEditorDay = 'Monday';
  let classAndDiv = '2G';
  let currentDayEmoji = '🪂';

  // --- LOCAL STORAGE HELPERS ---
  function loadStateFromStorage() {
    try {
      const classDivInput = document.getElementById('classDiv');

      const savedSubjects = localStorage.getItem('glimpse_subjects_v10');
      if (savedSubjects) {
        subjects = JSON.parse(savedSubjects);
        if (Array.isArray(subjects)) {
          subjects.forEach(s => {
            const iconVal = (typeof s.icon === 'string' && s.icon.trim()) ? s.icon : ((typeof s.emoji === 'string' && s.emoji.trim()) ? s.emoji : '📖');
            s.icon = iconVal;
            s.emoji = iconVal;
          });
        }
      } else {
        subjects = JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_SUBJECTS || []));
      }

      const savedTimetable = localStorage.getItem('glimpse_timetable_v10');
      if (savedTimetable) {
        timetable = JSON.parse(savedTimetable);
      } else {
        timetable = JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_TIMETABLE || {}));
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
    } catch (e) {
      console.error('Error loading storage:', e);
      subjects = JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_SUBJECTS || []));
      timetable = JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_TIMETABLE || {}));
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

  // --- TIMETABLE ENGINE ---
  function getSlotKey(slotIndex) {
    return `slot_${slotIndex}`;
  }

  function applyTimetableForDate(dateObj) {
    const days = window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dateObj.getDay()];
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
        if (typeof window.showToast === 'function') window.showToast('Pasted notes from clipboard! 📋');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
      const fallbackText = prompt('Paste your copied notes text below:');
      if (fallbackText !== null && fallbackText !== undefined) {
        textareaEl.value = fallbackText;
        currentNotes[slotKey] = fallbackText;
        saveNotesToStorage();
        renderWhatsAppPreview();
        if (typeof window.showToast === 'function') window.showToast('Pasted notes! 📋');
      }
    }
  }

  function clearBlockNotes(slotKey, textareaEl) {
    textareaEl.value = '';
    currentNotes[slotKey] = '';
    saveNotesToStorage();
    renderWhatsAppPreview();
    if (typeof window.showToast === 'function') window.showToast('Cleared notes for block! 🧹');
  }

  // --- DATE & KEYCAP FORMATTING ---
  function setupDatePicker() {
    const glimpseDateInput = document.getElementById('glimpseDate');
    const days = window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    if (glimpseDateInput) glimpseDateInput.value = `${yyyy}-${mm}-${dd}`;
    selectedDate = today;
    selectedEditorDay = days[today.getDay()];
  }

  function getFormattedKeycapDate(dateObj) {
    const emojis = window.KEYCAP_EMOJIS || {};
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = String(dateObj.getFullYear());

    const toKeycap = (str) => {
      let res = '';
      for (let char of str) {
        res += emojis[char] || char;
      }
      return res;
    };

    const ddKeycap = toKeycap(dd);
    const mmKeycap = toKeycap(mm);
    const yyyyKeycap = toKeycap(yyyy);

    return `📆 ${ddKeycap}-${mmKeycap}-${yyyyKeycap}`;
  }

  function applyRandomDayEmojiOnRefresh() {
    const emojis = window.RANDOM_HEADER_EMOJIS_100 || ['🪂'];
    const randomIndex = Math.floor(Math.random() * emojis.length);
    currentDayEmoji = emojis[randomIndex];
  }

  function applyRandomTitleEmojiOnRefresh() {
    const headerEmojiInput = document.getElementById('headerEmoji');
    if (!headerEmojiInput) return;

    const manualOverride = localStorage.getItem('glimpse_manual_title_override_v11');
    if (manualOverride && manualOverride.trim() !== '') {
      headerEmojiInput.value = manualOverride.trim();
    } else {
      const emojis = window.RANDOM_HEADER_EMOJIS_100 || ['🪁'];
      const randomIndex = Math.floor(Math.random() * emojis.length);
      const freshRandomEmoji = emojis[randomIndex];
      headerEmojiInput.value = freshRandomEmoji;
    }
  }

  function getFormattedDayOfWeek(dateObj) {
    const days = window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dateObj.getDay()];
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
    const days = window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[selectedDate.getDay()];
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const yyyy = String(selectedDate.getFullYear());

    const todayFormattedDateEl = document.getElementById('todayFormattedDate');
    const todayFormattedDayEl = document.getElementById('todayFormattedDay');

    if (todayFormattedDateEl) {
      todayFormattedDateEl.textContent = `${dd} / ${mm} / ${yyyy}`;
    }
    if (todayFormattedDayEl) {
      todayFormattedDayEl.textContent = dayName;
    }
  }

  function getActiveDaySlots() {
    const days = window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[selectedDate.getDay()];
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
    const subjectEntryListEl = document.getElementById('subjectEntryList');
    const activeCountBadgeEl = document.getElementById('activeCountBadge');
    if (!subjectEntryListEl) return;

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
      if (activeCountBadgeEl) activeCountBadgeEl.textContent = '0';
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
      const iconVal = subject.icon || subject.emoji || '📖';

      card.innerHTML = `
        <div class="card-top">
          <div class="subject-header-info">
            <span class="badge-box">${subject.badge || '🟦'}</span>
            <div class="subject-title-wrap">
              <span class="subject-title">${iconVal} ${window.escapeHtml(subject.name)}</span>
              ${subject.suffix ? `<span class="subject-suffix">${window.escapeHtml(subject.suffix)}</span>` : ''}
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
          >${window.escapeHtml(slot.notes)}</textarea>
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

    if (activeCountBadgeEl) activeCountBadgeEl.textContent = activeCount;
  }

  function renderSubjectManagerCards() {
    const subjectsManagerListEl = document.getElementById('subjectsManagerList');
    if (!subjectsManagerListEl) return;

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
      const iconVal = (typeof subject.icon === 'string' && subject.icon.trim()) ? subject.icon : ((typeof subject.emoji === 'string' && subject.emoji.trim()) ? subject.emoji : '📖');
      subject.icon = iconVal;
      subject.emoji = iconVal;

      card.innerHTML = `
        <div class="manager-left">
          <span class="badge-box">${subject.badge || '🟦'}</span>
          <div>
            <div class="subject-title">${iconVal} ${window.escapeHtml(subject.name)}</div>
            ${subject.suffix ? `<span class="subject-suffix">${window.escapeHtml(subject.suffix)}</span>` : ''}
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
    const daySelectorPills = document.getElementById('daySelectorPills');
    const currentEditorDayTitle = document.getElementById('currentEditorDayTitle');
    const daySubjectCount = document.getElementById('daySubjectCount');
    const timetablePeriodSlots = document.getElementById('timetablePeriodSlots');

    if (!daySelectorPills || !timetablePeriodSlots) return;

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

    if (currentEditorDayTitle) currentEditorDayTitle.textContent = `${selectedEditorDay} Schedule (8 Periods)`;

    const periodSubjectIds = timetable[selectedEditorDay] || [];
    if (daySubjectCount) daySubjectCount.textContent = `${periodSubjectIds.length} Period Slots`;

    timetablePeriodSlots.innerHTML = '';

    for (let i = 0; i < 8; i++) {
      const currentSubId = periodSubjectIds[i] || '';
      
      const slotCard = document.createElement('div');
      slotCard.className = 'period-slot-card';

      let optionsHtml = `<option value="">-- Free / No Class --</option>`;
      subjects.forEach(sub => {
        const fullName = sub.suffix ? `${sub.name} ${sub.suffix}` : sub.name;
        const selected = sub.id === currentSubId ? 'selected' : '';
        const iconVal = sub.icon || sub.emoji || '📖';
        optionsHtml += `<option value="${sub.id}" ${selected}>${sub.badge || '🟦'} ${iconVal} ${window.escapeHtml(fullName)}</option>`;
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
    const classDivInput = document.getElementById('classDiv');
    const headerEmojiInput = document.getElementById('headerEmoji');

    const keycapDateStr = getFormattedKeycapDate(selectedDate);
    const dayStr = getFormattedDayOfWeek(selectedDate);
    const classDivStr = (classDivInput && classDivInput.value.trim()) || '2G';
    const titleEmoji = headerEmojiInput ? (headerEmojiInput.value.trim() || '🪁') : '🪁';

    const lines = [];

    // Title line with custom header emojis
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
      const iconVal = subject.icon || subject.emoji || '📖';
      
      const subjectHeader = `${subject.badge || '🟦'}${itemNumber}. *_${iconVal}${fullName}_*`;
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
    const whatsappOutputTextEl = document.getElementById('whatsappOutputText');
    if (!whatsappOutputTextEl) return;
    const message = generateWhatsAppMessage();
    whatsappOutputTextEl.textContent = message;
  }

  function updateTimeStamp() {
    const waTimeStampEl = document.getElementById('waTimeStamp');
    if (!waTimeStampEl) return;
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
        const targetPane = document.getElementById(targetTab);
        if (targetPane) targetPane.classList.add('active');

        if (targetTab === 'tab-preview') {
          renderWhatsAppPreview();
          updateTimeStamp();
        }

        const subName = targetTab.replace('tab-', '');
        if (typeof window.navigateToRoute === 'function') {
          window.navigateToRoute('#/glimpse/' + subName);
        }
      });
    });
  }

  // --- SECRET URL PRESET DETECTOR ---
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
        if (typeof window.loadPresetENG === 'function') {
          window.loadPresetENG();
        }
        return true;
      }
    } catch (e) {
      console.error('URL parse error:', e);
    }
    return false;
  }

  function loadPreset2G() {
    const classDivInput = document.getElementById('classDiv');

    subjects = JSON.parse(JSON.stringify(window.PRESET_2G_SUBJECTS || []));
    timetable = JSON.parse(JSON.stringify(window.PRESET_2G_TIMETABLE || {}));
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

  // --- SUBJECT MODAL CONTROLS ---
  function openSubjectModal(subId = null) {
    const subjectModal = document.getElementById('subjectModal');
    const modalTitle = document.getElementById('modalTitle');
    const editSubjectId = document.getElementById('editSubjectId');
    const subName = document.getElementById('subName');
    const subEmoji = document.getElementById('subEmoji');
    const subBadge = document.getElementById('subBadge');
    const subSuffix = document.getElementById('subSuffix');

    if (!subjectModal || !subName) return;

    if (subId) {
      if (modalTitle) modalTitle.textContent = 'Edit Subject';
      const sub = subjects.find(s => s.id === subId);
      if (sub) {
        if (editSubjectId) editSubjectId.value = sub.id;
        subName.value = sub.name;
        if (subEmoji) subEmoji.value = sub.icon || sub.emoji || '🔤';
        if (subBadge) subBadge.value = sub.badge || '🟥';
        if (subSuffix) subSuffix.value = sub.suffix || '';
      }
    } else {
      if (modalTitle) modalTitle.textContent = 'Add Subject';
      if (editSubjectId) editSubjectId.value = '';
      subName.value = '';
      if (subEmoji) subEmoji.value = '🔤';
      if (subBadge) subBadge.value = '🟥';
      if (subSuffix) subSuffix.value = '';
    }

    subjectModal.inert = false;
    subjectModal.classList.add('active');
    subjectModal.removeAttribute('aria-hidden');
    subName.focus();
  }

  function closeSubjectModal() {
    const subjectModal = document.getElementById('subjectModal');
    if (!subjectModal) return;
    if (document.activeElement && subjectModal.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    subjectModal.classList.remove('active');
    subjectModal.setAttribute('aria-hidden', 'true');
    subjectModal.inert = true;
  }

  function saveModalSubject() {
    const editSubjectId = document.getElementById('editSubjectId');
    const subName = document.getElementById('subName');
    const subEmoji = document.getElementById('subEmoji');
    const subBadge = document.getElementById('subBadge');
    const subSuffix = document.getElementById('subSuffix');

    if (!subName) return;

    const name = subName.value.trim();
    const icon = (subEmoji && subEmoji.value.trim()) || '📚';
    const badge = (subBadge && subBadge.value) || '🟥';
    const suffix = (subSuffix && subSuffix.value.trim()) || '';
    const id = editSubjectId ? editSubjectId.value : '';

    if (!name) return;

    if (id) {
      const subIndex = subjects.findIndex(s => s.id === id);
      if (subIndex !== -1) {
        subjects[subIndex].name = name;
        subjects[subIndex].icon = icon;
        subjects[subIndex].emoji = icon;
        subjects[subIndex].badge = badge;
        subjects[subIndex].suffix = suffix;
      }
    } else {
      const newId = 'sub_' + Date.now();
      const newSubject = {
        id: newId,
        badge: badge,
        icon: icon,
        emoji: icon,
        name: name,
        suffix: suffix,
        notes: ''
      };
      subjects.push(newSubject);
    }

    saveSubjectsToStorage();
    closeSubjectModal();
    renderAll();
    if (typeof window.showToast === 'function') {
      window.showToast(id ? 'Subject updated!' : 'New subject added!');
    }
  }

  // --- GLIMPSE EVENT LISTENERS SETUP ---
  function setupGlimpseEventListeners() {
    const glimpseDateInput = document.getElementById('glimpseDate');
    const classDivInput = document.getElementById('classDiv');
    const headerEmojiInput = document.getElementById('headerEmoji');
    const randomEmojiBtn = document.getElementById('randomEmojiBtn');
    const clearNotesBtn = document.getElementById('clearNotesBtn');
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
    const copyMessageBtn = document.getElementById('copyMessageBtn');
    const copyMessageBtn2 = document.getElementById('copyMessageBtn2');
    const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
    const resetTimetableBtn = document.getElementById('resetTimetableBtn');
    const reapplyTimetableBtn = document.getElementById('reapplyTimetableBtn');
    const subjectEntryListEl = document.getElementById('subjectEntryList');
    const subjectsManagerListEl = document.getElementById('subjectsManagerList');
    const timetablePeriodSlots = document.getElementById('timetablePeriodSlots');
    const daySelectorPills = document.getElementById('daySelectorPills');
    const subjectForm = document.getElementById('subjectForm');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const subjectModal = document.getElementById('subjectModal');

    // Date change
    if (glimpseDateInput) {
      glimpseDateInput.addEventListener('change', (e) => {
        if (e.target.value) {
          selectedDate = new Date(e.target.value + 'T00:00:00');
          const days = window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = days[selectedDate.getDay()];
          selectedEditorDay = dayName;

          // Auto apply timetable for newly selected day
          applyTimetableForDate(selectedDate);

          renderAll();
          if (typeof window.showToast === 'function') window.showToast(`Loaded timetable for ${dayName}`);
        }
      });
    }

    // Class/Div change
    if (classDivInput) {
      classDivInput.addEventListener('input', (e) => {
        classAndDiv = e.target.value;
        saveSettingsToStorage();
        renderWhatsAppPreview();
      });
    }

    // Title Emoji Input & Random Pick
    if (headerEmojiInput) {
      headerEmojiInput.addEventListener('input', (e) => {
        localStorage.setItem('glimpse_manual_title_override_v11', e.target.value);
        renderWhatsAppPreview();
      });
    }

    if (randomEmojiBtn) {
      randomEmojiBtn.addEventListener('click', () => {
        const emojis = window.RANDOM_HEADER_EMOJIS_100 || ['✨'];
        const randomIndex = Math.floor(Math.random() * emojis.length);
        const freshEmoji = emojis[randomIndex];
        if (headerEmojiInput) headerEmojiInput.value = freshEmoji;
        localStorage.setItem('glimpse_manual_title_override_v11', freshEmoji);
        renderWhatsAppPreview();
        if (typeof window.showToast === 'function') window.showToast(`Selected icon: ${freshEmoji}`);
      });
    }

    // Note Input & Toggles (Delegate events)
    if (subjectEntryListEl) {
      subjectEntryListEl.addEventListener('input', (e) => {
        if (e.target.classList.contains('notes-input')) {
          const slot = e.target.getAttribute('data-slot');
          currentNotes[slot] = e.target.value;
          saveNotesToStorage();
          renderWhatsAppPreview();
        }
      });

      subjectEntryListEl.addEventListener('change', (e) => {
        if (e.target.classList.contains('toggle-subject-btn')) {
          const slot = e.target.getAttribute('data-slot');
          currentEnabled[slot] = e.target.checked;
          saveEnabledToStorage();
          renderSubjectEntryCards();
          renderWhatsAppPreview();
        }
      });

      subjectEntryListEl.addEventListener('click', (e) => {
        const pasteBtn = e.target.closest('.paste-notes-btn');
        if (pasteBtn) {
          const slot = pasteBtn.getAttribute('data-slot');
          const card = pasteBtn.closest('.subject-card');
          const textarea = card.querySelector('.notes-input');
          if (textarea) pasteFromClipboard(slot, textarea);
          return;
        }

        const clearBtn = e.target.closest('.clear-notes-btn');
        if (clearBtn) {
          const slot = clearBtn.getAttribute('data-slot');
          const card = clearBtn.closest('.subject-card');
          const textarea = card.querySelector('.notes-input');
          if (textarea) clearBlockNotes(slot, textarea);
          return;
        }
      });
    }

    // Clear All Notes
    if (clearNotesBtn) {
      clearNotesBtn.addEventListener('click', async () => {
        const confirmed = await window.showConfirmDialog({
          title: 'Clear All Notes?',
          message: 'This will erase all notes entered for today. Enabled subjects will remain intact.',
          confirmText: 'Clear Notes',
          cancelText: 'Cancel',
          isDanger: true
        });

        if (confirmed) {
          currentNotes = {};
          saveNotesToStorage();
          renderSubjectEntryCards();
          renderWhatsAppPreview();
          if (typeof window.showToast === 'function') window.showToast('All notes cleared for today!');
        }
      });
    }

    // Subject Manager Actions (Delegation)
    if (subjectsManagerListEl) {
      subjectsManagerListEl.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.classList.contains('move-up')) {
          const index = parseInt(target.getAttribute('data-index'), 10);
          if (index > 0) {
            const temp = subjects[index];
            subjects[index] = subjects[index - 1];
            subjects[index - 1] = temp;
            saveSubjectsToStorage();
            renderAll();
          }
        } else if (target.classList.contains('move-down')) {
          const index = parseInt(target.getAttribute('data-index'), 10);
          if (index < subjects.length - 1) {
            const temp = subjects[index];
            subjects[index] = subjects[index + 1];
            subjects[index + 1] = temp;
            saveSubjectsToStorage();
            renderAll();
          }
        } else if (target.classList.contains('edit-sub')) {
          const id = target.getAttribute('data-id');
          openSubjectModal(id);
        } else if (target.classList.contains('delete-sub')) {
          const id = target.getAttribute('data-id');
          const sub = subjects.find(s => s.id === id);
          const subTitle = sub ? sub.name : 'this subject';

          const confirmed = await window.showConfirmDialog({
            title: `Delete Subject "${subTitle}"?`,
            message: `Are you sure you want to delete ${subTitle}? It will be removed from your subject roster.`,
            confirmText: 'Delete Subject',
            cancelText: 'Cancel',
            isDanger: true
          });

          if (confirmed) {
            subjects = subjects.filter(s => s.id !== id);
            saveSubjectsToStorage();
            renderAll();
            if (typeof window.showToast === 'function') window.showToast('Subject deleted');
          }
        }
      });
    }

    // Day Selector in Timetable Editor
    if (daySelectorPills) {
      daySelectorPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.day-pill');
        if (pill) {
          selectedEditorDay = pill.getAttribute('data-day');
          renderTimetableEditor();
        }
      });
    }

    // Period Select change in Timetable Editor
    if (timetablePeriodSlots) {
      timetablePeriodSlots.addEventListener('change', (e) => {
        if (e.target.classList.contains('period-select')) {
          const slotIndex = parseInt(e.target.getAttribute('data-slot-index'), 10);
          const selectedSubId = e.target.value;

          if (!timetable[selectedEditorDay]) {
            timetable[selectedEditorDay] = [];
          }

          timetable[selectedEditorDay][slotIndex] = selectedSubId;
          saveTimetableToStorage();

          const days = window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          if (days[selectedDate.getDay()] === selectedEditorDay) {
            applyTimetableForDate(selectedDate);
            renderSubjectEntryCards();
            renderWhatsAppPreview();
          }

          if (typeof window.showToast === 'function') window.showToast(`Updated Period #${slotIndex + 1}`);
        }
      });
    }

    // Reapply Timetable Button
    if (reapplyTimetableBtn) {
      reapplyTimetableBtn.addEventListener('click', () => {
        applyTimetableForDate(selectedDate);
        renderSubjectEntryCards();
        renderWhatsAppPreview();
        const days = window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        if (typeof window.showToast === 'function') window.showToast(`Applied ${days[selectedDate.getDay()]} schedule! 🔄`);
      });
    }

    // Reset Timetable to Default
    if (resetTimetableBtn) {
      resetTimetableBtn.addEventListener('click', async () => {
        const confirmed = await window.showConfirmDialog({
          title: 'Reset Timetable to Default?',
          message: 'This will reset your weekly timetable schedule across all days back to default empty periods.',
          confirmText: 'Reset Timetable',
          cancelText: 'Cancel',
          isDanger: true
        });

        if (confirmed) {
          timetable = JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_TIMETABLE || {}));
          saveTimetableToStorage();
          applyTimetableForDate(selectedDate);
          renderAll();
          if (typeof window.showToast === 'function') window.showToast('Weekly timetable reset to default');
        }
      });
    }

    // Add Subject Button
    if (addSubjectBtn) {
      addSubjectBtn.addEventListener('click', () => openSubjectModal(null));
    }

    // Reset All to Default
    if (resetDefaultsBtn) {
      resetDefaultsBtn.addEventListener('click', async () => {
        const confirmed = await window.showConfirmDialog({
          title: 'Reset Subjects & Timetable?',
          message: 'This will reset all subjects and weekly timetable configurations. Custom notes will be cleared.',
          confirmText: 'Reset to Defaults',
          cancelText: 'Cancel',
          isDanger: true
        });

        if (confirmed) {
          subjects = JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_SUBJECTS || []));
          timetable = JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_TIMETABLE || {}));
          currentNotes = {};
          currentEnabled = {};
          classAndDiv = '';
          if (classDivInput) classDivInput.value = '';

          saveSubjectsToStorage();
          saveTimetableToStorage();
          saveNotesToStorage();
          saveEnabledToStorage();
          saveSettingsToStorage();

          applyTimetableForDate(selectedDate);
          renderAll();
          if (typeof window.showToast === 'function') window.showToast('Reset to default subjects and timetable!');
        }
      });
    }

    // Copy WhatsApp Message
    function copyWhatsAppSummary() {
      const msg = generateWhatsAppMessage();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(msg).then(() => {
          if (typeof window.showToast === 'function') window.showToast('WhatsApp Message Copied! 📋');
        }).catch(() => {
          if (typeof window.fallbackCopyText === 'function') window.fallbackCopyText(msg);
        });
      } else {
        if (typeof window.fallbackCopyText === 'function') window.fallbackCopyText(msg);
      }
    }

    if (copyMessageBtn) copyMessageBtn.addEventListener('click', copyWhatsAppSummary);
    if (copyMessageBtn2) copyMessageBtn2.addEventListener('click', copyWhatsAppSummary);

    // Share directly to WhatsApp
    if (shareWhatsAppBtn) {
      shareWhatsAppBtn.addEventListener('click', () => {
        const msg = generateWhatsAppMessage();
        const encoded = encodeURIComponent(msg);
        if (navigator.share) {
          navigator.share({
            title: "Glimpse of Today's Session",
            text: msg
          }).catch(() => {
            window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
          });
        } else {
          window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
        }
      });
    }

    // Subject Modal Form Submit & Cancel
    if (subjectForm) {
      subjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveModalSubject();
      });
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeSubjectModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeSubjectModal);
    if (subjectModal) {
      subjectModal.addEventListener('click', (e) => {
        if (e.target === subjectModal) closeSubjectModal();
      });
    }
  }

  // Export to global scope
  Object.defineProperty(window, 'subjects', {
    get: () => subjects,
    set: (val) => { subjects = val; },
    configurable: true
  });
  Object.defineProperty(window, 'timetable', {
    get: () => timetable,
    set: (val) => { timetable = val; },
    configurable: true
  });
  Object.defineProperty(window, 'currentNotes', {
    get: () => currentNotes,
    set: (val) => { currentNotes = val; },
    configurable: true
  });
  window.loadStateFromStorage = loadStateFromStorage;
  window.saveSubjectsToStorage = saveSubjectsToStorage;
  window.saveTimetableToStorage = saveTimetableToStorage;
  window.saveNotesToStorage = saveNotesToStorage;
  window.saveEnabledToStorage = saveEnabledToStorage;
  window.saveSettingsToStorage = saveSettingsToStorage;
  window.applyTimetableForDate = applyTimetableForDate;
  window.setupDatePicker = setupDatePicker;
  window.applyRandomDayEmojiOnRefresh = applyRandomDayEmojiOnRefresh;
  window.applyRandomTitleEmojiOnRefresh = applyRandomTitleEmojiOnRefresh;
  window.renderAll = renderAll;
  window.generateWhatsAppMessage = generateWhatsAppMessage;
  window.renderWhatsAppPreview = renderWhatsAppPreview;
  window.updateTimeStamp = updateTimeStamp;
  window.setupTabNavigation = setupTabNavigation;
  window.checkUrlForSecretPreset = checkUrlForSecretPreset;
  window.loadPreset2G = loadPreset2G;
  window.setupGlimpseEventListeners = setupGlimpseEventListeners;

})(window);
