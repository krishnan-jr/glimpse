// Glimpse User Groups & Bulk Roster Management Engine Module
(function(window) {
  'use strict';

  let userGroupsData = { groups: [] };
  let ugCurrentActiveGroupId = null;
  let ugDraftMembers = [];
  let ugInitialFormSnapshot = null;
  let ugBulkInitialMembers = [];

  // --- STORAGE HANDLERS ---
  function loadUserGroupsDataFromStorage() {
    try {
      const saved = localStorage.getItem('glimpse_user_groups_data_v1');
      if (saved) {
        userGroupsData = JSON.parse(saved);
        if (!userGroupsData || typeof userGroupsData !== 'object' || Array.isArray(userGroupsData)) {
          userGroupsData = { groups: [] };
        }
        if (!Array.isArray(userGroupsData.groups)) {
          userGroupsData.groups = [];
        }
        userGroupsData.groups.forEach(g => {
          if (!Array.isArray(g.members)) g.members = [];
        });
      } else {
        userGroupsData = { groups: [] };
        saveUserGroupsDataToStorage();
      }
    } catch (e) {
      console.error('Error loading user groups data:', e);
      userGroupsData = { groups: [] };
    }
  }

  function saveUserGroupsDataToStorage() {
    try {
      localStorage.setItem('glimpse_user_groups_data_v1', JSON.stringify(userGroupsData));
    } catch (e) {
      console.error('Error saving user groups data:', e);
    }
  }

  // Screen Switcher
  function showUgScreen(screenId) {
    const screens = document.querySelectorAll('#view-user-groups-app .att-screen');
    screens.forEach(s => s.classList.remove('active'));

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');

    const ugBackBtnText = document.getElementById('ugBackBtnText');
    if (ugBackBtnText) {
      if (screenId === 'ug-screen-groups') {
        ugBackBtnText.textContent = 'Manage';
      } else {
        ugBackBtnText.textContent = 'Groups';
      }
    }
  }

  function handleUgBackClick() {
    const activeScreen = document.querySelector('#view-user-groups-app .att-screen.active');
    if (activeScreen && activeScreen.id === 'ug-screen-group-form') {
      if (isUgFormDirty()) {
        confirmUnsavedUgChanges().then(confirmed => {
          if (confirmed) {
            ugInitialFormSnapshot = null;
            if (typeof window.openUserGroupsApp === 'function') window.openUserGroupsApp();
          }
        });
      } else {
        if (typeof window.openUserGroupsApp === 'function') window.openUserGroupsApp();
      }
    } else {
      if (typeof window.openManageApp === 'function') window.openManageApp();
    }
  }

  function captureUgFormSnapshot() {
    const nameInput = document.getElementById('ugGroupName');
    const descInput = document.getElementById('ugGroupDesc');
    ugInitialFormSnapshot = {
      name: nameInput ? nameInput.value.trim() : '',
      description: descInput ? descInput.value.trim() : '',
      members: JSON.parse(JSON.stringify(ugDraftMembers))
    };
  }

  function isUgFormDirty() {
    const activeScreen = document.querySelector('#view-user-groups-app .att-screen.active');
    if (!activeScreen || activeScreen.id !== 'ug-screen-group-form') return false;
    if (!ugInitialFormSnapshot) return false;

    const nameInput = document.getElementById('ugGroupName');
    const descInput = document.getElementById('ugGroupDesc');
    const newNameInput = document.getElementById('ugNewMemberName');
    const currentName = nameInput ? nameInput.value.trim() : '';
    const currentDesc = descInput ? descInput.value.trim() : '';

    // If typed something in the new member input bar
    if (newNameInput && newNameInput.value.trim().length > 0) return true;

    // Check basic metadata change
    if (currentName !== ugInitialFormSnapshot.name) return true;
    if (currentDesc !== ugInitialFormSnapshot.description) return true;

    // Check if in bulk edit mode and textarea differs
    const bulkSection = document.getElementById('ugBulkRosterSection');
    if (bulkSection && bulkSection.style.display !== 'none') {
      const textarea = document.getElementById('ugBulkMembersTextarea');
      if (textarea) {
        const lines = textarea.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const initialNames = ugInitialFormSnapshot.members.map(m => (m.name || '').trim()).filter(Boolean);
        if (lines.length !== initialNames.length) return true;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i] !== initialNames[i]) return true;
        }
      }
    }

    // Check draft members vs snapshot members
    if (ugDraftMembers.length !== ugInitialFormSnapshot.members.length) return true;
    for (let i = 0; i < ugDraftMembers.length; i++) {
      const curr = ugDraftMembers[i];
      const init = ugInitialFormSnapshot.members[i];
      if (!init) return true;
      if ((curr.name || '').trim() !== (init.name || '').trim()) return true;
      if (String(curr.rollNo || '').trim() !== String(init.rollNo || '').trim()) return true;
    }

    return false;
  }

  function confirmUnsavedUgChanges() {
    if (!isUgFormDirty()) {
      return Promise.resolve(true);
    }

    return window.showConfirmDialog({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes in this user group. Are you sure you want to discard your changes?',
      confirmText: 'Discard & Leave',
      cancelText: 'Stay on Page',
      isDanger: true
    });
  }

  function resetUgInitialSnapshot() {
    ugInitialFormSnapshot = null;
  }

  // --- SCREEN 1: RENDER USER GROUPS LIST ---
  function renderUgGroupsList() {
    const container = document.getElementById('ugGroupsList');
    if (!container) return;

    if (!userGroupsData.groups || userGroupsData.groups.length === 0) {
      container.innerHTML = `
        <div class="att-empty-state">
          <div class="att-empty-icon">👥</div>
          <h3>No User Groups Found</h3>
          <p>Create your first user group to start managing members and rosters.</p>
          <button id="ugEmptyCreateBtn" class="btn btn-primary btn-sm">+ Create User Group</button>
        </div>
      `;
      const emptyBtn = document.getElementById('ugEmptyCreateBtn');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openUserGroupForm(null));
      return;
    }

    container.innerHTML = userGroupsData.groups.map(group => {
      const memberCount = Array.isArray(group.members) ? group.members.length : 0;
      return `
        <div class="att-program-card" data-group-id="${group.id}">
          <div class="att-card-header">
            <div class="att-card-title-group">
              <h3>${window.escapeHtml(group.name)}</h3>
              ${group.description ? `<div class="att-card-subtitle">${window.escapeHtml(group.description)}</div>` : ''}
            </div>
            <button type="button" class="btn-round-arrow ug-open-group-btn" data-id="${group.id}" title="Open ${window.escapeHtml(group.name)}" aria-label="Open User Group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          <div class="att-card-stats">
            <span class="att-stat-badge">👥 ${memberCount} ${memberCount === 1 ? 'Member' : 'Members'}</span>
          </div>

          <div class="att-card-actions">
            <button class="btn btn-subtle btn-sm ug-edit-group-btn" data-id="${group.id}">✎ Edit</button>
            <button class="btn btn-subtle btn-sm ug-delete-group-btn" data-id="${group.id}" style="color: var(--danger);">✕ Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach button listeners
    container.querySelectorAll('.ug-open-group-btn, .ug-edit-group-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gId = btn.getAttribute('data-id');
        openUserGroupForm(gId);
      });
    });

    container.querySelectorAll('.ug-delete-group-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const gId = btn.getAttribute('data-id');
        const targetGroup = userGroupsData.groups.find(g => g.id === gId);
        if (!targetGroup) return;

        const confirmed = await window.showConfirmDialog({
          title: 'Delete User Group',
          message: `Are you sure you want to delete "${targetGroup.name}"? This action cannot be undone.`,
          confirmText: 'Delete Group',
          cancelText: 'Cancel'
        });

        if (confirmed) {
          userGroupsData.groups = userGroupsData.groups.filter(g => g.id !== gId);
          saveUserGroupsDataToStorage();
          renderUgGroupsList();
          if (typeof window.showToast === 'function') window.showToast(`Deleted group: ${targetGroup.name}`);
        }
      });
    });
  }

  // --- SCREEN 2: OPEN CREATE / EDIT USER GROUP FORM ---
  function openUserGroupForm(groupId = null, updateHash = true) {
    ugCurrentActiveGroupId = groupId;
    const formTitle = document.getElementById('ugGroupFormTitle');
    const editIdInput = document.getElementById('ugEditGroupId');
    const nameInput = document.getElementById('ugGroupName');
    const descInput = document.getElementById('ugGroupDesc');
    const newRollInput = document.getElementById('ugNewMemberRollNo');
    const newNameInput = document.getElementById('ugNewMemberName');

    // Ensure default to standard roster view
    const standardSection = document.getElementById('ugStandardRosterSection');
    const bulkSection = document.getElementById('ugBulkRosterSection');
    if (standardSection) standardSection.style.display = '';
    if (bulkSection) bulkSection.style.display = 'none';

    if (groupId) {
      const group = userGroupsData.groups.find(g => g.id === groupId);
      if (!group) {
        if (typeof window.openUserGroupsApp === 'function') window.openUserGroupsApp();
        return;
      }
      if (formTitle) formTitle.textContent = 'Edit User Group';
      if (editIdInput) editIdInput.value = group.id;
      if (nameInput) nameInput.value = group.name || '';
      if (descInput) descInput.value = group.description || '';
      ugDraftMembers = Array.isArray(group.members) ? JSON.parse(JSON.stringify(group.members)) : [];
      if (updateHash && typeof window.navigateToRoute === 'function') window.navigateToRoute(`#/manage/groups/form?id=${groupId}`);
    } else {
      if (formTitle) formTitle.textContent = 'Create New User Group';
      if (editIdInput) editIdInput.value = '';
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      ugDraftMembers = [];
      if (updateHash && typeof window.navigateToRoute === 'function') window.navigateToRoute('#/manage/groups/form');
    }

    if (newRollInput) newRollInput.value = String(ugDraftMembers.length + 1);
    if (newNameInput) newNameInput.value = '';

    renderUgMembersDraftList();
    captureUgFormSnapshot();
    showUgScreen('ug-screen-group-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- BULK EDIT / STANDARD VIEW SWITCHERS ---
  function switchToUgBulkEditMode() {
    const standardSection = document.getElementById('ugStandardRosterSection');
    const bulkSection = document.getElementById('ugBulkRosterSection');
    const textarea = document.getElementById('ugBulkMembersTextarea');
    const countEl = document.getElementById('ugBulkLineCount');

    ugBulkInitialMembers = JSON.parse(JSON.stringify(ugDraftMembers));

    if (textarea) {
      textarea.value = ugDraftMembers.map(m => m.name).filter(Boolean).join('\n');
    }
    if (countEl) {
      countEl.textContent = String(ugDraftMembers.length);
    }

    if (standardSection) standardSection.style.display = 'none';
    if (bulkSection) bulkSection.style.display = '';

    if (textarea) {
      setTimeout(() => {
        textarea.focus();
      }, 50);
    }
  }

  async function applyUgBulkEditAndReturnToStandard() {
    const standardSection = document.getElementById('ugStandardRosterSection');
    const bulkSection = document.getElementById('ugBulkRosterSection');
    const textarea = document.getElementById('ugBulkMembersTextarea');

    const lines = textarea ? textarea.value.split('\n').map(l => l.trim()).filter(l => l.length > 0) : [];
    const origNames = ugBulkInitialMembers.map(m => (m.name || '').trim().toLowerCase()).filter(Boolean);

    // If there were previously members, and either all names are cleared or completely replaced (0 overlap):
    const isCompletelyReplacing = origNames.length > 0 && (
      lines.length === 0 || 
      !origNames.some(orig => lines.some(l => l.toLowerCase() === orig))
    );

    if (isCompletelyReplacing) {
      const confirmed = await window.showConfirmDialog({
        title: 'Replace Entire Member List?',
        message: lines.length === 0 
          ? 'You have cleared all members. All previous member data will be removed. Do you want to proceed?' 
          : 'You are completely replacing the existing member roster with a new list. All previous member data will be replaced. Do you want to proceed?',
        confirmText: lines.length === 0 ? 'Clear Roster' : 'Replace Roster',
        cancelText: 'Keep Editing',
        isDanger: true
      });

      if (!confirmed) {
        return; // Stay in bulk edit mode
      }
    }

    ugDraftMembers = lines.map((name, idx) => ({
      id: `mem_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      rollNo: String(idx + 1),
      name: name
    }));

    const newRollInput = document.getElementById('ugNewMemberRollNo');
    if (newRollInput) {
      newRollInput.value = String(ugDraftMembers.length + 1);
    }

    if (bulkSection) bulkSection.style.display = 'none';
    if (standardSection) standardSection.style.display = '';

    renderUgMembersDraftList();
  }

  function syncUgBulkLineCount() {
    const textarea = document.getElementById('ugBulkMembersTextarea');
    const countEl = document.getElementById('ugBulkLineCount');
    if (!textarea || !countEl) return;
    const lines = textarea.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    countEl.textContent = String(lines.length);
  }

  function getUgMemberRollNo(m, defaultIdx) {
    if (m && m.rollNo !== undefined && m.rollNo !== null && String(m.rollNo).trim() !== '') {
      return String(m.rollNo).trim();
    }
    return String(defaultIdx);
  }

  function getUgNextSuggestedRollNo() {
    let maxNum = 0;
    let hasNumeric = false;
    ugDraftMembers.forEach((m, idx) => {
      const rNo = getUgMemberRollNo(m, idx + 1);
      const parsed = parseInt(rNo, 10);
      if (!isNaN(parsed) && String(parsed) === rNo.trim()) {
        hasNumeric = true;
        if (parsed > maxNum) maxNum = parsed;
      }
    });

    if (hasNumeric && maxNum > 0) {
      return String(maxNum + 1);
    }
    return String(ugDraftMembers.length + 1);
  }

  // --- RENDER DRAFT MEMBERS IN FORM ---
  function renderUgMembersDraftList() {
    const container = document.getElementById('ugMembersList');
    const badge = document.getElementById('ugMemberCountBadge');
    if (badge) badge.textContent = String(ugDraftMembers.length);

    const rollNoInput = document.getElementById('ugNewMemberRollNo');
    if (rollNoInput) {
      rollNoInput.value = getUgNextSuggestedRollNo();
    }

    if (!container) return;

    if (ugDraftMembers.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--muted); padding: 12px; font-size: var(--text-xs);">No members added yet. Enter full name above to build your roster.</div>`;
      return;
    }

    container.innerHTML = ugDraftMembers.map((m, index) => {
      const rollNo = getUgMemberRollNo(m, index + 1);
      return `
        <div class="att-participant-item" data-id="${m.id}">
          <span class="name-text"><strong>${window.escapeHtml(rollNo)}.</strong> ${window.escapeHtml(m.name)}</span>
          <div class="item-actions">
            <button type="button" class="action-icon-btn ug-edit-member-btn" data-id="${m.id}" title="Edit Member Details">✎</button>
            <button type="button" class="action-icon-btn delete ug-delete-member-btn" data-id="${m.id}" title="Remove Member">✕</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.ug-edit-member-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const mIndex = ugDraftMembers.findIndex(item => item.id === id);
        if (mIndex !== -1) {
          const m = ugDraftMembers[mIndex];
          const currentRollNo = getUgMemberRollNo(m, mIndex + 1);
          const updated = await window.showUgMemberEditModal({
            rollNo: currentRollNo,
            name: m.name
          });
          if (updated) {
            m.rollNo = updated.rollNo;
            m.name = updated.name;
            renderUgMembersDraftList();
          }
        }
      });
    });

    container.querySelectorAll('.ug-delete-member-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        ugDraftMembers = ugDraftMembers.filter(item => item.id !== id);
        renderUgMembersDraftList();
      });
    });
  }

  // --- USER GROUPS EVENT LISTENERS SETUP ---
  function setupUserGroupsEventListeners() {
    const tileUserGroup = document.getElementById('tileUserGroup');
    const ugBackBtn = document.getElementById('ugBackBtn');

    if (tileUserGroup) {
      tileUserGroup.addEventListener('click', () => {
        if (typeof window.openUserGroupsApp === 'function') window.openUserGroupsApp();
      });
    }
    if (ugBackBtn) {
      ugBackBtn.addEventListener('click', handleUgBackClick);
    }

    const createGroupBtn = document.getElementById('ugCreateGroupBtn');
    if (createGroupBtn) {
      createGroupBtn.addEventListener('click', () => openUserGroupForm(null));
    }

    const cancelFormBtn = document.getElementById('ugCancelGroupFormBtn');
    if (cancelFormBtn) {
      cancelFormBtn.addEventListener('click', () => {
        if (isUgFormDirty()) {
          confirmUnsavedUgChanges().then(confirmed => {
            if (confirmed) {
              ugInitialFormSnapshot = null;
              if (typeof window.openUserGroupsApp === 'function') window.openUserGroupsApp();
            }
          });
        } else {
          if (typeof window.openUserGroupsApp === 'function') window.openUserGroupsApp();
        }
      });
    }

    // Toggle bulk edit mode listeners
    const switchToBulkBtn = document.getElementById('ugSwitchToBulkBtn');
    if (switchToBulkBtn) {
      switchToBulkBtn.addEventListener('click', switchToUgBulkEditMode);
    }

    const switchToStandardBtn = document.getElementById('ugSwitchToStandardBtn');
    if (switchToStandardBtn) {
      switchToStandardBtn.addEventListener('click', applyUgBulkEditAndReturnToStandard);
    }

    const bulkTextarea = document.getElementById('ugBulkMembersTextarea');
    if (bulkTextarea) {
      bulkTextarea.addEventListener('input', syncUgBulkLineCount);
    }

    // Add Member bar in Form
    const addMemberBtn = document.getElementById('ugAddMemberBtn');
    const newNameInput = document.getElementById('ugNewMemberName');
    const newRollInput = document.getElementById('ugNewMemberRollNo');

    const handleAddMember = () => {
      if (!newNameInput) return;
      const nameVal = newNameInput.value.trim();
      const rollVal = newRollInput ? newRollInput.value.trim() : '';

      if (!nameVal) {
        newNameInput.focus();
        return;
      }

      ugDraftMembers.push({
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        rollNo: rollVal,
        name: nameVal
      });

      newNameInput.value = '';
      if (newRollInput) {
        newRollInput.value = String(ugDraftMembers.length + 1);
      }
      renderUgMembersDraftList();
      newNameInput.focus();
    };

    if (addMemberBtn) addMemberBtn.addEventListener('click', handleAddMember);
    if (newNameInput) {
      newNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddMember();
        }
      });
    }

    // Group Form Submit
    const groupForm = document.getElementById('ugGroupForm');
    if (groupForm) {
      groupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('ugGroupName');
        const descInput = document.getElementById('ugGroupDesc');
        const name = nameInput ? nameInput.value.trim() : '';
        const desc = descInput ? descInput.value.trim() : '';

        if (!name) return;

        // If bulk view is currently active, ensure latest textarea content is parsed
        const bulkSection = document.getElementById('ugBulkRosterSection');
        if (bulkSection && bulkSection.style.display !== 'none') {
          const textarea = document.getElementById('ugBulkMembersTextarea');
          if (textarea) {
            const lines = textarea.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const origNames = ugBulkInitialMembers.map(m => (m.name || '').trim().toLowerCase()).filter(Boolean);
            const isCompletelyReplacing = origNames.length > 0 && (
              lines.length === 0 || 
              !origNames.some(orig => lines.some(l => l.toLowerCase() === orig))
            );

            if (isCompletelyReplacing) {
              const confirmed = await window.showConfirmDialog({
                title: 'Replace Entire Member List?',
                message: lines.length === 0 
                  ? 'You have cleared all members. All previous member data will be removed upon saving. Do you want to proceed?' 
                  : 'You are completely replacing the existing member roster with a new list. All previous member data will be replaced upon saving. Do you want to proceed?',
                confirmText: lines.length === 0 ? 'Clear & Save' : 'Replace & Save',
                cancelText: 'Keep Editing',
                isDanger: true
              });

              if (!confirmed) {
                return;
              }
            }

            ugDraftMembers = lines.map((mName, idx) => ({
              id: `mem_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
              rollNo: String(idx + 1),
              name: mName
            }));
          }
        }

        if (ugCurrentActiveGroupId) {
          // Update existing group
          const idx = userGroupsData.groups.findIndex(g => g.id === ugCurrentActiveGroupId);
          if (idx !== -1) {
            userGroupsData.groups[idx].name = name;
            userGroupsData.groups[idx].description = desc;
            userGroupsData.groups[idx].members = JSON.parse(JSON.stringify(ugDraftMembers));
            userGroupsData.groups[idx].updatedAt = new Date().toISOString();
          }
          if (typeof window.showToast === 'function') window.showToast(`Updated group: ${name}`);
        } else {
          // Create new group
          const newGroup = {
            id: `ug_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name,
            description: desc,
            members: JSON.parse(JSON.stringify(ugDraftMembers)),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          userGroupsData.groups.push(newGroup);
          if (typeof window.showToast === 'function') window.showToast(`Created group: ${name}`);
        }

        saveUserGroupsDataToStorage();
        ugInitialFormSnapshot = null;
        if (typeof window.openUserGroupsApp === 'function') window.openUserGroupsApp();
      });
    }
  }

  // Export to global scope
  Object.defineProperty(window, 'userGroupsData', {
    get: () => userGroupsData,
    set: (val) => { userGroupsData = val; },
    configurable: true
  });
  window.loadUserGroupsDataFromStorage = loadUserGroupsDataFromStorage;
  window.saveUserGroupsDataToStorage = saveUserGroupsDataToStorage;
  window.showUgScreen = showUgScreen;
  window.renderUgGroupsList = renderUgGroupsList;
  window.openUserGroupForm = openUserGroupForm;
  window.getUgMemberRollNo = getUgMemberRollNo;
  window.isUgFormDirty = isUgFormDirty;
  window.confirmUnsavedUgChanges = confirmUnsavedUgChanges;
  window.resetUgInitialSnapshot = resetUgInitialSnapshot;
  window.setupUserGroupsEventListeners = setupUserGroupsEventListeners;

})(window);
