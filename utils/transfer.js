// 文件传输工具：JSON 适合完整备份；CSV 和 SpreadsheetML(.xls) 可由 Excel 直接打开。
function escapeCsv(value) {
  const text = String(value == null ? '' : value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows) {
  return rows.map(row => row.map(escapeCsv).join(',')).join('\n');
}

function xmlEscape(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stateToCsv(state) {
  const categoryName = id => (state.categories.find(item => item.id === id) || {}).name || '未分类';
  const rows = [['模块', '编号', '用户', '类型/科目', '分类', '数值', '日期', '备注', '状态']];
  const userName = id => (state.users.find(item => item.id === id) || {}).name || id;
  state.financeRecords.forEach(item => rows.push(['收支', item.id, userName(item.userId), item.type === 'income' ? '收入' : '消费', categoryName(item.categoryId), item.amount, item.date, item.note, '']));
  state.studyRecords.forEach(item => rows.push(['学习', item.id, userName(item.userId), categoryName(item.subjectId), categoryName(item.subjectId), item.minutes, item.date, item.note, item.mood]));
  return '\ufeff' + toCsv(rows);
}

function stateToExcelXml(state) {
  const csv = stateToCsv(state).replace(/^\ufeff/, '');
  const parsedRows = parseCsv(csv);
  const rows = parsedRows.map((row, rowIndex) => {
    const cells = row.map(cell => `<Cell><Data ss:Type="String">${xmlEscape(cell)}</Data></Cell>`).join('');
    return `<Row>${cells}</Row>`;
  }).join('');
  // Excel 2003 SpreadsheetML 的完整声明可避免 Excel 将 XML 误判为损坏文件。
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40"><DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Author>校园账学簿</Author><LastAuthor>校园账学簿</LastAuthor><Created>${new Date().toISOString()}</Created><Version>16.00</Version></DocumentProperties><ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel"><ProtectStructure>False</ProtectStructure><ProtectWindows>False</ProtectWindows></ExcelWorkbook><Styles><Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Microsoft YaHei" ss:Size="10"/></Style><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#4263EB" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style></Styles><Worksheet ss:Name="校园账学簿"><Table ss:ExpandedColumnCount="9" ss:ExpandedRowCount="${parsedRows.length}" x:FullColumns="1" x:FullRows="1">${rows}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><Selected/><ProtectObjects>False</ProtectObjects><ProtectScenarios>False</ProtectScenarios><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions></Worksheet></Workbook>`;
}

function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]; const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell); if (row.some(value => value !== '')) rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  row.push(cell); if (row.some(value => value !== '')) rows.push(row);
  return rows;
}

function decodeXml(value) { return value.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&'); }
function parseExcelXml(text) {
  const rows = []; const matches = text.match(/<Row[^>]*>[\s\S]*?<\/Row>/g) || [];
  matches.forEach(rowText => {
    const row = []; const cells = rowText.match(/<Data[^>]*>[\s\S]*?<\/Data>/g) || [];
    cells.forEach(cell => row.push(decodeXml(cell.replace(/<[^>]+>/g, ''))));
    if (row.length) rows.push(row);
  });
  return rows;
}

function rowsToPayload(rows, currentState) {
  if (!rows.length) throw new Error('文件中没有可导入的数据');
  const first = rows[0][0];
  if (first === '模块') rows.shift();
  const state = { users: currentState.users, categories: currentState.categories, financeRecords: [], studyRecords: [], currentUserId: currentState.currentUserId };
  const userId = name => (state.users.find(item => item.name === name) || state.users[0]).id;
  const catId = (name, scope, type) => {
    let category = state.categories.find(item => item.name === name && item.scope === scope && (!type || item.type === type));
    if (!category) { category = { id: `import_cat_${Date.now()}_${state.categories.length}`, scope, name, type: type || undefined, icon: scope === 'study' ? '📖' : '📦', color: '#748FFC', targetMinutes: scope === 'study' ? 600 : undefined }; state.categories.push(category); }
    return category.id;
  };
  rows.forEach((row, index) => {
    const [module, , user, kind, category, value, date, note, mood] = row;
    if (module === '收支') {
      const type = kind === '收入' ? 'income' : 'expense';
      if (Number(value) > 0 && date) state.financeRecords.push({ id: `import_f_${Date.now()}_${index}`, userId: userId(user), type, categoryId: catId(category, 'finance', type), amount: Number(value), date, note: note || '' });
    } else if (module === '学习') {
      if (Number(value) > 0 && date) state.studyRecords.push({ id: `import_st_${Date.now()}_${index}`, userId: userId(user), subjectId: catId(category || kind, 'study'), minutes: Number(value), date, note: note || '', mood: mood || '平稳' });
    }
  });
  return state;
}

function openExport(filename, data) {
  const fs = wx.getFileSystemManager();
  const path = `${wx.env.USER_DATA_PATH}/${filename}`;
  const extension = (filename.split('.').pop() || '').toLowerCase();
  return new Promise((resolve, reject) => {
    fs.writeFile({ filePath: path, data, encoding: 'utf8', success: () => {
      // xls 可直接预览；JSON/CSV 由系统文档组件处理，失败时继续尝试发送文件。
      wx.openDocument({ filePath: path, fileType: extension === 'xls' ? 'xls' : extension, showMenu: true, success: () => resolve({ path, filename, opened: true }), fail: openError => {
        if (typeof wx.shareFileMessage === 'function') {
          wx.shareFileMessage({ filePath: path, fileName: filename, success: () => resolve({ path, filename, shared: true }), fail: () => resolve({ path, filename, opened: false, openError }) });
        } else resolve({ path, filename, opened: false, openError });
      }});
    }, fail: reject });
  });
}

function chooseAndRead() {
  return new Promise((resolve, reject) => {
    wx.chooseMessageFile({ count: 1, type: 'file', extension: ['json', 'csv', 'xls'], success: result => {
      const file = result.tempFiles[0];
      wx.getFileSystemManager().readFile({ filePath: file.path, encoding: 'utf8', success: data => resolve({ name: file.name, text: data.data }), fail: reject });
    }, fail: reject });
  });
}

function parseImport(name, text, currentState) {
  if (/\.json$/i.test(name)) {
    const parsed = JSON.parse(text.replace(/^\ufeff/, ''));
    if (!parsed || (!Array.isArray(parsed.financeRecords) && !Array.isArray(parsed.studyRecords))) throw new Error('JSON 不是校园账学簿备份文件');
    return parsed;
  }
  const rows = /\.xls$/i.test(name) ? parseExcelXml(text) : parseCsv(text.replace(/^\ufeff/, ''));
  return rowsToPayload(rows, currentState);
}

module.exports = { stateToCsv, stateToExcelXml, openExport, chooseAndRead, parseImport, parseCsv };
