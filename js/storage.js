// Glimpse Storage & Database Schema Migration Engine
(function(window) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // DATABASE SCHEMA VERSION & DATA MIGRATION ENGINE
  // ─────────────────────────────────────────────────────────────────────────
  const CURRENT_DB_SCHEMA_VERSION = 'V08';

  /**
   * Parses schema version string into a comparable integer.
   * e.g., 'V01' -> 1, 'V05' -> 5, 'v2' -> 2, null -> 0
   */
  function parseSchemaVersion(versionStr) {
    if (!versionStr || typeof versionStr !== 'string') return 0;
    const match = versionStr.trim().match(/^V?(\d+)$/i);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Formats numeric schema version into canonical 'V01', 'V02' format.
   */
  function formatSchemaVersion(versionNum) {
    const num = Math.max(0, parseInt(versionNum, 10) || 0);
    return `V${String(num).padStart(2, '0')}`;
  }

  /**
   * Creates safe storage accessor helper for migration scripts.
   */
  function createMigrationStorageHelper() {
    return {
      getItem: (key) => {
        try { return localStorage.getItem(key); } catch (e) { return null; }
      },
      getJson: (key, defaultValue = null) => {
        try {
          const val = localStorage.getItem(key);
          return val ? JSON.parse(val) : defaultValue;
        } catch (e) {
          return defaultValue;
        }
      },
      setItem: (key, value) => {
        try { localStorage.setItem(key, value); } catch (e) { console.error(`[Migration] Failed to set ${key}:`, e); }
      },
      setJson: (key, value) => {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error(`[Migration] Failed to set JSON ${key}:`, e); }
      },
      removeItem: (key) => {
        try { localStorage.removeItem(key); } catch (e) {}
      },
      hasKey: (key) => {
        try { return localStorage.getItem(key) !== null; } catch (e) { return false; }
      }
    };
  }

  /**
   * Intelligently scans and prunes historical migration safety backups from localStorage.
   * Keeps at most `maxKeep` newest backups (default: 1) and removes older ones.
   */
  function pruneMigrationBackups(maxKeep = 1) {
    try {
      const backupKeys = [];
      let totalBytesFreed = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('glimpse_migration_backup_')) {
          backupKeys.push(key);
        }
      }

      if (backupKeys.length <= maxKeep) {
        return { totalFound: backupKeys.length, pruned: 0, bytesFreed: 0 };
      }

      // Sort chronologically by ISO timestamp extracted from the key name
      backupKeys.sort((a, b) => {
        const timeA = (a.match(/\d{4}-\d{2}-\d{2}T[\d-]+Z/) || [a])[0];
        const timeB = (b.match(/\d{4}-\d{2}-\d{2}T[\d-]+Z/) || [b])[0];
        return timeA.localeCompare(timeB);
      });

      const keysToRemove = backupKeys.slice(0, backupKeys.length - maxKeep);
      keysToRemove.forEach(k => {
        const val = localStorage.getItem(k) || '';
        totalBytesFreed += (k.length + val.length) * 2;
        localStorage.removeItem(k);
        console.log(`[Storage Pruning] Removed stale migration backup: ${k}`);
      });

      return { totalFound: backupKeys.length, pruned: keysToRemove.length, bytesFreed: totalBytesFreed };
    } catch (e) {
      console.warn('[Storage Pruning] Error pruning migration backups:', e);
      return { totalFound: 0, pruned: 0, bytesFreed: 0, error: e };
    }
  }

  /**
   * Cleans all migration backup snapshots to maximize free storage space.
   */
  function clearAllMigrationBackups() {
    return pruneMigrationBackups(0);
  }

  /**
   * Computes human-readable storage statistics and migration backup overhead.
   */
  function getStorageUsageStats() {
    let totalBytes = 0;
    let backupBytes = 0;
    let backupCount = 0;
    let appKeyCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key) || '';
      const size = (key.length + val.length) * 2;
      totalBytes += size;
      if (key.startsWith('glimpse_migration_backup_')) {
        backupBytes += size;
        backupCount++;
      } else {
        appKeyCount++;
      }
    }

    const formatBytes = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return {
      totalBytes,
      totalFormatted: formatBytes(totalBytes),
      backupBytes,
      backupFormatted: formatBytes(backupBytes),
      backupCount,
      appKeyCount
    };
  }

  /**
   * Creates an automated snapshot of current app data before running migrations.
   * Automatically excludes other migration backups and prunes old historical snapshots.
   */
  function createPreMigrationBackup(fromVersion, toVersion) {
    try {
      // 1. Prune older backups first so storage doesn't balloon
      pruneMigrationBackups(0);

      const dump = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Exclude migration backup keys from the dump
        if (key && !key.startsWith('glimpse_migration_backup_')) {
          dump[key] = localStorage.getItem(key);
        }
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupKey = `glimpse_migration_backup_from_${fromVersion || 'unversioned'}_to_${toVersion}_${timestamp}`;
      localStorage.setItem(backupKey, JSON.stringify(dump));
      console.log(`[Storage Migration] Safety backup created: ${backupKey}`);
    } catch (e) {
      console.warn('[Storage Migration] Could not create pre-migration safety backup:', e);
    }
  }

  /**
   * Sequential Database Schema Migrations Definition Registry.
   * Each entry specifies target version, integer version number, description, and migration logic.
   */
  const SCHEMA_MIGRATIONS = [
    {
      version: 'V01',
      versionNum: 1,
      description: 'Initial schema baseline: normalize storage keys, subjects, timetable, notes, enabled states, and attendance data structures.',
      migrate: (storage) => {
        // 1. Normalize subjects collection
        const subjectsData = storage.getJson('glimpse_subjects_v10', null);
        if (subjectsData !== null) {
          if (!Array.isArray(subjectsData)) {
            storage.setJson('glimpse_subjects_v10', window.GENERIC_DEFAULT_SUBJECTS || []);
          } else {
            const cleanSubjects = subjectsData.map(s => {
              const iconVal = typeof s.icon === 'string' ? s.icon : (s.emoji || '📖');
              return {
                id: s.id || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                name: typeof s.name === 'string' ? s.name : 'Untitled',
                icon: iconVal,
                emoji: iconVal,
                badge: typeof s.badge === 'string' ? s.badge : '🟦',
                suffix: typeof s.suffix === 'string' ? s.suffix : '',
                notes: typeof s.notes === 'string' ? s.notes : ''
              };
            });
            storage.setJson('glimpse_subjects_v10', cleanSubjects);
          }
        }

        // 2. Normalize timetable day mapping
        const timetableData = storage.getJson('glimpse_timetable_v10', null);
        if (timetableData !== null) {
          if (typeof timetableData !== 'object' || Array.isArray(timetableData)) {
            storage.setJson('glimpse_timetable_v10', window.GENERIC_DEFAULT_TIMETABLE || {});
          } else {
            const cleanTimetable = {};
            (window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).forEach(day => {
              if (Array.isArray(timetableData[day])) {
                cleanTimetable[day] = timetableData[day];
              } else {
                cleanTimetable[day] = (window.GENERIC_DEFAULT_TIMETABLE && window.GENERIC_DEFAULT_TIMETABLE[day]) || [];
              }
            });
            storage.setJson('glimpse_timetable_v10', cleanTimetable);
          }
        }

        // 3. Normalize attendance programs & sessions
        const attData = storage.getJson('glimpse_attendance_data_v1', null);
        if (attData !== null) {
          if (typeof attData !== 'object' || Array.isArray(attData) || !Array.isArray(attData.programs)) {
            storage.setJson('glimpse_attendance_data_v1', { programs: [] });
          } else {
            const cleanPrograms = attData.programs.map(p => ({
              id: p.id || `prog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              name: typeof p.name === 'string' ? p.name : 'Untitled Program',
              type: p.type === 'custom' ? 'custom' : 'daily',
              startDate: p.startDate || '',
              endDate: p.endDate || '',
              activeDays: Array.isArray(p.activeDays) ? p.activeDays : [],
              activeDates: Array.isArray(p.activeDates) ? p.activeDates : [],
              participants: Array.isArray(p.participants) ? p.participants.map(pt => ({
                id: pt.id || `part_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                name: typeof pt.name === 'string' ? pt.name : 'Participant',
                rollNo: pt.rollNo !== undefined ? String(pt.rollNo) : ''
              })) : [],
              sessions: Array.isArray(p.sessions) ? p.sessions : (p.sessions && typeof p.sessions === 'object' ? p.sessions : [])
            }));
            storage.setJson('glimpse_attendance_data_v1', { programs: cleanPrograms });
          }
        }
      }
    },
    {
      version: 'V02',
      versionNum: 2,
      description: 'Repair and guarantee attendance sessions array format across all programs.',
      migrate: (storage) => {
        const attData = storage.getJson('glimpse_attendance_data_v1', null);
        if (attData && Array.isArray(attData.programs)) {
          let modified = false;
          attData.programs.forEach(p => {
            if (!Array.isArray(p.sessions)) {
              if (p.sessions && typeof p.sessions === 'object') {
                p.sessions = Object.keys(p.sessions).map(k => ({
                  date: k,
                  records: p.sessions[k] && typeof p.sessions[k] === 'object' ? p.sessions[k] : {}
                }));
              } else {
                p.sessions = [];
              }
              modified = true;
            }
            if (!Array.isArray(p.participants)) {
              p.participants = [];
              modified = true;
            }
          });
          if (modified) {
            storage.setJson('glimpse_attendance_data_v1', attData);
          }
        }
      }
    },
    {
      version: 'V03',
      versionNum: 3,
      description: 'Initialize and normalize User Groups data collection (glimpse_user_groups_data_v1).',
      migrate: (storage) => {
        const ugData = storage.getJson('glimpse_user_groups_data_v1', null);
        if (ugData === null || typeof ugData !== 'object' || Array.isArray(ugData) || !Array.isArray(ugData.groups)) {
          storage.setJson('glimpse_user_groups_data_v1', { groups: [] });
        } else {
          const cleanGroups = ugData.groups.map(g => ({
            id: g.id || `ug_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: typeof g.name === 'string' ? g.name : 'Untitled Group',
            description: typeof g.description === 'string' ? g.description : '',
            members: Array.isArray(g.members) ? g.members.map(m => ({
              id: m.id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              rollNo: m.rollNo !== undefined ? String(m.rollNo) : '',
              name: typeof m.name === 'string' ? m.name : 'Member'
            })) : [],
            createdAt: g.createdAt || new Date().toISOString(),
            updatedAt: g.updatedAt || new Date().toISOString()
          }));
          storage.setJson('glimpse_user_groups_data_v1', { groups: cleanGroups });
        }
      }
    },
    {
      version: 'V04',
      versionNum: 4,
      description: 'Support User Group sync bindings and copy tracking on Attendance Programs (assignedGroupId, isCopiedFromGroup).',
      migrate: (storage) => {
        const attData = storage.getJson('glimpse_attendance_data_v1', null);
        const ugData = storage.getJson('glimpse_user_groups_data_v1', null);
        const groups = (ugData && Array.isArray(ugData.groups)) ? ugData.groups : [];

        if (attData && Array.isArray(attData.programs)) {
          let modified = false;
          attData.programs.forEach(p => {
            if (p.assignedGroupId === undefined) {
              p.assignedGroupId = null;
              modified = true;
            } else if (typeof p.assignedGroupId === 'string' && p.assignedGroupId.trim() !== '') {
              p.assignedGroupId = p.assignedGroupId.trim();
              // If group exists in storage, sync participants
              const targetGroup = groups.find(g => g.id === p.assignedGroupId);
              if (targetGroup && Array.isArray(targetGroup.members)) {
                p.participants = targetGroup.members.map((m, idx) => ({
                  id: m.id || `mem_${Date.now()}_${idx}`,
                  name: m.name || 'Member',
                  rollNo: (m.rollNo !== undefined && m.rollNo !== null && String(m.rollNo).trim() !== '') ? String(m.rollNo).trim() : String(idx + 1)
                }));
                modified = true;
              }
            } else {
              p.assignedGroupId = null;
              modified = true;
            }

            if (p.isCopiedFromGroup === undefined) {
              p.isCopiedFromGroup = false;
              modified = true;
            } else {
              p.isCopiedFromGroup = Boolean(p.isCopiedFromGroup);
            }
          });

          if (modified) {
            storage.setJson('glimpse_attendance_data_v1', attData);
          }
        }
      }
    },
    {
      version: 'V05',
      versionNum: 5,
      description: 'Normalize subject icon and emoji properties across subjects collection.',
      migrate: (storage) => {
        const subjectsData = storage.getJson('glimpse_subjects_v10', null);
        if (Array.isArray(subjectsData)) {
          const cleanSubjects = subjectsData.map(s => {
            const iconVal = (typeof s.icon === 'string' && s.icon.trim()) ? s.icon : ((typeof s.emoji === 'string' && s.emoji.trim()) ? s.emoji : '📖');
            return {
              ...s,
              icon: iconVal,
              emoji: iconVal
            };
          });
          storage.setJson('glimpse_subjects_v10', cleanSubjects);
        }
      }
    },
    {
      version: 'V06',
      versionNum: 6,
      description: 'Initialize Classes collection (glimpse_classes_data_v1) and migrate existing subjects, timetable, and class & division settings.',
      migrate: (storage) => {
        let classesData = storage.getJson('glimpse_classes_data_v1', null);
        if (!classesData || typeof classesData !== 'object' || !Array.isArray(classesData.classes)) {
          classesData = { classes: [], activeClassId: null };
        }

        const existingSubjects = storage.getJson('glimpse_subjects_v10', null);
        const existingTimetable = storage.getJson('glimpse_timetable_v10', null);
        const existingClassDiv = storage.getItem('glimpse_class_div_v10') || '';

        // If no classes exist yet and there is existing subjects/timetable/class data
        if (classesData.classes.length === 0) {
          const className = existingClassDiv.trim() || '2G';
          const defaultSubjects = (Array.isArray(existingSubjects) && existingSubjects.length > 0)
            ? existingSubjects
            : JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_SUBJECTS || []));
          const defaultTimetable = (existingTimetable && typeof existingTimetable === 'object')
            ? existingTimetable
            : JSON.parse(JSON.stringify(window.GENERIC_DEFAULT_TIMETABLE || {}));

          const initialClass = {
            id: `cls_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: className,
            description: `Class ${className}`,
            isActive: true,
            subjects: defaultSubjects,
            timetable: defaultTimetable,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          classesData.classes.push(initialClass);
          classesData.activeClassId = initialClass.id;
        }

        // Validate and clean each class structure
        classesData.classes = classesData.classes.map(c => {
          const cSubjects = Array.isArray(c.subjects) ? c.subjects.map(s => {
            const iconVal = (typeof s.icon === 'string' && s.icon.trim()) ? s.icon : ((typeof s.emoji === 'string' && s.emoji.trim()) ? s.emoji : '📖');
            return {
              id: s.id || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              name: typeof s.name === 'string' ? s.name : 'Untitled',
              icon: iconVal,
              emoji: iconVal,
              badge: typeof s.badge === 'string' ? s.badge : '🟦',
              suffix: typeof s.suffix === 'string' ? s.suffix : '',
              notes: typeof s.notes === 'string' ? s.notes : ''
            };
          }) : [];

          const cTimetable = (c.timetable && typeof c.timetable === 'object') ? c.timetable : {};
          (window.DAYS_OF_WEEK || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).forEach(d => {
            if (!Array.isArray(cTimetable[d])) {
              cTimetable[d] = [];
            }
            while (cTimetable[d].length < 8) {
              cTimetable[d].push('');
            }
          });

          return {
            id: c.id || `cls_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: typeof c.name === 'string' ? c.name : 'Class',
            description: typeof c.description === 'string' ? c.description : '',
            isActive: c.isActive !== false,
            assignedGroupId: (typeof c.assignedGroupId === 'string' && c.assignedGroupId.trim()) ? c.assignedGroupId.trim() : null,
            subjects: cSubjects,
            timetable: cTimetable,
            createdAt: c.createdAt || new Date().toISOString(),
            updatedAt: c.updatedAt || new Date().toISOString()
          };
        });

        // Ensure activeClassId points to a valid active class
        const validActiveClass = classesData.classes.find(c => c.id === classesData.activeClassId && c.isActive !== false)
          || classesData.classes.find(c => c.isActive !== false)
          || classesData.classes[0];

        if (validActiveClass) {
          classesData.activeClassId = validActiveClass.id;
        }

        // Initialize or sanitize last selected class ID for Glimpse
        const currentSavedSelectedId = storage.getItem('glimpse_selected_class_id_v1');
        const selectedClassExists = currentSavedSelectedId && classesData.classes.some(c => c.id === currentSavedSelectedId && c.isActive !== false);
        if (!selectedClassExists && classesData.activeClassId) {
          storage.setItem('glimpse_selected_class_id_v1', classesData.activeClassId);
        }

        storage.setJson('glimpse_classes_data_v1', classesData);
      }
    },
    {
      version: 'V07',
      versionNum: 7,
      description: 'Ensure Classes schema supports User Group direct assignment (assignedGroupId) and validate group linkage integrity.',
      migrate: (storage) => {
        const classesData = storage.getJson('glimpse_classes_data_v1', null);
        const ugData = storage.getJson('glimpse_user_groups_data_v1', null);
        const groups = (ugData && Array.isArray(ugData.groups)) ? ugData.groups : [];

        if (classesData && Array.isArray(classesData.classes)) {
          let modified = false;
          classesData.classes.forEach(c => {
            if (c.assignedGroupId === undefined) {
              c.assignedGroupId = null;
              modified = true;
            } else if (typeof c.assignedGroupId === 'string' && c.assignedGroupId.trim() !== '') {
              c.assignedGroupId = c.assignedGroupId.trim();
              // Verify that the linked user group exists
              const exists = groups.some(g => g.id === c.assignedGroupId);
              if (!exists) {
                c.assignedGroupId = null;
                modified = true;
              }
            } else {
              c.assignedGroupId = null;
              modified = true;
            }
          });

          if (modified) {
            storage.setJson('glimpse_classes_data_v1', classesData);
          }
        }
      }
    },
    {
      version: 'V08',
      versionNum: 8,
      description: 'Support multiple User Group direct assignments on Classes (assignedGroupIds array) with live synchronization.',
      migrate: (storage) => {
        const classesData = storage.getJson('glimpse_classes_data_v1', null);
        const ugData = storage.getJson('glimpse_user_groups_data_v1', null);
        const groups = (ugData && Array.isArray(ugData.groups)) ? ugData.groups : [];

        if (classesData && Array.isArray(classesData.classes)) {
          let modified = false;
          classesData.classes.forEach(c => {
            let groupIds = [];
            if (Array.isArray(c.assignedGroupIds)) {
              groupIds = c.assignedGroupIds.map(id => String(id).trim()).filter(Boolean);
            } else if (c.assignedGroupId && typeof c.assignedGroupId === 'string' && c.assignedGroupId.trim()) {
              groupIds = [c.assignedGroupId.trim()];
            }
            // Filter to only groups that actually exist in ugData
            const validGroupIds = groupIds.filter(id => groups.some(g => g.id === id));
            // Remove duplicates
            const uniqueGroupIds = Array.from(new Set(validGroupIds));

            c.assignedGroupIds = uniqueGroupIds;
            c.assignedGroupId = uniqueGroupIds.length > 0 ? uniqueGroupIds[0] : null;
            modified = true;
          });

          if (modified) {
            storage.setJson('glimpse_classes_data_v1', classesData);
          }
        }
      }
    }
  ];

  /**
   * Main LocalStorage Data Migration Engine.
   * Compares current stored dbSchemaV against target CURRENT_DB_SCHEMA_VERSION.
   * Sequentially executes incremental migration steps (e.g. V01 -> V02 -> V05).
   */
  function runDataMigrations(customTargetVersion = CURRENT_DB_SCHEMA_VERSION) {
    try {
      const storedVersionStr = localStorage.getItem('dbSchemaV');
      const storedVersionNum = parseSchemaVersion(storedVersionStr);
      const targetVersionNum = parseSchemaVersion(customTargetVersion);

      if (storedVersionNum >= targetVersionNum && storedVersionStr) {
        // Storage is already up to date
        return { success: true, migrated: false, currentVersion: storedVersionStr };
      }

      console.log(`[Storage Migration] Migration required: current stored version '${storedVersionStr || 'none'}' (v${storedVersionNum}) -> target '${customTargetVersion}' (v${targetVersionNum})`);

      // 1. Create safety snapshot before making changes
      createPreMigrationBackup(storedVersionStr, customTargetVersion);

      const storage = createMigrationStorageHelper();

      // 2. Select and sort pending migrations in ascending order
      const pendingMigrations = SCHEMA_MIGRATIONS
        .filter(m => m.versionNum > storedVersionNum && m.versionNum <= targetVersionNum)
        .sort((a, b) => a.versionNum - b.versionNum);

      // 3. Sequentially execute migration steps
      for (const step of pendingMigrations) {
        console.log(`[Storage Migration] Executing step ${step.version} (${step.description})...`);
        try {
          step.migrate(storage);
          localStorage.setItem('dbSchemaV', step.version);
          console.log(`[Storage Migration] Step ${step.version} completed.`);
        } catch (stepErr) {
          console.error(`[Storage Migration] Failed at step ${step.version}:`, stepErr);
          throw stepErr;
        }
      }

      // 4. Mark target version in storage
      localStorage.setItem('dbSchemaV', customTargetVersion);
      console.log(`[Storage Migration] All migrations completed successfully. Storage is now at schema ${customTargetVersion}.`);

      // 5. Keep storage clean: prune historical backups, keeping at most 1
      pruneMigrationBackups(1);

      return { success: true, migrated: true, fromVersion: storedVersionStr, currentVersion: customTargetVersion };
    } catch (err) {
      console.error('[Storage Migration] Error encountered during migration execution:', err);
      // Ensure dbSchemaV has a fallback value so unhandled crashes don't loop
      if (!localStorage.getItem('dbSchemaV')) {
        localStorage.setItem('dbSchemaV', customTargetVersion);
      }
      return { success: false, error: err };
    }
  }

  // Export to global scope
  window.CURRENT_DB_SCHEMA_VERSION = CURRENT_DB_SCHEMA_VERSION;
  window.parseSchemaVersion = parseSchemaVersion;
  window.formatSchemaVersion = formatSchemaVersion;
  window.createMigrationStorageHelper = createMigrationStorageHelper;
  window.createPreMigrationBackup = createPreMigrationBackup;
  window.pruneMigrationBackups = pruneMigrationBackups;
  window.clearAllMigrationBackups = clearAllMigrationBackups;
  window.getStorageUsageStats = getStorageUsageStats;
  window.SCHEMA_MIGRATIONS = SCHEMA_MIGRATIONS;
  window.runDataMigrations = runDataMigrations;

})(window);
