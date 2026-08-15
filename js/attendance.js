// Glimpse Attendance Module Engine
(function(window) {
  'use strict';

  let attendanceData = { programs: [] };
  let attCurrentActiveProgramId = null;
  let attFormEditingProgramId = null;
  let attFormParticipantsDraft = [];
  let attEditingSessionDate = null;
  let attRecordRosterDraft = {};
  let attMatrixSearchQuery = '';
  let attRecordSearchQuery = '';
  let attRecordInitialDate = null;
  let attRecordInitialRoster = null;
  let attDraftAssignedGroupId = null;
  let attDraftIsCopiedFromGroup = false;
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

  function getTodayISOString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  let attCustomFromDate = get30DaysAgoISOString();
  let attCustomToDate = getTodayISOString();

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

    return window.showConfirmDialog({
      title: 'Unsaved Attendance Changes',
      message: 'You have unsaved attendance changes. Are you sure you want to discard your changes and continue?',
      confirmText: 'Discard & Continue',
      cancelText: 'Stay on Page',
      isDanger: true
    });
  }

  function resetAttRecordInitialState() {
    attRecordInitialDate = null;
    attRecordInitialRoster = null;
  }

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

  // --- STORAGE HANDLERS ---
  function loadAttendanceDataFromStorage() {
    try {
      const saved = localStorage.getItem('glimpse_attendance_data_v1');
      if (saved) {
        attendanceData = JSON.parse(saved);
        if (!attendanceData || typeof attendanceData !== 'object' || Array.isArray(attendanceData)) {
          attendanceData = { programs: [] };
        }
        if (!Array.isArray(attendanceData.programs)) {
          attendanceData.programs = [];
        }
        // Self-heal and guarantee participants and sessions are always valid arrays
        attendanceData.programs.forEach(p => {
          syncProgramWithAssignedGroup(p);
          if (!Array.isArray(p.participants)) p.participants = [];
          if (!Array.isArray(p.sessions)) {
            if (p.sessions && typeof p.sessions === 'object') {
              p.sessions = Object.keys(p.sessions).map(k => ({
                date: k,
                records: p.sessions[k] && typeof p.sessions[k] === 'object' ? p.sessions[k] : {}
              }));
            } else {
              p.sessions = [];
            }
          }
        });
      } else {
        attendanceData = { programs: [] };
        saveAttendanceDataToStorage();
      }
    } catch (e) {
      console.error('Error loading attendance data:', e);
      attendanceData = { programs: [] };
    }
  }

  // --- ATTENDEE INTELLIGENT MATCHING & ATTENDANCE REMAPPING ENGINE ---

  /**
   * Normalizes participant name for comparison (lowercased, trimmed, stripped punctuation and leading numbers).
   */
  function normalizeAttendeeName(name) {
    if (typeof name !== 'string') return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/^\d+[\s\.\-_:]+\s*/, '')     // strip leading roll/index prefix like "1." or "01 -"
      .replace(/[\(\)\[\]\{\}\.,_\-]+/g, ' ') // replace punctuation with spaces
      .replace(/\s+/g, ' ')                  // normalize multiple spaces
      .trim();
  }

  /**
   * Checks if two names are fuzzy-matched (exact, prefix, extension, token containment, or spelling similarity).
   * Handles cases like: "1 Anoop" -> "1 Anoop Krishnan", "Anoop K." -> "Anoop Krishnan".
   */
  function isNameFuzzyMatch(nameA, nameB) {
    const normA = normalizeAttendeeName(nameA);
    const normB = normalizeAttendeeName(nameB);

    if (!normA || !normB) return false;
    if (normA === normB) return true;

    // Direct prefix / extension check (e.g. "Anoop" vs "Anoop Krishnan")
    if (normA.startsWith(normB + ' ') || normB.startsWith(normA + ' ')) {
      return true;
    }

    // Token containment: all words in shorter name appear in longer name in sequence
    const tokensA = normA.split(' ').filter(Boolean);
    const tokensB = normB.split(' ').filter(Boolean);

    const shorter = tokensA.length <= tokensB.length ? tokensA : tokensB;
    const longer = tokensA.length <= tokensB.length ? tokensB : tokensA;

    if (shorter.length >= 1) {
      // First word must match (e.g. "Anoop" matches "Anoop", not "Sarah")
      const firstS = shorter[0];
      const firstMatch = longer.some(w => w === firstS || (firstS.length >= 2 && (w.startsWith(firstS) || firstS.startsWith(w))));
      if (!firstMatch) return false;

      let lastIdx = -1;
      let allFound = true;
      for (const word of shorter) {
        // A word matches if it is equal, or if one is a prefix of the other (including single-letter initials like "K" -> "Krishnan")
        const foundIdx = longer.findIndex((w, idx) => idx > lastIdx && (w === word || w.startsWith(word) || word.startsWith(w)));
        if (foundIdx === -1) {
          allFound = false;
          break;
        }
        lastIdx = foundIdx;
      }
      if (allFound) return true;
    }

    return false;
  }

  /**
   * Intelligently matches attendees between oldList and newList.
   * Priority:
   * 1. Exact Roll No + Exact Name
   * 2. Exact Roll No + Fuzzy Name (e.g., Roll 1 "Anoop" -> Roll 1 "Anoop Krishnan")
   * 3. Exact Name + Different Roll No
   * 4. Fuzzy Name + Similar Roll No
   * 
   * Returns: { matches: Map<newId, oldParticipant>, matchedCount, unmatchedOldCount, unmatchedNewCount }
   */
  function matchAttendees(oldList = [], newList = []) {
    const newToOldMap = new Map();
    const usedOldIds = new Set();
    const usedNewIds = new Set();

    const safeOld = (Array.isArray(oldList) ? oldList : []).map((p, idx) => ({
      ...p,
      _roll: getParticipantRollNo(p, idx + 1),
      _norm: normalizeAttendeeName(p.name)
    }));

    const safeNew = (Array.isArray(newList) ? newList : []).map((p, idx) => ({
      ...p,
      _roll: getParticipantRollNo(p, idx + 1),
      _norm: normalizeAttendeeName(p.name)
    }));

    // Pass 1: Exact Roll No & Exact Name
    safeNew.forEach(newP => {
      if (usedNewIds.has(newP.id)) return;
      const match = safeOld.find(oldP => {
        if (usedOldIds.has(oldP.id)) return false;
        return newP._roll !== '' && oldP._roll === newP._roll && oldP._norm === newP._norm;
      });

      if (match) {
        newToOldMap.set(newP.id, match);
        usedOldIds.add(match.id);
        usedNewIds.add(newP.id);
      }
    });

    // Pass 2: Exact Roll No & Fuzzy Name (e.g. same Roll No, "Anoop" -> "Anoop Krishnan")
    safeNew.forEach(newP => {
      if (usedNewIds.has(newP.id)) return;
      if (newP._roll === '') return;

      const match = safeOld.find(oldP => {
        if (usedOldIds.has(oldP.id)) return false;
        if (oldP._roll !== newP._roll) return false;
        return isNameFuzzyMatch(oldP.name, newP.name);
      });

      if (match) {
        newToOldMap.set(newP.id, match);
        usedOldIds.add(match.id);
        usedNewIds.add(newP.id);
      }
    });

    // Pass 3: Exact Name (even if Roll No differs)
    safeNew.forEach(newP => {
      if (usedNewIds.has(newP.id)) return;
      if (!newP._norm || newP._norm.length < 2) return;

      const match = safeOld.find(oldP => {
        if (usedOldIds.has(oldP.id)) return false;
        return oldP._norm === newP._norm;
      });

      if (match) {
        newToOldMap.set(newP.id, match);
        usedOldIds.add(match.id);
        usedNewIds.add(newP.id);
      }
    });

    // Pass 4: Fuzzy Name Match across remaining
    safeNew.forEach(newP => {
      if (usedNewIds.has(newP.id)) return;
      if (!newP._norm || newP._norm.length < 3) return;

      const match = safeOld.find(oldP => {
        if (usedOldIds.has(oldP.id)) return false;
        return isNameFuzzyMatch(oldP.name, newP.name);
      });

      if (match) {
        newToOldMap.set(newP.id, match);
        usedOldIds.add(match.id);
        usedNewIds.add(newP.id);
      }
    });

    return {
      matches: newToOldMap,
      matchedCount: newToOldMap.size,
      unmatchedOldCount: safeOld.length - newToOldMap.size,
      unmatchedNewCount: safeNew.length - newToOldMap.size
    };
  }

  /**
   * Remaps attendance session records from old participants to new participants.
   * Unmapped records are discarded while matched records are preserved under the new participant IDs.
   */
  function remapSessionsRecords(sessions = [], newParticipants = [], newToOldMap = new Map()) {
    if (!Array.isArray(sessions) || sessions.length === 0) return sessions;

    return sessions.map(session => {
      const oldRecords = session.records || {};
      const newRecords = {};

      newParticipants.forEach(newP => {
        const mappedOld = newToOldMap.get(newP.id);
        if (mappedOld && oldRecords[mappedOld.id] !== undefined) {
          newRecords[newP.id] = oldRecords[mappedOld.id];
        }
      });

      return {
        ...session,
        records: newRecords
      };
    });
  }

  function syncProgramWithAssignedGroup(prog) {
    if (!prog || !prog.assignedGroupId || !window.userGroupsData || !window.userGroupsData.groups) return;
    const group = window.userGroupsData.groups.find(g => g.id === prog.assignedGroupId);
    if (group && Array.isArray(group.members)) {
      const newParticipants = group.members.map((m, idx) => ({
        id: m.id,
        name: m.name,
        rollNo: (typeof window.getUgMemberRollNo === 'function') ? window.getUgMemberRollNo(m, idx + 1) : (m.rollNo || String(idx + 1))
      }));

      // If program already has participants and sessions, check if remapping is needed (e.g. member IDs or roster modified)
      if (Array.isArray(prog.participants) && prog.participants.length > 0 && Array.isArray(prog.sessions) && prog.sessions.length > 0) {
        const oldIds = new Set(prog.participants.map(p => p.id));
        const hasIdMismatch = newParticipants.some(np => !oldIds.has(np.id));
        if (hasIdMismatch) {
          const matchResult = matchAttendees(prog.participants, newParticipants);
          prog.sessions = remapSessionsRecords(prog.sessions, newParticipants, matchResult.matches);
        }
      }

      prog.participants = newParticipants;
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
      syncProgramWithAssignedGroup(prog);
      const pList = Array.isArray(prog.participants) ? prog.participants : [];
      const sList = Array.isArray(prog.sessions) ? prog.sessions : [];
      const pCount = pList.length;
      const sCount = sList.length;
      const isSynced = Boolean(prog.assignedGroupId);
      
      let lastDateText = 'No sessions yet';
      if (sCount > 0) {
        const sortedSessions = [...sList].sort((a, b) => new Date(b.date) - new Date(a.date));
        lastDateText = 'Last: ' + formatDateLabel(sortedSessions[0].date);
      }

      return `
        <div class="att-program-card" data-program-id="${prog.id}">
          <div class="att-card-header">
            <div class="att-card-title-group">
              <h3>${window.escapeHtml(prog.name)}</h3>
              ${prog.description ? `<div class="att-card-subtitle">${window.escapeHtml(prog.description)}</div>` : ''}
            </div>
            <button type="button" class="btn-round-arrow att-open-prog-btn" data-id="${prog.id}" title="Open ${window.escapeHtml(prog.name)}" aria-label="Open Program">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          <div class="att-card-stats">
            <span class="att-stat-badge">${isSynced ? '🔗' : '👥'} ${pCount} ${pCount === 1 ? 'Attendee' : 'Attendees'}${isSynced ? ' (Synced)' : ''}</span>
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

    window.showConfirmDialog({
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
        if (typeof window.showToast === 'function') window.showToast('Program deleted');
      }
    });
  }

  // --- SCREEN 2: CREATE / EDIT PROGRAM & PARTICIPANTS ---
  function openProgramForm(programId = null, updateHash = true) {
    if (updateHash && typeof window.navigateToRoute === 'function') {
      window.navigateToRoute(programId ? `#/attendance/program-form?id=${programId}` : '#/attendance/program-form');
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
        attDraftAssignedGroupId = prog.assignedGroupId || null;
        attDraftIsCopiedFromGroup = prog.isCopiedFromGroup || false;

        syncProgramWithAssignedGroup(prog);
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
      attDraftAssignedGroupId = null;
      attDraftIsCopiedFromGroup = false;
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

    const sourceActions = document.getElementById('attRosterSourceActions');
    const assignedBanner = document.getElementById('attAssignedUgBanner');
    const assignedUgName = document.getElementById('attAssignedUgName');
    const addBar = document.getElementById('attAddParticipantBar');
    const container = document.getElementById('attParticipantsList');

    if (attDraftAssignedGroupId) {
      // Synced mode with User Group
      const group = (window.userGroupsData && window.userGroupsData.groups) 
        ? window.userGroupsData.groups.find(g => g.id === attDraftAssignedGroupId) 
        : null;
      
      if (assignedUgName) {
        assignedUgName.textContent = group ? group.name : 'Unknown Group';
      }
      if (assignedBanner) assignedBanner.style.display = 'flex';
      if (sourceActions) sourceActions.style.display = 'none';
      if (addBar) addBar.style.display = 'none';
    } else {
      if (assignedBanner) assignedBanner.style.display = 'none';
      if (addBar) addBar.style.display = 'flex';
      if (sourceActions) sourceActions.style.display = 'flex';
    }

    if (!container) return;

    if (attFormParticipantsDraft.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--muted); padding: 12px; font-size: var(--text-xs);">No attendees added yet. Enter full name above to build your roster.</div>`;
      return;
    }

    container.innerHTML = attFormParticipantsDraft.map((p, index) => {
      const rollNo = getParticipantRollNo(p, index + 1);
      if (attDraftAssignedGroupId) {
        return `
          <div class="att-participant-item" data-id="${p.id}">
            <span class="name-text"><strong>${window.escapeHtml(rollNo)}.</strong> ${window.escapeHtml(p.name)}</span>
            <span style="font-size: var(--text-xs); color: var(--muted); display: inline-flex; align-items: center; gap: 4px;">
              <span>🔗 Synced</span>
            </span>
          </div>
        `;
      }
      return `
        <div class="att-participant-item" data-id="${p.id}">
          <span class="name-text"><strong>${window.escapeHtml(rollNo)}.</strong> ${window.escapeHtml(p.name)}</span>
          <div class="item-actions">
            <button type="button" class="action-icon-btn edit-participant-btn" data-id="${p.id}" title="Edit Attendee Details">✎</button>
            <button type="button" class="action-icon-btn delete delete-participant-btn" data-id="${p.id}" title="Remove Attendee">✕</button>
          </div>
        </div>
      `;
    }).join('');

    if (!attDraftAssignedGroupId) {
      container.querySelectorAll('.edit-participant-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const pIndex = attFormParticipantsDraft.findIndex(item => item.id === id);
          if (pIndex !== -1) {
            const p = attFormParticipantsDraft[pIndex];
            const currentRollNo = getParticipantRollNo(p, pIndex + 1);
            const updated = await window.showParticipantEditModal({
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
  }

  function handleAddParticipantFromInput() {
    if (attDraftAssignedGroupId) return; // Locked when assigned

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

  function areRostersEqual(listA = [], listB = []) {
    if (!Array.isArray(listA) || !Array.isArray(listB)) return false;
    if (listA.length !== listB.length) return false;
    for (let i = 0; i < listA.length; i++) {
      const a = listA[i];
      const b = listB[i];
      const aRoll = String(a.rollNo !== undefined && a.rollNo !== null ? a.rollNo : (i + 1)).trim();
      const bRoll = String(b.rollNo !== undefined && b.rollNo !== null ? b.rollNo : (i + 1)).trim();
      if (a.id !== b.id || a.name !== b.name || aRoll !== bRoll) {
        return false;
      }
    }
    return true;
  }

  async function saveProgramForm(e) {
    if (e) e.preventDefault();

    // Auto-add any attendee currently typed in input before saving
    if (!attDraftAssignedGroupId) {
      const input = document.getElementById('attNewParticipantInput');
      if (input && input.value.trim() !== '') {
        handleAddParticipantFromInput();
      }
    }

    const nameInput = document.getElementById('attProgName');
    const descInput = document.getElementById('attProgDesc');

    const name = nameInput ? nameInput.value.trim() : '';
    const desc = descInput ? descInput.value.trim() : '';

    if (!name) {
      if (typeof window.showToast === 'function') window.showToast('Please enter a program name');
      return;
    }

    let savedProgramId = attFormEditingProgramId;

    if (attFormEditingProgramId) {
      const prog = attendanceData.programs.find(p => p.id === attFormEditingProgramId);
      if (prog) {
        let newParticipants = [];
        if (attDraftAssignedGroupId) {
          const group = (window.userGroupsData && window.userGroupsData.groups)
            ? window.userGroupsData.groups.find(g => g.id === attDraftAssignedGroupId)
            : null;
          if (group && Array.isArray(group.members)) {
            newParticipants = group.members.map((m, idx) => ({
              id: m.id,
              name: m.name,
              rollNo: (typeof window.getUgMemberRollNo === 'function') ? window.getUgMemberRollNo(m, idx + 1) : (m.rollNo || String(idx + 1))
            }));
          }
        } else {
          newParticipants = JSON.parse(JSON.stringify(attFormParticipantsDraft));
        }

        const isRosterChanged = !areRostersEqual(prog.participants, newParticipants) 
          || prog.assignedGroupId !== attDraftAssignedGroupId 
          || prog.isCopiedFromGroup !== attDraftIsCopiedFromGroup;

        const hasRecordedSessions = Array.isArray(prog.sessions) && prog.sessions.some(s => s.records && Object.keys(s.records).length > 0);

        if (isRosterChanged && Array.isArray(prog.participants) && prog.participants.length > 0 && hasRecordedSessions) {
          const matchResult = matchAttendees(prog.participants, newParticipants);

          const message = `You are saving changes to the active attendee roster for "${name}".\n\n`
            + `• Original Attendees: ${prog.participants.length}\n`
            + `• Updated Attendees: ${newParticipants.length}\n`
            + `• Recoverable Attendees: ${matchResult.matchedCount} (attendance history preserved)\n`
            + (matchResult.unmatchedOldCount > 0 
              ? `• Unmapped Attendees: ${matchResult.unmatchedOldCount} (past records will be retired)\n\n` 
              : `\n`)
            + `Do you want to apply and save these changes to the active attendance list?`;

          const confirmed = await window.showConfirmDialog({
            title: 'Update Active Attendee List?',
            message: message,
            confirmText: 'Save & Update Roster',
            cancelText: 'Keep Editing',
            isDanger: matchResult.unmatchedOldCount > 0
          });

          if (!confirmed) {
            return;
          }

          // Remap session records
          prog.sessions = remapSessionsRecords(prog.sessions, newParticipants, matchResult.matches);
        } else if (isRosterChanged && Array.isArray(prog.participants) && prog.participants.length > 0 && Array.isArray(prog.sessions) && prog.sessions.length > 0) {
          const matchResult = matchAttendees(prog.participants, newParticipants);
          prog.sessions = remapSessionsRecords(prog.sessions, newParticipants, matchResult.matches);
        }

        prog.name = name;
        prog.description = desc;
        prog.assignedGroupId = attDraftAssignedGroupId;
        prog.isCopiedFromGroup = attDraftIsCopiedFromGroup;
        prog.participants = newParticipants;
      }
    } else {
      savedProgramId = 'prog_' + Date.now();
      const newProgram = {
        id: savedProgramId,
        name: name,
        description: desc,
        assignedGroupId: attDraftAssignedGroupId,
        isCopiedFromGroup: attDraftIsCopiedFromGroup,
        createdAt: new Date().toISOString(),
        participants: attDraftAssignedGroupId ? (
          ((window.userGroupsData && window.userGroupsData.groups ? window.userGroupsData.groups.find(g => g.id === attDraftAssignedGroupId) : null)?.members || []).map((m, idx) => ({
            id: m.id,
            name: m.name,
            rollNo: (typeof window.getUgMemberRollNo === 'function') ? window.getUgMemberRollNo(m, idx + 1) : (m.rollNo || String(idx + 1))
          }))
        ) : JSON.parse(JSON.stringify(attFormParticipantsDraft)),
        sessions: []
      };
      attendanceData.programs.push(newProgram);
    }

    saveAttendanceDataToStorage();
    if (typeof window.showToast === 'function') window.showToast(attFormEditingProgramId ? 'Program updated!' : 'Program created!');
    renderAttProgramsList();

    if (savedProgramId) {
      openProgramMatrix(savedProgramId);
    } else {
      showAttScreen('att-screen-programs');
    }
  }

  // --- SCREEN 3: ATTENDANCE MATRIX DASHBOARD ---
  function openProgramMatrix(programId, updateHash = true) {
    if (updateHash && typeof window.navigateToRoute === 'function') {
      window.navigateToRoute(`#/attendance/matrix?id=${programId}`);
    }
    attCurrentActiveProgramId = programId;
    const prog = attendanceData.programs.find(p => p.id === programId);
    if (prog) {
      syncProgramWithAssignedGroup(prog);
    }
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
    let filteredParticipants = Array.isArray(prog.participants) ? prog.participants : [];
    if (attMatrixSearchQuery.trim() !== '') {
      const q = attMatrixSearchQuery.toLowerCase().trim();
      filteredParticipants = filteredParticipants.filter(p => p.name.toLowerCase().includes(q));
    }

    // Determine date range filter based on attViewMode and attAnchorDate
    const rawSessions = Array.isArray(prog.sessions) ? prog.sessions : [];
    let sortedSessions = [...rawSessions];

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
      const totalSessionsCount = rawSessions.length;
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
      tableHtml += `<td class="cell-participant">${window.escapeHtml(rollNo)}. ${window.escapeHtml(p.name)}</td>`;

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

    let participants = Array.isArray(prog.participants) ? prog.participants : [];
    if (attMatrixSearchQuery.trim() !== '') {
      const q = attMatrixSearchQuery.toLowerCase().trim();
      participants = participants.filter(p => p.name.toLowerCase().includes(q));
    }

    const rawSessions = Array.isArray(prog.sessions) ? prog.sessions : [];
    let sessions = [...rawSessions];
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
        const sortedAll = [...rawSessions].sort((a, b) => new Date(a.date) - new Date(b.date));
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
      window.showAlertDialog('Nothing to Export', 'The currently visible attendance table has no exportable rows.');
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

  async function exportVisibleAttendanceAsJpg() {
    const table = document.querySelector('#attMatrixTableContainer .att-table');
    const options = getExportOptions();
    const data = getVisibleAttendanceMatrixData(options);
    if (!data) {
      window.showAlertDialog('Nothing to Export', 'The attendance table is not available yet.');
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

    const drawText = (text, x, y, maxWidth, opt = {}) => {
      ctx.fillStyle = opt.color || fg;
      ctx.font = `${opt.weight || 600} ${opt.size || 14}px ${fontFamily}`;
      ctx.textAlign = opt.align || 'center';
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
        window.showAlertDialog('Export Failed', 'Could not create the JPG export.');
        return;
      }
      const filename = getExportFilename(data.prog ? data.prog.name : '', 'jpg');
      if (typeof window.downloadBlob === 'function') window.downloadBlob(blob, filename);
      if (typeof window.showToast === 'function') window.showToast('JPG export downloaded');
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
      window.showAlertDialog('Nothing to Export', 'The currently visible attendance table has no exportable rows.');
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
    if (typeof window.downloadBlob === 'function') window.downloadBlob(blob, filename);
    if (typeof window.showToast === 'function') window.showToast('XLSX export downloaded');
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
      navigator.clipboard.writeText(text).then(() => {
        if (typeof window.showToast === 'function') window.showToast(successMessage);
      });
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
    if (typeof window.showToast === 'function') window.showToast(successMessage);
  }

  function copyVisibleAttendanceWhatsAppMessage() {
    const data = getVisibleAttendanceMatrixData();
    if (!data || data.sessions.length !== 1) {
      window.showAlertDialog('Single Date Required', 'Filter the table to one visible attendance date before copying a WhatsApp message.');
      return;
    }

    copyTextToClipboard(buildVisibleAttendanceWhatsAppMessage(data), 'WhatsApp attendance copied');
  }

  function deleteAttendanceSession(date) {
    const prog = attendanceData.programs.find(p => p.id === attCurrentActiveProgramId);
    if (!prog) return;

    window.showConfirmDialog({
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
        if (typeof window.showToast === 'function') window.showToast('Attendance session deleted');
      }
    });
  }

  // --- SCREEN 4: ADD / EDIT ATTENDANCE SESSION ---
  function openRecordSession(sessionDate = null, updateHash = true, programId = null) {
    if (programId) attCurrentActiveProgramId = programId;
    if (updateHash && attCurrentActiveProgramId && typeof window.navigateToRoute === 'function') {
      const route = sessionDate 
        ? `#/attendance/record?id=${attCurrentActiveProgramId}&date=${sessionDate}`
        : `#/attendance/record?id=${attCurrentActiveProgramId}`;
      window.navigateToRoute(route);
    }
    attEditingSessionDate = sessionDate;
    attRecordSearchQuery = '';

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

    let searchQ = attRecordSearchQuery || '';
    let filtered = prog.participants || [];
    if (searchQ.trim() !== '') {
      const q = searchQ.toLowerCase().trim();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--muted);">No participants found matching "${window.escapeHtml(searchQ)}".</div>`;
      return;
    }

    container.innerHTML = filtered.map((p, index) => {
      const origIndex = (prog.participants || []).findIndex(item => item.id === p.id);
      const rollNo = getParticipantRollNo(p, origIndex >= 0 ? origIndex + 1 : index + 1);
      const status = attRecordRosterDraft[p.id] || 'present';
      const isPresent = status === 'present';

      return `
        <div class="att-record-item" data-id="${p.id}">
          <span class="participant-name">${window.escapeHtml(rollNo)}. ${window.escapeHtml(p.name)}</span>
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
      if (typeof window.showToast === 'function') window.showToast('Please select a valid date');
      return;
    }

    if (!prog.sessions) prog.sessions = [];

    const existingIndex = prog.sessions.findIndex(s => s.date === targetDate);

    if (existingIndex !== -1 && attEditingSessionDate !== targetDate) {
      window.showAlertDialog(
        'Attendance Already Recorded',
        `An attendance session for ${formatDateLabel(targetDate)} has already been recorded in "${prog.name}". Duplicate entries on the same date are not allowed. Please select a different date or edit the existing session from the matrix.`
      );
      return;
    }

    if (existingIndex !== -1) {
      prog.sessions[existingIndex].records = JSON.parse(JSON.stringify(attRecordRosterDraft));
    } else {
      prog.sessions.push({
        id: 'sess_' + Date.now(),
        date: targetDate,
        records: JSON.parse(JSON.stringify(attRecordRosterDraft))
      });
    }

    saveAttendanceDataToStorage();
    if (typeof window.showToast === 'function') window.showToast('Attendance saved!');

    attRecordInitialDate = null;
    attRecordInitialRoster = null;

    renderAttMatrixTable();
    showAttScreen('att-screen-matrix');
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
      if (typeof window.openDashboard === 'function') window.openDashboard();
    } else if (screenId === 'att-screen-program-form' || screenId === 'att-screen-matrix') {
      if (typeof window.openAttendanceApp === 'function') window.openAttendanceApp();
    } else if (screenId === 'att-screen-record-session') {
      confirmUnsavedAttendanceChanges().then(confirmed => {
        if (confirmed) {
          attRecordInitialDate = null;
          attRecordInitialRoster = null;
          if (attCurrentActiveProgramId) {
            openProgramMatrix(attCurrentActiveProgramId);
          } else {
            if (typeof window.openAttendanceApp === 'function') window.openAttendanceApp();
          }
        }
      });
    } else {
      if (typeof window.openDashboard === 'function') window.openDashboard();
    }
  }

  function loadPresetENG() {
    loadAttendanceDataFromStorage();
    if (!attendanceData.programs) attendanceData.programs = [];

    const engProgramId = 'prog_eng_improvement';
    let existingProg = attendanceData.programs.find(p => p.id === engProgramId || (p.name && p.name.toUpperCase() === 'ENGLISH LANGUAGE IMPROVEMENT'));

    const attendees = window.PRESET_ENG_ATTENDEES || [];
    const participantsList = attendees.map((name, index) => ({
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

    // Also populate User Group
    if (typeof window.loadUserGroupsDataFromStorage === 'function') window.loadUserGroupsDataFromStorage();
    if (!window.userGroupsData.groups) window.userGroupsData.groups = [];

    const engGroupId = 'ug_eng_improvement';
    let existingGroup = window.userGroupsData.groups.find(g => g.id === engGroupId || (g.name && g.name.toUpperCase() === 'ENGLISH LANGUAGE IMPROVEMENT'));

    const groupMembersList = attendees.map((name, index) => ({
      id: `mem_eng_${index + 1}`,
      name: name,
      rollNo: String(index + 1)
    }));

    if (existingGroup) {
      existingGroup.id = engGroupId;
      existingGroup.name = 'English Language Improvement';
      existingGroup.description = 'Team D';
      existingGroup.members = groupMembersList;
      existingGroup.updatedAt = new Date().toISOString();
    } else {
      existingGroup = {
        id: engGroupId,
        name: 'English Language Improvement',
        description: 'Team D',
        members: groupMembersList,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      window.userGroupsData.groups.unshift(existingGroup);
    }

    if (typeof window.saveUserGroupsDataToStorage === 'function') window.saveUserGroupsDataToStorage();

    try {
      localStorage.setItem('glimpse_last_active_route_v1', '#/dashboard');
    } catch (e) {}

    const cleanUrl = window.location.origin + window.location.pathname + '#/dashboard';
    window.location.href = cleanUrl;
    window.location.reload();
  }

  // --- ATTENDANCE EVENT LISTENERS SETUP ---
  function setupAttendanceEventListeners() {
    const tileAttendanceApp = document.getElementById('tileAttendanceApp');
    const attBackToDashboardBtn = document.getElementById('attBackToDashboardBtn');

    if (tileAttendanceApp) {
      tileAttendanceApp.addEventListener('click', () => {
        if (typeof window.openAttendanceApp === 'function') window.openAttendanceApp();
      });
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
    if (cancelFormBtn) cancelFormBtn.addEventListener('click', () => {
      if (typeof window.openAttendanceApp === 'function') window.openAttendanceApp();
    });
    if (cancelFormBtn2) cancelFormBtn2.addEventListener('click', () => {
      if (typeof window.openAttendanceApp === 'function') window.openAttendanceApp();
    });

    // Copy from User Group button
    const copyFromUgBtn = document.getElementById('attCopyFromUgBtn');
    if (copyFromUgBtn) {
      copyFromUgBtn.addEventListener('click', async () => {
        if (!window.userGroupsData || !window.userGroupsData.groups || window.userGroupsData.groups.length === 0) {
          if (typeof window.showToast === 'function') window.showToast('No user groups available. Create one in Manage > User Groups first.');
          return;
        }

        const group = await window.showUserGroupSelectModal('copy');
        if (!group) return;

        const newParticipants = (group.members || []).map((m, idx) => ({
          id: 'part_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
          name: m.name,
          rollNo: (typeof window.getUgMemberRollNo === 'function') ? window.getUgMemberRollNo(m, idx + 1) : (m.rollNo || String(idx + 1))
        }));

        const existingProg = attFormEditingProgramId 
          ? attendanceData.programs.find(p => p.id === attFormEditingProgramId) 
          : null;
        const baselineParticipants = existingProg && Array.isArray(existingProg.participants) && existingProg.participants.length > 0
          ? existingProg.participants
          : attFormParticipantsDraft;
        const hasRecordedSessions = existingProg && Array.isArray(existingProg.sessions) && existingProg.sessions.some(s => s.records && Object.keys(s.records).length > 0);

        if (baselineParticipants.length > 0) {
          const matchResult = matchAttendees(baselineParticipants, newParticipants);

          let message = '';
          if (hasRecordedSessions) {
            message = `Replacing the current roster (${baselineParticipants.length} attendees) with "${group.name}" (${newParticipants.length} members).\n\nIntelligent mapping will preserve attendance history for ${matchResult.matchedCount} matching attendee${matchResult.matchedCount === 1 ? '' : 's'} (matched by roll number and name). Only recoverable entries will be mapped; any completely unmatchable records will be discarded.\n\nDo you want to proceed?`;
          } else {
            message = `Replacing the current attendee list (${baselineParticipants.length} attendees) with "${group.name}" (${newParticipants.length} members). Do you want to proceed?`;
          }

          const confirmed = await window.showConfirmDialog({
            title: 'Copy from User Group',
            message: message,
            confirmText: hasRecordedSessions ? 'Copy & Map Attendance' : 'Continue & Copy',
            cancelText: 'Keep Current List',
            isDanger: hasRecordedSessions
          });
          if (!confirmed) return;

          attDraftAssignedGroupId = null;
          attDraftIsCopiedFromGroup = true;
          attFormParticipantsDraft = newParticipants;
          renderAttFormParticipants();

          if (typeof window.showToast === 'function') {
            if (hasRecordedSessions) {
              window.showToast(`Copied ${newParticipants.length} attendees. Attendance mapped for ${matchResult.matchedCount} attendee${matchResult.matchedCount === 1 ? '' : 's'}! 🎯`);
            } else {
              window.showToast(`Copied ${newParticipants.length} attendees from "${group.name}"`);
            }
          }
        } else {
          attDraftAssignedGroupId = null;
          attDraftIsCopiedFromGroup = true;
          attFormParticipantsDraft = newParticipants;
          renderAttFormParticipants();
          if (typeof window.showToast === 'function') window.showToast(`Copied ${newParticipants.length} attendees from "${group.name}"`);
        }
      });
    }

    // Assign User Group button
    const assignUgBtn = document.getElementById('attAssignUgBtn');
    if (assignUgBtn) {
      assignUgBtn.addEventListener('click', async () => {
        if (!window.userGroupsData || !window.userGroupsData.groups || window.userGroupsData.groups.length === 0) {
          if (typeof window.showToast === 'function') window.showToast('No user groups available. Create one in Manage > User Groups first.');
          return;
        }

        const group = await window.showUserGroupSelectModal('assign');
        if (!group) return;

        const newParticipants = (group.members || []).map((m, idx) => ({
          id: m.id,
          name: m.name,
          rollNo: (typeof window.getUgMemberRollNo === 'function') ? window.getUgMemberRollNo(m, idx + 1) : (m.rollNo || String(idx + 1))
        }));

        const existingProg = attFormEditingProgramId 
          ? attendanceData.programs.find(p => p.id === attFormEditingProgramId) 
          : null;
        const baselineParticipants = existingProg && Array.isArray(existingProg.participants) && existingProg.participants.length > 0
          ? existingProg.participants
          : attFormParticipantsDraft;
        const hasRecordedSessions = existingProg && Array.isArray(existingProg.sessions) && existingProg.sessions.some(s => s.records && Object.keys(s.records).length > 0);

        if (baselineParticipants.length > 0) {
          const matchResult = matchAttendees(baselineParticipants, newParticipants);

          let message = '';
          if (hasRecordedSessions) {
            message = `Assigning "${group.name}" (${newParticipants.length} members) will link this program in permanent sync with the master User Group.\n\nAttendance history will be automatically mapped to ${matchResult.matchedCount} matching attendee${matchResult.matchedCount === 1 ? '' : 's'} (matched by roll number and name). Only recoverable entries will be mapped; any completely unmatchable records will be discarded.\n\nAll future roster changes must be made in Manage > User Groups. Do you want to proceed?`;
          } else {
            message = `Assigning "${group.name}" (${newParticipants.length} members) will link this program in permanent sync with the master User Group. All future roster edits must be made in Manage > User Groups. Do you want to proceed?`;
          }

          const confirmed = await window.showConfirmDialog({
            title: 'Assign Master User Group',
            message: message,
            confirmText: 'Assign & Live Sync',
            cancelText: 'Keep Current List',
            isDanger: hasRecordedSessions
          });
          if (!confirmed) return;

          attDraftAssignedGroupId = group.id;
          attDraftIsCopiedFromGroup = false;
          attFormParticipantsDraft = newParticipants;
          renderAttFormParticipants();

          if (typeof window.showToast === 'function') {
            if (hasRecordedSessions) {
              window.showToast(`Linked to "${group.name}". Attendance mapped for ${matchResult.matchedCount} attendee${matchResult.matchedCount === 1 ? '' : 's'}! 🎯`);
            } else {
              window.showToast(`Linked program to User Group: "${group.name}"`);
            }
          }
        } else {
          attDraftAssignedGroupId = group.id;
          attDraftIsCopiedFromGroup = false;
          attFormParticipantsDraft = newParticipants;
          renderAttFormParticipants();
          if (typeof window.showToast === 'function') window.showToast(`Linked program to User Group: "${group.name}"`);
        }
      });
    }

    // Unassign User Group button
    const unassignUgBtn = document.getElementById('attUnassignUgBtn');
    if (unassignUgBtn) {
      unassignUgBtn.addEventListener('click', async () => {
        const confirmed = await window.showConfirmDialog({
          title: 'Unlink from User Group?',
          message: 'This will convert the attendees into an independent manual roster. Roster updates in User Groups will no longer automatically sync here.',
          confirmText: 'Unlink',
          cancelText: 'Keep Linked'
        });
        if (confirmed) {
          attDraftAssignedGroupId = null;
          attDraftIsCopiedFromGroup = false;
          renderAttFormParticipants();
          if (typeof window.showToast === 'function') window.showToast('Unlinked from User Group. Attendee list is now editable.');
        }
      });
    }

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
        if (typeof window.showToast === 'function') window.showToast('Reset date filter to current date range');
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
          window.showAlertDialog('Export Failed', 'Could not create the JPG export.');
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

  // Export to global scope
  Object.defineProperty(window, 'attendanceData', {
    get: () => attendanceData,
    set: (val) => { attendanceData = val; },
    configurable: true
  });
  Object.defineProperty(window, 'attFormParticipantsDraft', {
    get: () => attFormParticipantsDraft,
    set: (val) => { attFormParticipantsDraft = val; },
    configurable: true
  });
  Object.defineProperty(window, 'attDraftAssignedGroupId', {
    get: () => attDraftAssignedGroupId,
    set: (val) => { attDraftAssignedGroupId = val; },
    configurable: true
  });
  Object.defineProperty(window, 'attDraftIsCopiedFromGroup', {
    get: () => attDraftIsCopiedFromGroup,
    set: (val) => { attDraftIsCopiedFromGroup = val; },
    configurable: true
  });
  window.normalizeAttendeeName = normalizeAttendeeName;
  window.isNameFuzzyMatch = isNameFuzzyMatch;
  window.matchAttendees = matchAttendees;
  window.remapSessionsRecords = remapSessionsRecords;
  window.loadAttendanceDataFromStorage = loadAttendanceDataFromStorage;
  window.saveAttendanceDataToStorage = saveAttendanceDataToStorage;
  window.syncProgramWithAssignedGroup = syncProgramWithAssignedGroup;
  window.showAttScreen = showAttScreen;
  window.renderAttProgramsList = renderAttProgramsList;
  window.openProgramForm = openProgramForm;
  window.saveProgramForm = saveProgramForm;
  window.openProgramMatrix = openProgramMatrix;
  window.openRecordSession = openRecordSession;
  window.isAttRecordSessionDirty = isAttRecordSessionDirty;
  window.confirmUnsavedAttendanceChanges = confirmUnsavedAttendanceChanges;
  window.resetAttRecordInitialState = resetAttRecordInitialState;
  window.loadPresetENG = loadPresetENG;
  window.setupAttendanceEventListeners = setupAttendanceEventListeners;

})(window);
