const { dateString } = require('./format');

const STORAGE_KEY = 'campus_ledger_study_v1';
const clone = value => JSON.parse(JSON.stringify(value));
const makeId = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return dateString(date);
}

function monthsAgo(months, day) {
  const date = new Date();
  // 先定位到当月 1 号，再回退月份，避免 29/30/31 号跨月溢出。
  date.setDate(1);
  date.setMonth(date.getMonth() - months);
  // 当前月份不生成未来日期，演示数据在任意打开日期下都显得合理。
  date.setDate(months === 0 ? Math.min(day, new Date().getDate()) : day);
  return dateString(date);
}

function trendExpenses() {
  const amounts = [[32, 15], [68, 22], [47, 31], [86, 18], [59, 36], [74, 28]];
  const categoryIds = [['c_food', 'c_transport'], ['c_food', 'c_books'], ['c_life', 'c_food'], ['c_books', 'c_transport'], ['c_food', 'c_life'], ['c_books', 'c_food']];
  const notes = ['早餐', '公交', '打印资料', '宿舍用品', '晚餐', '课程资料'];
  const records = [];
  amounts.forEach((pair, monthIndex) => pair.forEach((amount, itemIndex) => records.push({
    id: `trend_${monthIndex + 1}_${itemIndex + 1}`,
    userId: 'u_student', type: 'expense', amount, categoryId: categoryIds[monthIndex][itemIndex],
    date: monthsAgo(5 - monthIndex, itemIndex ? 16 : 6), note: notes[(monthIndex + itemIndex) % notes.length]
  })));
  return records;
}

function createSeed() {
  return {
    version: 1,
    currentUserId: 'u_student',
    users: [
      { id: 'u_student', name: '林知夏', role: '学生', avatar: '林', color: '#4263EB' },
      { id: 'u_peer', name: '陈一鸣', role: '同学', avatar: '陈', color: '#12B886' },
      { id: 'u_adviser', name: '王老师', role: '辅导员', avatar: '王', color: '#F59F00' }
    ],
    categories: [
      { id: 'c_food', scope: 'finance', type: 'expense', name: '餐饮', icon: '🍜', color: '#FF922B' },
      { id: 'c_transport', scope: 'finance', type: 'expense', name: '交通', icon: '🚌', color: '#748FFC' },
      { id: 'c_books', scope: 'finance', type: 'expense', name: '学习用品', icon: '📚', color: '#9775FA' },
      { id: 'c_life', scope: 'finance', type: 'expense', name: '生活日用', icon: '🧴', color: '#F06595' },
      { id: 'c_grant', scope: 'finance', type: 'income', name: '奖助学金', icon: '🏆', color: '#20C997' },
      { id: 'c_parttime', scope: 'finance', type: 'income', name: '兼职', icon: '💼', color: '#15AABF' },
      { id: 's_math', scope: 'study', name: '高等数学', icon: '∑', color: '#4263EB', targetMinutes: 900 },
      { id: 's_english', scope: 'study', name: '英语', icon: 'A', color: '#12B886', targetMinutes: 720 },
      { id: 's_program', scope: 'study', name: '程序设计', icon: '</>', color: '#F59F00', targetMinutes: 1080 }
    ],
    financeRecords: [
      { id: 'f_1', userId: 'u_student', type: 'expense', amount: 18.5, categoryId: 'c_food', date: daysAgo(0), note: '午餐' },
      { id: 'f_2', userId: 'u_student', type: 'expense', amount: 7, categoryId: 'c_transport', date: daysAgo(1), note: '地铁' },
      { id: 'f_3', userId: 'u_student', type: 'expense', amount: 42.8, categoryId: 'c_books', date: daysAgo(3), note: '笔记本和资料' },
      { id: 'f_4', userId: 'u_student', type: 'income', amount: 300, categoryId: 'c_parttime', date: daysAgo(5), note: '助教兼职' },
      { id: 'f_5', userId: 'u_peer', type: 'expense', amount: 26, categoryId: 'c_food', date: daysAgo(1), note: '晚餐' },
      ...trendExpenses()
    ],
    studyRecords: [
      { id: 'st_1', userId: 'u_student', subjectId: 's_math', minutes: 85, date: daysAgo(0), note: '极限与连续', mood: '充实' },
      { id: 'st_2', userId: 'u_student', subjectId: 's_english', minutes: 40, date: daysAgo(1), note: '听力练习', mood: '平稳' },
      { id: 'st_3', userId: 'u_student', subjectId: 's_program', minutes: 120, date: daysAgo(2), note: '链表作业', mood: '专注' },
      { id: 'st_4', userId: 'u_student', subjectId: 's_math', minutes: 60, date: daysAgo(3), note: '习题课复盘', mood: '充实' },
      { id: 'st_5', userId: 'u_student', subjectId: 's_english', minutes: 30, date: daysAgo(4), note: '背单词', mood: '轻松' },
      { id: 'st_6', userId: 'u_peer', subjectId: 's_program', minutes: 90, date: daysAgo(0), note: '算法学习', mood: '专注' }
    ]
  };
}

function normalize(state) {
  const seed = createSeed();
  if (!state || typeof state !== 'object') return seed;
  return {
    ...seed,
    ...state,
    users: Array.isArray(state.users) && state.users.length ? state.users : seed.users,
    categories: Array.isArray(state.categories) ? state.categories : seed.categories,
    financeRecords: Array.isArray(state.financeRecords) ? state.financeRecords : [],
    studyRecords: Array.isArray(state.studyRecords) ? state.studyRecords : []
  };
}

function initialize() {
  const state = wx.getStorageSync(STORAGE_KEY);
  if (!state) wx.setStorageSync(STORAGE_KEY, createSeed());
  else wx.setStorageSync(STORAGE_KEY, normalize(state));
}

function getState() { return clone(normalize(wx.getStorageSync(STORAGE_KEY))); }
function saveState(state) { wx.setStorageSync(STORAGE_KEY, normalize(state)); return getState(); }
function currentUser(state = getState()) { return state.users.find(item => item.id === state.currentUserId) || state.users[0]; }
function categoryById(id, state = getState()) { return state.categories.find(item => item.id === id); }

function addRecord(collection, record) {
  const state = getState();
  const item = { ...record, id: makeId(collection === 'financeRecords' ? 'f' : 'st'), userId: currentUser(state).id };
  state[collection].unshift(item);
  saveState(state);
  return item;
}

function updateRecord(collection, id, patch) {
  const state = getState();
  const index = state[collection].findIndex(item => item.id === id);
  if (index < 0) return null;
  state[collection][index] = { ...state[collection][index], ...patch, id };
  saveState(state);
  return state[collection][index];
}

function deleteRecord(collection, id) {
  const state = getState();
  state[collection] = state[collection].filter(item => item.id !== id);
  saveState(state);
}

function saveCategory(category) {
  const state = getState();
  if (category.id) {
    const index = state.categories.findIndex(item => item.id === category.id);
    if (index > -1) state.categories[index] = { ...state.categories[index], ...category };
  } else state.categories.push({ ...category, id: makeId('cat') });
  saveState(state);
}

function deleteCategory(id) {
  const state = getState();
  const inUse = state.financeRecords.some(item => item.categoryId === id) || state.studyRecords.some(item => item.subjectId === id);
  if (inUse) return { ok: false, message: '该分类已有记录，无法删除' };
  state.categories = state.categories.filter(item => item.id !== id);
  saveState(state);
  return { ok: true };
}

function switchUser(id) { const state = getState(); state.currentUserId = id; saveState(state); }

function addUser(user) {
  const state = getState();
  const item = { id: makeId('u'), avatar: String(user.name || '新').slice(0, 1), color: '#4263EB', ...user };
  state.users.push(item); saveState(state); return item;
}

function importState(payload, mode = 'merge') {
  const current = getState();
  const incoming = normalize(payload);
  const state = mode === 'replace' ? incoming : current;
  if (mode === 'merge') {
    ['categories', 'financeRecords', 'studyRecords'].forEach(key => {
      const known = new Set(state[key].map(item => item.id));
      incoming[key].forEach(item => { if (!known.has(item.id)) state[key].push(item); });
    });
    incoming.users.forEach(user => { if (!state.users.some(item => item.id === user.id)) state.users.push(user); });
  }
  if (!state.users.some(item => item.id === state.currentUserId)) state.currentUserId = state.users[0].id;
  saveState(state);
}

function reset() { wx.setStorageSync(STORAGE_KEY, createSeed()); }

module.exports = {
  STORAGE_KEY, initialize, getState, saveState, currentUser, categoryById,
  addFinance: record => addRecord('financeRecords', record),
  updateFinance: (id, patch) => updateRecord('financeRecords', id, patch),
  deleteFinance: id => deleteRecord('financeRecords', id),
  addStudy: record => addRecord('studyRecords', record),
  updateStudy: (id, patch) => updateRecord('studyRecords', id, patch),
  deleteStudy: id => deleteRecord('studyRecords', id),
  saveCategory, deleteCategory, switchUser, addUser, importState, reset
};
