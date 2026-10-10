const store = require('../../utils/storage');
const analytics = require('../../utils/analytics');
const { money, minutesText } = require('../../utils/format');

Page({
  data: { user: {}, finance: {}, study: {}, streak: 0, recentFinance: [], recentStudy: [], progress: [] },
  onShow() { this.loadData(); },
  onPullDownRefresh() { this.loadData(); wx.stopPullDownRefresh(); },
  loadData() {
    const state = store.getState(); const user = store.currentUser(state);
    const records = analytics.userFinance(state, user.id); const studyRecords = analytics.userStudy(state, user.id);
    const finance = analytics.financeSummary(records); const study = analytics.studySummary(studyRecords, state.categories);
    const subjects = state.categories.filter(item => item.scope === 'study');
    const progress = subjects.map(subject => {
      const spent = studyRecords.filter(item => item.subjectId === subject.id).reduce((sum, item) => sum + Number(item.minutes), 0);
      const target = Number(subject.targetMinutes || 0);
      return { ...subject, spent, label: minutesText(spent), rate: target ? Math.min(100, Math.round(spent / target * 100)) : 0 };
    });
    this.setData({
      user, finance: { ...finance, incomeText: money(finance.income), expenseText: money(finance.expense), balanceText: money(finance.balance) },
      study: { ...study, minutesText: minutesText(study.minutes) }, streak: analytics.consecutiveDays(studyRecords),
      recentFinance: records.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map(item => ({ ...item, amountText: money(item.amount), category: store.categoryById(item.categoryId, state) || {} })),
      recentStudy: studyRecords.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2).map(item => ({ ...item, minutesText: minutesText(item.minutes), subject: store.categoryById(item.subjectId, state) || {} })),
      progress: progress.slice(0, 3)
    });
  },
  go(event) { wx.navigateTo({ url: event.currentTarget.dataset.url }); },
  goTab(event) { wx.switchTab({ url: event.currentTarget.dataset.url }); }
});
