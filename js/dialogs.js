// Glimpse In-App Dialogs, Modals, Toasts & Secret Backup Module
(function(window) {
  'use strict';

  // --- TOAST NOTIFICATIONS ---
  function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // --- FALLBACK CLIPBOARD COPY ---
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

  // --- DOWNLOAD BLOB UTILITY ---
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

  // --- IN-APP CONFIRMATION & ALERT MODAL ENGINE ---
  function showConfirmDialog(options = {}) {
    const confirmModal = document.getElementById('confirmModal');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
    const okConfirmBtn = document.getElementById('okConfirmBtn');

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

  // --- ATTENDEE EDIT MODAL DIALOG ---
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

  // --- USER GROUP MEMBER EDIT MODAL DIALOG ---
  function showUgMemberEditModal(options = {}) {
    return new Promise((resolve) => {
      const { rollNo = '', name = '' } = options;
      const modal = document.getElementById('ugMemberModal');
      const rollNoInput = document.getElementById('ugEditMemberRollNo');
      const nameInput = document.getElementById('ugEditMemberName');
      const form = document.getElementById('ugMemberForm');
      const cancelBtn = document.getElementById('ugCancelMemberModalBtn');

      if (!modal || !form || !rollNoInput || !nameInput) {
        const newName = window.prompt('Enter member name:', name);
        if (newName !== null) {
          const newRoll = window.prompt('Enter roll number / ID:', rollNo) || rollNo;
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
        const trimmedName = nameInput.value.trim();
        const trimmedRoll = rollNoInput.value.trim();
        if (!trimmedName) return;
        cleanup();
        resolve({ name: trimmedName, rollNo: trimmedRoll });
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

  // --- SELECT USER GROUP MODAL (COPY / ASSIGN) ---
  function showUserGroupSelectModal(mode = 'copy') {
    return new Promise((resolve) => {
      const modal = document.getElementById('attUserGroupSelectModal');
      const titleEl = document.getElementById('attUgSelectModalTitle');
      const descEl = document.getElementById('attUgSelectModalDesc');
      const iconBadge = document.getElementById('attUgSelectModalIconBadge');
      const listEl = document.getElementById('attUgSelectList');
      const cancelBtn = document.getElementById('attCancelUgSelectBtn');

      if (!modal || !listEl) {
        resolve(null);
        return;
      }

      if (mode === 'copy') {
        if (titleEl) titleEl.textContent = 'Copy from User Group';
        if (descEl) descEl.textContent = 'Select a user group to copy its member names and roll numbers.';
        if (iconBadge) iconBadge.textContent = '📋';
      } else {
        if (titleEl) titleEl.textContent = 'Assign Master User Group';
        if (descEl) descEl.textContent = 'Select a user group to keep this program roster in live sync.';
        if (iconBadge) iconBadge.textContent = '🔗';
      }

      const groups = (window.userGroupsData && window.userGroupsData.groups) ? window.userGroupsData.groups : [];
      if (groups.length === 0) {
        listEl.innerHTML = `
          <div style="text-align: center; color: var(--muted); padding: 24px 12px; font-size: var(--text-sm);">
            No user groups found. Go to <strong>Manage &gt; User Groups</strong> to create one.
          </div>
        `;
      } else {
        listEl.innerHTML = groups.map(g => {
          const mCount = Array.isArray(g.members) ? g.members.length : 0;
          return `
            <div class="att-ug-select-card" data-group-id="${g.id}">
              <div style="flex: 1;">
                <div style="font-weight: 600; font-size: var(--text-sm); color: var(--fg);">${window.escapeHtml(g.name)}</div>
                ${g.description ? `<div style="font-size: var(--text-xs); color: var(--muted); margin-top: 2px;">${window.escapeHtml(g.description)}</div>` : ''}
                <div style="font-size: var(--text-xs); color: var(--accent); margin-top: 4px;">👥 ${mCount} ${mCount === 1 ? 'member' : 'members'}</div>
              </div>
              <button type="button" class="btn btn-secondary btn-sm att-ug-pick-btn" data-group-id="${g.id}">
                ${mode === 'copy' ? 'Copy Roster' : 'Assign Sync'}
              </button>
            </div>
          `;
        }).join('');
      }

      modal.classList.add('active');
      modal.removeAttribute('aria-hidden');
      modal.inert = false;

      const cleanup = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        modal.inert = true;
        if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onOverlayClick);
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

      if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
      modal.addEventListener('click', onOverlayClick);

      listEl.querySelectorAll('.att-ug-select-card').forEach(card => {
        card.addEventListener('click', () => {
          const gId = card.getAttribute('data-group-id');
          const selectedGroup = groups.find(g => g.id === gId);
          cleanup();
          resolve(selectedGroup || null);
        });
      });
    });
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
      if (typeof window.updateLandingPageHero === 'function') {
        window.updateLandingPageHero();
      }
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

    const cleanStaleBtn = document.getElementById('backupCleanStaleBtn');
    if (cleanStaleBtn) {
      cleanStaleBtn.addEventListener('click', () => {
        if (typeof window.clearAllMigrationBackups === 'function') {
          const result = window.clearAllMigrationBackups();
          updateBackupModalStorageStats();
          if (result.pruned > 0) {
            const kbFreed = (result.bytesFreed / 1024).toFixed(1);
            showToast(`Cleaned ${result.pruned} stale backup${result.pruned === 1 ? '' : 's'} (${kbFreed} KB freed)! 🧹`);
          } else {
            showToast('Storage is already clean! No stale backups found. ✨');
          }
        }
      });
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

  function updateBackupModalStorageStats() {
    const totalSizeText = document.getElementById('storageTotalSizeText');
    const backupInfoText = document.getElementById('storageBackupInfoText');
    const cleanStaleBtn = document.getElementById('backupCleanStaleBtn');

    if (typeof window.getStorageUsageStats === 'function') {
      const stats = window.getStorageUsageStats();
      if (totalSizeText) {
        totalSizeText.textContent = `${stats.totalFormatted} used (${stats.appKeyCount} active key${stats.appKeyCount === 1 ? '' : 's'})`;
      }
      if (backupInfoText) {
        if (stats.backupCount > 0) {
          backupInfoText.innerHTML = `Stale migration backups: <strong style="color: var(--danger);">${stats.backupCount}</strong> (${stats.backupFormatted})`;
        } else {
          backupInfoText.innerHTML = `Migration backups: <strong style="color: var(--success);">0 (Clean ✨)</strong>`;
        }
      }
      if (cleanStaleBtn) {
        cleanStaleBtn.style.display = stats.backupCount > 0 ? 'inline-flex' : 'none';
      }
    }
  }

  function openBackupModal() {
    const modal = document.getElementById('backupModal');
    if (!modal) return;
    const nameInput = document.getElementById('userNameInput');
    if (nameInput) {
      nameInput.value = localStorage.getItem('glimpse_user_name') || '';
    }
    updateBackupModalStorageStats();
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
        // Exclude internal migration snapshots from JSON exports to keep backups lightweight
        if (key && !key.startsWith('glimpse_migration_backup_')) {
          dump[key] = localStorage.getItem(key);
        }
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

  // Export to global scope
  window.showToast = showToast;
  window.fallbackCopyText = fallbackCopyText;
  window.downloadBlob = downloadBlob;
  window.showConfirmDialog = showConfirmDialog;
  window.showAlertDialog = showAlertDialog;
  window.showPromptDialog = showPromptDialog;
  window.showParticipantEditModal = showParticipantEditModal;
  window.showUgMemberEditModal = showUgMemberEditModal;
  window.showUserGroupSelectModal = showUserGroupSelectModal;
  window.setupBackupSecretFeature = setupBackupSecretFeature;
  window.openBackupModal = openBackupModal;
  window.closeBackupModal = closeBackupModal;
  window.exportLocalStorageAsJson = exportLocalStorageAsJson;
  window.importLocalStorageFromJson = importLocalStorageFromJson;

})(window);
