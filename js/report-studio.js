// Glimpse Report Studio: Text & Tabular Data to Image (PNG / JPG) Report Generator
(function(window) {
  'use strict';

  const STORAGE_KEY_DRAFT = 'glimpse_report_studio_draft_v1';

  // --- DEFAULT STATE ---
  const DEFAULT_STATE = {
    mode: 'notes', // 'notes' or 'table'
    title: 'Weekly Progress Report',
    subtitle: 'Class 2G • Summary & Updates',
    includeDate: true,
    date: getTodayDateString(),
    includePreNote: true,
    preNote: 'Important Notice: Parents are kindly requested to review the weekly highlights and upcoming schedule below.',
    notesHtml: '<p>Welcome to this week\'s session updates! Below are the key learning milestones covered across subjects.</p><ul><li><b>English:</b> Completed Unit 3 poetry recitation, vocabulary cards, and reading comprehension.</li><li><b>Mathematics:</b> Introduced double-digit addition with carry-forward concepts and word problems.</li><li><b>Science & Nature:</b> Plant growth observation activity in the school garden with live samples.</li></ul><p>Please ensure all homework worksheets are completed over the weekend.</p>',
    tableRaw: 'Roll No\tStudent Name\tSubject\tGrade\tRemarks\n101\tAarav Patel\tMathematics\tA+\tOutstanding conceptual clarity\n102\tDiya Sharma\tMathematics\tA\tConsistent accuracy & speed\n103\tKabir Verma\tMathematics\tB+\tGood improvement in calculations\n104\tMeera Nair\tMathematics\tA+\tTop score in word problems\n105\tRohan Gupta\tMathematics\tB\tNeeds practice in long addition\n106\tAnanya Rao\tMathematics\tA\tNeat work and correct methodology',
    tableHasHeader: true,
    tableZebra: true,
    tableCompact: false,
    tablePreserveMerges: true,
    tableMergeScope: 'auto', // 'auto', 'first', 'first2', 'all'
    tableAlign: 'auto', // 'auto', 'left', 'center', 'right'
    tableEditorMode: 'sheet', // 'sheet' or 'raw'
    includePostNote: true,
    postNote: 'Note: Parents are requested to sign the report book and return it with your child by Wednesday morning.',
    includeFooter: true,
    footerLeft: 'Glimpse Report Studio • Academic Year 2026–27',
    footerRight: 'Class Teacher Signature: __________________',
    cardAccent: '#e60023', // Default Pinterest Red
    cardWidth: 'standard', // 'standard', 'compact', 'wide'
    aspectRatio: 'auto', // 'auto', '1:1', '4:5', '9:16', '16:9', '2:3', '3:4', '3:2', 'custom'
    customRatioW: 1,
    customRatioH: 1,
    previewZoom: 1
  };

  let rsState = Object.assign({}, DEFAULT_STATE);
  let autoSaveTimeout = null;

  function getTodayDateString() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  }

  function getEffectiveAspectRatio() {
    if (!rsState.aspectRatio || rsState.aspectRatio === 'auto') return null;
    if (rsState.aspectRatio === 'custom') {
      const w = parseFloat(rsState.customRatioW) || 1;
      const h = parseFloat(rsState.customRatioH) || 1;
      return (w > 0 && h > 0) ? { w, h, ratio: w / h, label: `${w}:${h}` } : null;
    }
    const parts = String(rsState.aspectRatio).split(':');
    if (parts.length === 2) {
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (w > 0 && h > 0) return { w, h, ratio: w / h, label: rsState.aspectRatio };
    }
    return null;
  }

  // --- STORAGE & DRAFT AUTO-SAVE ---
  function loadReportStudioDataFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAFT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          rsState = Object.assign({}, DEFAULT_STATE, parsed);
        }
      }
    } catch (e) {
      console.warn('Could not load Report Studio draft from storage:', e);
    }
  }

  function saveReportStudioDraftDebounced() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(rsState));
      } catch (e) {
        console.warn('Could not save Report Studio draft to storage:', e);
      }
    }, 400);
  }

  // --- EXCEL / CSV / TSV PARSER ---
  function parseTableData(rawText) {
    if (!rawText || !rawText.trim()) return [];
    const lines = rawText.split(/\r\n|\n|\r/);
    if (lines.length === 0) return [];

    // Detect delimiter: tab takes highest priority (Excel copy-paste), then comma, then semicolon, then pipe
    const sampleLine = lines.find(line => line.trim().length > 0) || lines[0] || '';
    let delimiter = '\t';
    if (sampleLine.indexOf('\t') !== -1) {
      delimiter = '\t';
    } else if (sampleLine.indexOf(',') !== -1) {
      delimiter = ',';
    } else if (sampleLine.indexOf(';') !== -1) {
      delimiter = ';';
    } else if (sampleLine.indexOf('|') !== -1) {
      delimiter = '|';
    }

    const filtered = lines.filter(line => line.trim().length > 0 || line.includes(delimiter));
    if (filtered.length === 0) return [];

    return filtered.map(line => {
      if (delimiter === ',') {
        return parseCsvLine(line);
      }
      return line.split(delimiter).map(cell => cell.trim());
    });
  }

  function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  function isNumericColumn(rows, colIndex) {
    let numericCount = 0;
    let checkedCount = 0;
    const startIdx = rsState.tableHasHeader ? 1 : 0;
    for (let i = startIdx; i < rows.length; i++) {
      const val = (rows[i][colIndex] || '').replace(/[$€₹%,\s]/g, '');
      if (val.length > 0) {
        checkedCount++;
        if (!isNaN(Number(val))) {
          numericCount++;
        }
      }
    }
    return checkedCount > 0 && numericCount / checkedCount >= 0.75;
  }

  // --- SPREADSHEET STARTER TEMPLATES ---
  const TABLE_TEMPLATES = {
    student_roster: 'CLASS\tROLL NO\tSTUDENT NAME\tREMARKS\n1A\t101\tMaryam Bint Saheer\tExcellent participation\n\t102\tNavanika Vineeth\tConsistent attendance\n\t103\tAyaan Muhammad\tVery good progress\n1B\t104\tMiswana\tCreative and attentive\n\t105\tMuhammed Aslam\tActive learner\n1C\t106\tKhanza\tNeat work and methodical\n\t107\tAlfid\tHigh accuracy in exercises',
    marksheet: 'ROLL NO\tNAME\tMATHEMATICS\tSCIENCE\tTOTAL\tGRADE\n101\tAarav Patel\t94\t92\t186\tA+\n102\tDiya Sharma\t88\t85\t173\tA\n103\tKabir Verma\t76\t80\t156\tB+\n104\tMeera Nair\t95\t98\t193\tA+\n105\tRohan Gupta\t82\t79\t161\tB+',
    schedule: 'DAY\tPERIOD 1\tPERIOD 2\tPERIOD 3\tPERIOD 4\nMonday\tMathematics\tEnglish\tPhysics\tPhysical Ed.\nTuesday\tChemistry\tBiology\tMathematics\tArt & Craft\nWednesday\tEnglish\tComputer Sci.\tPhysics\tLibrary\nThursday\tMathematics\tSocial Studies\tChemistry\tMusic\nFriday\tLanguage\tPhysics\tMathematics\tGames',
    blank_3x4: 'Column 1\tColumn 2\tColumn 3\n\t\t\n\t\t\n\t\t'
  };

  // --- INTERACTIVE SPREADSHEET HELPERS & BUILDER ---
  function getGridDataFromRaw(rawText) {
    const parsed = parseTableData(rawText);
    if (!parsed || parsed.length === 0) {
      return [
        ['Column 1', 'Column 2', 'Column 3'],
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
      ];
    }
    let maxCols = 0;
    parsed.forEach(row => {
      if (row.length > maxCols) maxCols = row.length;
    });
    if (maxCols === 0) maxCols = 1;

    return parsed.map((row, rIdx) => {
      const newRow = row.slice();
      while (newRow.length < maxCols) {
        newRow.push(rIdx === 0 ? `Col ${newRow.length + 1}` : '');
      }
      return newRow;
    });
  }

  function serializeGridData(grid) {
    if (!grid || grid.length === 0) return '';
    return grid.map(row => row.join('\t')).join('\n');
  }

  function renderInteractiveSheet() {
    const wrapper = document.getElementById('rsSheetTableWrapper');
    if (!wrapper) return;

    const grid = getGridDataFromRaw(rsState.tableRaw);
    const numRows = grid.length;
    const numCols = grid[0].length;

    wrapper.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'rs-sheet-table';

    // 1. thead: Column headers
    const thead = document.createElement('thead');
    const headerTr = document.createElement('tr');

    // Corner cell
    const cornerTh = document.createElement('th');
    cornerTh.className = 'rs-sheet-corner-th';
    cornerTh.innerHTML = '<span style="font-size: 10px; color: var(--muted, #91918c);">#</span>';
    headerTr.appendChild(cornerTh);

    // Column headers
    for (let c = 0; c < numCols; c++) {
      const th = document.createElement('th');
      th.className = 'rs-sheet-th';

      const wrap = document.createElement('div');
      wrap.className = 'rs-sheet-th-wrap';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'rs-sheet-header-input';
      input.value = grid[0][c] || `Col ${c + 1}`;
      input.placeholder = `Col ${c + 1}`;
      input.dataset.col = c;
      input.dataset.row = 0;

      input.addEventListener('input', (e) => {
        grid[0][c] = e.target.value;
        rsState.tableRaw = serializeGridData(grid);
        const rawInput = document.getElementById('rsTableRawInput');
        if (rawInput) rawInput.value = rsState.tableRaw;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });

      input.addEventListener('keydown', (e) => handleSheetKeyNav(e, 0, c, numRows, numCols));

      wrap.appendChild(input);

      if (numCols > 1) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'rs-sheet-col-del-btn';
        delBtn.title = 'Delete column';
        delBtn.innerHTML = '&times;';
        delBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          deleteSheetColumn(c);
        });
        wrap.appendChild(delBtn);
      }

      th.appendChild(wrap);
      headerTr.appendChild(th);
    }

    thead.appendChild(headerTr);
    table.appendChild(thead);

    // 2. tbody: Data rows
    const tbody = document.createElement('tbody');
    const startRow = 1;

    for (let r = startRow; r < numRows; r++) {
      const tr = document.createElement('tr');

      // Gutter cell (row number & delete button)
      const gutterTd = document.createElement('td');
      gutterTd.className = 'rs-sheet-row-gutter';

      const gutterWrap = document.createElement('div');
      gutterWrap.className = 'rs-sheet-row-gutter-wrap';

      const rowNum = document.createElement('span');
      rowNum.className = 'rs-sheet-row-num';
      rowNum.textContent = String(r);
      gutterWrap.appendChild(rowNum);

      const delRowBtn = document.createElement('button');
      delRowBtn.type = 'button';
      delRowBtn.className = 'rs-sheet-row-del-btn';
      delRowBtn.title = `Delete row ${r}`;
      delRowBtn.innerHTML = '&times;';
      delRowBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        deleteSheetRow(r);
      });
      gutterWrap.appendChild(delRowBtn);

      gutterTd.appendChild(gutterWrap);
      tr.appendChild(gutterTd);

      // Data cells
      for (let c = 0; c < numCols; c++) {
        const td = document.createElement('td');
        td.className = 'rs-sheet-td';

        const cellInput = document.createElement('input');
        cellInput.type = 'text';
        cellInput.className = 'rs-sheet-cell-input';
        cellInput.value = grid[r][c] || '';
        cellInput.placeholder = '(empty)';
        cellInput.dataset.row = r;
        cellInput.dataset.col = c;

        cellInput.addEventListener('input', (e) => {
          grid[r][c] = e.target.value;
          rsState.tableRaw = serializeGridData(grid);
          const rawInput = document.getElementById('rsTableRawInput');
          if (rawInput) rawInput.value = rsState.tableRaw;
          updateReportPreview();
          saveReportStudioDraftDebounced();
        });

        cellInput.addEventListener('keydown', (e) => handleSheetKeyNav(e, r, c, numRows, numCols));

        td.appendChild(cellInput);
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);
  }

  function handleSheetKeyNav(e, r, c, numRows, numCols) {
    if (e.key === 'Tab') {
      if (!e.shiftKey && r === numRows - 1 && c === numCols - 1) {
        e.preventDefault();
        addSheetRow(true);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (r === numRows - 1) {
        addSheetRow(false, c);
      } else {
        const nextInput = document.querySelector(`.rs-sheet-table input[data-row="${r + 1}"][data-col="${c}"]`);
        if (nextInput) nextInput.focus();
      }
    } else if (e.key === 'ArrowDown') {
      const nextInput = document.querySelector(`.rs-sheet-table input[data-row="${r + 1}"][data-col="${c}"]`);
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp' && r > 0) {
      const prevInput = document.querySelector(`.rs-sheet-table input[data-row="${r - 1}"][data-col="${c}"]`);
      if (prevInput) prevInput.focus();
    }
  }

  function addSheetRow(focusFirst = true, focusCol = 0) {
    const grid = getGridDataFromRaw(rsState.tableRaw);
    const numCols = grid[0].length;
    const newRow = new Array(numCols).fill('');
    grid.push(newRow);
    rsState.tableRaw = serializeGridData(grid);
    const rawInput = document.getElementById('rsTableRawInput');
    if (rawInput) rawInput.value = rsState.tableRaw;
    renderInteractiveSheet();
    updateReportPreview();
    saveReportStudioDraftDebounced();

    setTimeout(() => {
      const targetCol = focusFirst ? 0 : focusCol;
      const newRowIdx = grid.length - 1;
      const target = document.querySelector(`.rs-sheet-table input[data-row="${newRowIdx}"][data-col="${targetCol}"]`);
      if (target) target.focus();
    }, 10);
  }

  function addSheetColumn() {
    const grid = getGridDataFromRaw(rsState.tableRaw);
    const newColIdx = grid[0].length;
    grid[0].push(`Col ${newColIdx + 1}`);
    for (let r = 1; r < grid.length; r++) {
      grid[r].push('');
    }
    rsState.tableRaw = serializeGridData(grid);
    const rawInput = document.getElementById('rsTableRawInput');
    if (rawInput) rawInput.value = rsState.tableRaw;
    renderInteractiveSheet();
    updateReportPreview();
    saveReportStudioDraftDebounced();

    setTimeout(() => {
      const headerInput = document.querySelector(`.rs-sheet-table input[data-row="0"][data-col="${newColIdx}"]`);
      if (headerInput) {
        headerInput.focus();
        headerInput.select();
      }
    }, 10);
  }

  function deleteSheetRow(rowIndex) {
    const grid = getGridDataFromRaw(rsState.tableRaw);
    if (grid.length <= 2) {
      grid[1] = new Array(grid[0].length).fill('');
    } else {
      grid.splice(rowIndex, 1);
    }
    rsState.tableRaw = serializeGridData(grid);
    const rawInput = document.getElementById('rsTableRawInput');
    if (rawInput) rawInput.value = rsState.tableRaw;
    renderInteractiveSheet();
    updateReportPreview();
    saveReportStudioDraftDebounced();
  }

  function deleteSheetColumn(colIndex) {
    const grid = getGridDataFromRaw(rsState.tableRaw);
    if (grid[0].length <= 1) return;
    for (let r = 0; r < grid.length; r++) {
      grid[r].splice(colIndex, 1);
    }
    rsState.tableRaw = serializeGridData(grid);
    const rawInput = document.getElementById('rsTableRawInput');
    if (rawInput) rawInput.value = rsState.tableRaw;
    renderInteractiveSheet();
    updateReportPreview();
    saveReportStudioDraftDebounced();
  }

  function clearSheetData() {
    const grid = [
      ['Column 1', 'Column 2', 'Column 3'],
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ];
    rsState.tableRaw = serializeGridData(grid);
    const rawInput = document.getElementById('rsTableRawInput');
    if (rawInput) rawInput.value = rsState.tableRaw;
    renderInteractiveSheet();
    updateReportPreview();
    saveReportStudioDraftDebounced();
    if (typeof window.showToast === 'function') {
      window.showToast('Table reset to blank template! 🧹');
    }
  }

  function applyTableTemplate(templateKey) {
    if (!templateKey || !TABLE_TEMPLATES[templateKey]) return;
    rsState.tableRaw = TABLE_TEMPLATES[templateKey];
    const rawInput = document.getElementById('rsTableRawInput');
    if (rawInput) rawInput.value = rsState.tableRaw;
    renderInteractiveSheet();
    updateReportPreview();
    saveReportStudioDraftDebounced();
    if (typeof window.showToast === 'function') {
      window.showToast('Starter template loaded into sheet! ✨');
    }
  }

  function switchTableEditorView(mode, save = true) {
    rsState.tableEditorMode = mode;
    const sheetView = document.getElementById('rsTableSheetView');
    const rawView = document.getElementById('rsTableRawView');
    const sheetBtn = document.getElementById('rsTableViewSheetBtn');
    const rawBtn = document.getElementById('rsTableViewRawBtn');

    if (mode === 'sheet') {
      if (sheetView) sheetView.style.display = 'block';
      if (rawView) rawView.style.display = 'none';
      if (sheetBtn) sheetBtn.classList.add('active');
      if (rawBtn) rawBtn.classList.remove('active');
      renderInteractiveSheet();
    } else {
      if (sheetView) sheetView.style.display = 'none';
      if (rawView) rawView.style.display = 'block';
      if (sheetBtn) sheetBtn.classList.remove('active');
      if (rawBtn) rawBtn.classList.add('active');
      const rawInput = document.getElementById('rsTableRawInput');
      if (rawInput) rawInput.value = rsState.tableRaw || '';
    }
    if (save) {
      saveReportStudioDraftDebounced();
    }
  }

  // --- TABLE CELL MERGE MATRIX BUILDER ---
  function buildTableMatrix(rows, hasHeader, preserveMerges, mergeScope) {
    const numCols = rows.length > 0 ? rows[0].length : 0;
    const matrix = [];
    for (let r = 0; r < rows.length; r++) {
      matrix[r] = [];
      for (let c = 0; c < numCols; c++) {
        matrix[r][c] = {
          text: rows[r][c] != null ? rows[r][c] : '',
          rowSpan: 1,
          isMergedContinuation: false,
          isMergeRoot: false,
          parentRow: r
        };
      }
    }

    if (!preserveMerges || rows.length === 0) {
      return matrix;
    }

    const startIdx = hasHeader ? 1 : 0;

    // Determine which columns qualify for cell merging
    const shouldMergeCol = [];
    for (let c = 0; c < numCols; c++) {
      if (mergeScope === 'first') {
        shouldMergeCol[c] = (c === 0);
      } else if (mergeScope === 'first2') {
        shouldMergeCol[c] = (c < 2);
      } else if (mergeScope === 'all') {
        shouldMergeCol[c] = true;
      } else {
        // 'auto' mode: Smart leading grouping columns
        if (c === 0) {
          let hasGroupStructure = false;
          for (let r = startIdx + 1; r < rows.length; r++) {
            if (rows[r][0].trim() === '' && rows[r - 1][0].trim() !== '') {
              hasGroupStructure = true;
              break;
            }
          }
          shouldMergeCol[0] = hasGroupStructure;
        } else {
          if (shouldMergeCol[c - 1]) {
            let hasGroupStructure = false;
            for (let r = startIdx + 1; r < rows.length; r++) {
              if (rows[r][c].trim() === '' && rows[r - 1][c].trim() !== '') {
                hasGroupStructure = true;
                break;
              }
            }
            shouldMergeCol[c] = hasGroupStructure;
          } else {
            shouldMergeCol[c] = false;
          }
        }
      }
    }

    // Identify vertical merge spans for qualified columns
    for (let c = 0; c < numCols; c++) {
      if (!shouldMergeCol[c]) continue;

      let r = startIdx;
      while (r < rows.length) {
        matrix[r][c].isGroupCol = true;
        const cellVal = rows[r][c].trim();
        if (cellVal !== '') {
          let span = 1;
          while (r + span < rows.length && rows[r + span][c].trim() === '') {
            span++;
          }
          matrix[r][c].rowSpan = span;
          matrix[r][c].isMergeRoot = true;

          if (span > 1) {
            for (let k = 1; k < span; k++) {
              matrix[r + k][c].isMergedContinuation = true;
              matrix[r + k][c].parentRow = r;
              matrix[r + k][c].rowSpan = 0;
              matrix[r + k][c].isGroupCol = true;
            }
            r += span;
          } else {
            r++;
          }
        } else {
          r++;
        }
      }
    }

    matrix.shouldMergeCol = shouldMergeCol;
    return matrix;
  }

  // --- COMPUTE PROPORTIONAL COLUMN WIDTHS & TABLE LAYOUT ---
  function computeTableLayout(mCtx, fontFamily) {
    const rawRows = parseTableData(rsState.tableRaw);
    if (rawRows.length === 0) {
      return {
        hasData: false,
        numCols: 0,
        rows: [],
        matrix: [],
        naturalColWidths: [],
        sumNaturalW: 0,
        headerHeight: 0,
        rowHeight: 0,
        totalHeight: 0,
        isNumCols: []
      };
    }

    const numCols = Math.max(...rawRows.map(r => r.length), 1);
    const rows = rawRows.map(r => {
      const copy = r.slice();
      while (copy.length < numCols) copy.push('');
      return copy;
    });

    const isNumCols = [];
    for (let c = 0; c < numCols; c++) {
      isNumCols[c] = rsState.tableAlign === 'auto' ? isNumericColumn(rows, c) : (rsState.tableAlign === 'right');
    }

    const matrix = buildTableMatrix(rows, rsState.tableHasHeader, rsState.tablePreserveMerges, rsState.tableMergeScope);
    const headerHeight = rsState.tableCompact ? 30 : 38;
    const rowHeight = rsState.tableCompact ? 28 : 34;
    const startIdx = rsState.tableHasHeader ? 1 : 0;
    const paddingH = rsState.tableCompact ? 22 : 30; // 11px or 15px on each side

    const naturalColWidths = [];
    for (let c = 0; c < numCols; c++) {
      let maxTextW = 0;

      if (rsState.tableHasHeader && rows.length > 0) {
        mCtx.font = `700 ${rsState.tableCompact ? 11.5 : 12.5}px ${fontFamily}`;
        const headerStr = String(rows[0][c] || '').toUpperCase();
        maxTextW = Math.max(maxTextW, mCtx.measureText(headerStr).width);
      }

      mCtx.font = `500 ${rsState.tableCompact ? 12.5 : 13}px ${fontFamily}`;
      for (let r = startIdx; r < rows.length; r++) {
        const text = rows[r][c] != null ? String(rows[r][c]) : '';
        if (text) {
          maxTextW = Math.max(maxTextW, mCtx.measureText(text).width);
        }
      }

      const minW = isNumCols[c] ? 56 : (c === 0 ? 70 : 80);
      naturalColWidths[c] = Math.max(minW, Math.ceil(maxTextW + paddingH));
    }

    const sumNaturalW = naturalColWidths.reduce((a, b) => a + b, 0);
    const headerRowCount = rsState.tableHasHeader ? 1 : 0;
    const bodyRowCount = rows.length - headerRowCount;
    const totalHeight = (headerRowCount * headerHeight) + (bodyRowCount * rowHeight);

    return {
      hasData: true,
      numCols,
      rows,
      matrix,
      isNumCols,
      headerHeight,
      rowHeight,
      totalHeight,
      naturalColWidths,
      sumNaturalW
    };
  }

  // --- RENDER TABLE HTML ---
  function renderTableToHtml() {
    const rawRows = parseTableData(rsState.tableRaw);
    if (rawRows.length === 0) {
      return `<div class="rs-empty-table-prompt">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" style="color: var(--meta);"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
        <p>No table data pasted yet. Copy rows from Excel or CSV and paste in the left panel.</p>
      </div>`;
    }

    const numCols = Math.max(...rawRows.map(r => r.length), 1);
    const rows = rawRows.map(r => {
      const copy = r.slice();
      while (copy.length < numCols) copy.push('');
      return copy;
    });

    const isNumCols = [];
    for (let c = 0; c < numCols; c++) {
      isNumCols[c] = rsState.tableAlign === 'auto' ? isNumericColumn(rows, c) : (rsState.tableAlign === 'right');
    }

    const matrix = buildTableMatrix(rows, rsState.tableHasHeader, rsState.tablePreserveMerges, rsState.tableMergeScope);
    const zebraClass = rsState.tableZebra ? 'rs-table-zebra' : '';
    const compactClass = rsState.tableCompact ? 'rs-table-compact' : '';

    let html = `<table class="rs-rendered-table ${zebraClass} ${compactClass}">`;

    let bodyStartIdx = 0;
    if (rsState.tableHasHeader && rows.length > 0) {
      const headerRow = rows[0];
      html += '<thead><tr>';
      for (let c = 0; c < numCols; c++) {
        const text = headerRow[c] != null ? headerRow[c] : '';
        const isGroupCol = matrix.shouldMergeCol && matrix.shouldMergeCol[c];
        const align = rsState.tableAlign !== 'auto' 
          ? rsState.tableAlign 
          : (isNumCols[c] ? 'right' : (isGroupCol ? 'center' : 'left'));
        html += `<th style="text-align: ${align};">${escapeXml(text)}</th>`;
      }
      html += '</tr></thead>';
      bodyStartIdx = 1;
    }

    html += '<tbody>';
    for (let r = bodyStartIdx; r < rows.length; r++) {
      html += '<tr>';
      for (let c = 0; c < numCols; c++) {
        const cell = matrix[r][c];
        if (cell.isMergedContinuation) {
          // Omit <td> for covered rows
          continue;
        }

        const isGroupCol = matrix.shouldMergeCol && matrix.shouldMergeCol[c];
        const isGroupCell = cell.isGroupCol || isGroupCol || cell.isMergeRoot || (cell.rowSpan > 1);

        const align = rsState.tableAlign !== 'auto'
          ? rsState.tableAlign
          : (isNumCols[c] ? 'right' : (isGroupCell ? 'center' : 'left'));

        if (isGroupCell) {
          html += `<td rowspan="${cell.rowSpan}" class="rs-merged-cell" style="text-align: ${align}; vertical-align: middle;">${escapeXml(cell.text)}</td>`;
        } else {
          html += `<td style="text-align: ${align};">${escapeXml(cell.text)}</td>`;
        }
      }
      html += '</tr>';
    }
    html += '</tbody></table>';

    return html;
  }

  function escapeXml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- UPDATE LIVE PREVIEW ---
  function updateReportPreview() {
    const card = document.getElementById('rsReportCard');
    if (!card) return;

    // Dynamic width expansion if tabular data exceeds standard base width
    const baseCardWidth = rsState.cardWidth === 'compact' ? 540 : (rsState.cardWidth === 'wide' ? 920 : 720);
    const baseContentW = baseCardWidth - 64;
    if (rsState.mode === 'table') {
      const measureCanvas = document.createElement('canvas');
      const mCtx = measureCanvas.getContext('2d');
      const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", Helvetica, Arial, sans-serif';
      const layout = computeTableLayout(mCtx, fontFamily);
      if (layout.hasData && layout.sumNaturalW > baseContentW) {
        const expandedW = layout.sumNaturalW + 64;
        card.style.maxWidth = `${expandedW}px`;
        if (window.innerWidth > 680) {
          card.style.width = `${expandedW}px`;
        } else {
          card.style.width = '100%';
        }
      } else {
        card.style.maxWidth = '';
        card.style.width = '';
      }
    } else {
      card.style.maxWidth = '';
      card.style.width = '';
    }

    // 1. Accent color & width
    card.style.setProperty('--rs-accent', rsState.cardAccent);
    card.className = `rs-report-card width-${rsState.cardWidth}`;

    // Aspect Ratio on preview card
    const effRatio = getEffectiveAspectRatio();
    if (effRatio) {
      card.style.aspectRatio = `${effRatio.w} / ${effRatio.h}`;
      card.classList.add('rs-fixed-aspect');
    } else {
      card.style.aspectRatio = '';
      card.classList.remove('rs-fixed-aspect');
    }

    const accentBar = document.getElementById('rsCardAccentBar');
    if (accentBar) accentBar.style.backgroundColor = rsState.cardAccent;

    // 2. Title Block
    const titleEl = document.getElementById('rsCardTitle');
    if (titleEl) {
      titleEl.textContent = rsState.title || 'Untitled Report';
      titleEl.style.display = rsState.title ? 'block' : 'none';
    }

    const subtitleEl = document.getElementById('rsCardSubtitle');
    if (subtitleEl) {
      subtitleEl.textContent = rsState.subtitle || '';
      subtitleEl.style.display = rsState.subtitle ? 'block' : 'none';
    }

    // 3. Date
    const dateEl = document.getElementById('rsCardDate');
    const dateTextEl = document.getElementById('rsCardDateText');
    if (dateEl && dateTextEl) {
      if (rsState.includeDate && rsState.date) {
        dateEl.style.display = 'inline-flex';
        dateTextEl.textContent = formatDisplayDate(rsState.date);
      } else {
        dateEl.style.display = 'none';
      }
    }

    // 4. Pre-content Note
    const preNoteEl = document.getElementById('rsCardPreNote');
    const preNoteTextEl = document.getElementById('rsCardPreNoteText');
    if (preNoteEl && preNoteTextEl) {
      if (rsState.includePreNote && rsState.preNote && rsState.preNote.trim()) {
        preNoteEl.style.display = 'block';
        preNoteTextEl.textContent = rsState.preNote.trim();
      } else {
        preNoteEl.style.display = 'none';
      }
    }

    // 5. Content Area (Notes vs. Table)
    const contentArea = document.getElementById('rsCardContentArea');
    if (contentArea) {
      if (rsState.mode === 'notes') {
        contentArea.innerHTML = rsState.notesHtml || '<p style="color: #91918c; font-style: italic;">No notes entered yet.</p>';
      } else {
        contentArea.innerHTML = renderTableToHtml();
      }
    }

    // 6. Post-content Note
    const postNoteEl = document.getElementById('rsCardPostNote');
    const postNoteTextEl = document.getElementById('rsCardPostNoteText');
    if (postNoteEl && postNoteTextEl) {
      if (rsState.includePostNote && rsState.postNote && rsState.postNote.trim()) {
        postNoteEl.style.display = 'block';
        postNoteTextEl.textContent = rsState.postNote.trim();
      } else {
        postNoteEl.style.display = 'none';
      }
    }

    // 7. Footer
    const footerEl = document.getElementById('rsCardFooter');
    const footerLeftEl = document.getElementById('rsCardFooterLeft');
    const footerRightEl = document.getElementById('rsCardFooterRight');
    if (footerEl && footerLeftEl && footerRightEl) {
      if (rsState.includeFooter && (rsState.footerLeft || rsState.footerRight)) {
        footerEl.style.display = 'flex';
        footerLeftEl.textContent = rsState.footerLeft || '';
        footerRightEl.textContent = rsState.footerRight || '';
      } else {
        footerEl.style.display = 'none';
      }
    }

    // 8. Divider lines visibility
    const dividers = card.querySelectorAll('.rs-card-divider');
    dividers.forEach(div => div.style.display = 'block');
  }

  // --- SYNC FORM INPUTS FROM STATE ---
  function syncFormInputsFromState() {
    const titleInput = document.getElementById('rsTitleInput');
    const subtitleInput = document.getElementById('rsSubtitleInput');
    const dateInput = document.getElementById('rsDateInput');
    const dateToggle = document.getElementById('rsDateToggle');
    const preNoteInput = document.getElementById('rsPreNoteInput');
    const preNoteToggle = document.getElementById('rsPreNoteToggle');
    const postNoteInput = document.getElementById('rsPostNoteInput');
    const postNoteToggle = document.getElementById('rsPostNoteToggle');
    const footerToggle = document.getElementById('rsFooterToggle');
    const footerLeftInput = document.getElementById('rsFooterLeftInput');
    const footerRightInput = document.getElementById('rsFooterRightInput');
    const tableRawInput = document.getElementById('rsTableRawInput');
    const tableHeaderToggle = document.getElementById('rsTableHeaderToggle');
    const tableZebraToggle = document.getElementById('rsTableZebraToggle');
    const tableCompactToggle = document.getElementById('rsTableCompactToggle');
    const tableMergeToggle = document.getElementById('rsTableMergeToggle');
    const tableMergeScopeSelect = document.getElementById('rsTableMergeScopeSelect');
    const tableMergeScopeGroup = document.getElementById('rsTableMergeScopeGroup');
    const tableAlignSelect = document.getElementById('rsTableAlignSelect');
    const cardWidthSelect = document.getElementById('rsCardWidthSelect');
    const aspectRatioSelect = document.getElementById('rsAspectRatioSelect');
    const customRatioContainer = document.getElementById('rsCustomRatioContainer');
    const customRatioW = document.getElementById('rsCustomRatioW');
    const customRatioH = document.getElementById('rsCustomRatioH');
    const notesEditor = document.getElementById('rsNotesEditor');

    if (titleInput) titleInput.value = rsState.title || '';
    if (subtitleInput) subtitleInput.value = rsState.subtitle || '';
    if (dateInput) dateInput.value = rsState.date || '';
    if (dateToggle) dateToggle.checked = !!rsState.includeDate;
    if (preNoteInput) preNoteInput.value = rsState.preNote || '';
    if (preNoteToggle) preNoteToggle.checked = !!rsState.includePreNote;
    if (postNoteInput) postNoteInput.value = rsState.postNote || '';
    if (postNoteToggle) postNoteToggle.checked = !!rsState.includePostNote;
    if (footerToggle) footerToggle.checked = !!rsState.includeFooter;
    if (footerLeftInput) footerLeftInput.value = rsState.footerLeft || '';
    if (footerRightInput) footerRightInput.value = rsState.footerRight || '';
    if (tableRawInput) tableRawInput.value = rsState.tableRaw || '';
    if (tableHeaderToggle) tableHeaderToggle.checked = !!rsState.tableHasHeader;
    if (tableZebraToggle) tableZebraToggle.checked = !!rsState.tableZebra;
    if (tableCompactToggle) tableCompactToggle.checked = !!rsState.tableCompact;
    if (tableMergeToggle) tableMergeToggle.checked = !!rsState.tablePreserveMerges;
    if (tableMergeScopeSelect) tableMergeScopeSelect.value = rsState.tableMergeScope || 'auto';
    if (tableMergeScopeGroup) {
      tableMergeScopeGroup.style.display = rsState.tablePreserveMerges ? 'inline-flex' : 'none';
    }
    if (tableAlignSelect) tableAlignSelect.value = rsState.tableAlign || 'auto';
    if (cardWidthSelect) cardWidthSelect.value = rsState.cardWidth || 'standard';
    if (aspectRatioSelect) aspectRatioSelect.value = rsState.aspectRatio || 'auto';
    if (customRatioContainer) {
      customRatioContainer.style.display = rsState.aspectRatio === 'custom' ? 'block' : 'none';
    }
    if (customRatioW) customRatioW.value = rsState.customRatioW || 1;
    if (customRatioH) customRatioH.value = rsState.customRatioH || 1;

    if (notesEditor && rsState.notesHtml != null) {
      notesEditor.innerHTML = rsState.notesHtml;
      attachImageControlsToEditor(notesEditor);
    }

    // Color chips
    const colorChips = document.querySelectorAll('.rs-color-chip');
    colorChips.forEach(chip => {
      const color = chip.getAttribute('data-color');
      if (color === rsState.cardAccent) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Tab switcher active state
    setWorkspaceMode(rsState.mode, false);

    // Table editor mode (sheet vs raw)
    switchTableEditorView(rsState.tableEditorMode || 'sheet', false);
  }

  // --- WORKSPACE MODE SWITCHER ---
  function setWorkspaceMode(mode, save = true) {
    rsState.mode = mode === 'table' ? 'table' : 'notes';

    const tabNotesBtn = document.getElementById('rsTabNotesBtn');
    const tabTableBtn = document.getElementById('rsTabTableBtn');
    const notesCard = document.getElementById('rsNotesModeCard');
    const tableCard = document.getElementById('rsTableModeCard');

    if (rsState.mode === 'notes') {
      if (tabNotesBtn) {
        tabNotesBtn.classList.add('active');
        tabNotesBtn.setAttribute('aria-selected', 'true');
      }
      if (tabTableBtn) {
        tabTableBtn.classList.remove('active');
        tabTableBtn.setAttribute('aria-selected', 'false');
      }
      if (notesCard) notesCard.style.display = 'block';
      if (tableCard) tableCard.style.display = 'none';
    } else {
      if (tabTableBtn) {
        tabTableBtn.classList.add('active');
        tabTableBtn.setAttribute('aria-selected', 'true');
      }
      if (tabNotesBtn) {
        tabNotesBtn.classList.remove('active');
        tabNotesBtn.setAttribute('aria-selected', 'false');
      }
      if (tableCard) tableCard.style.display = 'block';
      if (notesCard) notesCard.style.display = 'none';
    }

    updateReportPreview();
    if (save) saveReportStudioDraftDebounced();
  }

  // --- WYSIWYG FORMATTING & IMAGE CONTROLS ---
  function executeWysiwygCommand(command, value = null) {
    const editor = document.getElementById('rsNotesEditor');
    if (!editor) return;
    editor.focus();

    if (command === 'formatBlock') {
      document.execCommand('formatBlock', false, `<${value}>`);
    } else {
      document.execCommand(command, false, value);
    }

    rsState.notesHtml = editor.innerHTML;
    updateReportPreview();
    saveReportStudioDraftDebounced();
  }

  function insertInlineImage(dataUrl) {
    const editor = document.getElementById('rsNotesEditor');
    if (!editor) return;
    editor.focus();

    // Create responsive styled image figure
    const figure = document.createElement('figure');
    figure.className = 'rs-inline-img-figure rs-img-w-full';
    figure.style.cssText = 'margin: 14px 0; text-align: center; position: relative; user-select: none;';

    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Imported Report Graphic';
    img.className = 'rs-editor-img';
    img.style.cssText = 'max-width: 100%; border-radius: 8px; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.06); cursor: pointer;';

    // Sizing Toolbar Overlay
    const toolbar = document.createElement('div');
    toolbar.className = 'rs-img-sizing-toolbar rs-no-export';
    toolbar.contentEditable = 'false';
    toolbar.innerHTML = `
      <button type="button" class="rs-img-size-btn" data-size="25">25%</button>
      <button type="button" class="rs-img-size-btn" data-size="50">50%</button>
      <button type="button" class="rs-img-size-btn" data-size="75">75%</button>
      <button type="button" class="rs-img-size-btn active" data-size="100">100%</button>
      <button type="button" class="rs-img-delete-btn" title="Remove image">🗑️</button>
    `;

    figure.appendChild(img);
    figure.appendChild(toolbar);

    // Insert at cursor selection if inside editor, or append
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.collapse(false);
      range.insertNode(figure);
      // Add trailing empty paragraph for easy continuation typing
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      if (figure.nextSibling) {
        editor.insertBefore(p, figure.nextSibling);
      } else {
        editor.appendChild(p);
      }
    } else {
      editor.appendChild(figure);
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      editor.appendChild(p);
    }

    bindImageFigureEvents(figure);
    rsState.notesHtml = editor.innerHTML;
    updateReportPreview();
    saveReportStudioDraftDebounced();

    if (typeof window.showToast === 'function') {
      window.showToast('Image inserted inline! 🖼️');
    }
  }

  function bindImageFigureEvents(figure) {
    const img = figure.querySelector('img');
    const toolbar = figure.querySelector('.rs-img-sizing-toolbar');
    if (!img || !toolbar) return;

    toolbar.querySelectorAll('.rs-img-size-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const size = btn.getAttribute('data-size');
        figure.className = `rs-inline-img-figure rs-img-w-${size}`;
        toolbar.querySelectorAll('.rs-img-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const editor = document.getElementById('rsNotesEditor');
        if (editor) {
          rsState.notesHtml = editor.innerHTML;
          updateReportPreview();
          saveReportStudioDraftDebounced();
        }
      });
    });

    const delBtn = toolbar.querySelector('.rs-img-delete-btn');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        figure.remove();
        const editor = document.getElementById('rsNotesEditor');
        if (editor) {
          rsState.notesHtml = editor.innerHTML;
          updateReportPreview();
          saveReportStudioDraftDebounced();
        }
      });
    }
  }

  function attachImageControlsToEditor(editor) {
    if (!editor) return;
    editor.querySelectorAll('.rs-inline-img-figure').forEach(fig => {
      // If missing toolbar (from stored snapshot), recreate it
      let toolbar = fig.querySelector('.rs-img-sizing-toolbar');
      if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.className = 'rs-img-sizing-toolbar rs-no-export';
        toolbar.contentEditable = 'false';
        toolbar.innerHTML = `
          <button type="button" class="rs-img-size-btn" data-size="25">25%</button>
          <button type="button" class="rs-img-size-btn" data-size="50">50%</button>
          <button type="button" class="rs-img-size-btn" data-size="75">75%</button>
          <button type="button" class="rs-img-size-btn active" data-size="100">100%</button>
          <button type="button" class="rs-img-delete-btn" title="Remove image">🗑️</button>
        `;
        fig.appendChild(toolbar);
      }
      bindImageFigureEvents(fig);
    });
  }

  // --- DIRECT CANVAS 2D REPORT CARD RENDERER (UNTAINTED & CRYSTAL CLEAR) ---
  function renderReportCardToCanvas() {
    return new Promise((resolve, reject) => {
      try {
        let targetWidth = 720;
        if (rsState.cardWidth === 'compact') targetWidth = 540;
        if (rsState.cardWidth === 'wide') targetWidth = 920;

        const paddingX = 32;
        const paddingY = 32;
        let contentWidth = targetWidth - (paddingX * 2);
        const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", Helvetica, Arial, sans-serif';

        // Temporary measuring canvas
        const measureCanvas = document.createElement('canvas');
        const mCtx = measureCanvas.getContext('2d');

        // Tabular Data layout measurement & auto-expanding width
        let tableLayout = null;
        let tableColWidths = [];
        if (rsState.mode === 'table') {
          tableLayout = computeTableLayout(mCtx, fontFamily);
          if (tableLayout.hasData) {
            if (tableLayout.sumNaturalW > contentWidth) {
              // Expand card width dynamically to accommodate table columns with natural spacing
              contentWidth = tableLayout.sumNaturalW;
              targetWidth = contentWidth + (paddingX * 2);
              tableColWidths = tableLayout.naturalColWidths.slice();
            } else {
              // Distribute extra space proportionally so columns look balanced and comfortable
              const extra = contentWidth - tableLayout.sumNaturalW;
              tableColWidths = tableLayout.naturalColWidths.map(w => w + Math.floor(extra * (w / tableLayout.sumNaturalW)));
              const curSum = tableColWidths.reduce((a, b) => a + b, 0);
              if (tableColWidths.length > 0) tableColWidths[tableColWidths.length - 1] += (contentWidth - curSum);
            }
          }
        }

        function wrapLines(ctx, text, maxWidth, font) {
          if (!text) return [];
          ctx.font = font;
          const words = text.split(/\s+/);
          const lines = [];
          let currentLine = '';
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(testLine).width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine);
          return lines;
        }

        // Measure pass to calculate exact canvas height
        let totalHeight = paddingY; // top padding
        totalHeight += 8; // top accent bar

        // Title Block
        const titleFont = `800 24px ${fontFamily}`;
        const titleLines = wrapLines(mCtx, rsState.title || 'Untitled Report', contentWidth - (rsState.includeDate ? 140 : 0), titleFont);
        totalHeight += Math.max(34, titleLines.length * 30);

        if (rsState.subtitle) {
          totalHeight += 24;
        }
        totalHeight += 16; // space before divider
        totalHeight += 18; // divider line

        // Pre-content Note
        let preNoteBoxHeight = 0;
        if (rsState.includePreNote && rsState.preNote && rsState.preNote.trim()) {
          const noteFont = `500 13px ${fontFamily}`;
          const lines = wrapLines(mCtx, rsState.preNote.trim(), contentWidth - 32, noteFont);
          preNoteBoxHeight = Math.max(38, 16 + lines.length * 19);
          totalHeight += preNoteBoxHeight + 16;
        }

        // Content Area
        let contentElements = [];
        let tableHeaderHeight = 0;
        let tableRowHeight = 0;
        let tableTotalHeight = 0;

        if (rsState.mode === 'notes') {
          const editor = document.getElementById('rsNotesEditor');
          if (editor) {
            const children = Array.from(editor.childNodes);
            children.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();
                if (tag === 'p') {
                  const text = node.innerText.trim();
                  if (text) {
                    const lines = wrapLines(mCtx, text, contentWidth, `400 14.5px ${fontFamily}`);
                    contentElements.push({ type: 'p', lines, height: lines.length * 22 + 8 });
                    totalHeight += lines.length * 22 + 8;
                  }
                } else if (tag === 'h1') {
                  const text = node.innerText.trim();
                  if (text) {
                    const lines = wrapLines(mCtx, text, contentWidth, `700 21px ${fontFamily}`);
                    contentElements.push({ type: 'h1', lines, height: lines.length * 28 + 14 });
                    totalHeight += lines.length * 28 + 14;
                  }
                } else if (tag === 'h2') {
                  const text = node.innerText.trim();
                  if (text) {
                    const lines = wrapLines(mCtx, text, contentWidth, `700 18px ${fontFamily}`);
                    contentElements.push({ type: 'h2', lines, height: lines.length * 24 + 12 });
                    totalHeight += lines.length * 24 + 12;
                  }
                } else if (tag === 'h3') {
                  const text = node.innerText.trim();
                  if (text) {
                    const lines = wrapLines(mCtx, text, contentWidth, `600 16px ${fontFamily}`);
                    contentElements.push({ type: 'h3', lines, height: lines.length * 22 + 10 });
                    totalHeight += lines.length * 22 + 10;
                  }
                } else if (tag === 'ul' || tag === 'ol') {
                  const items = Array.from(node.querySelectorAll('li')).map(li => li.innerText.trim()).filter(Boolean);
                  const isOrdered = tag === 'ol';
                  items.forEach((itemText, idx) => {
                    const prefix = isOrdered ? `${idx + 1}. ` : '• ';
                    const lines = wrapLines(mCtx, itemText, contentWidth - 24, `400 14px ${fontFamily}`);
                    contentElements.push({ type: 'li', prefix, lines, height: lines.length * 20 + 4 });
                    totalHeight += lines.length * 20 + 4;
                  });
                  totalHeight += 8;
                } else if (tag === 'figure' || node.classList.contains('rs-inline-img-figure') || tag === 'img') {
                  const img = node.tagName.toLowerCase() === 'img' ? node : node.querySelector('img');
                  if (img && img.complete && img.naturalWidth > 0) {
                    let scale = 1;
                    if (node.classList.contains('rs-img-w-25')) scale = 0.25;
                    else if (node.classList.contains('rs-img-w-50')) scale = 0.50;
                    else if (node.classList.contains('rs-img-w-75')) scale = 0.75;

                    const drawW = contentWidth * scale;
                    const aspect = img.naturalHeight / img.naturalWidth;
                    const drawH = drawW * aspect;
                    contentElements.push({ type: 'img', img, w: drawW, h: drawH, height: drawH + 16 });
                    totalHeight += drawH + 16;
                  }
                }
              } else if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) {
                  const lines = wrapLines(mCtx, text, contentWidth, `400 14.5px ${fontFamily}`);
                  contentElements.push({ type: 'p', lines, height: lines.length * 22 + 8 });
                  totalHeight += lines.length * 22 + 8;
                }
              }
            });
          }
        } else {
          // Tabular Data
          if (tableLayout && tableLayout.hasData) {
            tableHeaderHeight = tableLayout.headerHeight;
            tableRowHeight = tableLayout.rowHeight;
            tableTotalHeight = tableLayout.totalHeight;
            totalHeight += tableTotalHeight + 16;
          } else {
            totalHeight += 40;
          }
        }

        // Post-content Note
        let postNoteBoxHeight = 0;
        if (rsState.includePostNote && rsState.postNote && rsState.postNote.trim()) {
          const noteFont = `500 13px ${fontFamily}`;
          const lines = wrapLines(mCtx, rsState.postNote.trim(), contentWidth - 32, noteFont);
          postNoteBoxHeight = Math.max(38, 16 + lines.length * 19);
          totalHeight += postNoteBoxHeight + 16;
        }

        // Footer
        if (rsState.includeFooter && (rsState.footerLeft || rsState.footerRight)) {
          totalHeight += 18; // divider
          totalHeight += 24; // footer line
        }

        totalHeight += paddingY; // bottom padding
        const naturalTotalHeight = totalHeight;

        // Aspect Ratio Calculation
        let finalWidth = targetWidth;
        let finalHeight = naturalTotalHeight;
        const effRatio = getEffectiveAspectRatio();

        if (effRatio) {
          // Required ratio: width / height = effRatio.ratio
          const targetHeightFromWidth = Math.round(targetWidth / effRatio.ratio);
          if (naturalTotalHeight <= targetHeightFromWidth) {
            finalWidth = targetWidth;
            finalHeight = targetHeightFromWidth;
          } else {
            // Content is taller than targetHeightFromWidth.
            // Scale both dimensions proportionally to preserve exact aspect ratio without clipping content:
            finalHeight = naturalTotalHeight;
            finalWidth = Math.round(naturalTotalHeight * effRatio.ratio);

            if (finalWidth > targetWidth) {
              targetWidth = finalWidth;
              contentWidth = targetWidth - (paddingX * 2);
              if (rsState.mode === 'table' && tableLayout && tableLayout.hasData) {
                const extra = contentWidth - tableLayout.sumNaturalW;
                if (extra > 0) {
                  tableColWidths = tableLayout.naturalColWidths.map(w => w + Math.floor(extra * (w / tableLayout.sumNaturalW)));
                  const curSum = tableColWidths.reduce((a, b) => a + b, 0);
                  if (tableColWidths.length > 0) tableColWidths[tableColWidths.length - 1] += (contentWidth - curSum);
                }
              }
            }
          }
        }

        // Allocate Final 2x DPR Canvas
        const dpr = 2;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(finalWidth * dpr);
        canvas.height = Math.round(finalHeight * dpr);
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, finalWidth, finalHeight);

        // Top accent bar
        ctx.fillStyle = rsState.cardAccent;
        ctx.fillRect(0, 0, finalWidth, 8);

        let curY = paddingY;

        // Render Title Block
        const titleX = paddingX;
        const dateW = 120;
        const availableTitleW = rsState.includeDate ? (contentWidth - dateW - 16) : contentWidth;

        ctx.fillStyle = '#211922';
        ctx.font = `800 24px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const renderTitleLines = wrapLines(ctx, rsState.title || 'Untitled Report', availableTitleW, `800 24px ${fontFamily}`);
        for (let l = 0; l < renderTitleLines.length; l++) {
          ctx.fillText(renderTitleLines[l], titleX, curY);
          curY += 30;
        }

        if (rsState.subtitle) {
          ctx.fillStyle = '#62625b';
          ctx.font = `500 14px ${fontFamily}`;
          ctx.fillText(rsState.subtitle, titleX, curY);
          curY += 22;
        }

        // Date Badge (top right)
        if (rsState.includeDate && rsState.date) {
          const dateBadgeW = 118;
          const dateBadgeH = 28;
          const dateBadgeX = finalWidth - paddingX - dateBadgeW;
          const dateBadgeY = paddingY + 2;

          ctx.fillStyle = '#f6f6f3';
          ctx.strokeStyle = '#e0e0d9';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(dateBadgeX, dateBadgeY, dateBadgeW, dateBadgeH, 14);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#33332e';
          ctx.font = `600 12px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`📆 ${formatDisplayDate(rsState.date)}`, dateBadgeX + dateBadgeW / 2, dateBadgeY + dateBadgeH / 2);
          ctx.textAlign = 'left';
        }

        curY += 8;

        // Divider Line
        ctx.strokeStyle = '#ecece6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(paddingX, curY);
        ctx.lineTo(finalWidth - paddingX, curY);
        ctx.stroke();
        curY += 16;

        // Pre-content Note
        if (preNoteBoxHeight > 0) {
          const boxX = paddingX;
          const boxW = contentWidth;

          ctx.fillStyle = '#fcfcfb';
          ctx.strokeStyle = '#e5e5e0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(boxX, curY, boxW, preNoteBoxHeight, 10);
          ctx.fill();
          ctx.stroke();

          // Lines
          ctx.fillStyle = '#33332e';
          ctx.font = `500 13px ${fontFamily}`;
          ctx.textBaseline = 'top';
          const noteLines = wrapLines(ctx, rsState.preNote.trim(), boxW - 32, `500 13px ${fontFamily}`);
          let textY = curY + 12;
          for (let l = 0; l < noteLines.length; l++) {
            ctx.fillText(noteLines[l], boxX + 16, textY);
            textY += 19;
          }

          curY += preNoteBoxHeight + 16;
        }

        // Render Content Area
        if (rsState.mode === 'notes') {
          contentElements.forEach(el => {
            if (el.type === 'p') {
              ctx.fillStyle = '#211922';
              ctx.font = `400 14.5px ${fontFamily}`;
              ctx.textBaseline = 'top';
              el.lines.forEach(line => {
                ctx.fillText(line, paddingX, curY);
                curY += 22;
              });
              curY += 8;
            } else if (el.type === 'h1') {
              ctx.fillStyle = '#211922';
              ctx.font = `700 21px ${fontFamily}`;
              ctx.textBaseline = 'top';
              el.lines.forEach(line => {
                ctx.fillText(line, paddingX, curY);
                curY += 28;
              });
              curY += 10;
            } else if (el.type === 'h2') {
              ctx.fillStyle = '#211922';
              ctx.font = `700 18px ${fontFamily}`;
              ctx.textBaseline = 'top';
              el.lines.forEach(line => {
                ctx.fillText(line, paddingX, curY);
                curY += 24;
              });
              curY += 8;
            } else if (el.type === 'h3') {
              ctx.fillStyle = '#211922';
              ctx.font = `600 16px ${fontFamily}`;
              ctx.textBaseline = 'top';
              el.lines.forEach(line => {
                ctx.fillText(line, paddingX, curY);
                curY += 22;
              });
              curY += 6;
            } else if (el.type === 'li') {
              ctx.fillStyle = rsState.cardAccent;
              ctx.font = `700 14px ${fontFamily}`;
              ctx.textBaseline = 'top';
              ctx.fillText(el.prefix, paddingX + 8, curY);

              ctx.fillStyle = '#211922';
              ctx.font = `400 14px ${fontFamily}`;
              el.lines.forEach(line => {
                ctx.fillText(line, paddingX + 24, curY);
                curY += 20;
              });
              curY += 4;
            } else if (el.type === 'img') {
              const imgX = paddingX + (contentWidth - el.w) / 2;
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(imgX, curY, el.w, el.h, 8);
              ctx.clip();
              ctx.drawImage(el.img, imgX, curY, el.w, el.h);
              ctx.restore();

              ctx.strokeStyle = '#e0e0d9';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(imgX, curY, el.w, el.h, 8);
              ctx.stroke();

              curY += el.h + 16;
            }
          });
        } else {
          // Table Mode
          if (tableLayout && tableLayout.hasData) {
            const numCols = tableLayout.numCols;
            const rows = tableLayout.rows;
            const matrix = tableLayout.matrix;
            const isNumCols = tableLayout.isNumCols;

            let startIdx = 0;
            if (rsState.tableHasHeader && rows.length > 0) {
              const headerRow = rows[0];
              let cellX = paddingX;
              for (let c = 0; c < numCols; c++) {
                const w = tableColWidths[c];
                ctx.fillStyle = '#f6f6f3';
                ctx.fillRect(cellX, curY, w, tableHeaderHeight);
                ctx.strokeStyle = '#e0e0d9';
                ctx.lineWidth = 1;
                ctx.strokeRect(cellX, curY, w, tableHeaderHeight);

                const isGroupCol = matrix.shouldMergeCol && matrix.shouldMergeCol[c];
                const align = rsState.tableAlign !== 'auto' ? rsState.tableAlign : (isNumCols[c] ? 'right' : (isGroupCol ? 'center' : 'left'));
                const text = (headerRow[c] || '').toUpperCase();
                ctx.fillStyle = '#211922';
                ctx.font = `700 ${rsState.tableCompact ? 11.5 : 12}px ${fontFamily}`;
                ctx.textBaseline = 'middle';
                const textX = align === 'right' ? (cellX + w - 12) : (align === 'center' ? cellX + w / 2 : cellX + 12);
                ctx.textAlign = align;

                const availW = w - 24;
                const measuredW = ctx.measureText(text).width;
                if (measuredW > availW && availW > 0) {
                  ctx.fillText(text, textX, curY + tableHeaderHeight / 2, availW);
                } else {
                  ctx.fillText(text, textX, curY + tableHeaderHeight / 2);
                }

                cellX += w;
              }
              curY += tableHeaderHeight;
              startIdx = 1;
            }

            // Calculate column X positions
            const colXPositions = [paddingX];
            for (let c = 0; c < numCols; c++) {
              colXPositions[c + 1] = colXPositions[c] + tableColWidths[c];
            }

            const bodyStartY = curY;

            for (let r = startIdx; r < rows.length; r++) {
              const isEven = (r - startIdx) % 2 === 1;
              const defaultRowBg = (rsState.tableZebra && isEven) ? '#fafaf8' : '#ffffff';
              const rY = bodyStartY + (r - startIdx) * tableRowHeight;

              for (let c = 0; c < numCols; c++) {
                const cell = matrix[r][c];
                if (cell.isMergedContinuation) {
                  continue;
                }

                const isGroupCol = matrix.shouldMergeCol && matrix.shouldMergeCol[c];
                const isGroupCell = cell.isGroupCol || isGroupCol || cell.isMergeRoot || (cell.rowSpan > 1);

                const cellX = colXPositions[c];
                const w = tableColWidths[c];
                const span = cell.rowSpan || 1;
                const cellH = span * tableRowHeight;

                // Background: group/merged cells stay clean white, normal cells use row zebra
                ctx.fillStyle = isGroupCell ? '#ffffff' : defaultRowBg;
                ctx.fillRect(cellX, rY, w, cellH);

                // Border: single unified bounding box around the cell/span
                ctx.strokeStyle = '#e0e0d9';
                ctx.lineWidth = 1;
                ctx.strokeRect(cellX, rY, w, cellH);

                // Determine text alignment
                const align = rsState.tableAlign !== 'auto'
                  ? rsState.tableAlign
                  : (isNumCols[c] ? 'right' : (isGroupCell ? 'center' : 'left'));

                const text = cell.text != null ? String(cell.text) : '';
                ctx.fillStyle = '#211922';
                ctx.font = isGroupCell 
                  ? `700 ${rsState.tableCompact ? 12.5 : 13}px ${fontFamily}` 
                  : `500 ${rsState.tableCompact ? 12.5 : 13}px ${fontFamily}`;
                ctx.textBaseline = 'middle';
                const textX = align === 'right' ? (cellX + w - 12) : (align === 'center' ? cellX + w / 2 : cellX + 12);
                const textY = rY + cellH / 2;
                ctx.textAlign = align;

                const availW = w - 24;
                const measuredW = ctx.measureText(text).width;
                if (measuredW > availW && availW > 0) {
                  ctx.fillText(text, textX, textY, availW);
                } else {
                  ctx.fillText(text, textX, textY);
                }
              }
            }
            curY += (rows.length - startIdx) * tableRowHeight + 16;
          }
        }

        // Post-content Note
        if (postNoteBoxHeight > 0) {
          const boxX = paddingX;
          const boxW = contentWidth;

          ctx.fillStyle = '#fcfcfb';
          ctx.strokeStyle = '#e5e5e0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(boxX, curY, boxW, postNoteBoxHeight, 10);
          ctx.fill();
          ctx.stroke();

          // Lines
          ctx.fillStyle = '#33332e';
          ctx.font = `500 13px ${fontFamily}`;
          ctx.textBaseline = 'top';
          const noteLines = wrapLines(ctx, rsState.postNote.trim(), boxW - 32, `500 13px ${fontFamily}`);
          let textY = curY + 12;
          for (let l = 0; l < noteLines.length; l++) {
            ctx.fillText(noteLines[l], boxX + 16, textY);
            textY += 19;
          }

          curY += postNoteBoxHeight + 16;
        }

        // Footer Block
        if (rsState.includeFooter && (rsState.footerLeft || rsState.footerRight)) {
          // Pin footer to bottom if aspect ratio has surplus vertical height
          const pinnedDividerY = finalHeight - paddingY - 24 - 16;
          if (curY < pinnedDividerY) {
            curY = pinnedDividerY;
          }

          ctx.strokeStyle = '#ecece6';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(paddingX, curY);
          ctx.lineTo(finalWidth - paddingX, curY);
          ctx.stroke();
          curY += 16;

          ctx.textBaseline = 'middle';
          ctx.font = `500 12.5px ${fontFamily}`;
          if (rsState.footerLeft) {
            ctx.fillStyle = '#62625b';
            ctx.textAlign = 'left';
            ctx.fillText(rsState.footerLeft, paddingX, curY);
          }

          if (rsState.footerRight) {
            ctx.fillStyle = '#211922';
            ctx.font = `600 12.5px ${fontFamily}`;
            ctx.textAlign = 'right';
            ctx.fillText(rsState.footerRight, finalWidth - paddingX, curY);
            ctx.textAlign = 'left';
          }
        }

        resolve(canvas);
      } catch (err) {
        reject(err);
      }
    });
  }

  function generateCardImageBlob(format = 'image/png', quality = 0.95) {
    return renderReportCardToCanvas().then(canvas => {
      return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas blob generation failed'));
        }, format, quality);
      });
    });
  }

  function getExportFilename(extension) {
    const rawTitle = (rsState.title || 'Report').trim();
    const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 30);
    const dateStr = rsState.date || getTodayDateString();
    return `${cleanTitle}_${dateStr}.${extension}`;
  }

  // --- EXPORT ACTIONS (DOWNLOAD & CLIPBOARD) ---
  function exportReportImage(format = 'image/png') {
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    const btnId = ext === 'jpg' ? 'rsExportJpgBtn' : 'rsExportPngBtn';
    const btn = document.getElementById(btnId);

    if (btn) btn.disabled = true;
    if (typeof window.showToast === 'function') {
      window.showToast(`Rendering ${ext.toUpperCase()} image... ⏳`);
    }

    generateCardImageBlob(format, 0.95)
      .then(blob => {
        if (btn) btn.disabled = false;
        const filename = getExportFilename(ext);
        if (typeof window.downloadBlob === 'function') {
          window.downloadBlob(blob, filename);
        }
        if (typeof window.showToast === 'function') {
          window.showToast(`${ext.toUpperCase()} report downloaded! 🎉`);
        }
      })
      .catch(err => {
        console.error('Image export error:', err);
        if (btn) btn.disabled = false;
        if (typeof window.showAlertDialog === 'function') {
          window.showAlertDialog('Export Notice', 'Could not generate the image. Please verify your content and try again.');
        }
      });
  }

  function copyReportImageToClipboard() {
    const btn = document.getElementById('rsCopyImageBtn');
    if (btn) btn.disabled = true;

    if (typeof window.showToast === 'function') {
      window.showToast('Generating image for clipboard... ⏳');
    }

    generateCardImageBlob('image/png', 1)
      .then(blob => {
        if (btn) btn.disabled = false;
        if (navigator.clipboard && window.ClipboardItem && typeof navigator.clipboard.write === 'function') {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]).then(() => {
            if (typeof window.showToast === 'function') {
              window.showToast('Image copied to clipboard! 📋 Paste anywhere in WhatsApp Web or Telegram.');
            }
          }).catch(clipErr => {
            console.warn('Clipboard write failed, falling back to download:', clipErr);
            const filename = getExportFilename('png');
            if (typeof window.downloadBlob === 'function') {
              window.downloadBlob(blob, filename);
            }
            if (typeof window.showToast === 'function') {
              window.showToast('Direct clipboard access restricted. Downloaded PNG instead! 📥');
            }
          });
        } else {
          const filename = getExportFilename('png');
          if (typeof window.downloadBlob === 'function') {
            window.downloadBlob(blob, filename);
          }
          if (typeof window.showToast === 'function') {
            window.showToast('Clipboard not supported in this browser. Downloaded PNG! 📥');
          }
        }
      })
      .catch(err => {
        console.error('Clipboard generation error:', err);
        if (btn) btn.disabled = false;
        if (typeof window.showAlertDialog === 'function') {
          window.showAlertDialog('Copy Notice', 'Could not copy image to clipboard. Try the Download PNG button.');
        }
      });
  }

  // --- RESET / NEW REPORT ---
  function resetReportStudioDraft() {
    if (typeof window.showConfirmDialog === 'function') {
      window.showConfirmDialog({
        title: 'Start New Report?',
        message: 'This will reset the editor to the default template. Any unsaved edits will be cleared.',
        confirmText: 'Reset',
        cancelText: 'Cancel',
        isDanger: true
      }).then(confirmed => {
        if (confirmed) {
          rsState = Object.assign({}, DEFAULT_STATE, {
            date: getTodayDateString()
          });
          try {
            localStorage.removeItem(STORAGE_KEY_DRAFT);
          } catch (e) {}
          syncFormInputsFromState();
          updateReportPreview();
          if (typeof window.showToast === 'function') {
            window.showToast('Report reset to clean template ✨');
          }
        }
      });
    }
  }

  // --- EVENT LISTENERS INITIALIZATION ---
  function setupReportStudioEventListeners() {
    // Mode switcher buttons
    const tabNotesBtn = document.getElementById('rsTabNotesBtn');
    const tabTableBtn = document.getElementById('rsTabTableBtn');

    if (tabNotesBtn) {
      tabNotesBtn.addEventListener('click', () => setWorkspaceMode('notes'));
    }
    if (tabTableBtn) {
      tabTableBtn.addEventListener('click', () => setWorkspaceMode('table'));
    }

    // Title, Subtitle, Date inputs
    const titleInput = document.getElementById('rsTitleInput');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        rsState.title = e.target.value;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const subtitleInput = document.getElementById('rsSubtitleInput');
    if (subtitleInput) {
      subtitleInput.addEventListener('input', (e) => {
        rsState.subtitle = e.target.value;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const dateInput = document.getElementById('rsDateInput');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        rsState.date = e.target.value;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const dateToggle = document.getElementById('rsDateToggle');
    if (dateToggle) {
      dateToggle.addEventListener('change', (e) => {
        rsState.includeDate = e.target.checked;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    // Pre-content Note inputs
    const preNoteInput = document.getElementById('rsPreNoteInput');
    if (preNoteInput) {
      preNoteInput.addEventListener('input', (e) => {
        rsState.preNote = e.target.value;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const preNoteToggle = document.getElementById('rsPreNoteToggle');
    if (preNoteToggle) {
      preNoteToggle.addEventListener('change', (e) => {
        rsState.includePreNote = e.target.checked;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    // Post-content Note inputs
    const postNoteInput = document.getElementById('rsPostNoteInput');
    if (postNoteInput) {
      postNoteInput.addEventListener('input', (e) => {
        rsState.postNote = e.target.value;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const postNoteToggle = document.getElementById('rsPostNoteToggle');
    if (postNoteToggle) {
      postNoteToggle.addEventListener('change', (e) => {
        rsState.includePostNote = e.target.checked;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    // Footer inputs
    const footerToggle = document.getElementById('rsFooterToggle');
    if (footerToggle) {
      footerToggle.addEventListener('change', (e) => {
        rsState.includeFooter = e.target.checked;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const footerLeftInput = document.getElementById('rsFooterLeftInput');
    if (footerLeftInput) {
      footerLeftInput.addEventListener('input', (e) => {
        rsState.footerLeft = e.target.value;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const footerRightInput = document.getElementById('rsFooterRightInput');
    if (footerRightInput) {
      footerRightInput.addEventListener('input', (e) => {
        rsState.footerRight = e.target.value;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    // Table Data inputs & options
    const tableRawInput = document.getElementById('rsTableRawInput');
    if (tableRawInput) {
      tableRawInput.addEventListener('input', (e) => {
        rsState.tableRaw = e.target.value;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const tableHeaderToggle = document.getElementById('rsTableHeaderToggle');
    if (tableHeaderToggle) {
      tableHeaderToggle.addEventListener('change', (e) => {
        rsState.tableHasHeader = e.target.checked;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const tableZebraToggle = document.getElementById('rsTableZebraToggle');
    if (tableZebraToggle) {
      tableZebraToggle.addEventListener('change', (e) => {
        rsState.tableZebra = e.target.checked;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const tableCompactToggle = document.getElementById('rsTableCompactToggle');
    if (tableCompactToggle) {
      tableCompactToggle.addEventListener('change', (e) => {
        rsState.tableCompact = e.target.checked;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const tableMergeToggle = document.getElementById('rsTableMergeToggle');
    if (tableMergeToggle) {
      tableMergeToggle.addEventListener('change', (e) => {
        rsState.tablePreserveMerges = e.target.checked;
        const group = document.getElementById('rsTableMergeScopeGroup');
        if (group) group.style.display = rsState.tablePreserveMerges ? 'inline-flex' : 'none';
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const tableMergeScopeSelect = document.getElementById('rsTableMergeScopeSelect');
    if (tableMergeScopeSelect) {
      tableMergeScopeSelect.addEventListener('change', (e) => {
        rsState.tableMergeScope = e.target.value;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    const tableAlignSelect = document.getElementById('rsTableAlignSelect');
    if (tableAlignSelect) {
      tableAlignSelect.addEventListener('change', (e) => {
        rsState.tableAlign = e.target.value;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    // Table View switcher buttons (Sheet vs Raw)
    const tableViewSheetBtn = document.getElementById('rsTableViewSheetBtn');
    const tableViewRawBtn = document.getElementById('rsTableViewRawBtn');
    if (tableViewSheetBtn) {
      tableViewSheetBtn.addEventListener('click', () => switchTableEditorView('sheet'));
    }
    if (tableViewRawBtn) {
      tableViewRawBtn.addEventListener('click', () => switchTableEditorView('raw'));
    }

    // Interactive Sheet toolbar buttons
    const sheetAddRowBtn = document.getElementById('rsSheetAddRowBtn');
    if (sheetAddRowBtn) {
      sheetAddRowBtn.addEventListener('click', () => addSheetRow());
    }

    const sheetAddColBtn = document.getElementById('rsSheetAddColBtn');
    if (sheetAddColBtn) {
      sheetAddColBtn.addEventListener('click', () => addSheetColumn());
    }

    const sheetClearBtn = document.getElementById('rsSheetClearBtn');
    if (sheetClearBtn) {
      sheetClearBtn.addEventListener('click', () => clearSheetData());
    }

    const tableTemplateSelect = document.getElementById('rsTableTemplateSelect');
    if (tableTemplateSelect) {
      tableTemplateSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
          applyTableTemplate(val);
          tableTemplateSelect.value = '';
        }
      });
    }

    const pasteClipboardTableBtn = document.getElementById('rsPasteClipboardTableBtn');
    if (pasteClipboardTableBtn) {
      pasteClipboardTableBtn.addEventListener('click', () => {
        if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
          navigator.clipboard.readText().then(text => {
            if (text && text.trim()) {
              rsState.tableRaw = text;
              if (tableRawInput) tableRawInput.value = text;
              if (rsState.tableEditorMode === 'sheet') {
                renderInteractiveSheet();
              }
              updateReportPreview();
              saveReportStudioDraftDebounced();
              if (typeof window.showToast === 'function') {
                window.showToast('Pasted spreadsheet cells from clipboard! 📋');
              }
            } else {
              if (typeof window.showToast === 'function') {
                window.showToast('Clipboard is empty or does not contain text.');
              }
            }
          }).catch(() => {
            if (typeof window.showToast === 'function') {
              window.showToast('Please paste directly using Ctrl+V or Cmd+V in the box.');
            }
          });
        } else {
          if (typeof window.showToast === 'function') {
            window.showToast('Please paste directly using Ctrl+V or Cmd+V.');
          }
        }
      });
    }

    const clearTableBtn = document.getElementById('rsClearTableBtn');
    if (clearTableBtn) {
      clearTableBtn.addEventListener('click', () => {
        rsState.tableRaw = '';
        if (tableRawInput) tableRawInput.value = '';
        if (rsState.tableEditorMode === 'sheet') {
          renderInteractiveSheet();
        }
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    // WYSIWYG Editor Toolbar
    const formatBlockSelect = document.getElementById('rsFormatBlockSelect');
    if (formatBlockSelect) {
      formatBlockSelect.addEventListener('change', (e) => {
        executeWysiwygCommand('formatBlock', e.target.value);
      });
    }

    const toolBtns = document.querySelectorAll('.rs-tool-btn[data-command]');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.getAttribute('data-command');
        executeWysiwygCommand(cmd);
      });
    });

    const notesEditor = document.getElementById('rsNotesEditor');
    if (notesEditor) {
      notesEditor.addEventListener('input', () => {
        rsState.notesHtml = notesEditor.innerHTML;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });

      // Drag and Drop of Images into the editor
      notesEditor.addEventListener('dragover', (e) => {
        e.preventDefault();
        notesEditor.classList.add('drag-over');
      });
      notesEditor.addEventListener('dragleave', () => {
        notesEditor.classList.remove('drag-over');
      });
      notesEditor.addEventListener('drop', (e) => {
        e.preventDefault();
        notesEditor.classList.remove('drag-over');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (re) => insertInlineImage(re.target.result);
            reader.readAsDataURL(file);
          }
        }
      });
    }

    // Insert Image File Input Trigger
    const insertImageBtn = document.getElementById('rsInsertImageBtn');
    const imageFileInput = document.getElementById('rsImageFileInput');
    if (insertImageBtn && imageFileInput) {
      insertImageBtn.addEventListener('click', () => {
        imageFileInput.value = '';
        imageFileInput.click();
      });

      imageFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (re) => {
            insertInlineImage(re.target.result);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Color Chips
    const colorChips = document.querySelectorAll('.rs-color-chip');
    colorChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const color = chip.getAttribute('data-color');
        rsState.cardAccent = color;
        colorChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    });

    // Card Width Select
    const cardWidthSelect = document.getElementById('rsCardWidthSelect');
    if (cardWidthSelect) {
      cardWidthSelect.addEventListener('change', (e) => {
        rsState.cardWidth = e.target.value;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    // Aspect Ratio Select & Custom Inputs
    const aspectRatioSelect = document.getElementById('rsAspectRatioSelect');
    const customRatioContainer = document.getElementById('rsCustomRatioContainer');
    const customRatioW = document.getElementById('rsCustomRatioW');
    const customRatioH = document.getElementById('rsCustomRatioH');

    if (aspectRatioSelect) {
      aspectRatioSelect.addEventListener('change', (e) => {
        rsState.aspectRatio = e.target.value;
        if (customRatioContainer) {
          customRatioContainer.style.display = rsState.aspectRatio === 'custom' ? 'block' : 'none';
        }
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    if (customRatioW) {
      customRatioW.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        rsState.customRatioW = (!isNaN(val) && val > 0) ? val : 1;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    if (customRatioH) {
      customRatioH.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        rsState.customRatioH = (!isNaN(val) && val > 0) ? val : 1;
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    // Export Buttons
    const exportPngBtn = document.getElementById('rsExportPngBtn');
    if (exportPngBtn) {
      exportPngBtn.addEventListener('click', () => exportReportImage('image/png'));
    }

    const exportJpgBtn = document.getElementById('rsExportJpgBtn');
    if (exportJpgBtn) {
      exportJpgBtn.addEventListener('click', () => exportReportImage('image/jpeg'));
    }

    const copyImageBtn = document.getElementById('rsCopyImageBtn');
    if (copyImageBtn) {
      copyImageBtn.addEventListener('click', copyReportImageToClipboard);
    }

    const resetDraftBtn = document.getElementById('rsResetDraftBtn');
    if (resetDraftBtn) {
      resetDraftBtn.addEventListener('click', resetReportStudioDraft);
    }

    // Zoom Controls
    const zoomInBtn = document.getElementById('rsZoomInBtn');
    const zoomOutBtn = document.getElementById('rsZoomOutBtn');
    const zoomResetBtn = document.getElementById('rsZoomResetBtn');
    const zoomLabel = document.getElementById('rsZoomLabel');
    const card = document.getElementById('rsReportCard');

    function applyZoom() {
      if (card) {
        card.style.transform = `scale(${rsState.previewZoom})`;
        card.style.transformOrigin = 'top center';
      }
      if (zoomLabel) {
        zoomLabel.textContent = `${Math.round(rsState.previewZoom * 100)}%`;
      }
    }

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        if (rsState.previewZoom < 1.5) {
          rsState.previewZoom = Math.min(1.5, Number((rsState.previewZoom + 0.1).toFixed(1)));
          applyZoom();
        }
      });
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        if (rsState.previewZoom > 0.5) {
          rsState.previewZoom = Math.max(0.5, Number((rsState.previewZoom - 0.1).toFixed(1)));
          applyZoom();
        }
      });
    }
    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', () => {
        rsState.previewZoom = 1;
        applyZoom();
      });
    }

    // Initial render and sync
    syncFormInputsFromState();
    updateReportPreview();
  }

  function renderReportStudio() {
    syncFormInputsFromState();
    updateReportPreview();
  }

  // --- EXPORT TO GLOBAL WINDOW SCOPE ---
  window.loadReportStudioDataFromStorage = loadReportStudioDataFromStorage;
  window.setupReportStudioEventListeners = setupReportStudioEventListeners;
  window.renderReportStudio = renderReportStudio;
  window.exportReportImage = exportReportImage;
  window.renderReportCardToCanvas = renderReportCardToCanvas;
  window.generateCardImageBlob = generateCardImageBlob;

})(window);
