// Glimpse Single Page Application (SPA) Router & View Navigation Module
(function(window) {
  'use strict';

  let isNavigatingFromRouter = false;
  let isCheckingDirtyNavigation = false;

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
    const isAttDirty = typeof window.isAttRecordSessionDirty === 'function' && window.isAttRecordSessionDirty();
    if (isAttDirty && !isCheckingDirtyNavigation) {
      isCheckingDirtyNavigation = true;
      const targetHash = hashStr;
      if (typeof window.confirmUnsavedAttendanceChanges === 'function') {
        window.confirmUnsavedAttendanceChanges().then(confirmed => {
          isCheckingDirtyNavigation = false;
          if (confirmed) {
            if (typeof window.resetAttRecordInitialState === 'function') {
              window.resetAttRecordInitialState();
            }
            handleRoute(targetHash);
          } else {
            // Re-sync address bar hash to keep user on record screen
            if (window.attCurrentActiveProgramId) {
              const currentRoute = window.attEditingSessionDate 
                ? `#/attendance/record?id=${window.attCurrentActiveProgramId}&date=${window.attEditingSessionDate}`
                : `#/attendance/record?id=${window.attCurrentActiveProgramId}`;
              window.history.pushState(null, '', currentRoute);
            }
          }
        });
      } else {
        isCheckingDirtyNavigation = false;
      }
      return;
    }

    const isUgDirty = typeof window.isUgFormDirty === 'function' && window.isUgFormDirty();
    if (isUgDirty && !isCheckingDirtyNavigation) {
      isCheckingDirtyNavigation = true;
      const targetHash = hashStr;
      if (typeof window.confirmUnsavedUgChanges === 'function') {
        window.confirmUnsavedUgChanges().then(confirmed => {
          isCheckingDirtyNavigation = false;
          if (confirmed) {
            if (typeof window.resetUgInitialSnapshot === 'function') {
              window.resetUgInitialSnapshot();
            }
            handleRoute(targetHash);
          } else {
            // Re-sync address bar hash to keep user on group form screen
            const currentRoute = window.ugCurrentActiveGroupId
              ? `#/manage/groups/form?id=${window.ugCurrentActiveGroupId}`
              : `#/manage/groups/form`;
            window.history.pushState(null, '', currentRoute);
          }
        });
      } else {
        isCheckingDirtyNavigation = false;
      }
      return;
    }

    const isClsDirty = typeof window.isClsFormDirty === 'function' && window.isClsFormDirty();
    if (isClsDirty && !isCheckingDirtyNavigation) {
      isCheckingDirtyNavigation = true;
      const targetHash = hashStr;
      if (typeof window.confirmUnsavedClsChanges === 'function') {
        window.confirmUnsavedClsChanges().then(confirmed => {
          isCheckingDirtyNavigation = false;
          if (confirmed) {
            handleRoute(targetHash);
          } else {
            const currentRoute = window.clsCurrentEditingClassId
              ? `#/manage/classes/form?id=${window.clsCurrentEditingClassId}`
              : `#/manage/classes/form`;
            window.history.pushState(null, '', currentRoute);
          }
        });
      } else {
        isCheckingDirtyNavigation = false;
      }
      return;
    }

    isNavigatingFromRouter = true;
    const { path, params } = parseHash(hashStr);

    const rawHash = (hashStr || '').toUpperCase();
    if (rawHash === '#2G' || rawHash === '#/2G' || rawHash === '2G') {
      if (typeof window.loadClassesPreset2G === 'function') {
        window.loadClassesPreset2G();
      }
      if (typeof window.loadPreset2G === 'function') {
        window.loadPreset2G();
      }
      isNavigatingFromRouter = false;
      return;
    }

    if (rawHash === '#ENG' || rawHash === '#/ENG' || rawHash === 'ENG') {
      if (typeof window.loadPresetENG === 'function') {
        window.loadPresetENG();
      }
      isNavigatingFromRouter = false;
      return;
    }

    const viewDashboard = document.getElementById('view-dashboard');
    const viewGlimpseApp = document.getElementById('view-glimpse-app');
    const viewAttendanceApp = document.getElementById('view-attendance-app');
    const viewManageApp = document.getElementById('view-manage-app');
    const viewUserGroupsApp = document.getElementById('view-user-groups-app');
    const viewClassesApp = document.getElementById('view-classes-app');

    if (path.startsWith('glimpse')) {
      if (viewDashboard) viewDashboard.classList.remove('active');
      if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
      if (viewManageApp) viewManageApp.classList.remove('active');
      if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
      if (viewClassesApp) viewClassesApp.classList.remove('active');
      if (viewGlimpseApp) viewGlimpseApp.classList.add('active');

      const sub = path.split('/')[1] || 'entry';
      if (sub === 'subjects' || sub === 'timetable') {
        navigateToRoute('#/manage/classes');
        return;
      }
      const tabMap = { 'entry': 'tab-entry', 'preview': 'tab-preview' };
      const targetTab = tabMap[sub] || 'tab-entry';
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
    } else if (path.startsWith('attendance')) {
      if (viewDashboard) viewDashboard.classList.remove('active');
      if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
      if (viewManageApp) viewManageApp.classList.remove('active');
      if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
      if (viewAttendanceApp) viewAttendanceApp.classList.add('active');

      const sub = path.split('/')[1] || 'programs';
      const progId = params.get('id');

      if (sub === 'program-form') {
        if (typeof window.openProgramForm === 'function') {
          window.openProgramForm(progId, false);
        }
      } else if (sub === 'matrix') {
        if (progId) {
          if (typeof window.openProgramMatrix === 'function') {
            window.openProgramMatrix(progId, false);
          }
        } else {
          if (typeof window.showAttScreen === 'function') window.showAttScreen('att-screen-programs');
          if (typeof window.renderAttProgramsList === 'function') window.renderAttProgramsList();
        }
      } else if (sub === 'record') {
        if (progId) {
          window.attCurrentActiveProgramId = progId;
          const dateParam = params.get('date');
          if (typeof window.openRecordSession === 'function') {
            window.openRecordSession(dateParam, false, progId);
          }
        } else {
          if (typeof window.showAttScreen === 'function') window.showAttScreen('att-screen-programs');
          if (typeof window.renderAttProgramsList === 'function') window.renderAttProgramsList();
        }
      } else {
        if (typeof window.showAttScreen === 'function') window.showAttScreen('att-screen-programs');
        if (typeof window.renderAttProgramsList === 'function') window.renderAttProgramsList();
      }
    } else if (path.startsWith('manage/groups') || path.startsWith('user-groups')) {
      if (viewDashboard) viewDashboard.classList.remove('active');
      if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
      if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
      if (viewManageApp) viewManageApp.classList.remove('active');
      if (viewClassesApp) viewClassesApp.classList.remove('active');
      if (viewUserGroupsApp) viewUserGroupsApp.classList.add('active');

      const isForm = path.includes('/form');
      const gId = params.get('id');

      if (isForm) {
        if (typeof window.openUserGroupForm === 'function') {
          window.openUserGroupForm(gId, false);
        }
      } else {
        if (typeof window.showUgScreen === 'function') window.showUgScreen('ug-screen-groups');
        if (typeof window.renderUgGroupsList === 'function') window.renderUgGroupsList();
      }
    } else if (path.startsWith('manage/classes') || path.startsWith('classes')) {
      if (viewDashboard) viewDashboard.classList.remove('active');
      if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
      if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
      if (viewManageApp) viewManageApp.classList.remove('active');
      if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
      if (viewClassesApp) viewClassesApp.classList.add('active');

      const isForm = path.includes('/form');
      const isTimetable = path.includes('/timetable') || path.includes('/matrix');
      const cId = params.get('id');

      if (isForm) {
        if (typeof window.openClassForm === 'function') {
          window.openClassForm(cId, false);
        }
      } else if (isTimetable) {
        if (typeof window.openClassTimetable === 'function') {
          window.openClassTimetable(cId, false);
        }
      } else {
        if (typeof window.showClsScreen === 'function') window.showClsScreen('cls-screen-classes');
        if (typeof window.renderClsClassesList === 'function') window.renderClsClassesList();
      }
    } else if (path.startsWith('manage')) {
      if (viewDashboard) viewDashboard.classList.remove('active');
      if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
      if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
      if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
      if (viewClassesApp) viewClassesApp.classList.remove('active');
      if (viewManageApp) viewManageApp.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
      if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
      if (viewManageApp) viewManageApp.classList.remove('active');
      if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
      if (viewClassesApp) viewClassesApp.classList.remove('active');
      if (viewDashboard) viewDashboard.classList.add('active');
      if (typeof window.updateLandingPageHero === 'function') {
        window.updateLandingPageHero();
      }
    }

    isNavigatingFromRouter = false;
  }

  function openGlimpseApp() {
    const viewDashboard = document.getElementById('view-dashboard');
    const viewAttendanceApp = document.getElementById('view-attendance-app');
    const viewManageApp = document.getElementById('view-manage-app');
    const viewUserGroupsApp = document.getElementById('view-user-groups-app');
    const viewClassesApp = document.getElementById('view-classes-app');
    const viewGlimpseApp = document.getElementById('view-glimpse-app');

    if (viewDashboard) viewDashboard.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
    if (viewManageApp) viewManageApp.classList.remove('active');
    if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
    if (viewClassesApp) viewClassesApp.classList.remove('active');
    if (viewGlimpseApp) viewGlimpseApp.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigateToRoute('#/glimpse');
  }

  function openAttendanceApp() {
    const viewDashboard = document.getElementById('view-dashboard');
    const viewGlimpseApp = document.getElementById('view-glimpse-app');
    const viewManageApp = document.getElementById('view-manage-app');
    const viewUserGroupsApp = document.getElementById('view-user-groups-app');
    const viewClassesApp = document.getElementById('view-classes-app');
    const viewAttendanceApp = document.getElementById('view-attendance-app');

    if (viewDashboard) viewDashboard.classList.remove('active');
    if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
    if (viewManageApp) viewManageApp.classList.remove('active');
    if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
    if (viewClassesApp) viewClassesApp.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window.showAttScreen === 'function') window.showAttScreen('att-screen-programs');
    if (typeof window.renderAttProgramsList === 'function') window.renderAttProgramsList();
    navigateToRoute('#/attendance');
  }

  function openManageApp() {
    const viewDashboard = document.getElementById('view-dashboard');
    const viewGlimpseApp = document.getElementById('view-glimpse-app');
    const viewAttendanceApp = document.getElementById('view-attendance-app');
    const viewUserGroupsApp = document.getElementById('view-user-groups-app');
    const viewClassesApp = document.getElementById('view-classes-app');
    const viewManageApp = document.getElementById('view-manage-app');

    if (viewDashboard) viewDashboard.classList.remove('active');
    if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
    if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
    if (viewClassesApp) viewClassesApp.classList.remove('active');
    if (viewManageApp) viewManageApp.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigateToRoute('#/manage');
  }

  function openUserGroupsApp() {
    const viewDashboard = document.getElementById('view-dashboard');
    const viewGlimpseApp = document.getElementById('view-glimpse-app');
    const viewAttendanceApp = document.getElementById('view-attendance-app');
    const viewManageApp = document.getElementById('view-manage-app');
    const viewClassesApp = document.getElementById('view-classes-app');
    const viewUserGroupsApp = document.getElementById('view-user-groups-app');

    if (viewDashboard) viewDashboard.classList.remove('active');
    if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
    if (viewManageApp) viewManageApp.classList.remove('active');
    if (viewClassesApp) viewClassesApp.classList.remove('active');
    if (viewUserGroupsApp) viewUserGroupsApp.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window.showUgScreen === 'function') window.showUgScreen('ug-screen-groups');
    if (typeof window.renderUgGroupsList === 'function') window.renderUgGroupsList();
    navigateToRoute('#/manage/groups');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window.showClsScreen === 'function') window.showClsScreen('cls-screen-classes');
    if (typeof window.renderClsClassesList === 'function') window.renderClsClassesList();
    navigateToRoute('#/manage/classes');
  }

  function openDashboard() {
    const viewGlimpseApp = document.getElementById('view-glimpse-app');
    const viewAttendanceApp = document.getElementById('view-attendance-app');
    const viewManageApp = document.getElementById('view-manage-app');
    const viewUserGroupsApp = document.getElementById('view-user-groups-app');
    const viewClassesApp = document.getElementById('view-classes-app');
    const viewDashboard = document.getElementById('view-dashboard');

    if (viewGlimpseApp) viewGlimpseApp.classList.remove('active');
    if (viewAttendanceApp) viewAttendanceApp.classList.remove('active');
    if (viewManageApp) viewManageApp.classList.remove('active');
    if (viewUserGroupsApp) viewUserGroupsApp.classList.remove('active');
    if (viewClassesApp) viewClassesApp.classList.remove('active');
    if (viewDashboard) viewDashboard.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window.updateLandingPageHero === 'function') {
      window.updateLandingPageHero();
    }
    navigateToRoute('#/dashboard');
  }

  function setupViewNavigation() {
    const tileGlimpseApp = document.getElementById('tileGlimpseApp');
    const tileManageApp = document.getElementById('tileManageApp');
    const tileAttendanceApp = document.getElementById('tileAttendanceApp');
    const tileUserGroup = document.getElementById('tileUserGroup');
    const tileClasses = document.getElementById('tileClasses');
    const backToDashboardBtn = document.getElementById('backToDashboardBtn');
    const manageBackToDashboardBtn = document.getElementById('manageBackToDashboardBtn');

    if (tileGlimpseApp) {
      tileGlimpseApp.addEventListener('click', openGlimpseApp);
    }
    if (tileManageApp) {
      tileManageApp.addEventListener('click', openManageApp);
    }
    if (tileAttendanceApp) {
      tileAttendanceApp.addEventListener('click', openAttendanceApp);
    }
    if (tileUserGroup) {
      tileUserGroup.addEventListener('click', openUserGroupsApp);
    }
    if (tileClasses) {
      tileClasses.addEventListener('click', openClassesApp);
    }
    if (backToDashboardBtn) {
      backToDashboardBtn.addEventListener('click', openDashboard);
    }
    if (manageBackToDashboardBtn) {
      manageBackToDashboardBtn.addEventListener('click', openDashboard);
    }

    // In-app alert for coming-soon tiles
    const disabledTiles = document.querySelectorAll('.disabled-app-tile');
    disabledTiles.forEach(tile => {
      tile.addEventListener('click', () => {
        const appName = tile.getAttribute('data-app-name') || 'This app';
        if (typeof window.showAlertDialog === 'function') {
          window.showAlertDialog('Coming Soon 🚀', `${appName} is currently under development and will be available in an upcoming update!`);
        }
      });
    });

    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
    themeToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof window.toggleTheme === 'function') {
          window.toggleTheme();
        }
      });
    });
  }

  // Export to global scope
  window.navigateToRoute = navigateToRoute;
  window.parseHash = parseHash;
  window.handleRoute = handleRoute;
  window.openGlimpseApp = openGlimpseApp;
  window.openAttendanceApp = openAttendanceApp;
  window.openManageApp = openManageApp;
  window.openUserGroupsApp = openUserGroupsApp;
  window.openClassesApp = openClassesApp;
  window.openDashboard = openDashboard;
  window.setupViewNavigation = setupViewNavigation;

})(window);
