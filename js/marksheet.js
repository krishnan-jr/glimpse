// Glimpse Mark Sheet & Academic Assessment Management Module
(function(window) {
  'use strict';

  // --- STATE ---
  let marksheetData = { entries: [] };
  let msCurrentActiveEntryId = null;
  let msCurrentEditingEntryId = null;
  let msAvailableClassSubjects = [];
  let msDraftSubjects = []; // [{ id, name, icon, maxMarks, passMarks }]
  let msInitialFormSnapshot = null;
  let msInitialSheetSnapshot = null;
  let msSheetDraftMarks = {}; // { studentId: { marks: { [subId]: markOrAB }, remarks: string } }
  let msSheetSearchQuery = '';
  let msSheetFilterStatus = 'all'; // 'all' | 'passed' | 'failed' | 'incomplete' | 'absent'
  let msSelectedClassIdForForm = null;
  let msSelectedGroupIdForForm = null;

  // --- STORAGE HANDLERS ---
  function loadMarksheetDataFromStorage() {
    try {
      const saved = localStorage.getItem('glimpse_marksheet_data_v1');
      if (saved) {
        marksheetData = JSON.parse(saved);
        if (!marksheetData || typeof marksheetData !== 'object' || !Array.isArray(marksheetData.entries)) {
          marksheetData = { entries: [] };
        }
      } else {
        marksheetData = { entries: [] };
      }
    } catch (e) {
      console.error('[MarkSheet] Error loading marksheet data:', e);
      marksheetData = { entries: [] };
    }
  }

  function saveMarksheetDataToStorage() {
    try {
      localStorage.setItem('glimpse_marksheet_data_v1', JSON.stringify(marksheetData));
    } catch (e) {
      console.error('[MarkSheet] Error saving marksheet data:', e);
    }
  }

  // --- SCREEN NAVIGATION ---
  function showMsScreen(screenId) {
    const screens = document.querySelectorAll('#view-marksheet-app .att-screen');
    screens.forEach(s => s.classList.remove('active'));

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');

    const msBackBtnText = document.getElementById('msBackBtnText');
    if (msBackBtnText) {
      if (screenId === 'ms-screen-entries') {
        msBackBtnText.textContent = 'Dashboard';
      } else {
        msBackBtnText.textContent = 'Mark Sheets';
      }
    }
  }

  function handleMsBackClick() {
    const activeScreen = document.querySelector('#view-marksheet-app .att-screen.active');
    if (activeScreen && activeScreen.id === 'ms-screen-form') {
      if (isMsFormDirty()) {
        confirmUnsavedMsChanges('form').then(confirmed => {
          if (confirmed) {
            msInitialFormSnapshot = null;
            if (typeof window.openMarksheetApp === 'function') window.openMarksheetApp();
          }
        });
      } else {
        if (typeof window.openMarksheetApp === 'function') window.openMarksheetApp();
      }
    } else if (activeScreen && activeScreen.id === 'ms-screen-sheet') {
      if (isMsSheetDirty()) {
        confirmUnsavedMsChanges('sheet').then(confirmed => {
          if (confirmed) {
            msInitialSheetSnapshot = null;
            if (typeof window.openMarksheetApp === 'function') window.openMarksheetApp();
          }
        });
      } else {
        if (typeof window.openMarksheetApp === 'function') window.openMarksheetApp();
      }
    } else {
      if (typeof window.openDashboard === 'function') window.openDashboard();
    }
  }

  // --- DIRTY STATE MANAGEMENT & WARNINGS ---
  function captureMsFormSnapshot() {
    const titleInput = document.getElementById('msEntryTitle');
    const dateInput = document.getElementById('msEntryDate');
    const termInput = document.getElementById('msEntryTerm');
    const classSelect = document.getElementById('msClassSelect');
    const groupSelect = document.getElementById('msUserGroupSelect');
    const maxInp = document.getElementById('msGeneralMaxMarks');
    const passInp = document.getElementById('msGeneralPassMarks');

    msInitialFormSnapshot = {
      title: titleInput ? titleInput.value.trim() : '',
      date: dateInput ? dateInput.value : '',
      term: termInput ? termInput.value.trim() : '',
      classId: classSelect ? classSelect.value : '',
      groupId: groupSelect ? groupSelect.value : '',
      generalMaxMarks: maxInp ? maxInp.value : '100',
      generalPassMarks: passInp ? passInp.value : '35',
      subjects: JSON.parse(JSON.stringify(msDraftSubjects))
    };
  }

  function isMsFormDirty() {
    const activeScreen = document.querySelector('#view-marksheet-app .att-screen.active');
    if (!activeScreen || activeScreen.id !== 'ms-screen-form' || !msInitialFormSnapshot) return false;

    const titleInput = document.getElementById('msEntryTitle');
    const dateInput = document.getElementById('msEntryDate');
    const termInput = document.getElementById('msEntryTerm');
    const classSelect = document.getElementById('msClassSelect');
    const groupSelect = document.getElementById('msUserGroupSelect');
    const maxInp = document.getElementById('msGeneralMaxMarks');
    const passInp = document.getElementById('msGeneralPassMarks');

    if ((titleInput ? titleInput.value.trim() : '') !== msInitialFormSnapshot.title) return true;
    if ((dateInput ? dateInput.value : '') !== msInitialFormSnapshot.date) return true;
    if ((termInput ? termInput.value.trim() : '') !== msInitialFormSnapshot.term) return true;
    if ((classSelect ? classSelect.value : '') !== msInitialFormSnapshot.classId) return true;
    if ((groupSelect ? groupSelect.value : '') !== msInitialFormSnapshot.groupId) return true;
    if ((maxInp ? maxInp.value : '100') !== msInitialFormSnapshot.generalMaxMarks) return true;
    if ((passInp ? passInp.value : '35') !== msInitialFormSnapshot.generalPassMarks) return true;

    if (JSON.stringify(msDraftSubjects) !== JSON.stringify(msInitialFormSnapshot.subjects)) return true;

    return false;
  }

  function captureMsSheetSnapshot() {
    msInitialSheetSnapshot = JSON.parse(JSON.stringify(msSheetDraftMarks));
  }

  function isMsSheetDirty() {
    const activeScreen = document.querySelector('#view-marksheet-app .att-screen.active');
    if (!activeScreen || activeScreen.id !== 'ms-screen-sheet' || !msInitialSheetSnapshot) return false;
    return JSON.stringify(msSheetDraftMarks) !== JSON.stringify(msInitialSheetSnapshot);
  }

  function confirmUnsavedMsChanges(context = 'general') {
    return window.showConfirmDialog({
      title: 'Unsaved Mark Sheet Changes',
      message: 'You have unsaved changes in this mark sheet. Discard changes and navigate away?',
      confirmText: 'Discard & Continue',
      cancelText: 'Stay Here',
      isDanger: true
    });
  }

  // --- ENTRIES LIST SCREEN RENDERING ---
  function renderMsEntriesList() {
    const listEl = document.getElementById('msEntriesList');
    if (!listEl) return;

    loadMarksheetDataFromStorage();
    const searchInput = document.getElementById('msSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let entries = marksheetData.entries || [];
    if (query) {
      entries = entries.filter(e => 
        (e.title && e.title.toLowerCase().includes(query)) ||
        (e.className && e.className.toLowerCase().includes(query)) ||
        (e.groupName && e.groupName.toLowerCase().includes(query)) ||
        (e.term && e.term.toLowerCase().includes(query))
      );
    }

    if (entries.length === 0) {
      listEl.innerHTML = `
        <div class="att-empty-state">
          <div class="empty-icon-wrapper">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h3>${query ? 'No Matching Mark Sheets' : 'No Mark Sheets Yet'}</h3>
          <p>${query ? 'Try changing your search keywords.' : 'Create your first Mark Sheet by selecting a class, choosing subjects, and linking a student group.'}</p>
          ${!query ? `<button type="button" class="btn btn-primary" id="msEmptyCreateBtn" style="margin-top: 12px;">+ Create Mark Sheet</button>` : ''}
        </div>
      `;

      const emptyBtn = document.getElementById('msEmptyCreateBtn');
      if (emptyBtn) {
        emptyBtn.addEventListener('click', () => openMarkSheetForm(null));
      }
      return;
    }

    listEl.innerHTML = entries.map(entry => {
      const studentCount = Array.isArray(entry.students) ? entry.students.length : 0;
      const subjectCount = Array.isArray(entry.subjects) ? entry.subjects.length : 0;
      const totalMaxMarks = Array.isArray(entry.subjects) 
        ? entry.subjects.reduce((sum, s) => sum + (Number(s.maxMarks) || 0), 0)
        : 0;

      // Compute general statistics if marks exist
      let totalStudentsWithMarks = 0;
      let sumPercentages = 0;
      if (Array.isArray(entry.students) && entry.students.length > 0 && subjectCount > 0) {
        entry.students.forEach(st => {
          let stTotal = 0;
          let hasAnyMark = false;
          entry.subjects.forEach(sub => {
            const val = st.marks && st.marks[sub.id];
            if (val !== undefined && val !== null && val !== '' && String(val).toUpperCase() !== 'AB') {
              stTotal += Number(val) || 0;
              hasAnyMark = true;
            }
          });
          if (hasAnyMark && totalMaxMarks > 0) {
            sumPercentages += (stTotal / totalMaxMarks) * 100;
            totalStudentsWithMarks++;
          }
        });
      }

      const avgPercent = totalStudentsWithMarks > 0 ? (sumPercentages / totalStudentsWithMarks).toFixed(1) + '%' : null;
      const formattedDate = entry.date ? new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
      const dateText = formattedDate ? `Date: ${formattedDate}` : 'No date set';

      return `
        <div class="att-program-card ms-entry-card" data-entry-id="${entry.id}">
          <div class="att-card-header">
            <div class="att-card-title-group">
              <h3 class="att-card-title" title="${window.escapeHtml(entry.title || 'Untitled Assessment')}">${window.escapeHtml(entry.title || 'Untitled Assessment')}</h3>
              ${entry.term ? `<div class="att-card-subtitle" title="${window.escapeHtml(entry.term)}">${window.escapeHtml(entry.term)}</div>` : ''}
            </div>
            <button type="button" class="btn-round-arrow ms-open-sheet-btn" data-entry-id="${entry.id}" title="Open ${window.escapeHtml(entry.title || 'Assessment')}" aria-label="Open Mark Sheet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          <div class="att-card-meta-bar">
            <span class="att-meta-chip"><strong>${window.escapeHtml(entry.className || 'Class')}</strong>${entry.groupName ? ` • ${window.escapeHtml(entry.groupName)}` : ''}</span>
            <span class="att-meta-divider"></span>
            <span class="att-meta-chip"><strong>${studentCount}</strong> ${studentCount === 1 ? 'Student' : 'Students'}</span>
            <span class="att-meta-divider"></span>
            <span class="att-meta-chip"><strong>${subjectCount}</strong> ${subjectCount === 1 ? 'Subject' : 'Subjects'}${totalMaxMarks > 0 ? ` (${totalMaxMarks} M)` : ''}</span>
            ${avgPercent ? `
              <span class="att-meta-divider"></span>
              <span class="att-meta-chip" style="color: var(--success); font-weight: 600;"><strong>${avgPercent}</strong> Avg</span>
            ` : ''}
          </div>

          <div class="att-card-footer">
            <div class="att-card-actions">
              <button type="button" class="btn btn-card-action ms-edit-btn" data-entry-id="${entry.id}">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit</span>
              </button>
              <button type="button" class="btn btn-card-action ms-export-btn" data-entry-id="${entry.id}">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Export</span>
              </button>
              <button type="button" class="btn btn-card-action btn-card-delete ms-delete-btn" data-entry-id="${entry.id}">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Delete</span>
              </button>
            </div>
            <span class="att-card-footer-meta">${dateText}</span>
          </div>
        </div>
      `;
    }).join('');

    // Wire Card Event Listeners
    listEl.querySelectorAll('.ms-open-sheet-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const entryId = btn.getAttribute('data-entry-id');
        openMarkSheetWorkspace(entryId);
      });
    });

    listEl.querySelectorAll('.ms-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const entryId = btn.getAttribute('data-entry-id');
        openMarkSheetForm(entryId);
      });
    });

    listEl.querySelectorAll('.ms-export-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const entryId = btn.getAttribute('data-entry-id');
        openMsExportModal(entryId);
      });
    });

    listEl.querySelectorAll('.ms-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const entryId = btn.getAttribute('data-entry-id');
        deleteMarkSheetEntry(entryId);
      });
    });

    // Attach card-level click for instant workspace launch
    listEl.querySelectorAll('.ms-entry-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const entryId = card.getAttribute('data-entry-id');
        openMarkSheetWorkspace(entryId);
      });
    });
  }

  // --- CREATE / EDIT FORM SCREEN ---
  function openMarkSheetForm(entryId = null, pushState = true) {
    const viewDashboard = document.getElementById('view-dashboard');
    const viewGlimpseApp = document.getElementById('view-glimpse-app');
    const viewAttendanceApp = document.getElementById('view-attendance-app');
    const viewUserGroupsApp = document.getElementById('view-user-groups-app');
    const viewClassesApp = document.getElementById('view-classes-app');
    const viewMarksheetApp = document.getElementById('view-marksheet-app');

    if (viewDashboard) viewDashboard.classList.remove('active');
    if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
    if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
    if (viewClassesApp) viewClassesApp.classList.remove('active');
    if (viewMarksheetApp) viewMarksheetApp.classList.add('active');

    loadMarksheetDataFromStorage();
    if (typeof window.loadClassesDataFromStorage === 'function') window.loadClassesDataFromStorage();
    if (typeof window.loadUserGroupsDataFromStorage === 'function') window.loadUserGroupsDataFromStorage();

    msCurrentEditingEntryId = entryId;
    const formTitle = document.getElementById('msFormTitle');
    const formDesc = document.getElementById('msFormDesc');
    const titleInput = document.getElementById('msEntryTitle');
    const dateInput = document.getElementById('msEntryDate');
    const termInput = document.getElementById('msEntryTerm');
    const classSelect = document.getElementById('msClassSelect');
    const groupSelect = document.getElementById('msUserGroupSelect');
    const generalMaxInput = document.getElementById('msGeneralMaxMarks');
    const generalPassInput = document.getElementById('msGeneralPassMarks');

    const allClasses = (window.classesData && Array.isArray(window.classesData.classes)) ? window.classesData.classes : [];

    // Populate Class Select Dropdown
    if (classSelect) {
      if (allClasses.length === 0) {
        classSelect.innerHTML = `<option value="" disabled selected>No classes found. Please create a class first.</option>`;
      } else {
        classSelect.innerHTML = `<option value="" disabled ${!entryId ? 'selected' : ''}>-- Select Class --</option>` +
          allClasses.map(c => `<option value="${c.id}">${window.escapeHtml(c.name)}${c.description ? ` (${window.escapeHtml(c.description)})` : ''}</option>`).join('');
      }
    }

    let targetEntry = null;
    if (entryId) {
      targetEntry = marksheetData.entries.find(e => e.id === entryId);
    }

    if (targetEntry) {
      if (formTitle) formTitle.textContent = 'Edit Mark Sheet';
      if (formDesc) formDesc.textContent = 'Modify assessment configuration, subjects, and scoring parameters.';
      if (titleInput) titleInput.value = targetEntry.title || '';
      if (dateInput) dateInput.value = targetEntry.date || '';
      if (termInput) termInput.value = targetEntry.term || '';
      if (classSelect) classSelect.value = targetEntry.classId || '';

      msSelectedClassIdForForm = targetEntry.classId;
      populateUserGroupsDropdownForClass(targetEntry.classId, targetEntry.groupId);

      // Extract general max / pass mark configuration from entry
      const firstSub = Array.isArray(targetEntry.subjects) && targetEntry.subjects[0];
      if (generalMaxInput) generalMaxInput.value = firstSub ? (Number(firstSub.maxMarks) || 100) : 100;
      if (generalPassInput) generalPassInput.value = firstSub ? (Number(firstSub.passMarks) || 35) : 35;

      // Load available subjects for this class
      loadAvailableClassSubjects(targetEntry.classId);

      // Copy existing configured subjects
      msDraftSubjects = Array.isArray(targetEntry.subjects) ? targetEntry.subjects.map(s => ({
        id: s.id,
        name: s.name,
        icon: s.icon || '📖',
        maxMarks: Number(s.maxMarks) || 100,
        passMarks: Number(s.passMarks) || 35
      })) : [];

    } else {
      if (formTitle) formTitle.textContent = 'Create New Mark Sheet';
      if (formDesc) formDesc.textContent = 'Configure assessment details, subjects, and scoring parameters.';
      if (titleInput) titleInput.value = '';
      if (dateInput) dateInput.value = '';
      if (termInput) termInput.value = 'Term 1';
      if (generalMaxInput) generalMaxInput.value = '100';
      if (generalPassInput) generalPassInput.value = '35';

      // Auto-select active class if available
      const activeClassId = (window.classesData && window.classesData.activeClassId) || (allClasses.length > 0 ? allClasses[0].id : null);
      if (activeClassId && classSelect) {
        classSelect.value = activeClassId;
        msSelectedClassIdForForm = activeClassId;
      } else {
        msSelectedClassIdForForm = null;
      }

      // Populate User Groups assigned to the initial Class
      populateUserGroupsDropdownForClass(msSelectedClassIdForForm);

      // Starts empty by default (user selects which subjects to include)
      msDraftSubjects = [];
      loadAvailableClassSubjects(msSelectedClassIdForForm);
    }

    renderSubjectsManagementInForm();
    showMsScreen('ms-screen-form');
    captureMsFormSnapshot();

    if (pushState && typeof window.navigateToRoute === 'function') {
      window.navigateToRoute(entryId ? `#/marksheet/form?id=${entryId}` : `#/marksheet/form`);
    }
  }

  function populateUserGroupsDropdownForClass(classId, preferredGroupId = null) {
    if (typeof window.loadClassesDataFromStorage === 'function') window.loadClassesDataFromStorage();
    if (typeof window.loadUserGroupsDataFromStorage === 'function') window.loadUserGroupsDataFromStorage();

    const allClasses = (window.classesData && Array.isArray(window.classesData.classes)) ? window.classesData.classes : [];
    const allGroups = (window.userGroupsData && Array.isArray(window.userGroupsData.groups)) ? window.userGroupsData.groups : [];
    const groupSelect = document.getElementById('msUserGroupSelect');
    if (!groupSelect) return;

    if (!classId) {
      groupSelect.innerHTML = `<option value="" disabled selected>-- Select a Class First --</option>`;
      groupSelect.value = '';
      msSelectedGroupIdForForm = null;
      return;
    }

    const chosenClass = allClasses.find(c => c.id === classId);
    if (!chosenClass) {
      groupSelect.innerHTML = `<option value="" disabled selected>-- Select a Class First --</option>`;
      groupSelect.value = '';
      msSelectedGroupIdForForm = null;
      return;
    }

    const assignedGroupIds = Array.isArray(chosenClass.assignedGroupIds)
      ? chosenClass.assignedGroupIds
      : (chosenClass.assignedGroupId ? [chosenClass.assignedGroupId] : []);

    const assignedGroups = allGroups.filter(g => assignedGroupIds.includes(g.id));

    if (assignedGroups.length === 0) {
      const existingFallbackGroup = preferredGroupId ? allGroups.find(g => g.id === preferredGroupId) : null;
      if (existingFallbackGroup) {
        const count = Array.isArray(existingFallbackGroup.members) ? existingFallbackGroup.members.length : 0;
        groupSelect.innerHTML = `<option value="${existingFallbackGroup.id}" selected>${window.escapeHtml(existingFallbackGroup.name)} (${count} member${count === 1 ? '' : 's'})</option>`;
        groupSelect.value = existingFallbackGroup.id;
        msSelectedGroupIdForForm = existingFallbackGroup.id;
      } else {
        groupSelect.innerHTML = `<option value="" disabled selected>No student groups assigned to "${window.escapeHtml(chosenClass.name)}". Please assign a group in Classes.</option>`;
        groupSelect.value = '';
        msSelectedGroupIdForForm = null;
      }
      return;
    }

    const targetGroupId = (preferredGroupId && assignedGroupIds.includes(preferredGroupId))
      ? preferredGroupId
      : assignedGroups[0].id;

    if (assignedGroups.length === 1) {
      const g = assignedGroups[0];
      const count = Array.isArray(g.members) ? g.members.length : 0;
      groupSelect.innerHTML = `<option value="${g.id}" selected>${window.escapeHtml(g.name)} (${count} member${count === 1 ? '' : 's'})</option>`;
      groupSelect.value = g.id;
      msSelectedGroupIdForForm = g.id;
    } else {
      groupSelect.innerHTML = `<option value="" disabled ${!preferredGroupId ? 'selected' : ''}>-- Select Assigned Student Group --</option>` +
        assignedGroups.map(g => {
          const count = Array.isArray(g.members) ? g.members.length : 0;
          const isSel = g.id === targetGroupId ? 'selected' : '';
          return `<option value="${g.id}" ${isSel}>${window.escapeHtml(g.name)} (${count} member${count === 1 ? '' : 's'})</option>`;
        }).join('');
      groupSelect.value = targetGroupId;
      msSelectedGroupIdForForm = targetGroupId;
    }
  }

  function loadAvailableClassSubjects(classId) {
    if (typeof window.loadClassesDataFromStorage === 'function') window.loadClassesDataFromStorage();
    const allClasses = (window.classesData && Array.isArray(window.classesData.classes)) ? window.classesData.classes : [];
    const chosenClass = allClasses.find(c => c.id === classId);
    if (chosenClass && Array.isArray(chosenClass.subjects)) {
      msAvailableClassSubjects = chosenClass.subjects.map(cs => ({
        id: cs.id,
        name: cs.name,
        icon: cs.icon || cs.emoji || '📖'
      }));
    } else {
      msAvailableClassSubjects = [];
    }
  }

  function loadSubjectsAndGroupForSelectedClass(classId) {
    loadAvailableClassSubjects(classId);
    populateUserGroupsDropdownForClass(classId);
    renderSubjectsManagementInForm();
  }

  function openAddSubjectModal() {
    const modal = document.getElementById('msAddSubjectModal');
    const selectEl = document.getElementById('msModalSubjectSelect');
    const maxEl = document.getElementById('msModalSubjectMax');
    const passEl = document.getElementById('msModalSubjectPass');
    const generalMaxInp = document.getElementById('msGeneralMaxMarks');
    const generalPassInp = document.getElementById('msGeneralPassMarks');

    if (!modal || !selectEl) return;

    const remainingSubjects = msAvailableClassSubjects.filter(cs => !msDraftSubjects.some(ds => ds.id === cs.id || ds.name === cs.name));

    if (msAvailableClassSubjects.length === 0) {
      window.showAlertDialog('No Class Subjects', 'There are no subjects configured for the selected class. Please add subjects to the class first.');
      return;
    }

    if (remainingSubjects.length === 0) {
      window.showAlertDialog('All Subjects Added', 'All subjects from the selected class have already been added to this assessment.');
      return;
    }

    selectEl.innerHTML = `<option value="" disabled selected>-- Select Subject --</option>` +
      remainingSubjects.map(s => `<option value="${s.id}">${s.icon ? `${s.icon} ` : ''}${window.escapeHtml(s.name)}</option>`).join('');

    if (maxEl) maxEl.value = generalMaxInp ? (generalMaxInp.value || '100') : '100';
    if (passEl) passEl.value = generalPassInp ? (generalPassInp.value || '35') : '35';

    modal.inert = false;
    modal.classList.add('active');
    modal.removeAttribute('aria-hidden');
    setTimeout(() => selectEl.focus(), 50);
  }

  function closeAddSubjectModal() {
    const modal = document.getElementById('msAddSubjectModal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      modal.inert = true;
    }
  }

  function handleConfirmAddSubjectModal(e) {
    if (e) e.preventDefault();
    const selectEl = document.getElementById('msModalSubjectSelect');
    const maxEl = document.getElementById('msModalSubjectMax');
    const passEl = document.getElementById('msModalSubjectPass');
    const chosenSubId = selectEl ? selectEl.value : '';

    if (!chosenSubId) {
      window.showAlertDialog('Select a Subject', 'Please pick a subject from the dropdown to add.');
      return;
    }

    const sourceSub = msAvailableClassSubjects.find(s => s.id === chosenSubId);
    if (!sourceSub) return;

    const maxMarks = Math.max(1, Number(maxEl ? maxEl.value : 100) || 100);
    const passMarks = Math.max(0, Number(passEl ? passEl.value : 35) || 35);

    msDraftSubjects.push({
      id: sourceSub.id,
      name: sourceSub.name,
      icon: sourceSub.icon || '📖',
      maxMarks,
      passMarks
    });

    closeAddSubjectModal();
    renderSubjectsManagementInForm();
  }

  function renderSubjectsManagementInForm() {
    const countBadge = document.getElementById('msSubjectCountBadge');
    if (countBadge) {
      countBadge.textContent = msDraftSubjects.length;
    }

    const listHeader = document.getElementById('msSubjectsListHeader');
    const listContainer = document.getElementById('msSelectedSubjectsList');
    if (!listContainer) return;

    if (msDraftSubjects.length === 0) {
      if (listHeader) listHeader.style.display = 'none';
      listContainer.innerHTML = `
        <div style="text-align: center; color: var(--muted); padding: 28px 12px; font-size: var(--text-sm);">
          <div style="font-size: 26px; margin-bottom: 6px;">📚</div>
          <div>No subjects added yet. Tap <strong>+ Add Subject</strong> or <strong>+ Add All</strong> above to include subjects in this assessment.</div>
        </div>
      `;
      return;
    }

    if (listHeader) listHeader.style.display = 'grid';

    listContainer.innerHTML = msDraftSubjects.map((sub, idx) => `
      <div class="ms-subject-row" data-id="${sub.id}" data-idx="${idx}">
        <div class="ms-subject-row-info">
          <span class="ms-subject-icon">${window.escapeHtml(sub.icon || '📖')}</span>
          <span class="ms-subject-name" title="${window.escapeHtml(sub.name)}">${window.escapeHtml(sub.name)}</span>
        </div>
        <input type="number" min="1" max="1000" class="ms-item-num-input ms-item-max-input" data-idx="${idx}" value="${sub.maxMarks || 100}" title="Max Marks for ${window.escapeHtml(sub.name)}">
        <input type="number" min="0" max="1000" class="ms-item-num-input ms-item-pass-input" data-idx="${idx}" value="${sub.passMarks || 35}" title="Pass Marks for ${window.escapeHtml(sub.name)}">
        <button type="button" class="action-icon-btn delete ms-remove-subject-btn" data-idx="${idx}" title="Remove ${window.escapeHtml(sub.name)}">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `).join('');

    // Wire inline edits and deletes
    listContainer.querySelectorAll('.ms-item-max-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.getAttribute('data-idx'), 10);
        if (msDraftSubjects[idx]) {
          msDraftSubjects[idx].maxMarks = Math.max(1, Number(inp.value) || 100);
        }
      });
    });

    listContainer.querySelectorAll('.ms-item-pass-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.getAttribute('data-idx'), 10);
        if (msDraftSubjects[idx]) {
          msDraftSubjects[idx].passMarks = Math.max(0, Number(inp.value) || 35);
        }
      });
    });

    listContainer.querySelectorAll('.ms-remove-subject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (msDraftSubjects[idx]) {
          msDraftSubjects.splice(idx, 1);
          renderSubjectsManagementInForm();
        }
      });
    });
  }

  // Handle Class Change with Warning Prompts
  async function handleClassSelectionChange(newClassId) {
    if (!newClassId || newClassId === msSelectedClassIdForForm) return;

    const hasExistingMarks = msCurrentEditingEntryId && marksheetData.entries.some(e => {
      if (e.id !== msCurrentEditingEntryId) return false;
      return Array.isArray(e.students) && e.students.some(st => st.marks && Object.keys(st.marks).length > 0);
    });

    if (hasExistingMarks || msDraftSubjects.length > 0) {
      const confirmed = await window.showConfirmDialog({
        title: 'Change Class?',
        message: 'Changing the selected class will update available subjects and the student roster. Any previously added subjects for this assessment will be reset. Proceed?',
        confirmText: 'Change Class',
        cancelText: 'Keep Current Class',
        isDanger: true
      });

      if (!confirmed) {
        const classSelect = document.getElementById('msClassSelect');
        if (classSelect) classSelect.value = msSelectedClassIdForForm || '';
        return;
      }
    }

    msSelectedClassIdForForm = newClassId;
    msDraftSubjects = [];
    loadSubjectsAndGroupForSelectedClass(newClassId);
  }

  // Save Mark Sheet Form Handler
  async function handleSaveMarkSheetForm(e) {
    if (e) e.preventDefault();

    const titleInput = document.getElementById('msEntryTitle');
    const dateInput = document.getElementById('msEntryDate');
    const termInput = document.getElementById('msEntryTerm');
    const classSelect = document.getElementById('msClassSelect');
    const groupSelect = document.getElementById('msUserGroupSelect');

    const title = titleInput ? titleInput.value.trim() : '';
    const date = dateInput ? dateInput.value.trim() : '';
    const term = termInput ? termInput.value.trim() : 'Term 1';
    const classId = classSelect ? classSelect.value : '';
    const groupId = groupSelect ? groupSelect.value : '';

    if (!title) {
      window.showAlertDialog('Missing Information', 'Please enter a title for this mark sheet assessment.');
      if (titleInput) titleInput.focus();
      return;
    }

    if (!classId) {
      window.showAlertDialog('Missing Class', 'Please select a class for this mark sheet.');
      if (classSelect) classSelect.focus();
      return;
    }

    if (!groupId) {
      window.showAlertDialog('Missing User Group', 'Please select a student user group for this mark sheet.');
      if (groupSelect) groupSelect.focus();
      return;
    }

    if (msDraftSubjects.length === 0) {
      window.showAlertDialog('No Subjects Added', 'Please add at least one subject for this assessment.');
      return;
    }

    // Retrieve Class and Group Names
    if (typeof window.loadClassesDataFromStorage === 'function') window.loadClassesDataFromStorage();
    if (typeof window.loadUserGroupsDataFromStorage === 'function') window.loadUserGroupsDataFromStorage();

    const allClasses = (window.classesData && Array.isArray(window.classesData.classes)) ? window.classesData.classes : [];
    const allGroups = (window.userGroupsData && Array.isArray(window.userGroupsData.groups)) ? window.userGroupsData.groups : [];

    const targetClass = allClasses.find(c => c.id === classId);
    const targetGroup = allGroups.find(g => g.id === groupId);

    const className = targetClass ? targetClass.name : 'Class';
    const groupName = targetGroup ? targetGroup.name : 'Group';
    const groupMembers = (targetGroup && Array.isArray(targetGroup.members)) ? targetGroup.members : [];

    if (groupMembers.length === 0) {
      const proceed = await window.showConfirmDialog({
        title: 'Empty User Group',
        message: `The selected user group "${groupName}" currently has 0 members. Would you like to create this mark sheet anyway?`,
        confirmText: 'Create Anyway',
        cancelText: 'Cancel',
        isDanger: false
      });
      if (!proceed) return;
    }

    loadMarksheetDataFromStorage();

    if (msCurrentEditingEntryId) {
      // Update existing entry
      const entryIdx = marksheetData.entries.findIndex(e => e.id === msCurrentEditingEntryId);
      if (entryIdx !== -1) {
        const existingEntry = marksheetData.entries[entryIdx];
        
        // Merge student roster: preserve existing student marks where student ID or RollNo matches
        const updatedStudents = groupMembers.map((m, idx) => {
          const existingStudent = Array.isArray(existingEntry.students) 
            ? existingEntry.students.find(st => st.id === m.id || (st.rollNo === m.rollNo && st.name === m.name))
            : null;

          const existingMarks = (existingStudent && existingStudent.marks) ? existingStudent.marks : {};
          const filteredMarks = {};
          // Only keep marks for subjects that remain in draft
          msDraftSubjects.forEach(s => {
            if (existingMarks[s.id] !== undefined) {
              filteredMarks[s.id] = existingMarks[s.id];
            }
          });

          return {
            id: m.id || `mem_${Date.now()}_${idx}`,
            rollNo: (m.rollNo !== undefined && m.rollNo !== null && String(m.rollNo).trim() !== '') ? String(m.rollNo).trim() : String(idx + 1),
            name: m.name || 'Student',
            marks: filteredMarks,
            remarks: (existingStudent && existingStudent.remarks) ? existingStudent.remarks : ''
          };
        });

        marksheetData.entries[entryIdx] = {
          ...existingEntry,
          title,
          date,
          term,
          classId,
          className,
          groupId,
          groupName,
          subjects: msDraftSubjects.map(s => ({
            id: s.id,
            name: s.name,
            icon: s.icon || '📖',
            maxMarks: Number(s.maxMarks) || 100,
            passMarks: Number(s.passMarks) || 35
          })),
          students: updatedStudents,
          updatedAt: new Date().toISOString()
        };

        saveMarksheetDataToStorage();
        msInitialFormSnapshot = null;
        window.showToast('Mark Sheet updated successfully! ✨');
        openMarkSheetWorkspace(msCurrentEditingEntryId);
      }
    } else {
      // Create new assessment entry
      const newEntryId = `ms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const students = groupMembers.map((m, idx) => ({
        id: m.id || `mem_${Date.now()}_${idx}`,
        rollNo: (m.rollNo !== undefined && m.rollNo !== null && String(m.rollNo).trim() !== '') ? String(m.rollNo).trim() : String(idx + 1),
        name: m.name || 'Student',
        marks: {},
        remarks: ''
      }));

      const newEntry = {
        id: newEntryId,
        title,
        date,
        term,
        classId,
        className,
        groupId,
        groupName,
        subjects: msDraftSubjects.map(s => ({
          id: s.id,
          name: s.name,
          icon: s.icon || '📖',
          maxMarks: Number(s.maxMarks) || 100,
          passMarks: Number(s.passMarks) || 35
        })),
        students,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      marksheetData.entries.unshift(newEntry);
      saveMarksheetDataToStorage();
      msInitialFormSnapshot = null;
      window.showToast('Mark Sheet created successfully! 🎉');
      openMarkSheetWorkspace(newEntryId);
    }
  }

  // --- DELETE ENTRY ---
  async function deleteMarkSheetEntry(entryId) {
    loadMarksheetDataFromStorage();
    const entry = marksheetData.entries.find(e => e.id === entryId);
    if (!entry) return;

    const confirmed = await window.showConfirmDialog({
      title: 'Delete Mark Sheet?',
      message: `Are you sure you want to permanently delete "${entry.title}"? All student marks for this assessment will be removed.`,
      confirmText: 'Delete Mark Sheet',
      cancelText: 'Cancel',
      isDanger: true
    });

    if (confirmed) {
      marksheetData.entries = marksheetData.entries.filter(e => e.id !== entryId);
      saveMarksheetDataToStorage();
      window.showToast('Mark Sheet deleted.');
      renderMsEntriesList();
    }
  }

  // --- MARK ENTRY SHEET WORKSPACE SCREEN ---
  function openMarkSheetWorkspace(entryId, pushState = true) {
    const viewDashboard = document.getElementById('view-dashboard');
    const viewGlimpseApp = document.getElementById('view-glimpse-app');
    const viewAttendanceApp = document.getElementById('view-attendance-app');
    const viewUserGroupsApp = document.getElementById('view-user-groups-app');
    const viewClassesApp = document.getElementById('view-classes-app');
    const viewMarksheetApp = document.getElementById('view-marksheet-app');

    if (viewDashboard) viewDashboard.classList.remove('active');
    if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
    if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
    if (viewClassesApp) viewClassesApp.classList.remove('active');
    if (viewMarksheetApp) viewMarksheetApp.classList.add('active');

    loadMarksheetDataFromStorage();
    const entry = marksheetData.entries.find(e => e.id === entryId);
    if (!entry) {
      window.showToast('Mark Sheet not found.');
      openMarksheetApp();
      return;
    }

    msCurrentActiveEntryId = entryId;
    msSheetSearchQuery = '';
    msSheetFilterStatus = 'all';

    // Populate draft marks from entry students
    msSheetDraftMarks = {};
    if (Array.isArray(entry.students)) {
      entry.students.forEach(st => {
        msSheetDraftMarks[st.id] = {
          marks: { ...(st.marks || {}) },
          remarks: st.remarks || ''
        };
      });
    }

    // Set Workspace Header Details
    const titleEl = document.getElementById('msSheetWorkspaceTitle');
    const subtitleEl = document.getElementById('msSheetWorkspaceSubtitle');
    const searchInput = document.getElementById('msSheetStudentSearchInput');

    if (titleEl) titleEl.textContent = entry.title || 'Mark Sheet';
    if (subtitleEl) {
      const formattedDate = entry.date ? new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
      const parts = [];
      if (entry.className) parts.push(`Class <strong>${window.escapeHtml(entry.className)}</strong>`);
      if (entry.groupName) parts.push(`<strong>${window.escapeHtml(entry.groupName)}</strong>`);
      const subCount = (entry.subjects || []).length;
      parts.push(`<strong>${subCount} ${subCount === 1 ? 'Subject' : 'Subjects'}</strong>`);
      if (formattedDate) parts.push(formattedDate);
      subtitleEl.innerHTML = parts.join(' • ');
    }
    if (searchInput) searchInput.value = '';

    renderMsFilterChips();
    renderMsSheetTableAndStats();
    showMsScreen('ms-screen-sheet');
    captureMsSheetSnapshot();

    if (pushState && typeof window.navigateToRoute === 'function') {
      window.navigateToRoute(`#/marksheet/sheet?id=${entryId}`);
    }
  }

  function renderMsFilterChips() {
    const chips = document.querySelectorAll('.ms-filter-chip');
    chips.forEach(chip => {
      const filter = chip.getAttribute('data-filter');
      if (filter === msSheetFilterStatus) {
        chip.classList.add('active');
        chip.setAttribute('aria-selected', 'true');
      } else {
        chip.classList.remove('active');
        chip.setAttribute('aria-selected', 'false');
      }
    });
  }

  function calculateStudentStats(entry, student, studentDraft) {
    const subjects = entry.subjects || [];
    const totalMaxMarks = subjects.reduce((sum, s) => sum + (Number(s.maxMarks) || 0), 0);
    const marksObj = (studentDraft && studentDraft.marks) || {};

    let totalObtained = 0;
    let isAbsentAll = true;
    let hasAnyMark = false;
    let hasFailedAny = false;
    let incompleteCount = 0;

    subjects.forEach(sub => {
      const val = marksObj[sub.id];
      if (val === undefined || val === null || val === '') {
        incompleteCount++;
        isAbsentAll = false;
      } else if (String(val).toUpperCase() === 'AB') {
        // Absent for this subject
      } else {
        const numVal = Number(val);
        if (!isNaN(numVal)) {
          totalObtained += numVal;
          hasAnyMark = true;
          isAbsentAll = false;
          if (numVal < (Number(sub.passMarks) || 0)) {
            hasFailedAny = true;
          }
        } else {
          incompleteCount++;
          isAbsentAll = false;
        }
      }
    });

    const percentage = (totalMaxMarks > 0 && hasAnyMark) ? (totalObtained / totalMaxMarks) * 100 : 0;
    
    // Determine letter grade
    let grade = 'F';
    let gradeBadgeClass = 'badge-danger';

    if (isAbsentAll && subjects.length > 0) {
      grade = 'AB';
      gradeBadgeClass = 'badge-muted';
    } else if (incompleteCount > 0 && !hasAnyMark) {
      grade = '—';
      gradeBadgeClass = 'badge-muted';
    } else if (hasFailedAny) {
      grade = 'F';
      gradeBadgeClass = 'badge-danger';
    } else if (percentage >= 90) {
      grade = 'A+';
      gradeBadgeClass = 'badge-success';
    } else if (percentage >= 80) {
      grade = 'A';
      gradeBadgeClass = 'badge-success';
    } else if (percentage >= 70) {
      grade = 'B';
      gradeBadgeClass = 'badge-primary';
    } else if (percentage >= 60) {
      grade = 'C';
      gradeBadgeClass = 'badge-primary';
    } else if (percentage >= 50) {
      grade = 'D';
      gradeBadgeClass = 'badge-warning';
    } else if (percentage >= 35) {
      grade = 'E';
      gradeBadgeClass = 'badge-warning';
    } else {
      grade = 'F';
      gradeBadgeClass = 'badge-danger';
    }

    const isPassed = !isAbsentAll && !hasFailedAny && incompleteCount === 0 && percentage >= 35;
    const isFailed = hasFailedAny || (percentage < 35 && hasAnyMark);
    const isIncomplete = incompleteCount > 0 && !isAbsentAll;

    return {
      totalObtained,
      totalMaxMarks,
      percentage: Number(percentage.toFixed(1)),
      grade,
      gradeBadgeClass,
      hasAnyMark,
      isAbsentAll,
      isPassed,
      isFailed,
      isIncomplete
    };
  }

  function renderMsSheetTableAndStats() {
    loadMarksheetDataFromStorage();
    const entry = marksheetData.entries.find(e => e.id === msCurrentActiveEntryId);
    if (!entry) return;

    const subjects = entry.subjects || [];
    const allStudents = entry.students || [];

    // Calculate Overall Summary Statistics
    let totalAssessedStudents = 0;
    let totalPassedStudents = 0;
    let sumPercentages = 0;
    let highestTotal = 0;
    let topScorerName = '—';

    allStudents.forEach(st => {
      const stats = calculateStudentStats(entry, st, msSheetDraftMarks[st.id]);
      if (stats.hasAnyMark || stats.isAbsentAll) {
        totalAssessedStudents++;
        if (stats.isPassed) totalPassedStudents++;
        if (stats.hasAnyMark) {
          sumPercentages += stats.percentage;
          if (stats.totalObtained > highestTotal) {
            highestTotal = stats.totalObtained;
            topScorerName = `${st.name} (${highestTotal}/${stats.totalMaxMarks})`;
          }
        }
      }
    });

    const classAveragePercent = totalAssessedStudents > 0 ? (sumPercentages / totalAssessedStudents).toFixed(1) + '%' : '—';
    const passRatePercent = totalAssessedStudents > 0 ? ((totalPassedStudents / totalAssessedStudents) * 100).toFixed(1) + '%' : '—';

    // Update Summary Cards
    const totalStudentsStat = document.getElementById('msStatTotalStudents');
    const classAvgStat = document.getElementById('msStatClassAvg');
    const highestScoreStat = document.getElementById('msStatHighestScore');
    const passRateStat = document.getElementById('msStatPassRate');

    if (totalStudentsStat) totalStudentsStat.textContent = allStudents.length;
    if (classAvgStat) classAvgStat.textContent = classAveragePercent;
    if (highestScoreStat) highestScoreStat.textContent = highestTotal > 0 ? topScorerName : '—';
    if (passRateStat) passRateStat.textContent = passRatePercent;

    // Filter Students for Table
    const query = (msSheetSearchQuery || '').toLowerCase();
    const filteredStudents = allStudents.filter(st => {
      const matchQuery = !query || 
        (st.name && st.name.toLowerCase().includes(query)) ||
        (st.rollNo && String(st.rollNo).toLowerCase().includes(query));
      if (!matchQuery) return false;

      const stats = calculateStudentStats(entry, st, msSheetDraftMarks[st.id]);
      if (msSheetFilterStatus === 'passed') return stats.isPassed;
      if (msSheetFilterStatus === 'failed') return stats.isFailed;
      if (msSheetFilterStatus === 'incomplete') return stats.isIncomplete;
      if (msSheetFilterStatus === 'absent') return stats.isAbsentAll;
      return true;
    });

    const tableContainer = document.getElementById('msMatrixTableWrapper');
    if (!tableContainer) return;

    if (filteredStudents.length === 0) {
      tableContainer.innerHTML = `
        <div class="att-empty-state" style="padding: 40px 16px;">
          <p style="color: var(--muted); font-size: var(--text-sm);">
            ${query || msSheetFilterStatus !== 'all' ? 'No students match the selected filter.' : 'No students found in this user group.'}
          </p>
        </div>
      `;
      return;
    }

    const tableHeadHtml = `
      <thead>
        <tr>
          <th class="col-participant" style="min-width: 180px; text-align: left;">Student (${filteredStudents.length})</th>
          ${subjects.map(sub => `
            <th class="col-subject-header" data-sub-id="${sub.id}">
              <div class="ms-th-subject-name" title="${window.escapeHtml(sub.name)}">${window.escapeHtml(sub.name)}</div>
              <div class="ms-th-subject-meta">${sub.maxMarks || 100} M • Pass ${sub.passMarks || 35}</div>
            </th>
          `).join('')}
          <th style="min-width: 90px; text-align: center;">Total</th>
          <th style="min-width: 75px; text-align: center;">%</th>
          <th style="min-width: 75px; text-align: center;">Grade</th>
          <th style="min-width: 140px; text-align: left;">Remarks</th>
        </tr>
      </thead>
    `;

    const tableBodyHtml = `
      <tbody>
        ${filteredStudents.map((st, sIdx) => {
          const draft = msSheetDraftMarks[st.id] || { marks: {}, remarks: '' };
          const stats = calculateStudentStats(entry, st, draft);
          const rollNo = st.rollNo !== undefined && st.rollNo !== '' ? st.rollNo : sIdx + 1;

          return `
            <tr class="ms-student-row" data-student-id="${st.id}" data-row-idx="${sIdx}">
              <td class="cell-participant">
                <span style="color: var(--muted); font-weight: 700; margin-right: 6px;">${window.escapeHtml(String(rollNo))}.</span>
                <span style="font-weight: 600; color: var(--fg); font-size: var(--text-sm);">${window.escapeHtml(st.name)}</span>
              </td>
              ${subjects.map((sub, subIdx) => {
                const rawVal = draft.marks && draft.marks[sub.id];
                const displayVal = rawVal !== undefined && rawVal !== null ? rawVal : '';
                const numVal = Number(displayVal);
                const isFail = !isNaN(numVal) && displayVal !== '' && String(displayVal).toUpperCase() !== 'AB' && numVal < (Number(sub.passMarks) || 0);
                const isInvalid = !isNaN(numVal) && (numVal < 0 || numVal > (Number(sub.maxMarks) || 100));

                return `
                  <td class="ms-mark-cell" style="text-align: center;">
                    <input 
                      type="text" 
                      class="input-control ms-mark-input ${isFail ? 'mark-failed' : ''} ${isInvalid ? 'mark-invalid' : ''}" 
                      value="${window.escapeHtml(String(displayVal))}" 
                      placeholder="—"
                      data-student-id="${st.id}" 
                      data-subject-id="${sub.id}"
                      data-max="${sub.maxMarks || 100}"
                      data-pass="${sub.passMarks || 35}"
                      data-row-idx="${sIdx}"
                      data-col-idx="${subIdx}"
                      aria-label="${st.name} ${sub.name} marks"
                    >
                  </td>
                `;
              }).join('')}
              <td class="ms-total-cell" style="text-align: center; font-weight: 700; color: var(--fg);">
                ${stats.hasAnyMark ? `<span class="summary-pill">${stats.totalObtained} / ${stats.totalMaxMarks}</span>` : '—'}
              </td>
              <td class="ms-percent-cell" style="text-align: center; font-weight: 700; color: ${stats.isFailed ? 'var(--danger)' : 'var(--fg)'};">
                ${stats.hasAnyMark ? `${stats.percentage}%` : '—'}
              </td>
              <td class="ms-grade-cell" style="text-align: center;">
                <span class="ms-grade-badge ${stats.gradeBadgeClass}">${stats.grade}</span>
              </td>
              <td class="ms-remarks-cell">
                <input 
                  type="text" 
                  class="input-control ms-remarks-input" 
                  value="${window.escapeHtml(draft.remarks || '')}" 
                  placeholder="Notes..."
                  data-student-id="${st.id}"
                >
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    `;

    tableContainer.innerHTML = `
      <table class="att-table ms-matrix-table">
        ${tableHeadHtml}
        ${tableBodyHtml}
      </table>
    `;

    // Wire Mark Input Events & Live Keyboard Navigation
    tableContainer.querySelectorAll('.ms-mark-input').forEach(input => {
      input.addEventListener('input', (e) => {
        handleMarkCellInput(input);
        scheduleDebouncedAutoSave();
      });

      input.addEventListener('keydown', (e) => {
        handleMarkCellKeyNav(e, input);
      });
    });

    tableContainer.querySelectorAll('.ms-remarks-input').forEach(input => {
      input.addEventListener('input', () => {
        const studentId = input.getAttribute('data-student-id');
        if (!msSheetDraftMarks[studentId]) {
          msSheetDraftMarks[studentId] = { marks: {}, remarks: '' };
        }
        msSheetDraftMarks[studentId].remarks = input.value.trim();
        scheduleDebouncedAutoSave();
      });
    });
  }

  function handleMarkCellInput(input) {
    const studentId = input.getAttribute('data-student-id');
    const subjectId = input.getAttribute('data-subject-id');
    const maxMarks = Number(input.getAttribute('data-max')) || 100;
    const passMarks = Number(input.getAttribute('data-pass')) || 35;

    let rawVal = input.value.trim();
    if (!msSheetDraftMarks[studentId]) {
      msSheetDraftMarks[studentId] = { marks: {}, remarks: '' };
    }

    if (rawVal === '') {
      delete msSheetDraftMarks[studentId].marks[subjectId];
      input.classList.remove('mark-failed', 'mark-invalid');
    } else if (rawVal.toUpperCase() === 'AB') {
      msSheetDraftMarks[studentId].marks[subjectId] = 'AB';
      input.value = 'AB';
      input.classList.remove('mark-failed', 'mark-invalid');
    } else {
      const numVal = Number(rawVal);
      if (!isNaN(numVal)) {
        msSheetDraftMarks[studentId].marks[subjectId] = numVal;
        input.classList.toggle('mark-failed', numVal < passMarks);
        input.classList.toggle('mark-invalid', numVal < 0 || numVal > maxMarks);
      }
    }

    // Live update student's row stats without full table re-render
    updateStudentRowStats(studentId);
    updateTopSummaryStats();
  }

  function updateStudentRowStats(studentId) {
    loadMarksheetDataFromStorage();
    const entry = marksheetData.entries.find(e => e.id === msCurrentActiveEntryId);
    if (!entry) return;

    const student = (entry.students || []).find(st => st.id === studentId);
    if (!student) return;

    const row = document.querySelector(`.ms-student-row[data-student-id="${studentId}"]`);
    if (!row) return;

    const stats = calculateStudentStats(entry, student, msSheetDraftMarks[studentId]);

    const totalCell = row.querySelector('.ms-total-cell');
    const percentCell = row.querySelector('.ms-percent-cell');
    const gradeCell = row.querySelector('.ms-grade-cell');

    if (totalCell) {
      totalCell.innerHTML = stats.hasAnyMark 
        ? `${stats.totalObtained} <span style="font-size: 11px; color: var(--muted); font-weight: 400;">/ ${stats.totalMaxMarks}</span>` 
        : '—';
    }
    if (percentCell) {
      percentCell.textContent = stats.hasAnyMark ? `${stats.percentage}%` : '—';
      percentCell.style.color = stats.isFailed ? 'var(--danger)' : 'var(--fg)';
    }
    if (gradeCell) {
      gradeCell.innerHTML = `<span class="ms-grade-badge ${stats.gradeBadgeClass}">${stats.grade}</span>`;
    }
  }

  function updateTopSummaryStats() {
    loadMarksheetDataFromStorage();
    const entry = marksheetData.entries.find(e => e.id === msCurrentActiveEntryId);
    if (!entry) return;

    const allStudents = entry.students || [];
    let totalAssessedStudents = 0;
    let totalPassedStudents = 0;
    let sumPercentages = 0;
    let highestTotal = 0;
    let topScorerName = '—';

    allStudents.forEach(st => {
      const stats = calculateStudentStats(entry, st, msSheetDraftMarks[st.id]);
      if (stats.hasAnyMark || stats.isAbsentAll) {
        totalAssessedStudents++;
        if (stats.isPassed) totalPassedStudents++;
        if (stats.hasAnyMark) {
          sumPercentages += stats.percentage;
          if (stats.totalObtained > highestTotal) {
            highestTotal = stats.totalObtained;
            topScorerName = `${st.name} (${highestTotal}/${stats.totalMaxMarks})`;
          }
        }
      }
    });

    const classAveragePercent = totalAssessedStudents > 0 ? (sumPercentages / totalAssessedStudents).toFixed(1) + '%' : '—';
    const passRatePercent = totalAssessedStudents > 0 ? ((totalPassedStudents / totalAssessedStudents) * 100).toFixed(1) + '%' : '—';

    const classAvgStat = document.getElementById('msStatClassAvg');
    const highestScoreStat = document.getElementById('msStatHighestScore');
    const passRateStat = document.getElementById('msStatPassRate');

    if (classAvgStat) classAvgStat.textContent = classAveragePercent;
    if (highestScoreStat) highestScoreStat.textContent = highestTotal > 0 ? topScorerName : '—';
    if (passRateStat) passRateStat.textContent = passRatePercent;
  }

  function handleMarkCellKeyNav(e, currentInput) {
    const rowIdx = parseInt(currentInput.getAttribute('data-row-idx'), 10);
    const colIdx = parseInt(currentInput.getAttribute('data-col-idx'), 10);

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.querySelector(`.ms-mark-input[data-row-idx="${rowIdx + 1}"][data-col-idx="${colIdx}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.querySelector(`.ms-mark-input[data-row-idx="${rowIdx - 1}"][data-col-idx="${colIdx}"]`);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  }

  // Persist draft marks to storage
  // Debounce timer for auto-save
  let _autoSaveTimer = null;

  function autoPersistDraftMarks(silent = false) {
    if (!msCurrentActiveEntryId) return;
    loadMarksheetDataFromStorage();
    const entryIdx = marksheetData.entries.findIndex(e => e.id === msCurrentActiveEntryId);
    if (entryIdx === -1) return;

    const entry = marksheetData.entries[entryIdx];
    if (Array.isArray(entry.students)) {
      entry.students.forEach(st => {
        const draft = msSheetDraftMarks[st.id];
        if (draft) {
          st.marks = { ...(draft.marks || {}) };
          st.remarks = draft.remarks || '';
        }
      });
    }

    entry.updatedAt = new Date().toISOString();
    saveMarksheetDataToStorage();
    captureMsSheetSnapshot();

    if (!silent) {
      flashSavedIndicator();
    }
  }

  function scheduleDebouncedAutoSave() {
    if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(() => {
      autoPersistDraftMarks(false);
    }, 600);
  }

  function flashSavedIndicator() {
    const btn = document.getElementById('msSheetSaveBtn');
    if (!btn) return;
    btn.classList.add('saved-flash');
    const original = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Saved`;
    setTimeout(() => {
      btn.innerHTML = original;
      btn.classList.remove('saved-flash');
    }, 1800);
  }

  function saveMarkSheetScoresExplicit() {
    autoPersistDraftMarks(false);
  }

  // --- QUICK SHEET ACTIONS ---
  async function markRemainingBlankAsAbsent() {
    loadMarksheetDataFromStorage();
    const entry = marksheetData.entries.find(e => e.id === msCurrentActiveEntryId);
    if (!entry) return;

    const confirmed = await window.showConfirmDialog({
      title: 'Mark Remaining Absent?',
      message: 'This will fill all blank/unrecorded subject scores with "AB" (Absent). Existing scores will not be changed.',
      confirmText: 'Mark Absent',
      cancelText: 'Cancel',
      isDanger: false
    });

    if (confirmed) {
      const subjects = entry.subjects || [];
      const students = entry.students || [];

      students.forEach(st => {
        if (!msSheetDraftMarks[st.id]) {
          msSheetDraftMarks[st.id] = { marks: {}, remarks: '' };
        }
        subjects.forEach(sub => {
          if (msSheetDraftMarks[st.id].marks[sub.id] === undefined || msSheetDraftMarks[st.id].marks[sub.id] === '') {
            msSheetDraftMarks[st.id].marks[sub.id] = 'AB';
          }
        });
      });

      renderMsSheetTableAndStats();
      autoPersistDraftMarks();
      window.showToast('Unrecorded marks set to Absent (AB).');
    }
  }

  async function clearAllSheetMarks() {
    const confirmed = await window.showConfirmDialog({
      title: 'Clear All Marks?',
      message: 'Are you sure you want to clear all entered marks for this assessment sheet? This action cannot be undone.',
      confirmText: 'Clear All Marks',
      cancelText: 'Cancel',
      isDanger: true
    });

    if (confirmed) {
      Object.keys(msSheetDraftMarks).forEach(stId => {
        msSheetDraftMarks[stId].marks = {};
      });

      renderMsSheetTableAndStats();
      autoPersistDraftMarks();
      window.showToast('All marks cleared.');
    }
  }

  // --- EXPORT MODAL & GENERATION ---
  let msExportingEntryId = null;

  function openMsExportModal(entryId) {
    msExportingEntryId = entryId || msCurrentActiveEntryId;
    loadMarksheetDataFromStorage();
    const entry = marksheetData.entries.find(e => e.id === msExportingEntryId);
    if (!entry) return;

    const modal = document.getElementById('msExportModal');
    const titleEl = document.getElementById('msExportModalTitle');
    const descEl = document.getElementById('msExportModalDesc');

    if (titleEl) titleEl.textContent = `Export: ${entry.title}`;
    if (descEl) descEl.textContent = `Class ${entry.className} • ${entry.groupName} (${(entry.students || []).length} Students)`;

    if (modal) {
      modal.inert = false;
      modal.classList.add('active');
      modal.removeAttribute('aria-hidden');
    }
  }

  function closeMsExportModal() {
    const modal = document.getElementById('msExportModal');
    if (!modal) return;
    if (document.activeElement && modal.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    modal.inert = true;
  }

  function exportMarkSheetAsCSV() {
    loadMarksheetDataFromStorage();
    const entry = marksheetData.entries.find(e => e.id === msExportingEntryId);
    if (!entry) return;

    const subjects = entry.subjects || [];
    const students = entry.students || [];

    const headers = ['Roll No', 'Student Name', ...subjects.map(s => `${s.name} (Max: ${s.maxMarks})`), 'Total Obtained', 'Max Total', 'Percentage (%)', 'Grade', 'Remarks'];

    const rows = students.map(st => {
      const stats = calculateStudentStats(entry, st, { marks: st.marks || {}, remarks: st.remarks });
      const subjectMarks = subjects.map(s => {
        const val = st.marks && st.marks[s.id];
        return val !== undefined && val !== null ? String(val) : '';
      });

      return [
        `"${String(st.rollNo || '').replace(/"/g, '""')}"`,
        `"${String(st.name || '').replace(/"/g, '""')}"`,
        ...subjectMarks.map(m => `"${m.replace(/"/g, '""')}"`),
        stats.hasAnyMark ? stats.totalObtained : '',
        stats.totalMaxMarks,
        stats.hasAnyMark ? stats.percentage : '',
        stats.grade,
        `"${String(st.remarks || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `MarkSheet-${(entry.title || 'assessment').replace(/[^a-zA-Z0-9]/g, '_')}-${entry.className}.csv`;
    
    if (typeof window.downloadBlob === 'function') {
      window.downloadBlob(blob, filename);
    }
    closeMsExportModal();
    window.showToast('CSV export downloaded! 📊');
  }

  function printMarkSheetReport() {
    loadMarksheetDataFromStorage();
    const entry = marksheetData.entries.find(e => e.id === msExportingEntryId);
    if (!entry) return;

    const subjects = entry.subjects || [];
    const students = entry.students || [];

    const formattedDate = entry.date ? new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

    // Compute uniform width for all subject columns
    // Fixed columns: Roll(45px) + Name(140px) + Total(65px) + %(55px) + Grade(50px) + Remarks(100px) = 455px fixed
    // Remaining width spread equally across subjects
    const subjectColWidthPct = subjects.length > 0
      ? Math.floor((100 - 50) / subjects.length)  // reserve ~50% for fixed cols, rest for subjects
      : 5;

    let printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${window.escapeHtml(entry.title || 'Mark Sheet')} - ${window.escapeHtml(entry.className)}</title>
        <style>
          @page { size: landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #211922; background: #fff; padding: 16px; }
          .header { text-align: center; border-bottom: 2px solid #211922; padding-bottom: 12px; margin-bottom: 16px; }
          .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; }
          .header p { margin: 0; font-size: 13px; color: #62625b; }
          .meta-grid { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 12px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; table-layout: fixed; }
          th, td { border: 1px solid #d0d0c8; padding: 5px 4px; text-align: center; overflow: hidden; word-break: break-word; }
          th { background: #f6f6f3; font-weight: 700; }
          th.name-col, td.name-col { text-align: left; padding-left: 8px; }
          .col-roll { width: 36px; }
          .col-name { width: 130px; }
          .col-total { width: 60px; }
          .col-pct { width: 46px; }
          .col-grade { width: 44px; }
          .col-remarks { width: 90px; }
          .col-subject { width: ${subjectColWidthPct}%; }
          .col-subject .sub-max { font-size: 9px; font-weight: 400; color: #62625b; }
          .grade-pass { color: #103c25; font-weight: 700; }
          .grade-fail { color: #9e0a0a; font-weight: 700; }
          .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; color: #91918c; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${window.escapeHtml(entry.title || 'Mark Sheet Assessment')}</h1>
          <p>${window.escapeHtml(entry.term || '')} • Academic Assessment Report</p>
        </div>

        <div class="meta-grid">
          <div>Class: <strong>${window.escapeHtml(entry.className)}</strong> | Group: <strong>${window.escapeHtml(entry.groupName)}</strong></div>
          <div>Date: <strong>${formattedDate}</strong> | Total Students: <strong>${students.length}</strong></div>
        </div>

        <table>
          <colgroup>
            <col class="col-roll">
            <col class="col-name">
            ${subjects.map(() => `<col class="col-subject">`).join('')}
            <col class="col-total">
            <col class="col-pct">
            <col class="col-grade">
            <col class="col-remarks">
          </colgroup>
          <thead>
            <tr>
              <th class="col-roll">Roll</th>
              <th class="name-col col-name">Student Name</th>
              ${subjects.map(s => `<th class="col-subject">${window.escapeHtml(s.name)}<br><span class="sub-max">(${s.maxMarks})</span></th>`).join('')}
              <th class="col-total">Total</th>
              <th class="col-pct">%</th>
              <th class="col-grade">Grade</th>
              <th class="col-remarks">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${students.map((st, idx) => {
              const stats = calculateStudentStats(entry, st, { marks: st.marks || {}, remarks: st.remarks });
              return `
                <tr>
                  <td>${window.escapeHtml(String(st.rollNo || idx + 1))}</td>
                  <td class="name-col"><strong>${window.escapeHtml(st.name)}</strong></td>
                  ${subjects.map(s => {
                    const val = st.marks && st.marks[s.id];
                    const isFail = val !== undefined && val !== null && val !== '' && String(val).toUpperCase() !== 'AB' && Number(val) < (Number(s.passMarks) || 0);
                    return `<td style="${isFail ? 'color: #9e0a0a; font-weight: 700;' : ''}">${val !== undefined && val !== null ? window.escapeHtml(String(val)) : '—'}</td>`;
                  }).join('')}
                  <td><strong>${stats.hasAnyMark ? `${stats.totalObtained}/${stats.totalMaxMarks}` : '—'}</strong></td>
                  <td>${stats.hasAnyMark ? `${stats.percentage}%` : '—'}</td>
                  <td class="${stats.isFailed ? 'grade-fail' : 'grade-pass'}">${stats.grade}</td>
                  <td style="text-align: left; font-size: 10px;">${window.escapeHtml(st.remarks || '')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>Generated via Glimpse Studio • Mark Sheet Module</div>
          <div>Teacher / Evaluator Signature: _______________________</div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printHtml);
      printWindow.document.close();
      closeMsExportModal();
    } else {
      window.showAlertDialog('Pop-up Blocked', 'Please allow pop-ups for this site to open the printable mark sheet.');
    }
  }

  // --- TOP APP NAVIGATION ---
  function openMarksheetApp() {
    const viewDashboard = document.getElementById('view-dashboard');
    const viewGlimpseApp = document.getElementById('view-glimpse-app');
    const viewAttendanceApp = document.getElementById('view-attendance-app');
    const viewUserGroupsApp = document.getElementById('view-user-groups-app');
    const viewClassesApp = document.getElementById('view-classes-app');
    const viewMarksheetApp = document.getElementById('view-marksheet-app');

    if (viewDashboard) viewDashboard.classList.remove('active');
    if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
    if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
    if (viewClassesApp) viewClassesApp.classList.remove('active');
    if (viewMarksheetApp) viewMarksheetApp.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showMsScreen('ms-screen-entries');
    renderMsEntriesList();
    if (typeof window.navigateToRoute === 'function') {
      window.navigateToRoute('#/marksheet');
    }
  }

  // --- EVENT LISTENERS SETUP ---
  function setupMarksheetEventListeners() {
    // Back Button
    const msBackBtn = document.getElementById('msBackBtn');
    if (msBackBtn) {
      msBackBtn.addEventListener('click', handleMsBackClick);
    }

    // Create New Entry Button
    const msCreateEntryBtn = document.getElementById('msCreateEntryBtn');
    if (msCreateEntryBtn) {
      msCreateEntryBtn.addEventListener('click', () => openMarkSheetForm(null));
    }

    // Search Input on Entries List
    const msSearchInput = document.getElementById('msSearchInput');
    if (msSearchInput) {
      msSearchInput.addEventListener('input', () => {
        renderMsEntriesList();
      });
    }

    // Class Selection Dropdown in Form
    const msClassSelect = document.getElementById('msClassSelect');
    if (msClassSelect) {
      msClassSelect.addEventListener('change', (e) => {
        handleClassSelectionChange(e.target.value);
      });
    }

    // User Group Selection Dropdown in Form
    const msUserGroupSelect = document.getElementById('msUserGroupSelect');
    if (msUserGroupSelect) {
      msUserGroupSelect.addEventListener('change', (e) => {
        msSelectedGroupIdForForm = e.target.value;
      });
    }

    // General Scoring Standard Inputs (Header Level)
    const msGeneralMaxMarks = document.getElementById('msGeneralMaxMarks');
    const msGeneralPassMarks = document.getElementById('msGeneralPassMarks');
    const msAddSubjectMax = document.getElementById('msAddSubjectMax');
    const msAddSubjectPass = document.getElementById('msAddSubjectPass');

    if (msGeneralMaxMarks) {
      msGeneralMaxMarks.addEventListener('input', () => {
        if (msAddSubjectMax) msAddSubjectMax.value = msGeneralMaxMarks.value;
      });
    }

    if (msGeneralPassMarks) {
      msGeneralPassMarks.addEventListener('input', () => {
        if (msAddSubjectPass) msAddSubjectPass.value = msGeneralPassMarks.value;
      });
    }

    // Add Subject Selection Dropdown
    // Open Add Subject Modal Button
    const msOpenAddSubjectModalBtn = document.getElementById('msOpenAddSubjectModalBtn');
    if (msOpenAddSubjectModalBtn) {
      msOpenAddSubjectModalBtn.addEventListener('click', openAddSubjectModal);
    }

    // Close Add Subject Modal Buttons
    const msCloseAddSubjectModalBtn = document.getElementById('msCloseAddSubjectModalBtn');
    if (msCloseAddSubjectModalBtn) {
      msCloseAddSubjectModalBtn.addEventListener('click', closeAddSubjectModal);
    }

    const msCancelAddSubjectModalBtn = document.getElementById('msCancelAddSubjectModalBtn');
    if (msCancelAddSubjectModalBtn) {
      msCancelAddSubjectModalBtn.addEventListener('click', closeAddSubjectModal);
    }

    // Add Subject Modal Form Submit
    const msAddSubjectModalForm = document.getElementById('msAddSubjectModalForm');
    if (msAddSubjectModalForm) {
      msAddSubjectModalForm.addEventListener('submit', handleConfirmAddSubjectModal);
    }

    // Add All Subjects Button
    const msAddAllSubjectsBtn = document.getElementById('msAddAllSubjectsBtn');
    if (msAddAllSubjectsBtn) {
      msAddAllSubjectsBtn.addEventListener('click', () => {
        const maxMarks = Math.max(1, Number(msGeneralMaxMarks ? msGeneralMaxMarks.value : 100) || 100);
        const passMarks = Math.max(0, Number(msGeneralPassMarks ? msGeneralPassMarks.value : 35) || 35);

        msAvailableClassSubjects.forEach(cs => {
          if (!msDraftSubjects.some(ds => ds.id === cs.id || ds.name === cs.name)) {
            msDraftSubjects.push({
              id: cs.id,
              name: cs.name,
              icon: cs.icon || '📖',
              maxMarks,
              passMarks
            });
          }
        });

        renderSubjectsManagementInForm();
      });
    }

    // Clear All Subjects Button
    const msClearAllSubjectsBtn = document.getElementById('msClearAllSubjectsBtn');
    if (msClearAllSubjectsBtn) {
      msClearAllSubjectsBtn.addEventListener('click', () => {
        msDraftSubjects = [];
        renderSubjectsManagementInForm();
      });
    }

    // Mark Sheet Form Submit & Cancel
    const msForm = document.getElementById('msEntryForm');
    if (msForm) {
      msForm.addEventListener('submit', handleSaveMarkSheetForm);
    }

    const msCancelFormBtn = document.getElementById('msCancelFormBtn');
    if (msCancelFormBtn) {
      msCancelFormBtn.addEventListener('click', handleMsBackClick);
    }

    // Workspace Sheet Action Buttons
    const msSheetEditSettingsBtn = document.getElementById('msSheetEditSettingsBtn');
    if (msSheetEditSettingsBtn) {
      msSheetEditSettingsBtn.addEventListener('click', () => {
        if (msCurrentActiveEntryId) openMarkSheetForm(msCurrentActiveEntryId);
      });
    }

    const msSheetSaveBtn = document.getElementById('msSheetSaveBtn');
    if (msSheetSaveBtn) {
      msSheetSaveBtn.addEventListener('click', saveMarkSheetScoresExplicit);
    }

    const msSheetExportBtn = document.getElementById('msSheetExportBtn');
    if (msSheetExportBtn) {
      msSheetExportBtn.addEventListener('click', () => {
        if (msCurrentActiveEntryId) openMsExportModal(msCurrentActiveEntryId);
      });
    }

    const msSheetMarkAbBtn = document.getElementById('msSheetMarkAbBtn');
    if (msSheetMarkAbBtn) {
      msSheetMarkAbBtn.addEventListener('click', markRemainingBlankAsAbsent);
    }

    const msSheetClearAllBtn = document.getElementById('msSheetClearAllBtn');
    if (msSheetClearAllBtn) {
      msSheetClearAllBtn.addEventListener('click', clearAllSheetMarks);
    }

    // Workspace Search Student Input
    const msSheetStudentSearchInput = document.getElementById('msSheetStudentSearchInput');
    if (msSheetStudentSearchInput) {
      msSheetStudentSearchInput.addEventListener('input', (e) => {
        msSheetSearchQuery = e.target.value;
        renderMsSheetTableAndStats();
      });
    }

    // Workspace Filter Chips
    const filterChips = document.querySelectorAll('.ms-filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        msSheetFilterStatus = chip.getAttribute('data-filter') || 'all';
        renderMsFilterChips();
        renderMsSheetTableAndStats();
      });
    });

    // Export Modal Buttons
    const msCloseExportModalBtn = document.getElementById('msCloseExportModalBtn');
    if (msCloseExportModalBtn) {
      msCloseExportModalBtn.addEventListener('click', closeMsExportModal);
    }

    const msExportCsvBtn = document.getElementById('msExportCsvBtn');
    if (msExportCsvBtn) {
      msExportCsvBtn.addEventListener('click', exportMarkSheetAsCSV);
    }

    const msExportPrintBtn = document.getElementById('msExportPrintBtn');
    if (msExportPrintBtn) {
      msExportPrintBtn.addEventListener('click', printMarkSheetReport);
    }

    const msExportModal = document.getElementById('msExportModal');
    if (msExportModal) {
      msExportModal.addEventListener('click', (e) => {
        if (e.target === msExportModal) closeMsExportModal();
      });
    }
  }

  // Export to global scope
  window.marksheetData = marksheetData;
  window.loadMarksheetDataFromStorage = loadMarksheetDataFromStorage;
  window.saveMarksheetDataToStorage = saveMarksheetDataToStorage;
  window.openMarksheetApp = openMarksheetApp;
  window.openMarkSheetForm = openMarkSheetForm;
  window.openMarkSheetWorkspace = openMarkSheetWorkspace;
  window.showMsScreen = showMsScreen;
  window.renderMsEntriesList = renderMsEntriesList;
  window.setupMarksheetEventListeners = setupMarksheetEventListeners;
  window.isMsFormDirty = isMsFormDirty;
  window.isMsSheetDirty = isMsSheetDirty;
  window.confirmUnsavedMsChanges = confirmUnsavedMsChanges;

})(window);
