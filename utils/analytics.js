const { dateString, monthString } = require('./format');

function userFinance(state, userId) { return state.financeRecords.filter(item => item.userId === userId); }
function userStudy(state, userId) { return state.studyRecords.filter(item => item.userId === userId); }

function financeSummary(records, month = monthString()) {
  const selected = records.filter(item => item.date.indexOf(month) === 0);
  const income = selected.filter(item => item.type === 'income').reduce((total, item) => total + Number(item.amount), 0);
  const expense = selected.filter(item => item.type === 'expense').reduce((total, item) => total + Number(item.amount), 0);
  return { income, expense, balance: income - expense, count: selected.length, records: selected };
}

function groupByCategory(records, categories, type) {
  const map = {};
  records.filter(item => !type || item.type === type).forEach(item => {
    const category = categories.find(cat => cat.id === item.categoryId || cat.id === item.subjectId);
    const key = item.categoryId || item.subjectId;
    if (!map[key]) map[key] = { name: category ? category.name : '未分类', color: category ? category.color : '#ADB5BD', value: 0 };
    map[key].value += Number(item.amount || item.minutes || 0);
  });
  return Object.keys(map).map(key => map[key]).sort((a, b) => b.value - a.value);
}

function studySummary(records, categories, month = monthString()) {
  const selected = records.filter(item => item.date.indexOf(month) === 0);
  const minutes = selected.reduce((total, item) => total + Number(item.minutes), 0);
  const subjects = categories.filter(item => item.scope === 'study');
  const bySubject = groupByCategory(selected, categories);
  const targets = subjects.reduce((total, item) => total + Number(item.targetMinutes || 0), 0);
  return { minutes, count: selected.length, bySubject, target: targets, rate: targets ? Math.min(100, Math.round(minutes / targets * 100)) : 0 };
}

function consecutiveDays(records) {
  const dates = new Set(records.map(item => item.date));
  let count = 0;
  const cursor = new Date(`${dateString()}T00:00:00`);
  while (dates.has(dateString(cursor))) { count += 1; cursor.setDate(cursor.getDate() - 1); }
  return count;
}

function dailyStudy(records, days = 7) {
  const result = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(); date.setDate(date.getDate() - index);
    const day = dateString(date);
    result.push({ date: day, label: `${date.getMonth() + 1}/${date.getDate()}`, value: records.filter(item => item.date === day).reduce((sum, item) => sum + Number(item.minutes), 0) });
  }
  return result;
}

function monthlyExpense(records, months = 6) {
  const result = [];
  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(); date.setMonth(date.getMonth() - index);
    const month = monthString(date);
    result.push({ month, label: `${date.getMonth() + 1}月`, value: records.filter(item => item.type === 'expense' && item.date.indexOf(month) === 0).reduce((sum, item) => sum + Number(item.amount), 0) });
  }
  return result;
}

module.exports = { userFinance, userStudy, financeSummary, studySummary, groupByCategory, consecutiveDays, dailyStudy, monthlyExpense };
