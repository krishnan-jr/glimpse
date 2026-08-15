// Glimpse Daily Entry, WhatsApp Generator & Classes Integration Module
(function(window) {
  'use strict';

  // State Variables
  let subjects = [];
  let timetable = {}; // Day -> array of 8 subjectIds
  let currentNotes = {}; // slotKey -> string
  let currentEnabled = {}; // slotKey -> boolean
  let selectedDate = new Date();
  let classAndDiv = '2G';
  let currentDayEmoji = '🪂';

  // --- LOCAL STORAGE HELPERS ---
  function loadStateFromStorage() {
    try {
      // 1. Populate Class & Div dropdown from Classes App and select current active/saved class
      populateClassDivDropdown();

      // 2. Load daily notes and enabled slot toggles
      const savedNotes = localStorage.getItem('glimpse_notes_v10');
      if (savedNotes) {
        currentNotes = JSON.parse(savedNotes);
      } else {
        currentNotes = {};
      }

      const savedEnabled = localStorage.getItem('glimpse_enabled_v10');
      if (savedEnabled) {
        currentEnabled = JSON.parse(savedEnabled);
      } else {
        currentEnabled = {};
      }
    } catch (e) {
      console.error('Error loading storage in glimpse.js:', e);
      currentNotes = {};
      currentEnabled = {};
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

  // --- CLASSES APP INTEGRATION & DROPDOWN ENGINE ---
  function populateClassDivDropdown() {
    const classDivSelect = document.getElementById('classDiv');
    if (!classDivSelect) return;

    let clsData = window.classesData;
    if (!clsData && typeof window.loadClassesDataFromStorage === 'function') {
      clsData = window.loadClassesDataFromStorage();
    }

    const classesList = (clsData && Array.isArray(clsData.classes)) ? clsData.classes : [];
    const activeClassesList = classesList.filter(c => c.isActive !== false);

    if (activeClassesList.length === 0) {
      classDivSelect.innerHTML = `<option value="">-- No Active Classes --</option>`;
      subjects = [];
      timetable = {};
      classAndDiv = '';
      renderAll();
      return;
    }

    // Build options list for active classes only
    let optionsHtml = '';
    activeClassesList.forEach(c => {
      optionsHtml += `<option value="${c.id}">${window.escapeHtml(c.name)}</option>`;
    });
    classDivSelect.innerHTML = optionsHtml;

    // Retrieve last remembered selection or first active class
    const savedClassId = localStorage.getItem('glimpse_selected_class_id_v1') || (clsData && clsData.activeClassId);
    const targetClass = activeClassesList.find(c => c.id === savedClassId) || activeClassesList[0];

    if (targetClass) {
      classDivSelect.value = targetClass.id;
      selectGlimpseClass(targetClass.id, false);
    }
  }

  function selectGlimpseClass(classId, userInteracted = true) {
    if (!classId) return;

    let clsData = window.classesData;
    if (!clsData && typeof window.loadClassesDataFromStorage === 'function') {
      clsData = window.loadClassesDataFromStorage();
    }

    const classesList = (clsData && Array.isArray(clsData.classes)) ? clsData.classes : [];
    const targetClass = classesList.find(c => c.id === classId);
    if (!targetClass) return;

    // 1. Remember selection in localStorage
    try {
      localStorage.setItem('glimpse_selected_class_id_v1', classId);
    } catch (e) {}

    // 2. Set activeClassId in classes data
    if (clsData) {
      clsData.activeClassId = classId;
      if (typeof window.saveClassesDataToStorage === 'function') {
        window.saveClassesDataToStorage();
      }
    }

    // 3. Flow subjects, timetable, and class name directly from the class
    subjects = JSON.parse(JSON.stringify(targetClass.subjects || []));
    timetable = JSON.parse(JSON.stringify(targetClass.timetable || {}));
    classAndDiv = targetClass.name || '';

    // Legacy sync
    saveSubjectsToStorage();
    saveTimetableToStorage();
    saveSettingsToStorage();

    // 4. Update dropdown UI
    const classDivSelect = document.getElementById('classDiv');
    if (classDivSelect && classDivSelect.value !== classId) {
      classDivSelect.value = classId;
    }

    // 5. Apply timetable for current date & render
    applyTimetableForDate(selectedDate);
    renderAll();

    if (userInteracted && typeof window.showToast === 'function') {
      window.showToast(`Switched to Class: ${targetClass.name}`);
    }
  }

  function syncGlimpseWithActiveClass(activeClass) {
    populateClassDivDropdown();
    if (!activeClass) return;

    if (Array.isArray(activeClass.subjects)) {
      subjects = JSON.parse(JSON.stringify(activeClass.subjects));
    }
    if (activeClass.timetable && typeof activeClass.timetable === 'object') {
      timetable = JSON.parse(JSON.stringify(activeClass.timetable));
    }
    if (activeClass.name) {
      classAndDiv = activeClass.name;
    }
    const classDivSelect = document.getElementById('classDiv');
    if (classDivSelect && activeClass.id) {
      classDivSelect.value = activeClass.id;
    }

    try {
      localStorage.setItem('glimpse_selected_class_id_v1', activeClass.id);
    } catch (e) {}

    applyTimetableForDate(selectedDate);
    renderAll();
  }

  // --- TIMETABLE ENGINE ---
  function getSlotKey(slotIndex) {
    return `slot_${slotIndex}`;
  }

  function applyTimetableForDate(dateObj) {
    const days = window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dateObj.getDay()];
    let activeSubjectIds = timetable[dayName] || [];

    // Ensure slots are active by default for scheduled subjects
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
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    if (glimpseDateInput) glimpseDateInput.value = `${yyyy}-${mm}-${dd}`;
    selectedDate = today;
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
    let periodSubjectIds = timetable[dayName] || [];

    const slots = [];
    for (let i = 0; i < 8; i++) {
      const subId = periodSubjectIds[i];
      if (subId) {
        const subject = subjects.find(s => s.id === subId);
        if (subject) {
          const slotKey = getSlotKey(i);
          const isEnabled = currentEnabled[slotKey] !== false;
          let noteText = currentNotes[slotKey];
          if (noteText === undefined) {
            noteText = subject.notes || '';
          }
          slots.push({
            slotIndex: i,
            slotKey: slotKey,
            subject: subject,
            notes: noteText,
            enabled: isEnabled
          });
        }
      }
    }
    return slots;
  }

  function renderSubjectEntryCards() {
    const subjectEntryListEl = document.getElementById('subjectEntryList');
    const activeCountBadgeEl = document.getElementById('activeCountBadge');
    if (!subjectEntryListEl) return;

    subjectEntryListEl.innerHTML = '';

    const daySlots = getActiveDaySlots();
    const days = window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[selectedDate.getDay()];

    if (daySlots.length === 0) {
      subjectEntryListEl.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">📝</div>
          <h3>No Subjects Scheduled for Today</h3>
          <p>No periods have been assigned for <strong>${dayName}</strong> in <strong>${window.escapeHtml(classAndDiv || 'the selected class')}</strong>. You can configure the weekly schedule under the <strong>Classes App</strong>.</p>
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
      const periodNum = slot.slotIndex + 1;
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

  // --- WHATSAPP MESSAGE GENERATOR ENGINE ---
  function generateWhatsAppMessage() {
    const headerEmojiInput = document.getElementById('headerEmoji');

    const keycapDateStr = getFormattedKeycapDate(selectedDate);
    const dayStr = getFormattedDayOfWeek(selectedDate);
    const classDivStr = classAndDiv || '2G';
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

      if (rawLines.length > 0) {
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
    if (typeof window.loadClassesPreset2G === 'function') {
      window.loadClassesPreset2G();
    }

    try {
      localStorage.setItem('glimpse_last_active_route_v1', '#/dashboard');
    } catch (e) {}

    // Navigate to homepage and reload webapp
    const cleanUrl = window.location.origin + window.location.pathname + '#/dashboard';
    window.location.href = cleanUrl;
    window.location.reload();
  }

  // --- GLIMPSE EVENT LISTENERS SETUP ---
  function setupGlimpseEventListeners() {
    const glimpseDateInput = document.getElementById('glimpseDate');
    const classDivSelect = document.getElementById('classDiv');
    const headerEmojiInput = document.getElementById('headerEmoji');
    const randomEmojiBtn = document.getElementById('randomEmojiBtn');
    const clearNotesBtn = document.getElementById('clearNotesBtn');
    const copyMessageBtn = document.getElementById('copyMessageBtn');
    const copyMessageBtn2 = document.getElementById('copyMessageBtn2');
    const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
    const subjectEntryListEl = document.getElementById('subjectEntryList');

    // Date change
    if (glimpseDateInput) {
      glimpseDateInput.addEventListener('change', (e) => {
        if (e.target.value) {
          selectedDate = new Date(e.target.value + 'T00:00:00');
          const days = window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = days[selectedDate.getDay()];

          // Auto apply timetable for newly selected day
          applyTimetableForDate(selectedDate);

          renderAll();
          if (typeof window.showToast === 'function') window.showToast(`Loaded timetable for ${dayName}`);
        }
      });
    }

    // Class/Div select dropdown change
    if (classDivSelect) {
      classDivSelect.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        if (selectedId) {
          selectGlimpseClass(selectedId, true);
        }
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
  window.populateClassDivDropdown = populateClassDivDropdown;
  window.selectGlimpseClass = selectGlimpseClass;
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
  window.syncGlimpseWithActiveClass = syncGlimpseWithActiveClass;
  window.setupGlimpseEventListeners = setupGlimpseEventListeners;

})(window);
