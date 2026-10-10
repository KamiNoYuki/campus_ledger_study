const store = require('../../utils/storage');
const analytics = require('../../utils/analytics');
const { monthString, minutesText } = require('../../utils/format');

Page({
  data: { month: monthString(), summary: {}, streak: 0, subjects: [], records: [] },
  onShow() { this.loadData(); },
  loadData() {
    const state = store.getState(); const user = store.currentUser(state); const records = analytics.userStudy(state, user.id); const summary = analytics.studySummary(records, state.categories, this.data.month);
    const subjects = state.categories.filter(item => item.scope === 'study').map(subject => {
      const minutes = records.filter(item => item.subjectId === subject.id && item.date.indexOf(this.data.month) === 0).reduce((sum, item) => sum + Number(item.minutes), 0);
      const target = Number(subject.targetMinutes || 0); return { ...subject, minutes, minutesText: minutesText(minutes), rate: target ? Math.min(100, Math.round(minutes / target * 100)) : 0 };
    });
    this.setData({
      summary: { ...summary, minutesText: minutesText(summary.minutes) }, streak: analytics.consecutiveDays(records), subjects,
      records: records.filter(item => item.date.indexOf(this.data.month) === 0).sort((a, b) => b.date.localeCompare(a.date)).map(item => ({ ...item, minutesText: minutesText(item.minutes), subject: store.categoryById(item.subjectId, state) || {} }))
    });
  },
  chooseMonth(event) { this.setData({ month: event.detail.value }); this.loadData(); },
  add() { wx.navigateTo({ url: '/pages/study-form/index' }); },
  edit(event) { wx.navigateTo({ url: `/pages/study-form/index?id=${event.currentTarget.dataset.id}` }); },
  remove(event) { const id = event.currentTarget.dataset.id; wx.showModal({ title: '删除打卡', content: '删除后无法恢复，是否继续？', success: result => { if (result.confirm) { store.deleteStudy(id); this.loadData(); wx.showToast({ title: '已删除', icon: 'success' }); } } }); },
  goCategory() { wx.navigateTo({ url: '/pages/categories/index?scope=study' }); }
});
