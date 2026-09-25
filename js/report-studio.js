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
    tableSectionStyle: 'banner', // 'banner' or 'split'
    tableSplitPageBreak: false, // In PDF print, start each broken table on a new page
    includePostNote: true,
    postNote: 'Note: Parents are requested to sign the report book and return it with your child by Wednesday morning.',
    includeFooter: true,
    footerLeft: 'Glimpse Report Studio • Academic Year 2026–27',
    footerRight: 'Class Teacher Signature: __________________',
    cardAccent: '#e60023', // Default Pinterest Red
    cardWidth: 'auto', // 'auto', 'standard', 'compact', 'wide'
    aspectRatio: 'auto', // 'auto', '1:1', '4:5', '9:16', '16:9', '2:3', '3:4', '3:2', 'custom'
    customRatioW: 1,
    customRatioH: 1,
    previewZoom: 1,
    pdfPageFormat: 'a4', // 'a4' or 'fit'
    pdfLayout: 'document', // 'document' (Formal Document) or 'card' (Card Preview)
    pdfOrientation: 'auto' // 'auto', 'portrait', 'landscape'
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
    student_roster: 'CLASS\tROLL NO\tSTUDENT NAME\tREMARKS\n# English Recitation\n1A\t101\tMaryam Bint Saheer\tExcellent participation\n\t102\tNavanika Vineeth\tConsistent attendance\n\t103\tAyaan Muhammad\tVery good progress\n# Malayalam Recitation\n1B\t104\tMiswana\tCreative and attentive\n\t105\tMuhammed Aslam\tActive learner\n1C\t106\tKhanza\tNeat work and methodical\n\t107\tAlfid\tHigh accuracy in exercises',
    marksheet: 'ROLL NO\tNAME\tMATHEMATICS\tSCIENCE\tTOTAL\tGRADE\n101\tAarav Patel\t94\t92\t186\tA+\n102\tDiya Sharma\t88\t85\t173\tA\n103\tKabir Verma\t76\t80\t156\tB+\n104\tMeera Nair\t95\t98\t193\tA+\n105\tRohan Gupta\t82\t79\t161\tB+',
    schedule: 'DAY\tPERIOD 1\tPERIOD 2\tPERIOD 3\tPERIOD 4\nMonday\tMathematics\tEnglish\tPhysics\tPhysical Ed.\nTuesday\tChemistry\tBiology\tMathematics\tArt & Craft\nWednesday\tEnglish\tComputer Sci.\tPhysics\tLibrary\nThursday\tMathematics\tSocial Studies\tChemistry\tMusic\nFriday\tLanguage\tPhysics\tMathematics\tGames',
    blank_3x4: 'Column 1\tColumn 2\tColumn 3\n\t\t\n\t\t\n\t\t'
  };

  // --- SUB-SECTION HELPER FUNCTIONS ---
  function isSubSectionRow(textOrRow) {
    if (!textOrRow) return false;
    const str = Array.isArray(textOrRow) ? (textOrRow[0] || '') : String(textOrRow);
    const trimmed = str.trim();
    if (trimmed === '#' || trimmed === '##' || trimmed === '###' || trimmed === '§') return true;
    return /^(#{1,3}\s+|§\s*)/.test(trimmed);
  }

  function getSubSectionTitle(textOrRow) {
    if (!textOrRow) return '';
    const str = Array.isArray(textOrRow) ? (textOrRow[0] || '') : String(textOrRow);
    const trimmed = str.trim();
    return trimmed.replace(/^(#{1,3}\s*|§\s*)/, '').trim();
  }

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
    return grid.map(row => {
      if (isSubSectionRow(row)) {
        return (row[0] || '').trim();
      }
      return row.join('\t');
    }).join('\n');
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
      const isSection = isSubSectionRow(grid[r]);

      // Gutter cell (sub-section toggle + row number & delete button)
      const gutterTd = document.createElement('td');
      gutterTd.className = 'rs-sheet-row-gutter';

      const gutterWrap = document.createElement('div');
      gutterWrap.className = 'rs-sheet-row-gutter-wrap';

      const sectionBtn = document.createElement('button');
      sectionBtn.type = 'button';
      sectionBtn.className = `rs-sheet-section-btn ${isSection ? 'active' : ''}`;
      sectionBtn.title = isSection ? 'Row is a section (Click to revert to regular row)' : 'Convert row to section header';
      sectionBtn.textContent = '§';
      sectionBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        toggleSheetRowSection(r);
      });
      gutterWrap.appendChild(sectionBtn);

      const rowNumWrap = document.createElement('div');
      rowNumWrap.className = 'rs-sheet-row-num-wrap';

      const rowNum = document.createElement('span');
      rowNum.className = 'rs-sheet-row-num';
      rowNum.textContent = String(r);
      rowNumWrap.appendChild(rowNum);

      const delRowBtn = document.createElement('button');
      delRowBtn.type = 'button';
      delRowBtn.className = 'rs-sheet-row-del-btn';
      delRowBtn.title = `Delete row ${r}`;
      delRowBtn.innerHTML = '&times;';
      delRowBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        deleteSheetRow(r);
      });
      rowNumWrap.appendChild(delRowBtn);

      gutterWrap.appendChild(rowNumWrap);
      gutterTd.appendChild(gutterWrap);
      tr.appendChild(gutterTd);

      if (isSection) {
        tr.className = 'rs-sheet-row-section';
        const sectionTd = document.createElement('td');
        sectionTd.className = 'rs-sheet-section-td';
        sectionTd.colSpan = numCols;

        const sectionWrap = document.createElement('div');
        sectionWrap.className = 'rs-sheet-section-wrap';

        const tag = document.createElement('span');
        tag.className = 'rs-sheet-section-tag';
        tag.title = 'Section row';
        tag.textContent = '§';
        sectionWrap.appendChild(tag);

        const sectionInput = document.createElement('input');
        sectionInput.type = 'text';
        sectionInput.className = 'rs-sheet-section-input';
        sectionInput.value = getSubSectionTitle(grid[r]);
        sectionInput.placeholder = 'Enter section or category title (e.g. 1F, English Recitation)...';
        sectionInput.dataset.row = r;
        sectionInput.dataset.col = 0;

        sectionInput.addEventListener('input', (e) => {
          grid[r][0] = '# ' + e.target.value;
          for (let c = 1; c < numCols; c++) {
            grid[r][c] = '';
          }
          rsState.tableRaw = serializeGridData(grid);
          const rawInput = document.getElementById('rsTableRawInput');
          if (rawInput) rawInput.value = rsState.tableRaw;
          updateReportPreview();
          saveReportStudioDraftDebounced();
        });

        sectionInput.addEventListener('keydown', (e) => handleSheetKeyNav(e, r, 0, numRows, numCols));

        sectionWrap.appendChild(sectionInput);
        sectionTd.appendChild(sectionWrap);
        tr.appendChild(sectionTd);
      } else {
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
      }

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);
  }

  function toggleSheetRowSection(rowIndex) {
    const grid = getGridDataFromRaw(rsState.tableRaw);
    if (rowIndex < 1 || rowIndex >= grid.length) return;

    const row = grid[rowIndex];
    if (isSubSectionRow(row)) {
      // Revert from section to normal row
      const title = getSubSectionTitle(row);
      row[0] = title;
    } else {
      // Convert to sub-section row
      let initialTitle = '';
      for (let c = 0; c < row.length; c++) {
        if ((row[c] || '').trim()) {
          initialTitle = row[c].trim();
          break;
        }
      }
      if (!initialTitle) initialTitle = '';
      row[0] = '# ' + initialTitle;
      for (let c = 1; c < row.length; c++) {
        row[c] = '';
      }
    }

    rsState.tableRaw = serializeGridData(grid);
    const rawInput = document.getElementById('rsTableRawInput');
    if (rawInput) rawInput.value = rsState.tableRaw;
    renderInteractiveSheet();
    updateReportPreview();
    saveReportStudioDraftDebounced();

    setTimeout(() => {
      const targetInput = document.querySelector(`.rs-sheet-table input[data-row="${rowIndex}"][data-col="0"]`);
      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    }, 10);
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
        let nextInput = document.querySelector(`.rs-sheet-table input[data-row="${r + 1}"][data-col="${c}"]`);
        if (!nextInput) {
          nextInput = document.querySelector(`.rs-sheet-table input[data-row="${r + 1}"]`);
        }
        if (nextInput) nextInput.focus();
      }
    } else if (e.key === 'ArrowDown') {
      let nextInput = document.querySelector(`.rs-sheet-table input[data-row="${r + 1}"][data-col="${c}"]`);
      if (!nextInput) {
        nextInput = document.querySelector(`.rs-sheet-table input[data-row="${r + 1}"]`);
      }
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp' && r > 0) {
      let prevInput = document.querySelector(`.rs-sheet-table input[data-row="${r - 1}"][data-col="${c}"]`);
      if (!prevInput) {
        prevInput = document.querySelector(`.rs-sheet-table input[data-row="${r - 1}"]`);
      }
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
      const isSec = isSubSectionRow(rows[r]);
      const secTitle = isSec ? getSubSectionTitle(rows[r]) : '';
      matrix[r].isSection = isSec;
      matrix[r].sectionTitle = secTitle;

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

    // Identify vertical merge spans for qualified columns (sub-sections isolate merges)
    for (let c = 0; c < numCols; c++) {
      if (!shouldMergeCol[c]) continue;

      let r = startIdx;
      while (r < rows.length) {
        if (matrix[r].isSection) {
          r++;
          continue;
        }

        matrix[r][c].isGroupCol = true;
        const cellVal = rows[r][c].trim();
        if (cellVal !== '') {
          let span = 1;
          while (r + span < rows.length && !matrix[r + span].isSection && rows[r + span][c].trim() === '') {
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
        sectionBannerHeight: 0,
        splitHeaderHeight: 0,
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
    const sectionBannerHeight = rsState.tableCompact ? 32 : 38;
    const splitHeaderHeight = rsState.tableCompact ? 34 : 38;
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
        if (matrix[r] && matrix[r].isSection) {
          continue; // Skip section rows for column width measurement
        }
        const text = rows[r][c] != null ? String(rows[r][c]) : '';
        if (text) {
          maxTextW = Math.max(maxTextW, mCtx.measureText(text).width);
        }
      }

      const minW = isNumCols[c] ? 56 : (c === 0 ? 70 : 80);
      naturalColWidths[c] = Math.max(minW, Math.ceil(maxTextW + paddingH));
    }

    const sumNaturalW = naturalColWidths.reduce((a, b) => a + b, 0);

    // Compute totalHeight based on section style
    let sectionCount = 0;
    for (let r = startIdx; r < rows.length; r++) {
      if (matrix[r] && matrix[r].isSection) {
        sectionCount++;
      }
    }
    const normalRowCount = (rows.length - startIdx) - sectionCount;

    let totalHeight = 0;
    if (rsState.tableSectionStyle === 'split' && sectionCount > 0) {
      let headersCount = 0;
      let hasPreSectionRows = false;
      for (let r = startIdx; r < rows.length; r++) {
        if (matrix[r].isSection) break;
        hasPreSectionRows = true;
      }
      if (rsState.tableHasHeader && hasPreSectionRows) headersCount++;
      if (rsState.tableHasHeader) headersCount += sectionCount;

      totalHeight = (headersCount * headerHeight) +
                    (sectionCount * (splitHeaderHeight + 14)) +
                    (normalRowCount * rowHeight);
    } else {
      totalHeight = (startIdx * headerHeight) +
                    (sectionCount * sectionBannerHeight) +
                    (normalRowCount * rowHeight);
    }

    return {
      hasData: true,
      numCols,
      rows,
      matrix,
      isNumCols,
      headerHeight,
      rowHeight,
      sectionBannerHeight,
      splitHeaderHeight,
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

    const bodyStartIdx = (rsState.tableHasHeader && rows.length > 0) ? 1 : 0;
    const headerRow = (rsState.tableHasHeader && rows.length > 0) ? rows[0] : null;

    function renderHeaderTr() {
      if (!headerRow) return '';
      let ths = '<thead><tr>';
      for (let c = 0; c < numCols; c++) {
        const text = headerRow[c] != null ? headerRow[c] : '';
        const isGroupCol = matrix.shouldMergeCol && matrix.shouldMergeCol[c];
        const align = rsState.tableAlign !== 'auto' 
          ? rsState.tableAlign 
          : (isNumCols[c] ? 'right' : (isGroupCol ? 'center' : 'left'));
        ths += `<th style="text-align: ${align};">${escapeXml(text)}</th>`;
      }
      ths += '</tr></thead>';
      return ths;
    }

    function renderRowTr(r) {
      let trHtml = '<tr>';
      for (let c = 0; c < numCols; c++) {
        const cell = matrix[r][c];
        if (cell.isMergedContinuation) {
          continue;
        }

        const isGroupCol = matrix.shouldMergeCol && matrix.shouldMergeCol[c];
        const isGroupCell = cell.isGroupCol || isGroupCol || cell.isMergeRoot || (cell.rowSpan > 1);

        const align = rsState.tableAlign !== 'auto'
          ? rsState.tableAlign
          : (isNumCols[c] ? 'right' : (isGroupCell ? 'center' : 'left'));

        if (isGroupCell) {
          trHtml += `<td rowspan="${cell.rowSpan}" class="rs-merged-cell" style="text-align: ${align}; vertical-align: middle;">${escapeXml(cell.text)}</td>`;
        } else {
          trHtml += `<td style="text-align: ${align};">${escapeXml(cell.text)}</td>`;
        }
      }
      trHtml += '</tr>';
      return trHtml;
    }

    // Check if there are any section rows
    let hasSections = false;
    for (let r = bodyStartIdx; r < rows.length; r++) {
      if (matrix[r].isSection) {
        hasSections = true;
        break;
      }
    }

    if (rsState.tableSectionStyle === 'split' && hasSections) {
      // Split mode: partition rows into separate sub-tables with repeated column headers!
      let outHtml = '';
      let currentSectionTitle = null;
      let currentRows = [];

      function flushCurrentSection() {
        if (currentRows.length === 0 && !currentSectionTitle) return;
        outHtml += `<div class="rs-table-split-wrap">`;
        if (currentSectionTitle) {
          outHtml += `<div class="rs-table-split-header">
            <span class="rs-table-split-bar" style="background-color: ${escapeXml(rsState.cardAccent)};"></span>
            <h4 class="rs-table-split-title">${escapeXml(currentSectionTitle)}</h4>
          </div>`;
        }
        outHtml += `<table class="rs-rendered-table ${zebraClass} ${compactClass}">`;
        outHtml += renderHeaderTr();
        outHtml += '<tbody>';
        currentRows.forEach(r => {
          outHtml += renderRowTr(r);
        });
        outHtml += '</tbody></table></div>';
        currentRows = [];
      }

      for (let r = bodyStartIdx; r < rows.length; r++) {
        if (matrix[r].isSection) {
          flushCurrentSection();
          currentSectionTitle = matrix[r].sectionTitle;
        } else {
          currentRows.push(r);
        }
      }
      flushCurrentSection();

      return outHtml;
    }

    // Banner mode (or single table if no sections):
    let html = `<table class="rs-rendered-table ${zebraClass} ${compactClass}">`;
    html += renderHeaderTr();
    html += '<tbody>';

    for (let r = bodyStartIdx; r < rows.length; r++) {
      if (matrix[r].isSection) {
        html += `<tr class="rs-table-section-row">
          <td colspan="${numCols}">
            <div class="rs-table-section-banner">
              <span class="rs-table-section-bar" style="background-color: ${escapeXml(rsState.cardAccent)};"></span>
              <span class="rs-table-section-title">${escapeXml(matrix[r].sectionTitle)}</span>
            </div>
          </td>
        </tr>`;
      } else {
        html += renderRowTr(r);
      }
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

    // Dynamic width calculation for Auto or Preset widths
    const paddingX = 36;
    const paddingTotal = paddingX * 2; // 72px total horizontal padding

    if (rsState.cardWidth === 'auto') {
      if (rsState.mode === 'table') {
        const measureCanvas = document.createElement('canvas');
        const mCtx = measureCanvas.getContext('2d');
        const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", Helvetica, Arial, sans-serif';
        const layout = computeTableLayout(mCtx, fontFamily);
        if (layout.hasData) {
          // Approach 2: Pure Natural Fit with inner content padding and sensible minimum (480px)
          const autoCardWidth = Math.max(480, layout.sumNaturalW + paddingTotal);
          card.style.maxWidth = `${autoCardWidth}px`;
          if (window.innerWidth > 680) {
            card.style.width = `${autoCardWidth}px`;
          } else {
            card.style.width = '100%';
          }
        } else {
          card.style.maxWidth = '720px';
          card.style.width = '';
        }
      } else {
        card.style.maxWidth = '720px';
        card.style.width = '';
      }
    } else {
      const baseCardWidth = rsState.cardWidth === 'compact' ? 540 : (rsState.cardWidth === 'wide' ? 920 : 720);
      const baseContentW = baseCardWidth - paddingTotal;
      if (rsState.mode === 'table') {
        const measureCanvas = document.createElement('canvas');
        const mCtx = measureCanvas.getContext('2d');
        const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", Helvetica, Arial, sans-serif';
        const layout = computeTableLayout(mCtx, fontFamily);
        if (layout.hasData && layout.sumNaturalW > baseContentW) {
          const expandedW = layout.sumNaturalW + paddingTotal;
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
    const isSplitPageBreak = !!(rsState.mode === 'table' && rsState.tableSectionStyle === 'split' && rsState.tableSplitPageBreak);
    card.classList.toggle('rs-table-split-page-break', isSplitPageBreak);

    const contentArea = document.getElementById('rsCardContentArea');
    if (contentArea) {
      if (rsState.mode === 'notes') {
        contentArea.innerHTML = rsState.notesHtml || '<p style="color: #91918c; font-style: italic;">No notes entered yet.</p>';
      } else {
        contentArea.innerHTML = renderTableToHtml();
      }
      contentArea.classList.toggle('rs-table-split-page-break', isSplitPageBreak);
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
      tableMergeScopeGroup.style.display = rsState.tablePreserveMerges ? 'flex' : 'none';
    }
    if (tableAlignSelect) tableAlignSelect.value = rsState.tableAlign || 'auto';
    const tableSectionStyleSelect = document.getElementById('rsTableSectionStyleSelect');
    if (tableSectionStyleSelect) tableSectionStyleSelect.value = rsState.tableSectionStyle || 'banner';
    const tableSplitPageBreakToggle = document.getElementById('rsTableSplitPageBreakToggle');
    if (tableSplitPageBreakToggle) tableSplitPageBreakToggle.checked = !!rsState.tableSplitPageBreak;
    const tableSplitPageBreakGroup = document.getElementById('rsTableSplitPageBreakGroup');
    if (tableSplitPageBreakGroup) {
      tableSplitPageBreakGroup.style.display = (rsState.tableSectionStyle === 'split') ? 'flex' : 'none';
    }
    if (cardWidthSelect) cardWidthSelect.value = rsState.cardWidth || 'auto';
    if (aspectRatioSelect) aspectRatioSelect.value = rsState.aspectRatio || 'auto';
    if (customRatioContainer) {
      customRatioContainer.style.display = rsState.aspectRatio === 'custom' ? 'block' : 'none';
    }
    if (customRatioW) customRatioW.value = rsState.customRatioW || 1;
    if (customRatioH) customRatioH.value = rsState.customRatioH || 1;

    const pdfPageFormatSelect = document.getElementById('rsPdfPageFormatSelect');
    if (pdfPageFormatSelect) pdfPageFormatSelect.value = rsState.pdfPageFormat || 'a4';

    const pdfLayoutSelect = document.getElementById('rsPdfLayoutSelect');
    if (pdfLayoutSelect) pdfLayoutSelect.value = rsState.pdfLayout || 'document';

    const pdfOrientationSelect = document.getElementById('rsPdfOrientationSelect');
    if (pdfOrientationSelect) pdfOrientationSelect.value = rsState.pdfOrientation || 'auto';

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
        const paddingX = 36;
        const paddingY = 32;
        let targetWidth = 720;
        if (rsState.cardWidth === 'compact') targetWidth = 540;
        if (rsState.cardWidth === 'wide') targetWidth = 920;

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
            if (rsState.cardWidth === 'auto') {
              // Approach 2: Pure Natural Fit with inner content padding and sensible minimum (480px)
              const minContentW = 480 - (paddingX * 2);
              const naturalW = tableLayout.sumNaturalW;
              contentWidth = Math.max(minContentW, naturalW);
              targetWidth = contentWidth + (paddingX * 2);
              if (contentWidth > naturalW) {
                const extra = contentWidth - naturalW;
                tableColWidths = tableLayout.naturalColWidths.map(w => w + Math.floor(extra * (w / naturalW)));
                const curSum = tableColWidths.reduce((a, b) => a + b, 0);
                if (tableColWidths.length > 0) tableColWidths[tableColWidths.length - 1] += (contentWidth - curSum);
              } else {
                tableColWidths = tableLayout.naturalColWidths.slice();
              }
            } else if (tableLayout.sumNaturalW > contentWidth) {
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

        // Footer measurement
        let footerBoxHeight = 0;
        let footerLeftLines = [];
        let footerRightLines = [];
        const footerLineHeight = 18;
        if (rsState.includeFooter && (rsState.footerLeft || rsState.footerRight)) {
          footerLeftLines = rsState.footerLeft ? rsState.footerLeft.split('\n') : [];
          footerRightLines = rsState.footerRight ? rsState.footerRight.split('\n') : [];
          const maxFooterLines = Math.max(footerLeftLines.length, footerRightLines.length, 1);
          footerBoxHeight = maxFooterLines * footerLineHeight;
          totalHeight += 18; // divider
          totalHeight += footerBoxHeight;
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

          // Accent left border
          ctx.fillStyle = rsState.cardAccent || '#e60023';
          ctx.beginPath();
          ctx.roundRect(boxX, curY, 4, preNoteBoxHeight, [10, 0, 0, 10]);
          ctx.fill();

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

            const headerHeight = tableHeaderHeight;
            const rowHeight = tableRowHeight;
            const sectionBannerHeight = tableLayout.sectionBannerHeight || (rsState.tableCompact ? 32 : 38);
            const splitHeaderHeight = tableLayout.splitHeaderHeight || (rsState.tableCompact ? 34 : 38);
            const startIdx = rsState.tableHasHeader ? 1 : 0;
            const totalTableW = tableColWidths.reduce((a, b) => a + b, 0);

            // Calculate column X positions
            const colXPositions = [paddingX];
            for (let c = 0; c < numCols; c++) {
              colXPositions[c + 1] = colXPositions[c] + tableColWidths[c];
            }

            function drawCanvasHeader(y) {
              if (!rsState.tableHasHeader || rows.length === 0) return;
              const headerRow = rows[0];
              let cellX = paddingX;
              for (let c = 0; c < numCols; c++) {
                const w = tableColWidths[c];
                ctx.fillStyle = '#f6f6f3';
                ctx.fillRect(cellX, y, w, headerHeight);
                ctx.strokeStyle = '#e0e0d9';
                ctx.lineWidth = 1;
                ctx.strokeRect(cellX, y, w, headerHeight);

                // Accent bottom border on header cell
                ctx.fillStyle = rsState.cardAccent || '#e60023';
                ctx.fillRect(cellX, y + headerHeight - 2.5, w, 2.5);

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
                  ctx.fillText(text, textX, y + (headerHeight - 2.5) / 2, availW);
                } else {
                  ctx.fillText(text, textX, y + (headerHeight - 2.5) / 2);
                }

                cellX += w;
              }
            }

            function drawCanvasDataRow(r, y, isEven) {
              const defaultRowBg = (rsState.tableZebra && isEven) ? '#fafaf8' : '#ffffff';

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
                const cellH = span * rowHeight;

                ctx.fillStyle = isGroupCell ? '#ffffff' : defaultRowBg;
                ctx.fillRect(cellX, y, w, cellH);

                ctx.strokeStyle = '#e0e0d9';
                ctx.lineWidth = 1;
                ctx.strokeRect(cellX, y, w, cellH);

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
                const textY = y + cellH / 2;
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

            // Check if there are any section rows
            let hasSections = false;
            for (let r = startIdx; r < rows.length; r++) {
              if (matrix[r].isSection) {
                hasSections = true;
                break;
              }
            }

            if (rsState.tableSectionStyle === 'split' && hasSections) {
              let currentSectionStarted = false;
              let evenIndex = 0;

              let hasPreSectionRows = false;
              for (let r = startIdx; r < rows.length; r++) {
                if (matrix[r].isSection) break;
                hasPreSectionRows = true;
              }

              if (rsState.tableHasHeader && hasPreSectionRows) {
                drawCanvasHeader(curY);
                curY += headerHeight;
              }

              for (let r = startIdx; r < rows.length; r++) {
                if (matrix[r].isSection) {
                  if (currentSectionStarted || hasPreSectionRows) {
                    if (!canvas.sectionSplitYs) canvas.sectionSplitYs = [];
                    canvas.sectionSplitYs.push(curY);
                    curY += 14;
                  }
                  currentSectionStarted = true;
                  evenIndex = 0;

                  // 1. Draw split section header
                  ctx.fillStyle = rsState.cardAccent || '#e60023';
                  ctx.beginPath();
                  ctx.roundRect(paddingX, curY + 2, 4, 18, 2);
                  ctx.fill();

                  ctx.fillStyle = '#211922';
                  ctx.font = `800 ${rsState.tableCompact ? 14 : 15}px ${fontFamily}`;
                  ctx.textAlign = 'left';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(matrix[r].sectionTitle, paddingX + 14, curY + 11);

                  curY += 26;

                  ctx.strokeStyle = '#e0e0d9';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.moveTo(paddingX, curY);
                  ctx.lineTo(paddingX + totalTableW, curY);
                  ctx.stroke();
                  curY += 8;

                  // 2. Loop table header for this sub-table
                  if (rsState.tableHasHeader) {
                    drawCanvasHeader(curY);
                    curY += headerHeight;
                  }
                } else {
                  const isEven = (evenIndex % 2 === 1);
                  drawCanvasDataRow(r, curY, isEven);
                  curY += rowHeight;
                  evenIndex++;
                }
              }
            } else {
              // Banner mode (or regular table)
              if (rsState.tableHasHeader && rows.length > 0) {
                drawCanvasHeader(curY);
                curY += headerHeight;
              }

              let evenIndex = 0;
              for (let r = startIdx; r < rows.length; r++) {
                if (matrix[r].isSection) {
                  ctx.fillStyle = '#f6f6f3';
                  ctx.fillRect(paddingX, curY, totalTableW, sectionBannerHeight);

                  ctx.strokeStyle = '#e0e0d9';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.moveTo(paddingX, curY);
                  ctx.lineTo(paddingX + totalTableW, curY);
                  ctx.moveTo(paddingX, curY + sectionBannerHeight);
                  ctx.lineTo(paddingX + totalTableW, curY + sectionBannerHeight);
                  ctx.stroke();

                  // Vertical accent bar
                  const barW = 4;
                  const barH = 18;
                  const barX = paddingX + 12;
                  const barY = curY + (sectionBannerHeight - barH) / 2;
                  ctx.fillStyle = rsState.cardAccent || '#e60023';
                  ctx.beginPath();
                  ctx.roundRect(barX, barY, barW, barH, 2);
                  ctx.fill();

                  // Title
                  ctx.fillStyle = '#211922';
                  ctx.font = `800 ${rsState.tableCompact ? 13.5 : 14.5}px ${fontFamily}`;
                  ctx.textAlign = 'left';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(matrix[r].sectionTitle, barX + barW + 10, curY + sectionBannerHeight / 2);

                  curY += sectionBannerHeight;
                  evenIndex = 0;
                } else {
                  const isEven = (evenIndex % 2 === 1);
                  drawCanvasDataRow(r, curY, isEven);
                  curY += rowHeight;
                  evenIndex++;
                }
              }
            }

            curY += 16;
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

          // Accent left border
          ctx.fillStyle = rsState.cardAccent || '#e60023';
          ctx.beginPath();
          ctx.roundRect(boxX, curY, 4, postNoteBoxHeight, [10, 0, 0, 10]);
          ctx.fill();

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
          const pinnedDividerY = finalHeight - paddingY - footerBoxHeight - 16;
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

          ctx.textBaseline = 'top';
          if (footerLeftLines.length > 0) {
            ctx.fillStyle = '#62625b';
            ctx.font = `500 12.5px ${fontFamily}`;
            ctx.textAlign = 'left';
            footerLeftLines.forEach((line, idx) => {
              ctx.fillText(line, paddingX, curY + (idx * footerLineHeight));
            });
          }

          if (footerRightLines.length > 0) {
            ctx.fillStyle = '#211922';
            ctx.font = `600 12.5px ${fontFamily}`;
            ctx.textAlign = 'right';
            footerRightLines.forEach((line, idx) => {
              ctx.fillText(line, finalWidth - paddingX, curY + (idx * footerLineHeight));
            });
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

  // --- CLIENT-SIDE PURE JAVASCRIPT MULTI-PAGE PDF 1.4 BUILDER ---
  function createMultiPagePdfBlob(pages, pageSize = 'a4') {
    const encoder = new TextEncoder();
    const parts = [];
    const offsets = [];
    let pos = 0;

    function pushPart(chunk) {
      parts.push(chunk);
      pos += chunk.length;
    }

    const header = encoder.encode("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    pushPart(header);

    const numPages = pages.length;
    const kidsArray = [];
    for (let i = 0; i < numPages; i++) {
      kidsArray.push(`${3 + (i * 3)} 0 R`);
    }

    offsets[1] = pos;
    pushPart(encoder.encode("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"));

    offsets[2] = pos;
    pushPart(encoder.encode(`2 0 obj\n<< /Type /Pages /Kids [${kidsArray.join(' ')}] /Count ${numPages} >>\nendobj\n`));

    for (let i = 0; i < numPages; i++) {
      const page = pages[i];
      const pageObjNum = 3 + (i * 3);
      const imgObjNum = 4 + (i * 3);
      const contentsObjNum = 5 + (i * 3);

      const isLandscape = page.cssWidth > page.cssHeight;
      let pageWidth, pageHeight;
      if (pageSize === 'a4') {
        pageWidth = isLandscape ? 841.89 : 595.28;
        pageHeight = isLandscape ? 595.28 : 841.89;
      } else {
        pageWidth = Number((page.cssWidth * 0.75).toFixed(2));
        pageHeight = Number((page.cssHeight * 0.75).toFixed(2));
      }

      let destW, destH, destX, destY;
      if (pageSize === 'a4') {
        const margin = 28.35; // 10mm print margin
        const availW = pageWidth - (margin * 2);
        const availH = pageHeight - (margin * 2);
        const scale = Math.min(availW / (page.cssWidth * 0.75), availH / (page.cssHeight * 0.75), 1);
        destW = Number(((page.cssWidth * 0.75) * scale).toFixed(2));
        destH = Number(((page.cssHeight * 0.75) * scale).toFixed(2));
        destX = Number(((pageWidth - destW) / 2).toFixed(2));
        destY = Number(((pageHeight - destH) / 2).toFixed(2));
      } else {
        destW = pageWidth;
        destH = pageHeight;
        destX = 0;
        destY = 0;
      }

      const contentStream = `q\n${destW} 0 0 ${destH} ${destX} ${destY} cm\n/Im${i + 1} Do\nQ\n`;
      const contentBytes = encoder.encode(contentStream);

      offsets[pageObjNum] = pos;
      pushPart(encoder.encode(`${pageObjNum} 0 obj\n<<\n  /Type /Page\n  /Parent 2 0 R\n  /MediaBox [0 0 ${pageWidth} ${pageHeight}]\n  /Resources <<\n    /ProcSet [/PDF /ImageC]\n    /XObject << /Im${i + 1} ${imgObjNum} 0 R >>\n  >>\n  /Contents ${contentsObjNum} 0 R\n>>\nendobj\n`));

      offsets[imgObjNum] = pos;
      pushPart(encoder.encode(`${imgObjNum} 0 obj\n<<\n  /Type /XObject\n  /Subtype /Image\n  /Width ${page.imgWidth}\n  /Height ${page.imgHeight}\n  /ColorSpace /DeviceRGB\n  /BitsPerComponent 8\n  /Filter /DCTDecode\n  /Length ${page.jpegUint8.length}\n>>\nstream\n`));
      pushPart(page.jpegUint8);
      pushPart(encoder.encode("\nendstream\nendobj\n"));

      offsets[contentsObjNum] = pos;
      pushPart(encoder.encode(`${contentsObjNum} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}endstream\nendobj\n`));
    }

    const totalObjs = 3 + (numPages * 3);
    const startXref = pos;
    let xrefStr = `xref\n0 ${totalObjs}\n0000000000 65535 f \r\n`;
    for (let i = 1; i < totalObjs; i++) {
      xrefStr += String(offsets[i]).padStart(10, '0') + " 00000 n \r\n";
    }
    xrefStr += `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
    pushPart(encoder.encode(xrefStr));

    return new Blob(parts, { type: 'application/pdf' });
  }

  function createPdfBlobFromJpeg(jpegUint8, imgWidth, imgHeight, cssWidth, cssHeight, pageSize = 'a4') {
    return createMultiPagePdfBlob([{
      jpegUint8,
      imgWidth,
      imgHeight,
      cssWidth,
      cssHeight
    }], pageSize);
  }

  function canvasToJpegUint8(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Canvas image encoding failed'));
        blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(reject);
      }, 'image/jpeg', 0.95);
    });
  }

  function sliceCanvasToA4Pages(canvas) {
    const pageCanvasHeight = Math.floor(canvas.width * 1.45);

    if (rsState.tableSplitPageBreak && canvas.sectionSplitYs && canvas.sectionSplitYs.length > 0) {
      const cutPoints = [0, ...canvas.sectionSplitYs, canvas.height];
      const pages = [];
      let pChain = Promise.resolve();

      for (let p = 0; p < cutPoints.length - 1; p++) {
        const srcY = cutPoints[p];
        const srcH = cutPoints[p + 1] - srcY;
        if (srcH <= 0) continue;

        pChain = pChain.then(() => {
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = Math.max(pageCanvasHeight, srcH);
          const sCtx = sliceCanvas.getContext('2d');
          sCtx.fillStyle = '#ffffff';
          sCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

          sCtx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

          return canvasToJpegUint8(sliceCanvas).then(uint8 => {
            pages.push({
              jpegUint8: uint8,
              imgWidth: sliceCanvas.width,
              imgHeight: sliceCanvas.height,
              cssWidth: sliceCanvas.width / 2,
              cssHeight: sliceCanvas.height / 2
            });
          });
        });
      }
      return pChain.then(() => pages);
    }

    if (canvas.height <= pageCanvasHeight * 1.05) {
      return canvasToJpegUint8(canvas).then(uint8 => [{
        jpegUint8: uint8,
        imgWidth: canvas.width,
        imgHeight: canvas.height,
        cssWidth: canvas.width / 2,
        cssHeight: canvas.height / 2
      }]);
    }

    const numPages = Math.ceil(canvas.height / pageCanvasHeight);
    const pages = [];
    let pChain = Promise.resolve();

    for (let p = 0; p < numPages; p++) {
      const pageIdx = p;
      pChain = pChain.then(() => {
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = pageCanvasHeight;
        const sCtx = sliceCanvas.getContext('2d');
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

        const srcY = pageIdx * pageCanvasHeight;
        const srcH = Math.min(pageCanvasHeight, canvas.height - srcY);

        sCtx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

        return canvasToJpegUint8(sliceCanvas).then(uint8 => {
          pages.push({
            jpegUint8: uint8,
            imgWidth: sliceCanvas.width,
            imgHeight: sliceCanvas.height,
            cssWidth: sliceCanvas.width / 2,
            cssHeight: sliceCanvas.height / 2
          });
        });
      });
    }

    return pChain.then(() => pages);
  }

  function exportReportPdf() {
    const btn = document.getElementById('rsExportPdfBtn');
    if (btn) btn.disabled = true;
    if (typeof window.showToast === 'function') {
      window.showToast('Generating PDF document... ⏳');
    }

    return renderReportCardToCanvas()
      .then(canvas => {
        if (rsState.pdfLayout === 'card') {
          return canvasToJpegUint8(canvas).then(uint8 => [{
            jpegUint8: uint8,
            imgWidth: canvas.width,
            imgHeight: canvas.height,
            cssWidth: canvas.width / 2,
            cssHeight: canvas.height / 2
          }]);
        } else {
          return sliceCanvasToA4Pages(canvas);
        }
      })
      .then(pages => {
        const pageSize = rsState.pdfLayout === 'card' ? 'fit' : 'a4';
        const pdfBlob = createMultiPagePdfBlob(pages, pageSize);
        if (btn) btn.disabled = false;
        const filename = getExportFilename('pdf');
        if (typeof window.downloadBlob === 'function') {
          window.downloadBlob(pdfBlob, filename);
        }
        if (typeof window.showToast === 'function') {
          window.showToast(`PDF report downloaded (${pages.length} page${pages.length > 1 ? 's' : ''})! 📄`);
        }
      })
      .catch(err => {
        console.error('PDF export error:', err);
        if (btn) btn.disabled = false;
        if (typeof window.showAlertDialog === 'function') {
          window.showAlertDialog('Export Notice', 'Could not generate the PDF. Please try again.');
        }
      });
  }

  // --- DEDICATED PDF & PRINT DOCUMENT HTML BUILDER ---
  function buildPdfDocumentHtml() {
    const title = rsState.title || 'Report';
    const accent = rsState.cardAccent || '#e60023';

    let isLandscape = false;
    let numCols = 1;
    let tableHtml = '';

    if (rsState.mode === 'table') {
      const rawRows = parseTableData(rsState.tableRaw);
      if (rawRows.length > 0) {
        numCols = Math.max(...rawRows.map(r => r.length), 1);
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
        const zebraClass = rsState.tableZebra ? 'zebra' : '';
        const compactClass = rsState.tableCompact ? 'compact' : '';

        if (rsState.pdfOrientation === 'landscape') {
          isLandscape = true;
        } else if (rsState.pdfOrientation === 'portrait') {
          isLandscape = false;
        } else {
          isLandscape = (numCols >= 5);
        }

        function renderDocHeaderTr() {
          if (!rsState.tableHasHeader || rows.length === 0) return '';
          const headerRow = rows[0];
          let ths = '<thead><tr>';
          for (let c = 0; c < numCols; c++) {
            const text = headerRow[c] != null ? headerRow[c] : '';
            const isGroupCol = matrix.shouldMergeCol && matrix.shouldMergeCol[c];
            const align = rsState.tableAlign !== 'auto'
              ? rsState.tableAlign
              : (isNumCols[c] ? 'right' : (isGroupCol ? 'center' : 'left'));
            ths += `<th style="text-align: ${align};">${escapeXml(text)}</th>`;
          }
          ths += '</tr></thead>';
          return ths;
        }

        const bodyStartIdx = (rsState.tableHasHeader && rows.length > 0) ? 1 : 0;

        // Check if there are any section rows
        let hasSections = false;
        for (let r = bodyStartIdx; r < rows.length; r++) {
          if (matrix[r].isSection) {
            hasSections = true;
            break;
          }
        }

        if (rsState.tableSectionStyle === 'split' && hasSections) {
          // Split mode: partition rows into separate sub-tables with repeated column headers
          let currentSectionTitle = null;
          let currentRows = [];
          let sectionIndex = 0;

          function flushPdfSection() {
            if (currentRows.length === 0 && !currentSectionTitle) return;
            const isPageBreak = rsState.tableSplitPageBreak && sectionIndex > 0;
            const breakClass = isPageBreak ? ' rs-doc-page-break' : '';
            const breakInline = isPageBreak ? ' page-break-before: always !important; break-before: page !important; margin-top: 0 !important; padding-top: 0 !important;' : '';
            tableHtml += `<div class="rs-table-split-wrap${breakClass}" style="page-break-inside: auto; break-inside: auto; margin: ${isPageBreak ? '0' : '16px'} 0 10px 0;${breakInline}">`;
            if (currentSectionTitle) {
              tableHtml += `<div class="rs-table-split-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1.5px solid #e0e0d9; page-break-after: avoid; break-after: avoid;">
                <span class="rs-table-split-bar" style="width: 4px; height: 18px; border-radius: 2px; background-color: ${accent}; display: inline-block;"></span>
                <h4 class="rs-table-split-title" style="font-size: 15px; font-weight: 800; color: #211922; margin: 0;">${escapeXml(currentSectionTitle)}</h4>
              </div>`;
            }
            tableHtml += `<table class="rs-doc-table ${zebraClass} ${compactClass}">`;
            tableHtml += renderDocHeaderTr();

            let i = 0;
            while (i < currentRows.length) {
              const curR = currentRows[i];
              let groupSpan = 1;
              const cell0 = matrix[curR] && matrix[curR][0];
              if (rsState.tablePreserveMerges && cell0 && cell0.isMergeRoot && cell0.rowSpan > 1) {
                groupSpan = cell0.rowSpan;
              }

              const avoidBreakStyle = groupSpan <= 25 ? 'style="page-break-inside: avoid; break-inside: avoid;"' : '';
              tableHtml += `<tbody class="rs-doc-group" ${avoidBreakStyle}>`;

              for (let gr = 0; gr < groupSpan && (i + gr) < currentRows.length; gr++) {
                const rIdx = currentRows[i + gr];
                tableHtml += '<tr>';
                for (let c = 0; c < numCols; c++) {
                  const cell = matrix[rIdx][c];
                  if (cell.isMergedContinuation) {
                    if (groupSpan > 25 && c === 0) {
                      const rootCell = matrix[cell.parentRow][0];
                      tableHtml += `<td class="rs-doc-merged-cell" style="text-align: center; vertical-align: middle; opacity: 0.85;">${escapeXml(rootCell.text)}</td>`;
                    }
                    continue;
                  }

                  const isGroupCol = matrix.shouldMergeCol && matrix.shouldMergeCol[c];
                  const isGroupCell = cell.isGroupCol || isGroupCol || cell.isMergeRoot || (cell.rowSpan > 1);

                  const align = rsState.tableAlign !== 'auto'
                    ? rsState.tableAlign
                    : (isNumCols[c] ? 'right' : (isGroupCell ? 'center' : 'left'));

                  if (isGroupCell) {
                    const rSpan = (groupSpan > 25 && c === 0) ? 1 : cell.rowSpan;
                    tableHtml += `<td rowspan="${rSpan}" class="rs-doc-merged-cell" style="text-align: ${align}; vertical-align: middle;">${escapeXml(cell.text)}</td>`;
                  } else {
                    tableHtml += `<td style="text-align: ${align};">${escapeXml(cell.text)}</td>`;
                  }
                }
                tableHtml += '</tr>';
              }

              tableHtml += '</tbody>';
              i += groupSpan;
            }

            tableHtml += '</table></div>';
            currentRows = [];
            sectionIndex++;
          }

          for (let r = bodyStartIdx; r < rows.length; r++) {
            if (matrix[r].isSection) {
              flushPdfSection();
              currentSectionTitle = matrix[r].sectionTitle;
            } else {
              currentRows.push(r);
            }
          }
          flushPdfSection();
        } else {
          // Banner mode (Single table)
          tableHtml = `<table class="rs-doc-table ${zebraClass} ${compactClass}">`;
          tableHtml += renderDocHeaderTr();

          let r = bodyStartIdx;
          while (r < rows.length) {
            if (matrix[r].isSection) {
              tableHtml += `<tbody class="rs-doc-group" style="page-break-inside: avoid; break-inside: avoid;">
                <tr class="rs-table-section-row" style="background-color: #f6f6f3;">
                  <td colspan="${numCols}" style="padding: 10px 14px; border-top: 1.5px solid #e0e0d9; border-bottom: 1.5px solid #e0e0d9; text-align: left;">
                    <div class="rs-table-section-banner" style="display: flex; align-items: center; gap: 8px;">
                      <span class="rs-table-section-bar" style="width: 4px; height: 18px; border-radius: 2px; background-color: ${accent}; display: inline-block;"></span>
                      <strong class="rs-table-section-title" style="font-size: 14.5px; font-weight: 800; color: #211922;">${escapeXml(matrix[r].sectionTitle)}</strong>
                    </div>
                  </td>
                </tr>
              </tbody>`;
              r++;
              continue;
            }

            let groupSpan = 1;
            const cell0 = matrix[r] && matrix[r][0];
            if (rsState.tablePreserveMerges && cell0 && cell0.isMergeRoot && cell0.rowSpan > 1) {
              groupSpan = cell0.rowSpan;
            }

            const avoidBreakStyle = groupSpan <= 25 ? 'style="page-break-inside: avoid; break-inside: avoid;"' : '';
            tableHtml += `<tbody class="rs-doc-group" ${avoidBreakStyle}>`;

            for (let gr = 0; gr < groupSpan && (r + gr) < rows.length; gr++) {
              const curR = r + gr;
              tableHtml += '<tr>';
              for (let c = 0; c < numCols; c++) {
                const cell = matrix[curR][c];
                if (cell.isMergedContinuation) {
                  if (groupSpan > 25 && c === 0) {
                    const rootCell = matrix[cell.parentRow][0];
                    tableHtml += `<td class="rs-doc-merged-cell" style="text-align: center; vertical-align: middle; opacity: 0.85;">${escapeXml(rootCell.text)}</td>`;
                  }
                  continue;
                }

                const isGroupCol = matrix.shouldMergeCol && matrix.shouldMergeCol[c];
                const isGroupCell = cell.isGroupCol || isGroupCol || cell.isMergeRoot || (cell.rowSpan > 1);

                const align = rsState.tableAlign !== 'auto'
                  ? rsState.tableAlign
                  : (isNumCols[c] ? 'right' : (isGroupCell ? 'center' : 'left'));

                if (isGroupCell) {
                  const rSpan = (groupSpan > 25 && c === 0) ? 1 : cell.rowSpan;
                  tableHtml += `<td rowspan="${rSpan}" class="rs-doc-merged-cell" style="text-align: ${align}; vertical-align: middle;">${escapeXml(cell.text)}</td>`;
                } else {
                  tableHtml += `<td style="text-align: ${align};">${escapeXml(cell.text)}</td>`;
                }
              }
              tableHtml += '</tr>';
            }

            tableHtml += '</tbody>';
            r += groupSpan;
          }

          tableHtml += '</table>';
        }
      } else {
        tableHtml = '<p style="color: #64748b; font-style: italic;">No table data available.</p>';
      }
    } else {
      if (rsState.pdfOrientation === 'landscape') isLandscape = true;
      else if (rsState.pdfOrientation === 'portrait') isLandscape = false;
      else isLandscape = false;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeXml(title)}</title>
  <style>
    @page {
      size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
      margin: 12mm 15mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Completely eliminate any scrollbar in print & preview */
    * {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    ::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #211922 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      overflow: visible !important;
    }

    body {
      padding: 6px 10px;
    }

    .rs-doc-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      overflow: visible !important;
    }

    .rs-doc-topbar {
      height: 6px;
      background-color: ${accent};
      border-radius: 3px;
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .rs-doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 12px;
      border-bottom: 1.5px solid #e0e0d9;
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .rs-doc-title-block {
      flex: 1;
    }

    .rs-doc-title {
      font-size: 24px;
      font-weight: 800;
      color: #211922;
      line-height: 1.2;
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }

    .rs-doc-subtitle {
      font-size: 14px;
      font-weight: 500;
      color: #62625b;
      line-height: 1.45;
      margin: 0;
    }

    .rs-doc-date-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      background-color: #f6f6f3;
      border: 1px solid #e0e0d9;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      color: #33332e;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .rs-doc-prenote,
    .rs-doc-postnote {
      background-color: #fcfcfb;
      border: 1px solid #e5e5e0;
      border-left: 4px solid ${accent};
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12.5px;
      color: #33332e;
      line-height: 1.55;
      white-space: pre-line;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .rs-doc-prenote {
      margin-bottom: 14px;
    }

    .rs-doc-postnote {
      margin-top: 14px;
    }

    .rs-doc-content {
      width: 100%;
      overflow: visible !important;
    }

    /* Full-width document table */
    .rs-doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      line-height: 1.45;
      margin: 10px 0 16px 0;
      border: 1px solid #e0e0d9;
      overflow: visible !important;
    }

    .rs-doc-table thead {
      display: table-header-group;
    }

    .rs-doc-table th {
      background-color: #f6f6f3 !important;
      color: #211922 !important;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border: 1px solid #e0e0d9;
      border-bottom: 2.5px solid ${accent} !important;
      padding: 9px 12px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .rs-doc-table td {
      border: 1px solid #e0e0d9;
      padding: 8px 12px;
      color: #211922;
      vertical-align: middle;
    }

    .rs-doc-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .rs-doc-table.zebra tbody tr:nth-child(even) {
      background-color: #fafaf8 !important;
    }

    .rs-doc-table td.rs-doc-merged-cell {
      font-weight: 700;
      color: #211922;
      background-color: #ffffff !important;
      border: 1px solid #e0e0d9 !important;
      text-align: center;
      vertical-align: middle;
    }

    .rs-doc-table.compact th {
      padding: 6px 10px;
      font-size: 11px;
    }
    .rs-doc-table.compact td {
      padding: 5px 10px;
      font-size: 11.5px;
    }

    /* Section row and split table in PDF document */
    .rs-table-section-row td {
      background-color: #f6f6f3 !important;
      border-top: 1.5px solid #e0e0d9 !important;
      border-bottom: 1.5px solid #e0e0d9 !important;
      padding: 10px 14px !important;
    }

    .rs-table-section-banner {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rs-table-section-bar,
    .rs-table-split-bar {
      width: 4px;
      height: 18px;
      border-radius: 2px;
      display: inline-block;
      background-color: ${accent};
      flex-shrink: 0;
    }

    .rs-table-section-title,
    .rs-table-split-title {
      font-size: 14.5px;
      font-weight: 800;
      color: #211922;
      margin: 0;
    }

    .rs-table-split-wrap {
      margin: 16px 0 10px 0;
      page-break-inside: auto;
      break-inside: auto;
    }

    .rs-doc-page-break {
      page-break-before: always !important;
      break-before: page !important;
      margin-top: 0 !important;
      padding-top: 0 !important;
    }

    .rs-table-split-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #e0e0d9;
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Notes Mode */
    .rs-doc-notes {
      font-size: 14px;
      line-height: 1.7;
      color: #211922;
      overflow: visible !important;
    }
    .rs-doc-notes h1 { font-size: 20px; font-weight: 700; margin: 16px 0 8px; color: #211922; break-after: avoid; }
    .rs-doc-notes h2 { font-size: 17px; font-weight: 700; margin: 14px 0 6px; color: #211922; break-after: avoid; }
    .rs-doc-notes h3 { font-size: 15px; font-weight: 600; margin: 12px 0 4px; color: #211922; break-after: avoid; }
    .rs-doc-notes p { margin-bottom: 12px; }
    .rs-doc-notes ul, .rs-doc-notes ol { margin: 8px 0 12px 24px; }
    .rs-doc-notes li { margin-bottom: 4px; }
    .rs-doc-notes li::marker { color: ${accent}; font-weight: 700; }
    .rs-doc-notes img { max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #e0e0d9; }

    /* Footer Sign-off */
    .rs-doc-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1.5px solid #e0e0d9;
      font-size: 12px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .rs-doc-footer-left {
      flex: 1;
      white-space: pre-line;
      line-height: 1.55;
      color: #62625b;
    }

    .rs-doc-footer-right {
      flex: 1;
      white-space: pre-line;
      line-height: 1.55;
      text-align: right;
      font-weight: 600;
      color: #211922;
    }
  </style>
</head>
<body>
  <div class="rs-doc-container">
    <div class="rs-doc-topbar"></div>
    <header class="rs-doc-header">
      <div class="rs-doc-title-block">
        <h1 class="rs-doc-title">${escapeXml(title)}</h1>
        ${rsState.subtitle ? `<div class="rs-doc-subtitle">${escapeXml(rsState.subtitle)}</div>` : ''}
      </div>
      ${(rsState.includeDate && rsState.date) ? `<div class="rs-doc-date-badge">📆 ${escapeXml(formatDisplayDate(rsState.date))}</div>` : ''}
    </header>

    ${(rsState.includePreNote && rsState.preNote && rsState.preNote.trim()) ? `<div class="rs-doc-prenote">${escapeXml(rsState.preNote.trim())}</div>` : ''}

    <main class="rs-doc-content">
      ${rsState.mode === 'table' ? tableHtml : `<div class="rs-doc-notes">${rsState.notesHtml || '<p>No content entered.</p>'}</div>`}
    </main>

    ${(rsState.includePostNote && rsState.postNote && rsState.postNote.trim()) ? `<div class="rs-doc-postnote">${escapeXml(rsState.postNote.trim())}</div>` : ''}

    ${(rsState.includeFooter && (rsState.footerLeft || rsState.footerRight)) ? `
    <footer class="rs-doc-footer">
      <div class="rs-doc-footer-left">${escapeXml(rsState.footerLeft || '')}</div>
      <div class="rs-doc-footer-right">${escapeXml(rsState.footerRight || '')}</div>
    </footer>` : ''}
  </div>
</body>
</html>`;
  }

  function printReportCard() {
    if (typeof window.showToast === 'function') {
      window.showToast('Preparing print preview... 🖨️');
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;

    if (rsState.pdfLayout !== 'card') {
      // Formal Document Layout (Default)
      const docHtml = buildPdfDocumentHtml();
      frameDoc.open();
      frameDoc.write(docHtml);
      frameDoc.close();
    } else {
      // Card Preview Layout (with all scrollbars strictly removed)
      const card = document.getElementById('rsReportCard');
      if (!card) return;
      const title = rsState.title || 'Report';
      const cardClone = card.cloneNode(true);
      cardClone.style.transform = 'none';
      cardClone.style.margin = '0 auto';
      cardClone.style.boxShadow = 'none';
      cardClone.style.aspectRatio = 'auto';
      cardClone.style.maxHeight = 'none';
      cardClone.style.height = 'auto';

      const isLandscape = (rsState.pdfOrientation === 'landscape') ||
        (rsState.pdfOrientation === 'auto' && card.offsetWidth > 820);

      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <title>${window.escapeHtml ? window.escapeHtml(title) : title}</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    @page {
      size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
      margin: 10mm;
    }
    * {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
      box-shadow: none !important;
    }
    ::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    body {
      margin: 0;
      padding: 10px;
      background: #fff !important;
      display: flex;
      justify-content: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      overflow: visible !important;
    }
    .rs-report-card {
      box-shadow: none !important;
      transform: none !important;
      margin: 0 auto !important;
      max-width: 100% !important;
      height: auto !important;
      overflow: visible !important;
    }
    .rs-card-content-area {
      overflow: visible !important;
      max-height: none !important;
    }
    .rs-table-split-page-break .rs-table-split-wrap:not(:first-child) {
      page-break-before: always !important;
      break-before: page !important;
      margin-top: 0 !important;
    }
  </style>
</head>
<body>
  <div style="width: 100%; display: flex; justify-content: center; overflow: visible !important;">
    ${cardClone.outerHTML}
  </div>
</body>
</html>`);
      frameDoc.close();
    }

    printFrame.contentWindow.focus();
    setTimeout(() => {
      printFrame.contentWindow.print();
      setTimeout(() => {
        if (printFrame.parentNode) {
          printFrame.parentNode.removeChild(printFrame);
        }
      }, 3000);
    }, 400);
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
        if (group) group.style.display = rsState.tablePreserveMerges ? 'flex' : 'none';
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

    const tableSectionStyleSelect = document.getElementById('rsTableSectionStyleSelect');
    const tableSplitPageBreakGroup = document.getElementById('rsTableSplitPageBreakGroup');
    const tableSplitPageBreakToggle = document.getElementById('rsTableSplitPageBreakToggle');
    if (tableSectionStyleSelect) {
      tableSectionStyleSelect.addEventListener('change', (e) => {
        rsState.tableSectionStyle = e.target.value;
        if (tableSplitPageBreakGroup) {
          tableSplitPageBreakGroup.style.display = (rsState.tableSectionStyle === 'split') ? 'flex' : 'none';
        }
        updateReportPreview();
        saveReportStudioDraftDebounced();
      });
    }

    if (tableSplitPageBreakToggle) {
      tableSplitPageBreakToggle.addEventListener('change', (e) => {
        rsState.tableSplitPageBreak = e.target.checked;
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

    // PDF Settings Selects
    const pdfPageFormatSelect = document.getElementById('rsPdfPageFormatSelect');
    if (pdfPageFormatSelect) {
      pdfPageFormatSelect.addEventListener('change', (e) => {
        rsState.pdfPageFormat = e.target.value;
        saveReportStudioDraftDebounced();
      });
    }

    const pdfLayoutSelect = document.getElementById('rsPdfLayoutSelect');
    if (pdfLayoutSelect) {
      pdfLayoutSelect.addEventListener('change', (e) => {
        rsState.pdfLayout = e.target.value;
        saveReportStudioDraftDebounced();
      });
    }

    const pdfOrientationSelect = document.getElementById('rsPdfOrientationSelect');
    if (pdfOrientationSelect) {
      pdfOrientationSelect.addEventListener('change', (e) => {
        rsState.pdfOrientation = e.target.value;
        saveReportStudioDraftDebounced();
      });
    }

    // Export Buttons
    const exportPngBtn = document.getElementById('rsExportPngBtn');
    if (exportPngBtn) {
      exportPngBtn.addEventListener('click', () => exportReportImage('image/png'));
    }

    const exportPdfBtn = document.getElementById('rsExportPdfBtn');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', exportReportPdf);
    }

    const exportJpgBtn = document.getElementById('rsExportJpgBtn');
    if (exportJpgBtn) {
      exportJpgBtn.addEventListener('click', () => exportReportImage('image/jpeg'));
    }

    const printPdfBtn = document.getElementById('rsPrintPdfBtn');
    if (printPdfBtn) {
      printPdfBtn.addEventListener('click', printReportCard);
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
  window.exportReportPdf = exportReportPdf;
  window.printReportCard = printReportCard;
  window.buildPdfDocumentHtml = buildPdfDocumentHtml;
  window.renderReportCardToCanvas = renderReportCardToCanvas;
  window.generateCardImageBlob = generateCardImageBlob;

})(window);
