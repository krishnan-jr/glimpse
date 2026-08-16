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
  let clsActiveWorkspaceTab = 'timetable';
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
      } else {
        classesData.classes.forEach(c => {
          if (!Array.isArray(c.assignedGroupIds)) {
            if (c.assignedGroupId && typeof c.assignedGroupId === 'string' && c.assignedGroupId.trim()) {
              c.assignedGroupIds = [c.assignedGroupId.trim()];
            } else {
              c.assignedGroupIds = [];
            }
          }
          c.assignedGroupId = c.assignedGroupIds.length > 0 ? c.assignedGroupIds[0] : null;
        });
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
      assignedGroupIds: [],
      assignedGroupId: null,
      subjects: defaultSubjects,
      timetable: defaultTimetable,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    classesData.classes = [newClass];
    classesData.activeClassId = newClass.id;
    saveClassesDataToStorage();
  }

  /**
   * Returns merged student roster and assigned groups for a given class.
   */
  function getMergedClassRoster(cls) {
    if (!cls) return { groups: [], allMembers: [], totalCount: 0 };
    if (typeof window.loadUserGroupsDataFromStorage === 'function') {
      window.loadUserGroupsDataFromStorage();
    }
    const allGroups = (window.userGroupsData && Array.isArray(window.userGroupsData.groups)) ? window.userGroupsData.groups : [];
    
    let groupIds = [];
    if (Array.isArray(cls.assignedGroupIds)) {
      groupIds = cls.assignedGroupIds;
    } else if (cls.assignedGroupId) {
      groupIds = [cls.assignedGroupId];
    }

    const assignedGroups = groupIds.map(id => allGroups.find(g => g.id === id)).filter(Boolean);
    
    const allMembers = [];
    let memberCounter = 1;
    assignedGroups.forEach(g => {
      if (Array.isArray(g.members)) {
        g.members.forEach(m => {
          allMembers.push({
            id: m.id,
            rollNo: m.rollNo || memberCounter,
            name: m.name,
            groupId: g.id,
            groupName: g.name
          });
          memberCounter++;
        });
      }
    });

    return {
      groups: assignedGroups,
      allMembers,
      totalCount: allMembers.length
    };
  }

  let isSyncingToLegacy = false;

  function saveClassesDataToStorage() {
    try {
      localStorage.setItem('glimpse_classes_data_v1', JSON.stringify(classesData));
      if (!isSyncingToLegacy) {
        syncActiveClassToLegacyStorage();
      }
    } catch (e) {
      console.error('[Classes] Error saving classes data:', e);
    }
  }

  function syncActiveClassToLegacyStorage() {
    if (isSyncingToLegacy) return;
    isSyncingToLegacy = true;
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
    } finally {
      isSyncingToLegacy = false;
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
        clsBackBtnText.textContent = 'Dashboard';
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
    const viewUserGroupsApp = document.getElementById('view-user-groups-app');
    const viewClassesApp = document.getElementById('view-classes-app');

    if (viewDashboard) viewDashboard.classList.remove('active');
    if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
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
      if (typeof window.openDashboard === 'function') {
        window.openDashboard();
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
          <div class="att-empty-icon">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color: var(--meta);"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </div>
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

      const mergedRoster = getMergedClassRoster(cls);
      const groups = mergedRoster.groups;
      let groupsHtml = '';
      if (groups.length === 1) {
        groupsHtml = `
          <span class="att-meta-chip" title="Assigned User Group: ${window.escapeHtml(groups[0].name)}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent); flex-shrink: 0;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <strong>${window.escapeHtml(groups[0].name)}</strong>
          </span>
          <span class="att-meta-divider"></span>
        `;
      } else if (groups.length > 1) {
        const groupNames = groups.map(g => g.name).join(', ');
        groupsHtml = `
          <span class="att-meta-chip" title="Assigned Groups: ${window.escapeHtml(groupNames)}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent); flex-shrink: 0;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <strong>${groups.length} Groups</strong>
          </span>
          <span class="att-meta-divider"></span>
        `;
      }

      return `
        <div class="att-program-card ${isActive ? '' : 'inactive-class-card'}" data-class-id="${cls.id}">
          <div class="att-card-header">
            <div class="att-card-title-group">
              <h3 class="att-card-title" title="${window.escapeHtml(cls.name)}">${window.escapeHtml(cls.name)}</h3>
              ${cls.description ? `<div class="att-card-subtitle" title="${window.escapeHtml(cls.description)}">${window.escapeHtml(cls.description)}</div>` : ''}
            </div>
            <button type="button" class="btn-round-arrow cls-open-class-btn" data-id="${cls.id}" title="Open Timetable for ${window.escapeHtml(cls.name)}" aria-label="Open Timetable">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          <div class="att-card-meta-bar">
            ${groupsHtml}
            <span class="att-meta-chip"><strong>${subjectCount}</strong> ${subjectCount === 1 ? 'Subject' : 'Subjects'}</span>
            <span class="att-meta-divider"></span>
            <span class="att-meta-chip"><strong>${totalPeriods}</strong> ${totalPeriods === 1 ? 'Period' : 'Periods'}/Wk</span>
          </div>

          <div class="att-card-footer">
            <div class="att-card-actions">
              <button type="button" class="btn btn-card-action cls-edit-class-btn" data-id="${cls.id}">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit</span>
              </button>
              <button type="button" class="btn btn-card-action btn-card-delete cls-delete-class-btn" data-id="${cls.id}">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Delete</span>
              </button>
            </div>
            <span class="att-meta-badge ${isActive ? 'active' : 'inactive'}">${isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach card-level click for instant launch
    listEl.querySelectorAll('.att-program-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.cls-edit-class-btn') || e.target.closest('.cls-delete-class-btn')) return;
        const id = card.getAttribute('data-class-id');
        if (id) openClassTimetable(id);
      });
    });

    // Attach event listeners
    listEl.querySelectorAll('.cls-open-class-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute('data-id');
        openClassTimetable(id);
      });
    });

    listEl.querySelectorAll('.cls-edit-class-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute('data-id');
        openClassForm(id);
      });
    });

    listEl.querySelectorAll('.cls-delete-class-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
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
      window.showToast(cls.isActive ? `Class "${cls.name}" activated` : `Class "${cls.name}" archived / set inactive`);
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
    const checklistContainer = document.getElementById('clsAssignedGroupsChecklist');

    if (typeof window.loadUserGroupsDataFromStorage === 'function') {
      window.loadUserGroupsDataFromStorage();
    }
    const groups = (window.userGroupsData && Array.isArray(window.userGroupsData.groups)) ? window.userGroupsData.groups : [];

    let assignedGroupIds = [];

    if (classId) {
      const cls = getClassById(classId);
      if (!cls) return;

      if (Array.isArray(cls.assignedGroupIds)) {
        assignedGroupIds = cls.assignedGroupIds;
      } else if (cls.assignedGroupId) {
        assignedGroupIds = [cls.assignedGroupId];
      }

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

    // Populate user groups checklist
    if (checklistContainer) {
      if (groups.length === 0) {
        checklistContainer.innerHTML = '<div style="color: var(--muted); font-size: var(--text-xs); padding: 8px;">No user groups available. Create groups in User Groups to link them here.</div>';
      } else {
        checklistContainer.innerHTML = groups.map(g => {
          const isChecked = assignedGroupIds.includes(g.id) ? 'checked' : '';
          const count = Array.isArray(g.members) ? g.members.length : 0;
          return `
            <label class="cls-group-checkbox-item">
              <input type="checkbox" name="clsAssignedGroupCheckbox" value="${g.id}" ${isChecked}>
              <span class="group-checkbox-label">
                <strong>${window.escapeHtml(g.name)}</strong>
                <span class="group-count">(${count} ${count === 1 ? 'member' : 'members'})</span>
              </span>
            </label>
          `;
        }).join('');
      }
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
    const matrixCountBadge = document.getElementById('clsMatrixSubjectsCount');
    if (!listEl) return;

    if (countBadge) {
      countBadge.textContent = `${clsDraftSubjects.length}`;
    }
    if (matrixCountBadge) {
      matrixCountBadge.textContent = `${clsDraftSubjects.length}`;
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
        syncDraftSubjectsToCurrentClass();
        renderClsDraftSubjectsList();
        renderClsTimetableEditor();
        return;
      }

      const moveUpBtn = e.target.closest('.cls-sub-move-up');
      if (moveUpBtn && !moveUpBtn.disabled) {
        const idx = parseInt(moveUpBtn.dataset.idx, 10);
        if (idx > 0) {
          const temp = clsDraftSubjects[idx];
          clsDraftSubjects[idx] = clsDraftSubjects[idx - 1];
          clsDraftSubjects[idx - 1] = temp;
          syncDraftSubjectsToCurrentClass();
          renderClsDraftSubjectsList();
          renderClsTimetableEditor();
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
          syncDraftSubjectsToCurrentClass();
          renderClsDraftSubjectsList();
          renderClsTimetableEditor();
        }
        return;
      }
    };
  }

  function syncDraftSubjectsToCurrentClass() {
    if (!clsCurrentTimetableClassId) return;
    const cls = getClassById(clsCurrentTimetableClassId);
    if (cls) {
      cls.subjects = JSON.parse(JSON.stringify(clsDraftSubjects));
      cls.updatedAt = new Date().toISOString();
      saveClassesDataToStorage();
    }
  }

  // --- SUBJECT MODAL CONTROLS ---
  function openClsSubjectModal(subId = null) {
    const modal = document.getElementById('clsSubjectModal');
    const title = document.getElementById('clsSubjectModalTitle');
    const editIdInput = document.getElementById('clsEditSubjectId');
    const nameInput = document.getElementById('clsSubName');
    const iconInput = document.getElementById('clsSubIcon');
    const badgeInput = document.getElementById('clsSubBadge');

    if (!modal || !nameInput) return;

    if (subId) {
      if (title) title.textContent = 'Edit Subject';
      const sub = clsDraftSubjects.find(s => s.id === subId);
      if (sub) {
        if (editIdInput) editIdInput.value = sub.id;
        nameInput.value = sub.name || '';
        if (iconInput) iconInput.value = sub.icon || sub.emoji || '📖';
        if (badgeInput) badgeInput.value = sub.badge || '🟦';
      }
    } else {
      if (title) title.textContent = 'Add Subject';
      if (editIdInput) editIdInput.value = '';
      nameInput.value = '';
      if (iconInput) iconInput.value = '📖';
      if (badgeInput) badgeInput.value = '🟦';
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

    if (!nameInput) return;
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }

    const icon = (iconInput && iconInput.value.trim()) || '📖';
    const badge = (badgeInput && badgeInput.value.trim()) || '🟦';
    const editId = editIdInput ? editIdInput.value : '';

    if (editId) {
      const idx = clsDraftSubjects.findIndex(s => s.id === editId);
      if (idx !== -1) {
        clsDraftSubjects[idx] = {
          ...clsDraftSubjects[idx],
          name,
          icon,
          emoji: icon,
          badge
        };
      }
    } else {
      const newSubject = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name,
        icon,
        emoji: icon,
        badge
      };
      clsDraftSubjects.push(newSubject);
    }

    syncDraftSubjectsToCurrentClass();
    closeClsSubjectModal();
    renderClsDraftSubjectsList();
    renderClsTimetableEditor();
  }

  // --- SCREEN 3: CLASS WORKSPACE (TIMETABLE, SUBJECTS, USER GROUPS) ---
  function switchClsWorkspaceTab(tabKey) {
    clsActiveWorkspaceTab = tabKey;
    const tabBtns = document.querySelectorAll('#clsWorkspaceTabs .segmented-btn');
    tabBtns.forEach(btn => {
      const isMatch = btn.getAttribute('data-cls-tab') === tabKey;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    const timetablePane = document.getElementById('clsWorkspaceTabTimetable');
    const subjectsPane = document.getElementById('clsWorkspaceTabSubjects');
    const rosterPane = document.getElementById('clsWorkspaceTabRoster');
    const daySelectorRow = document.getElementById('clsDaySelectorRow');

    if (timetablePane) timetablePane.style.display = tabKey === 'timetable' ? '' : 'none';
    if (subjectsPane) subjectsPane.style.display = tabKey === 'subjects' ? '' : 'none';
    if (rosterPane) rosterPane.style.display = tabKey === 'roster' ? '' : 'none';
    if (daySelectorRow) daySelectorRow.style.display = tabKey === 'timetable' ? '' : 'none';
  }

  function renderClsUserGroupTab() {
    if (!clsCurrentTimetableClassId) return;
    const cls = getClassById(clsCurrentTimetableClassId);
    if (!cls) return;

    if (!Array.isArray(cls.assignedGroupIds)) {
      cls.assignedGroupIds = cls.assignedGroupId ? [cls.assignedGroupId] : [];
    }

    const listContainer = document.getElementById('clsAssignedUgListContainer');
    const unassignedCard = document.getElementById('clsUnassignedUgCard');
    const inlineGroupSelect = document.getElementById('clsInlineAssignedGroup');
    const countBadge = document.getElementById('clsAssignedUgCountBadge');
    const matrixGroupsCount = document.getElementById('clsMatrixGroupsCount');
    const rosterPreviewContainer = document.getElementById('clsRosterPreviewContainer');
    const rosterPreviewList = document.getElementById('clsRosterPreviewList');
    const combinedCountEl = document.getElementById('clsCombinedRosterCount');

    if (typeof window.loadUserGroupsDataFromStorage === 'function') {
      window.loadUserGroupsDataFromStorage();
    }
    const allGroups = (window.userGroupsData && Array.isArray(window.userGroupsData.groups)) ? window.userGroupsData.groups : [];

    const merged = getMergedClassRoster(cls);
    const assignedGroups = merged.groups;

    if (countBadge) countBadge.textContent = assignedGroups.length;
    if (matrixGroupsCount) matrixGroupsCount.textContent = assignedGroups.length;
    if (combinedCountEl) combinedCountEl.textContent = merged.totalCount;

    // Populate dropdown with groups that are NOT yet assigned
    if (inlineGroupSelect) {
      const availableGroups = allGroups.filter(g => !cls.assignedGroupIds.includes(g.id));
      let opts = '<option value="">-- Add User Group to Class --</option>';
      availableGroups.forEach(g => {
        const count = Array.isArray(g.members) ? g.members.length : 0;
        opts += `<option value="${g.id}">👥 ${window.escapeHtml(g.name)} (${count} ${count === 1 ? 'member' : 'members'})</option>`;
      });
      inlineGroupSelect.innerHTML = opts;
    }

    if (assignedGroups.length > 0) {
      if (listContainer) {
        listContainer.style.display = 'flex';
        listContainer.innerHTML = assignedGroups.map(g => {
          const count = Array.isArray(g.members) ? g.members.length : 0;
          return `
            <div class="cls-assigned-ug-card" data-group-id="${g.id}">
              <div class="assigned-ug-info">
                <span class="sync-icon">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </span>
                <div class="assigned-ug-text">
                  <div class="assigned-ug-title">${window.escapeHtml(g.name)}</div>
                  <div class="assigned-ug-meta">
                    <span>${count} ${count === 1 ? 'member' : 'members'}</span>
                    <span class="att-meta-divider"></span>
                    <span class="sync-live-badge">Live Sync</span>
                  </div>
                </div>
              </div>
              <button type="button" class="btn btn-subtle btn-sm cls-unlink-single-ug-btn" data-group-id="${g.id}" title="Unlink ${window.escapeHtml(g.name)} from class">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                <span>Unlink</span>
              </button>
            </div>
          `;
        }).join('');
      }
      if (unassignedCard) unassignedCard.style.display = 'none';
    } else {
      if (listContainer) listContainer.style.display = 'none';
      if (unassignedCard) unassignedCard.style.display = 'block';
    }
  }

  function openClassTimetable(classId, pushRoute = true) {
    clsCurrentTimetableClassId = classId;
    const cls = getClassById(classId);
    if (!cls) return;

    const titleEl = document.getElementById('clsTimetableClassTitle');
    const descEl = document.getElementById('clsTimetableClassDesc');
    if (titleEl) titleEl.textContent = `${cls.name} Class Workspace`;
    
    const merged = getMergedClassRoster(cls);
    let assignedInfo = '';
    if (merged.groups.length === 1) {
      assignedInfo = ` • ${merged.groups[0].name}`;
    } else if (merged.groups.length > 1) {
      assignedInfo = ` • ${merged.groups.length} User Groups`;
    }

    if (descEl) {
      descEl.textContent = assignedInfo 
        ? `Weekly schedule & subjects${assignedInfo}` 
        : (cls.description || 'Configure timetable, subjects & student roster');
    }

    clsDraftSubjects = JSON.parse(JSON.stringify(cls.subjects || []));
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

    switchClsWorkspaceTab(clsActiveWorkspaceTab || 'timetable');
    renderClsTimetableSchedule();
    renderClsDraftSubjectsList();
    renderClsUserGroupTab();
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
      toggleStatusBtn.className = 'btn btn-status-active btn-sm';
      toggleStatusBtn.innerHTML = `
        <span class="status-indicator-dot active"></span>
        <span>Active</span>
      `;
      toggleStatusBtn.title = 'Click to archive / set class as inactive';
    } else {
      toggleStatusBtn.className = 'btn btn-status-inactive btn-sm';
      toggleStatusBtn.innerHTML = `
        <span class="status-indicator-dot inactive"></span>
        <span>Archived</span>
      `;
      toggleStatusBtn.title = 'Click to activate class';
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
        const fullName = sub.name;
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

  // --- FORM SNAPSHOT & DIRTY DETECTION ---
  function getSelectedFormGroupIds() {
    const checkboxes = document.querySelectorAll('input[name="clsAssignedGroupCheckbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value).sort();
  }

  function takeClsInitialFormSnapshot() {
    const nameInput = document.getElementById('clsClassName');
    const descInput = document.getElementById('clsClassDesc');
    clsInitialFormSnapshot = {
      name: nameInput ? nameInput.value.trim() : '',
      desc: descInput ? descInput.value.trim() : '',
      assignedGroupIds: JSON.stringify(getSelectedFormGroupIds()),
      subjects: JSON.stringify(clsDraftSubjects)
    };
  }

  function isClsFormDirty() {
    if (!clsInitialFormSnapshot) return false;
    const nameInput = document.getElementById('clsClassName');
    const descInput = document.getElementById('clsClassDesc');
    const currentName = nameInput ? nameInput.value.trim() : '';
    const currentDesc = descInput ? descInput.value.trim() : '';
    const currentGroupIds = JSON.stringify(getSelectedFormGroupIds());
    const currentSubjects = JSON.stringify(clsDraftSubjects);

    return (
      currentName !== clsInitialFormSnapshot.name ||
      currentDesc !== clsInitialFormSnapshot.desc ||
      currentGroupIds !== clsInitialFormSnapshot.assignedGroupIds ||
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
        assignedGroupId: null,
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
        const selectedGroupIds = getSelectedFormGroupIds();

        if (!name) return;

        if (clsCurrentEditingClassId) {
          const cls = getClassById(clsCurrentEditingClassId);
          if (cls) {
            cls.name = name;
            cls.description = desc;
            cls.assignedGroupIds = selectedGroupIds;
            cls.assignedGroupId = selectedGroupIds.length > 0 ? selectedGroupIds[0] : null;
            cls.subjects = JSON.parse(JSON.stringify(clsDraftSubjects));
            cls.updatedAt = new Date().toISOString();
          }
          if (typeof window.showToast === 'function') window.showToast(`Updated class: ${name}`);
        } else {
          const newClass = {
            id: `cls_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name,
            description: desc,
            isActive: true,
            assignedGroupIds: selectedGroupIds,
            assignedGroupId: selectedGroupIds.length > 0 ? selectedGroupIds[0] : null,
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

    // Workspace Navigation Tabs listener
    const workspaceTabs = document.getElementById('clsWorkspaceTabs');
    if (workspaceTabs) {
      workspaceTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.segmented-btn');
        if (!btn) return;
        const tabKey = btn.getAttribute('data-cls-tab');
        if (tabKey) switchClsWorkspaceTab(tabKey);
      });
    }

    // User Group Assignment in Workspace (Add group to class)
    const inlineAssignBtn = document.getElementById('clsInlineAssignUgBtn');
    if (inlineAssignBtn) {
      inlineAssignBtn.addEventListener('click', () => {
        if (!clsCurrentTimetableClassId) return;
        const cls = getClassById(clsCurrentTimetableClassId);
        if (!cls) return;

        if (!Array.isArray(cls.assignedGroupIds)) {
          cls.assignedGroupIds = cls.assignedGroupId ? [cls.assignedGroupId] : [];
        }

        const inlineSelect = document.getElementById('clsInlineAssignedGroup');
        const gId = inlineSelect ? inlineSelect.value : '';
        if (!gId) {
          if (inlineSelect) inlineSelect.focus();
          if (typeof window.showToast === 'function') window.showToast('Please select a user group from the dropdown.');
          return;
        }

        if (!cls.assignedGroupIds.includes(gId)) {
          cls.assignedGroupIds.push(gId);
        }
        cls.assignedGroupId = cls.assignedGroupIds[0] || null;
        cls.updatedAt = new Date().toISOString();

        saveClassesDataToStorage();
        renderClsUserGroupTab();
        renderClsClassesList();

        const group = (window.userGroupsData && window.userGroupsData.groups) ? window.userGroupsData.groups.find(g => g.id === gId) : null;
        const gName = group ? group.name : 'Group';
        if (typeof window.showToast === 'function') window.showToast(`Assigned User Group: "${gName}"`);
      });
    }

    // Delegated Unlink Single Group button in Workspace
    const tabRoster = document.getElementById('clsWorkspaceTabRoster');
    if (tabRoster) {
      tabRoster.addEventListener('click', async (e) => {
        const unlinkBtn = e.target.closest('.cls-unlink-single-ug-btn');
        if (!unlinkBtn || !clsCurrentTimetableClassId) return;

        const cls = getClassById(clsCurrentTimetableClassId);
        if (!cls) return;

        const gId = unlinkBtn.getAttribute('data-group-id');
        if (!gId) return;

        const group = (window.userGroupsData && window.userGroupsData.groups) ? window.userGroupsData.groups.find(g => g.id === gId) : null;
        const gName = group ? group.name : 'this user group';

        const confirmed = await window.showConfirmDialog({
          title: `Unlink "${gName}"?`,
          message: `Are you sure you want to disconnect "${gName}" from this class?`,
          confirmText: 'Unlink Group',
          cancelText: 'Cancel',
          isDanger: false
        });

        if (!confirmed) return;

        if (Array.isArray(cls.assignedGroupIds)) {
          cls.assignedGroupIds = cls.assignedGroupIds.filter(id => id !== gId);
        } else {
          cls.assignedGroupIds = [];
        }
        cls.assignedGroupId = cls.assignedGroupIds.length > 0 ? cls.assignedGroupIds[0] : null;
        cls.updatedAt = new Date().toISOString();

        saveClassesDataToStorage();
        renderClsUserGroupTab();
        renderClsClassesList();
        if (typeof window.showToast === 'function') window.showToast(`Unlinked "${gName}" from class`);
      });
    }
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
