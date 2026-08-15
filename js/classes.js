// Glimpse Classes, Subjects & Timetable Matrix Management Module
(function(window) {
  'use strict';

  // --- STATE ---
  let classesData = {
    classes: [],
    activeClassId: null
  };

  let clsCurrentEditingClassId = null;
  let clsCurrentTimetableClassId = null;
  let clsDraftSubjects = [];
  let clsDraftTimetable = {};
  let clsSelectedTimetableDay = 'Monday';
  let clsTimetableViewMode = 'matrix'; // 'matrix' or 'day'
  let clsInitialFormSnapshot = null;

  // --- STORAGE HELPERS ---
  function loadClassesDataFromStorage() {
    try {
      const raw = localStorage.getItem('glimpse_classes_data_v1');
      if (raw) {
        classesData = JSON.parse(raw);
        if (!classesData || typeof classesData !== 'object' || !Array.isArray(classesData.classes)) {
          classesData = { classes: [], activeClassId: null };
        }
      } else {
        classesData = { classes: [], activeClassId: null };
      }

      // If no classes exist, initialize with existing Glimpse data or default
      if (classesData.classes.length === 0) {
        initializeDefaultClass();
      }

      // Priority: check localStorage for last selected class in Glimpse
      const savedSelectedId = localStorage.getItem('glimpse_selected_class_id_v1');
      if (savedSelectedId && classesData.classes.some(c => c.id === savedSelectedId)) {
        classesData.activeClassId = savedSelectedId;
      } else if (!classesData.activeClassId || !classesData.classes.some(c => c.id === classesData.activeClassId)) {
        if (classesData.classes.length > 0) {
          classesData.activeClassId = classesData.classes[0].id;
        }
      }

      // Sync active class with Glimpse legacy storage keys for seamless interoperability
      syncActiveClassToLegacyStorage();
    } catch (e) {
      console.error('[Classes] Error loading classes data:', e);
      classesData = { classes: [], activeClassId: null };
      initializeDefaultClass();
    }
  }

  function initializeDefaultClass() {
    const rawSubjects = localStorage.getItem('glimpse_subjects_v10');
    const rawTimetable = localStorage.getItem('glimpse_timetable_v10');
    const rawClassDiv = localStorage.getItem('glimpse_class_div_v10');

    const defaultSubjects = rawSubjects ? JSON.parse(rawSubjects) : JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_SUBJECTS || []));
    const defaultTimetable = rawTimetable ? JSON.parse(rawTimetable) : JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_TIMETABLE || {}));
    const defaultName = (rawClassDiv && rawClassDiv.trim()) ? rawClassDiv.trim() : '2G';

    const newClass = {
      id: `cls_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: defaultName,
      description: `Class ${defaultName}`,
      isActive: true,
      subjects: defaultSubjects,
      timetable: defaultTimetable,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    classesData.classes = [newClass];
    classesData.activeClassId = newClass.id;
    saveClassesDataToStorage();
  }

  function saveClassesDataToStorage() {
    try {
      localStorage.setItem('glimpse_classes_data_v1', JSON.stringify(classesData));
      syncActiveClassToLegacyStorage();
    } catch (e) {
      console.error('[Classes] Error saving classes data:', e);
    }
  }

  function syncActiveClassToLegacyStorage() {
    try {
      const activeClass = getActiveClass();
      if (activeClass) {
        localStorage.setItem('glimpse_subjects_v10', JSON.stringify(activeClass.subjects || []));
        localStorage.setItem('glimpse_timetable_v10', JSON.stringify(activeClass.timetable || {}));
        localStorage.setItem('glimpse_class_div_v10', activeClass.name || '');

        // Update Glimpse live state if glimpse engine is loaded
        if (typeof window.syncGlimpseWithActiveClass === 'function') {
          window.syncGlimpseWithActiveClass(activeClass);
        }
      }
    } catch (e) {
      console.error('[Classes] Error syncing active class:', e);
    }
  }

  function getActiveClass() {
    if (!classesData.classes || classesData.classes.length === 0) return null;
    const savedId = localStorage.getItem('glimpse_selected_class_id_v1') || classesData.activeClassId;
    if (savedId) {
      const match = classesData.classes.find(c => c.id === savedId);
      if (match) return match;
    }
    return classesData.classes.find(c => c.isActive !== false) || classesData.classes[0];
  }

  function getClassById(classId) {
    if (!classesData.classes) return null;
    return classesData.classes.find(c => c.id === classId) || null;
  }

  // --- SCREEN NAVIGATION ---
  function showClsScreen(screenId) {
    const screens = document.querySelectorAll('#view-classes-app .att-screen');
    screens.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }

    const clsBackBtnText = document.getElementById('clsBackBtnText');
    if (clsBackBtnText) {
      if (screenId === 'cls-screen-classes') {
        clsBackBtnText.textContent = 'Manage';
      } else {
        clsBackBtnText.textContent = 'Classes';
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openClassesApp() {
    const viewDashboard = document.getElementById('view-dashboard');
    const viewGlimpseApp = document.getElementById('view-glimpse-app');
    const viewAttendanceApp = document.getElementById('view-attendance-app');
    const viewManageApp = document.getElementById('view-manage-app');
    const viewUserGroupsApp = document.getElementById('view-user-groups-app');
    const viewClassesApp = document.getElementById('view-classes-app');

    if (viewDashboard) viewDashboard.classList.remove('active');
    if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
    if (viewManageApp) viewManageApp.classList.remove('active');
    if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
    if (viewClassesApp) viewClassesApp.classList.add('active');

    loadClassesDataFromStorage();
    showClsScreen('cls-screen-classes');
    renderClsClassesList();

    if (typeof window.navigateToRoute === 'function') {
      window.navigateToRoute('#/manage/classes');
    }
  }

  function handleClsBackClick() {
    const activeScreen = document.querySelector('#view-classes-app .att-screen.active');
    const screenId = activeScreen ? activeScreen.id : 'cls-screen-classes';

    if (screenId === 'cls-screen-classes') {
      if (typeof window.openManageApp === 'function') {
        window.openManageApp();
      }
    } else if (screenId === 'cls-screen-form') {
      if (isClsFormDirty()) {
        confirmUnsavedClsChanges().then(confirmed => {
          if (confirmed) {
            showClsScreen('cls-screen-classes');
            renderClsClassesList();
            if (typeof window.navigateToRoute === 'function') {
              window.navigateToRoute('#/manage/classes');
            }
          }
        });
      } else {
        showClsScreen('cls-screen-classes');
        renderClsClassesList();
        if (typeof window.navigateToRoute === 'function') {
          window.navigateToRoute('#/manage/classes');
        }
      }
    } else if (screenId === 'cls-screen-matrix') {
      showClsScreen('cls-screen-classes');
      renderClsClassesList();
      if (typeof window.navigateToRoute === 'function') {
        window.navigateToRoute('#/manage/classes');
      }
    }
  }

  // --- SCREEN 1: CLASSES LIST ---
  function renderClsClassesList() {
    const listEl = document.getElementById('clsClassesList');
    if (!listEl) return;

    if (!classesData.classes || classesData.classes.length === 0) {
      listEl.innerHTML = `
        <div class="att-empty-state">
          <div class="att-empty-icon">🏫</div>
          <h3>No Classes Found</h3>
          <p>Create your first class to maintain subjects and weekly period timetables.</p>
          <button type="button" id="clsEmptyCreateBtn" class="btn btn-primary btn-sm">+ Create Class</button>
        </div>
      `;
      const emptyBtn = document.getElementById('clsEmptyCreateBtn');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openClassForm(null));
      return;
    }

    listEl.innerHTML = classesData.classes.map(cls => {
      const isActive = cls.isActive !== false;
      const subjectCount = Array.isArray(cls.subjects) ? cls.subjects.length : 0;
      
      let totalPeriods = 0;
      if (cls.timetable && typeof cls.timetable === 'object') {
        Object.values(cls.timetable).forEach(slots => {
          if (Array.isArray(slots)) {
            totalPeriods += slots.filter(s => s && s.trim() !== '').length;
          }
        });
      }

      return `
        <div class="att-program-card ${isActive ? '' : 'inactive-class-card'}" data-class-id="${cls.id}">
          <div class="att-card-header">
            <div class="att-card-title-group">
              <h3>${window.escapeHtml(cls.name)}</h3>
              ${cls.description ? `<div class="att-card-subtitle">${window.escapeHtml(cls.description)}</div>` : ''}
            </div>
            <button type="button" class="btn-round-arrow cls-open-class-btn" data-id="${cls.id}" title="Open Timetable for ${window.escapeHtml(cls.name)}" aria-label="Open Timetable">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          <div class="att-card-stats">
            <span class="att-stat-badge">📖 ${subjectCount} ${subjectCount === 1 ? 'Subject' : 'Subjects'}</span>
            <span class="att-stat-badge">📅 ${totalPeriods} ${totalPeriods === 1 ? 'Period' : 'Periods'} / Wk</span>
            <span class="att-stat-badge" style="${isActive ? 'color: #10b981; font-weight: 700;' : 'color: var(--muted);'}">
              ${isActive ? '✓ Active' : '📦 Inactive'}
            </span>
          </div>

          <div class="att-card-actions">
            <button type="button" class="btn btn-subtle btn-sm cls-edit-class-btn" data-id="${cls.id}">✎ Edit</button>
            <button type="button" class="btn btn-subtle btn-sm cls-delete-class-btn" data-id="${cls.id}" style="color: var(--danger);">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span>Delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners
    listEl.querySelectorAll('.cls-open-class-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openClassTimetable(id);
      });
    });

    listEl.querySelectorAll('.cls-edit-class-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openClassForm(id);
      });
    });

    listEl.querySelectorAll('.cls-delete-class-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteClass(id);
      });
    });
  }

  function toggleClassStatus(classId) {
    const cls = getClassById(classId);
    if (!cls) return;

    const currentlyActive = cls.isActive !== false;
    cls.isActive = !currentlyActive;
    cls.updatedAt = new Date().toISOString();

    saveClassesDataToStorage();
    renderClsClassesList();

    if (typeof window.showToast === 'function') {
      window.showToast(cls.isActive ? `Class "${cls.name}" activated ✓` : `Class "${cls.name}" archived / made inactive 📦`);
    }
  }

  async function deleteClass(classId) {
    const cls = getClassById(classId);
    if (!cls) return;

    if (classesData.classes.length <= 1) {
      if (typeof window.showAlertDialog === 'function') {
        window.showAlertDialog('Cannot Delete Class', 'You must maintain at least one class in your workspace.');
      }
      return;
    }

    const confirmed = await window.showConfirmDialog({
      title: `Delete Class "${cls.name}"?`,
      message: `Are you sure you want to permanently delete this class including its ${cls.subjects.length} subjects and weekly timetable? This action cannot be undone.`,
      confirmText: 'Delete Class',
      cancelText: 'Cancel',
      isDanger: true
    });

    if (!confirmed) return;

    classesData.classes = classesData.classes.filter(c => c.id !== classId);
    if (classesData.activeClassId === classId) {
      classesData.activeClassId = classesData.classes[0].id;
    }

    saveClassesDataToStorage();
    renderClsClassesList();

    if (typeof window.showToast === 'function') {
      window.showToast(`Deleted class: ${cls.name}`);
    }
  }

  // --- SCREEN 2: CLASS & SUBJECTS FORM ---
  function openClassForm(classId = null, pushRoute = true) {
    clsCurrentEditingClassId = classId;
    const formTitle = document.getElementById('clsClassFormTitle');
    const editIdInput = document.getElementById('clsEditClassId');
    const nameInput = document.getElementById('clsClassName');
    const descInput = document.getElementById('clsClassDesc');

    if (classId) {
      const cls = getClassById(classId);
      if (!cls) return;

      if (formTitle) formTitle.textContent = `Edit Class: ${cls.name}`;
      if (editIdInput) editIdInput.value = cls.id;
      if (nameInput) nameInput.value = cls.name || '';
      if (descInput) descInput.value = cls.description || '';

      clsDraftSubjects = JSON.parse(JSON.stringify(cls.subjects || []));
      clsDraftTimetable = JSON.parse(JSON.stringify(cls.timetable || {}));
    } else {
      if (formTitle) formTitle.textContent = 'Create New Class';
      if (editIdInput) editIdInput.value = '';
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';

      clsDraftSubjects = JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_SUBJECTS || []));
      clsDraftTimetable = JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_TIMETABLE || {}));
    }

    renderClsDraftSubjectsList();
    takeClsInitialFormSnapshot();
    showClsScreen('cls-screen-form');

    if (pushRoute && typeof window.navigateToRoute === 'function') {
      const route = classId ? `#/manage/classes/form?id=${classId}` : '#/manage/classes/form';
      window.navigateToRoute(route);
    }
  }

  function renderClsDraftSubjectsList() {
    const listEl = document.getElementById('clsDraftSubjectsList');
    const countBadge = document.getElementById('clsDraftSubjectsCount');
    if (!listEl) return;

    if (countBadge) {
      countBadge.textContent = `${clsDraftSubjects.length}`;
    }

    listEl.innerHTML = '';

    if (clsDraftSubjects.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">📚</div>
          <h3>No Subjects Created Yet</h3>
          <p>Tap the <strong>+ Add Subject</strong> button above to create custom subjects.</p>
        </div>
      `;
      return;
    }

    clsDraftSubjects.forEach((subject, index) => {
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
          <button type="button" class="action-icon-btn move-up cls-sub-move-up" data-idx="${index}" title="Move Up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="action-icon-btn move-down cls-sub-move-down" data-idx="${index}" title="Move Down" ${index === clsDraftSubjects.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="action-icon-btn edit-sub cls-sub-edit-btn" data-id="${subject.id}" title="Edit Subject">✎</button>
          <button type="button" class="action-icon-btn delete delete-sub cls-sub-delete-btn" data-id="${subject.id}" title="Delete Subject">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      listEl.appendChild(card);
    });

    attachClsDraftSubjectsEvents();
  }

  function attachClsDraftSubjectsEvents() {
    const listEl = document.getElementById('clsDraftSubjectsList');
    if (!listEl) return;

    listEl.onclick = (e) => {
      const editBtn = e.target.closest('.cls-sub-edit-btn');
      if (editBtn) {
        const subId = editBtn.dataset.id;
        openClsSubjectModal(subId);
        return;
      }

      const deleteBtn = e.target.closest('.cls-sub-delete-btn');
      if (deleteBtn) {
        const subId = deleteBtn.dataset.id;
        clsDraftSubjects = clsDraftSubjects.filter(s => s.id !== subId);
        renderClsDraftSubjectsList();
        return;
      }

      const moveUpBtn = e.target.closest('.cls-sub-move-up');
      if (moveUpBtn && !moveUpBtn.disabled) {
        const idx = parseInt(moveUpBtn.dataset.idx, 10);
        if (idx > 0) {
          const temp = clsDraftSubjects[idx];
          clsDraftSubjects[idx] = clsDraftSubjects[idx - 1];
          clsDraftSubjects[idx - 1] = temp;
          renderClsDraftSubjectsList();
        }
        return;
      }

      const moveDownBtn = e.target.closest('.cls-sub-move-down');
      if (moveDownBtn && !moveDownBtn.disabled) {
        const idx = parseInt(moveDownBtn.dataset.idx, 10);
        if (idx < clsDraftSubjects.length - 1) {
          const temp = clsDraftSubjects[idx];
          clsDraftSubjects[idx] = clsDraftSubjects[idx + 1];
          clsDraftSubjects[idx + 1] = temp;
          renderClsDraftSubjectsList();
        }
        return;
      }
    };
  }

  // --- SUBJECT MODAL CONTROLS ---
  function openClsSubjectModal(subId = null) {
    const modal = document.getElementById('clsSubjectModal');
    const title = document.getElementById('clsSubjectModalTitle');
    const editIdInput = document.getElementById('clsEditSubjectId');
    const nameInput = document.getElementById('clsSubName');
    const iconInput = document.getElementById('clsSubIcon');
    const badgeInput = document.getElementById('clsSubBadge');
    const suffixInput = document.getElementById('clsSubSuffix');
    const notesInput = document.getElementById('clsSubNotes');

    if (!modal || !nameInput) return;

    if (subId) {
      if (title) title.textContent = 'Edit Subject';
      const sub = clsDraftSubjects.find(s => s.id === subId);
      if (sub) {
        if (editIdInput) editIdInput.value = sub.id;
        nameInput.value = sub.name || '';
        if (iconInput) iconInput.value = sub.icon || sub.emoji || '📖';
        if (badgeInput) badgeInput.value = sub.badge || '🟦';
        if (suffixInput) suffixInput.value = sub.suffix || '';
        if (notesInput) notesInput.value = sub.notes || '';
      }
    } else {
      if (title) title.textContent = 'Add Subject';
      if (editIdInput) editIdInput.value = '';
      nameInput.value = '';
      if (iconInput) iconInput.value = '📖';
      if (badgeInput) badgeInput.value = '🟦';
      if (suffixInput) suffixInput.value = '';
      if (notesInput) notesInput.value = '';
    }

    modal.inert = false;
    modal.classList.add('active');
    modal.removeAttribute('aria-hidden');
    setTimeout(() => nameInput.focus(), 50);
  }

  function closeClsSubjectModal() {
    const modal = document.getElementById('clsSubjectModal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      modal.inert = true;
    }
  }

  function saveClsSubjectModal() {
    const editIdInput = document.getElementById('clsEditSubjectId');
    const nameInput = document.getElementById('clsSubName');
    const iconInput = document.getElementById('clsSubIcon');
    const badgeInput = document.getElementById('clsSubBadge');
    const suffixInput = document.getElementById('clsSubSuffix');
    const notesInput = document.getElementById('clsSubNotes');

    if (!nameInput) return;
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }

    const icon = (iconInput && iconInput.value.trim()) || '📖';
    const badge = (badgeInput && badgeInput.value.trim()) || '🟦';
    const suffix = (suffixInput && suffixInput.value.trim()) || '';
    const notes = (notesInput && notesInput.value.trim()) || '';
    const editId = editIdInput ? editIdInput.value : '';

    if (editId) {
      const idx = clsDraftSubjects.findIndex(s => s.id === editId);
      if (idx !== -1) {
        clsDraftSubjects[idx] = {
          ...clsDraftSubjects[idx],
          name,
          icon,
          emoji: icon,
          badge,
          suffix,
          notes
        };
      }
    } else {
      const newSubject = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name,
        icon,
        emoji: icon,
        badge,
        suffix,
        notes
      };
      clsDraftSubjects.push(newSubject);
    }

    closeClsSubjectModal();
    renderClsDraftSubjectsList();
  }

  // --- SCREEN 3: TIMETABLE MATRIX DASHBOARD ---
  function openClassTimetable(classId, pushRoute = true) {
    clsCurrentTimetableClassId = classId;
    const cls = getClassById(classId);
    if (!cls) return;

    const titleEl = document.getElementById('clsTimetableClassTitle');
    const descEl = document.getElementById('clsTimetableClassDesc');
    if (titleEl) titleEl.textContent = `${cls.name} Timetable`;
    if (descEl) descEl.textContent = 'Configure weekly schedule';

    clsDraftTimetable = JSON.parse(JSON.stringify(cls.timetable || {}));
    
    // Ensure all 7 days exist
    (window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).forEach(d => {
      if (!Array.isArray(clsDraftTimetable[d])) {
        clsDraftTimetable[d] = [];
      }
      while (clsDraftTimetable[d].length < 8) {
        clsDraftTimetable[d].push('');
      }
    });

    renderClsTimetableSchedule();
    updateClsStatusButton();
    showClsScreen('cls-screen-matrix');

    if (pushRoute && typeof window.navigateToRoute === 'function') {
      window.navigateToRoute(`#/manage/classes/timetable?id=${classId}`);
    }
  }

  function updateClsStatusButton() {
    const toggleStatusBtn = document.getElementById('clsToggleStatusBtn');
    if (!toggleStatusBtn || !clsCurrentTimetableClassId) return;
    const cls = getClassById(clsCurrentTimetableClassId);
    if (!cls) return;
    const isActive = cls.isActive !== false;

    if (isActive) {
      toggleStatusBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;">
          <polyline points="21 8 21 21 3 21 3 8"></polyline>
          <rect x="1" y="3" width="22" height="5"></rect>
          <line x1="10" y1="12" x2="14" y2="12"></line>
        </svg>
        <span>Inactive</span>
      `;
      toggleStatusBtn.title = 'Archive / Set class as inactive';
    } else {
      toggleStatusBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>Active</span>
      `;
      toggleStatusBtn.title = 'Activate class';
    }
  }

  function renderClsTimetableSchedule() {
    renderClsTimetableEditor();
  }

  function renderClsTimetableEditor() {
    const cls = getClassById(clsCurrentTimetableClassId);
    const subjectsList = cls ? (cls.subjects || []) : [];

    const daySelectorPills = document.getElementById('clsDaySelectorPills');
    const currentEditorDayTitle = document.getElementById('clsCurrentDayTitle');
    const daySubjectCount = document.getElementById('clsDaySubjectCount');
    const timetablePeriodSlots = document.getElementById('clsTimetablePeriodSlots');

    if (!daySelectorPills || !timetablePeriodSlots) return;

    // Render Day Selector Pills
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    daySelectorPills.innerHTML = days.map(d => `
      <button type="button" class="day-pill ${d === clsSelectedTimetableDay ? 'active' : ''}" data-day="${d}">
        ${d.substr(0, 3)}
      </button>
    `).join('');

    daySelectorPills.querySelectorAll('.day-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        clsSelectedTimetableDay = pill.getAttribute('data-day');
        renderClsTimetableEditor();
      });
    });

    if (currentEditorDayTitle) currentEditorDayTitle.textContent = `${clsSelectedTimetableDay} Schedule`;

    const periodSubjectIds = (clsDraftTimetable && clsDraftTimetable[clsSelectedTimetableDay]) || [];
    const assignedCount = periodSubjectIds.filter(s => s && s.trim() !== '').length;
    if (daySubjectCount) daySubjectCount.textContent = `${assignedCount}/8 Assigned`;

    timetablePeriodSlots.innerHTML = '';

    for (let i = 0; i < 8; i++) {
      const currentSubId = periodSubjectIds[i] || '';
      
      const slotCard = document.createElement('div');
      slotCard.className = 'period-slot-card';

      let optionsHtml = `<option value="">-- Free / No Class --</option>`;
      subjectsList.forEach(sub => {
        const fullName = sub.suffix ? `${sub.name} ${sub.suffix}` : sub.name;
        const selected = sub.id === currentSubId ? 'selected' : '';
        const iconVal = sub.icon || sub.emoji || '📖';
        optionsHtml += `<option value="${sub.id}" ${selected}>${sub.badge || '🟦'} ${iconVal} ${window.escapeHtml ? window.escapeHtml(fullName) : fullName}</option>`;
      });

      slotCard.innerHTML = `
        <span class="period-number-badge">Period #${i + 1}</span>
        <select class="input-control period-select" data-slot-index="${i}">
          ${optionsHtml}
        </select>
      `;

      timetablePeriodSlots.appendChild(slotCard);
    }

    // Attach select change listeners
    timetablePeriodSlots.querySelectorAll('.period-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const slotIdx = parseInt(e.target.dataset.slotIndex, 10);
        const val = e.target.value;

        if (!clsDraftTimetable[clsSelectedTimetableDay]) {
          clsDraftTimetable[clsSelectedTimetableDay] = ['', '', '', '', '', '', '', ''];
        }
        clsDraftTimetable[clsSelectedTimetableDay][slotIdx] = val;
        saveDraftTimetableToClass();

        const updatedCount = clsDraftTimetable[clsSelectedTimetableDay].filter(s => s && s.trim() !== '').length;
        if (daySubjectCount) daySubjectCount.textContent = `${updatedCount} Assigned / 8 Slots`;
      });
    });
  }

  function saveDraftTimetableToClass() {
    if (!clsCurrentTimetableClassId) return;
    const cls = getClassById(clsCurrentTimetableClassId);
    if (!cls) return;

    cls.timetable = JSON.parse(JSON.stringify(clsDraftTimetable));
    cls.updatedAt = new Date().toISOString();
    saveClassesDataToStorage();
  }

  async function resetClassTimetable() {
    if (!clsCurrentTimetableClassId) return;
    const cls = getClassById(clsCurrentTimetableClassId);
    if (!cls) return;

    const confirmed = await window.showConfirmDialog({
      title: `Reset ${cls.name} Timetable?`,
      message: 'Are you sure you want to clear all period slots across all 7 days for this class?',
      confirmText: 'Reset Timetable',
      cancelText: 'Cancel',
      isDanger: true
    });

    if (!confirmed) return;

    const blankTimetable = {};
    (window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).forEach(d => {
      blankTimetable[d] = ['', '', '', '', '', '', '', ''];
    });

    clsDraftTimetable = blankTimetable;
    saveDraftTimetableToClass();
    renderClsTimetableSchedule();

    if (typeof window.showToast === 'function') {
      window.showToast('Timetable reset successfully');
    }
  }

  // --- FORM SNAPSHOT & DIRTY DETECTION ---
  function takeClsInitialFormSnapshot() {
    const nameInput = document.getElementById('clsClassName');
    const descInput = document.getElementById('clsClassDesc');
    clsInitialFormSnapshot = {
      name: nameInput ? nameInput.value.trim() : '',
      desc: descInput ? descInput.value.trim() : '',
      subjects: JSON.stringify(clsDraftSubjects)
    };
  }

  function isClsFormDirty() {
    if (!clsInitialFormSnapshot) return false;
    const nameInput = document.getElementById('clsClassName');
    const descInput = document.getElementById('clsClassDesc');
    const currentName = nameInput ? nameInput.value.trim() : '';
    const currentDesc = descInput ? descInput.value.trim() : '';
    const currentSubjects = JSON.stringify(clsDraftSubjects);

    return (
      currentName !== clsInitialFormSnapshot.name ||
      currentDesc !== clsInitialFormSnapshot.desc ||
      currentSubjects !== clsInitialFormSnapshot.subjects
    );
  }

  function confirmUnsavedClsChanges() {
    if (typeof window.showConfirmDialog === 'function') {
      return window.showConfirmDialog({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes to this class. Are you sure you want to leave without saving?',
        confirmText: 'Discard Changes',
        cancelText: 'Keep Editing',
        isDanger: true
      });
    }
    return Promise.resolve(true);
  }

  // --- PRESET 2G INTEGRATION ---
  function loadClassesPreset2G() {
    loadClassesDataFromStorage();

    let cls2G = classesData.classes.find(c => c.name.trim().toUpperCase() === '2G');
    if (!cls2G) {
      cls2G = {
        id: `cls_2g_${Date.now()}`,
        name: '2G',
        description: 'Class 2G Classroom',
        isActive: true,
        subjects: JSON.parse(JSON.stringify(window.PRESET_2G_SUBJECTS || [])),
        timetable: JSON.parse(JSON.stringify(window.PRESET_2G_TIMETABLE || {})),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      classesData.classes.unshift(cls2G);
    } else {
      cls2G.isActive = true;
      cls2G.subjects = JSON.parse(JSON.stringify(window.PRESET_2G_SUBJECTS || []));
      cls2G.timetable = JSON.parse(JSON.stringify(window.PRESET_2G_TIMETABLE || {}));
      cls2G.updatedAt = new Date().toISOString();
    }

    saveClassesDataToStorage();
  }

  // --- EVENT LISTENERS SETUP ---
  function setupClassesEventListeners() {
    const clsBackBtn = document.getElementById('clsBackBtn');
    if (clsBackBtn) {
      clsBackBtn.addEventListener('click', handleClsBackClick);
    }

    const createClassBtn = document.getElementById('clsCreateClassBtn');
    if (createClassBtn) {
      createClassBtn.addEventListener('click', () => openClassForm(null));
    }

    const cancelFormBtn = document.getElementById('clsCancelClassFormBtn');
    if (cancelFormBtn) {
      cancelFormBtn.addEventListener('click', handleClsBackClick);
    }

    const addSubBtn = document.getElementById('clsAddSubjectBtn');
    if (addSubBtn) {
      addSubBtn.addEventListener('click', () => openClsSubjectModal(null));
    }

    // Modal buttons and overlay click
    const modal = document.getElementById('clsSubjectModal');
    const cancelModalBtn = document.getElementById('clsCancelSubjectModalBtn');
    const closeModalBtn = document.getElementById('clsCloseSubjectModalBtn');

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeClsSubjectModal();
      });
    }

    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeClsSubjectModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeClsSubjectModal);

    const subjectForm = document.getElementById('clsSubjectForm');
    if (subjectForm) {
      subjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveClsSubjectModal();
      });
    }

    // Form submit
    const classForm = document.getElementById('clsClassForm');
    if (classForm) {
      classForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('clsClassName');
        const descInput = document.getElementById('clsClassDesc');
        const name = nameInput ? nameInput.value.trim() : '';
        const desc = descInput ? descInput.value.trim() : '';

        if (!name) return;

        if (clsCurrentEditingClassId) {
          const cls = getClassById(clsCurrentEditingClassId);
          if (cls) {
            cls.name = name;
            cls.description = desc;
            cls.subjects = JSON.parse(JSON.stringify(clsDraftSubjects));
            cls.updatedAt = new Date().toISOString();
          }
          if (typeof window.showToast === 'function') window.showToast(`Updated class: ${name}`);
        } else {
          const newClass = {
            id: `cls_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name,
            description: desc,
            subjects: JSON.parse(JSON.stringify(clsDraftSubjects)),
            timetable: JSON.parse(JSON.stringify(clsDraftTimetable || window.GENERIC_DEFAULT_TIMETABLE || {})),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          classesData.classes.push(newClass);
          if (!classesData.activeClassId) {
            classesData.activeClassId = newClass.id;
          }
          if (typeof window.showToast === 'function') window.showToast(`Created class: ${name}`);
        }

        saveClassesDataToStorage();
        clsInitialFormSnapshot = null;
        showClsScreen('cls-screen-classes');
        renderClsClassesList();

        if (typeof window.navigateToRoute === 'function') {
          window.navigateToRoute('#/manage/classes');
        }
      });
    }

    const toggleStatusBtn = document.getElementById('clsToggleStatusBtn');
    if (toggleStatusBtn) {
      toggleStatusBtn.addEventListener('click', () => {
        if (!clsCurrentTimetableClassId) return;
        toggleClassStatus(clsCurrentTimetableClassId);
        updateClsStatusButton();
      });
    }

    const resetTimetableBtn = document.getElementById('clsResetTimetableBtn');
    if (resetTimetableBtn) resetTimetableBtn.addEventListener('click', resetClassTimetable);
  }

  // Export to global scope
  Object.defineProperty(window, 'classesData', {
    get: () => classesData,
    set: (val) => { classesData = val; },
    configurable: true
  });
  window.loadClassesDataFromStorage = loadClassesDataFromStorage;
  window.saveClassesDataToStorage = saveClassesDataToStorage;
  window.showClsScreen = showClsScreen;
  window.openClassesApp = openClassesApp;
  window.openClassForm = openClassForm;
  window.openClassTimetable = openClassTimetable;
  window.renderClsClassesList = renderClsClassesList;
  window.loadClassesPreset2G = loadClassesPreset2G;
  window.getActiveClass = getActiveClass;
  window.setupClassesEventListeners = setupClassesEventListeners;

})(window);
