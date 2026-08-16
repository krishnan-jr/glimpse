// Glimpse Application Master Bootstrap & Orchestrator
(function(window) {
  'use strict';

  // --- THEME ICONS & CONTROLLER ---
  const SUN_SVG = `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`;
  const MOON_SVG = `<svg viewBox="0 0 24 24"><path d="M12.3 2C6.5 2 1.8 6.7 1.8 12.5S6.5 23 12.3 23c4.8 0 8.8-3.2 10.1-7.7-.6.2-1.3.3-2 .3-5.2 0-9.5-4.3-9.5-9.5 0-1.4.3-2.7.8-3.9-1.3-.2-2.5-.2-3.7-.2z"/></svg>`;

  let isDarkMode = false;

  function setupTheme() {
    const savedTheme = localStorage.getItem('glimpse_theme');
    isDarkMode = savedTheme === 'dark';

    const themeSpans = document.querySelectorAll('.theme-icon-span');
    const themeIcon = document.getElementById('themeIcon');

    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeSpans.forEach(span => { span.innerHTML = SUN_SVG; });
      if (themeIcon) themeIcon.innerHTML = SUN_SVG;
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeSpans.forEach(span => { span.innerHTML = MOON_SVG; });
      if (themeIcon) themeIcon.innerHTML = MOON_SVG;
    }
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('glimpse_theme', isDarkMode ? 'dark' : 'light');
    setupTheme();
  }

  // Global delegated theme toggle event handler
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-toggle-btn');
    if (btn) {
      e.preventDefault();
      toggleTheme();
    }
  });

  // --- PWA SERVICE WORKER & INSTALL PROMPT ---
  let deferredInstallPrompt = null;

  function setupPWA() {
    const pwaInstallBtn = document.getElementById('pwaInstallBtn');

    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {
          // Silently ignore if service worker registration is not supported in this environment
        });
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (pwaInstallBtn) {
        pwaInstallBtn.style.display = 'inline-flex';
        pwaInstallBtn.addEventListener('click', () => {
          if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then((choiceResult) => {
              pwaInstallBtn.style.display = 'none';
              deferredInstallPrompt = null;
            });
          }
        });
      }
    });

    window.addEventListener('appinstalled', () => {
      if (pwaInstallBtn) pwaInstallBtn.style.display = 'none';
      deferredInstallPrompt = null;
    });
  }

  // --- FEELGOOD MESSAGES & QUOTES ---
  function loadFeelgoodMessagesFromJson() {
    if (window.location.protocol === 'file:') return;
    fetch('./feelgood-messages.json')
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          window.FEELGOOD_MESSAGES_100 = data;
          updateLandingPageHero();
        }
      })
      .catch(() => {
        // Built-in messages from constants.js will be used automatically
      });
  }

  function updateLandingPageHero() {
    const heroTitle = document.getElementById('heroTitle');
    const heroSubMessage = document.getElementById('heroSubMessage');
    const dashboardHeaderTitle = document.getElementById('dashboardHeaderTitle');

    if (dashboardHeaderTitle) {
      dashboardHeaderTitle.textContent = 'Dashboard';
    }

    const userName = localStorage.getItem('glimpse_user_name');
    const vibrantColors = window.VIBRANT_NAME_COLORS || ['#FF4757', '#2ED573', '#1E90FF'];
    const messages = window.FEELGOOD_MESSAGES_100 || ["Small steps every day lead to big results."];

    if (heroTitle) {
      if (userName && userName.trim() !== '') {
        const randomColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
        heroTitle.innerHTML = `Welcome, <span id="heroUserNameSpan" style="color: ${randomColor}; font-weight: 800;">${window.escapeHtml(userName.trim())}</span>`;
      } else {
        heroTitle.textContent = 'Welcome to Studio';
      }
    }

    if (heroSubMessage) {
      const randomIndex = Math.floor(Math.random() * messages.length);
      heroSubMessage.textContent = messages[randomIndex];
    }
  }

  // --- GLOBAL EVENT LISTENERS & ROUTING HOOKS ---
  function setupGlobalRouterEvents() {
    window.addEventListener('popstate', () => {
      if (typeof window.handleRoute === 'function') {
        window.handleRoute(window.location.hash);
      }
    });

    window.addEventListener('hashchange', () => {
      if (typeof window.checkUrlForSecretPreset === 'function' && window.checkUrlForSecretPreset()) {
        if (typeof window.openGlimpseApp === 'function') window.openGlimpseApp();
        if (typeof window.applyTimetableForDate === 'function') window.applyTimetableForDate(new Date());
        if (typeof window.renderAll === 'function') window.renderAll();
      } else {
        if (typeof window.handleRoute === 'function') {
          window.handleRoute(window.location.hash);
        }
      }
    });

    // Page Refresh / Tab Close Protection for Unsaved Changes
    window.addEventListener('beforeunload', (e) => {
      const isAttDirty = typeof window.isAttRecordSessionDirty === 'function' && window.isAttRecordSessionDirty();
      const isUgDirty = typeof window.isUgFormDirty === 'function' && window.isUgFormDirty();

      if (isAttDirty || isUgDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Do you want to continue?';
        return e.returnValue;
      }
    });
  }

  // --- APP INITIALIZATION ---
  function init() {
    // 1. Run LocalStorage database schema migrations before loading state
    const migrationResult = (typeof window.runDataMigrations === 'function') 
      ? window.runDataMigrations() 
      : null;

    // Prune any historical migration backup snapshots (keep at most 1 safety backup)
    if (typeof window.pruneMigrationBackups === 'function') {
      window.pruneMigrationBackups(1);
    }

    // 2. Load storage states
    if (typeof window.loadClassesDataFromStorage === 'function') window.loadClassesDataFromStorage();
    if (typeof window.loadUserGroupsDataFromStorage === 'function') window.loadUserGroupsDataFromStorage();
    if (typeof window.loadAttendanceDataFromStorage === 'function') window.loadAttendanceDataFromStorage();
    loadFeelgoodMessagesFromJson();

    const isSecretPresetTriggered = (typeof window.checkUrlForSecretPreset === 'function') 
      ? window.checkUrlForSecretPreset() 
      : false;

    if (!isSecretPresetTriggered && typeof window.loadStateFromStorage === 'function') {
      window.loadStateFromStorage();
    }

    // 3. UI Setup
    if (typeof window.applyRandomTitleEmojiOnRefresh === 'function') window.applyRandomTitleEmojiOnRefresh();
    if (typeof window.applyRandomDayEmojiOnRefresh === 'function') window.applyRandomDayEmojiOnRefresh();
    if (typeof window.setupDatePicker === 'function') window.setupDatePicker();
    setupTheme();
    if (typeof window.setupTabNavigation === 'function') window.setupTabNavigation();
    setupPWA();
    if (typeof window.setupViewNavigation === 'function') window.setupViewNavigation();
    if (typeof window.setupGlimpseEventListeners === 'function') window.setupGlimpseEventListeners();
    if (typeof window.setupAttendanceEventListeners === 'function') window.setupAttendanceEventListeners();
    if (typeof window.setupUserGroupsEventListeners === 'function') window.setupUserGroupsEventListeners();
    if (typeof window.setupClassesEventListeners === 'function') window.setupClassesEventListeners();
    if (typeof window.setupBackupSecretFeature === 'function') window.setupBackupSecretFeature();
    setupGlobalRouterEvents();
    updateLandingPageHero();

    // 4. Timetable & Rendering
    if (typeof window.applyTimetableForDate === 'function') {
      window.applyTimetableForDate(new Date());
    }
    if (typeof window.renderAll === 'function') {
      window.renderAll();
    }

    // 5. Notify user if schema was automatically upgraded during this boot / refresh
    if (migrationResult && migrationResult.migrated && migrationResult.fromVersion) {
      setTimeout(() => {
        if (typeof window.showToast === 'function') {
          window.showToast(`Schema updated: ${migrationResult.fromVersion} → ${migrationResult.currentVersion}`);
        }
      }, 400);
    }

    // 6. SPA Router Setup & Route Restoration
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

    if (currentHash && typeof window.handleRoute === 'function') {
      window.handleRoute(currentHash);
    }
  }

  // Global diagnostics & migration tools
  window.__glimpseSchemaVersion = window.CURRENT_DB_SCHEMA_VERSION;
  window.__glimpseMigrateStorage = window.runDataMigrations;
  window.__glimpseMigrations = window.SCHEMA_MIGRATIONS;
  window.toggleTheme = toggleTheme;
  window.updateLandingPageHero = updateLandingPageHero;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
