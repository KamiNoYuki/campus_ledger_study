const store = require('../../utils/storage');
const analytics = require('../../utils/analytics');
const { minutesText } = require('../../utils/format');

Page({
  data: { user: {}, users: [], financeCount: 0, studyMinutes: '', streak: 0, showAdd: false, newName: '', roleIndex: 0, roles: ['学生', '同学', '辅导员', '家长'] },
  onShow() { this.loadData(); },
  loadData() {
    const state = store.getState(); const user = store.currentUser(state); const study = analytics.userStudy(state, user.id);
    this.setData({ user, users: state.users, financeCount: analytics.userFinance(state, user.id).length, studyMinutes: minutesText(study.reduce((sum, item) => sum + Number(item.minutes), 0)), streak: analytics.consecutiveDays(study) });
  },
  switchUser(event) { store.switchUser(event.currentTarget.dataset.id); this.loadData(); wx.showToast({ title: '已切换视角', icon: 'success' }); },
  openAdd() { this.setData({ showAdd: true, newName: '', roleIndex: 0 }); }, closeAdd() { this.setData({ showAdd: false }); },
  nameInput(event) { this.setData({ newName: event.detail.value }); }, roleChange(event) { this.setData({ roleIndex: Number(event.detail.value) }); },
  addUser() { const name = this.data.newName.trim(); if (!name) { wx.showToast({ title: '请输入姓名', icon: 'none' }); return; } const user = store.addUser({ name, role: this.data.roles[this.data.roleIndex] }); store.switchUser(user.id); this.closeAdd(); this.loadData(); wx.showToast({ title: '角色已创建', icon: 'success' }); },
  go(event) { wx.navigateTo({ url: event.currentTarget.dataset.url }); }
});
