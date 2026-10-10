const store = require('../../utils/storage');
const analytics = require('../../utils/analytics');
const { monthString, money } = require('../../utils/format');

Page({
  data: { month: monthString(), type: 'all', summary: {}, records: [], typeTabs: [{ id: 'all', name: '全部' }, { id: 'expense', name: '消费' }, { id: 'income', name: '收入' }] },
  onShow() { this.loadData(); },
  loadData() {
    const state = store.getState(); const user = store.currentUser(state); const records = analytics.userFinance(state, user.id);
    const summary = analytics.financeSummary(records, this.data.month);
    const list = records.filter(item => item.date.indexOf(this.data.month) === 0 && (this.data.type === 'all' || item.type === this.data.type)).sort((a, b) => b.date.localeCompare(a.date)).map(item => ({ ...item, amountText: money(item.amount), category: store.categoryById(item.categoryId, state) || { name: '未分类', icon: '📦' } }));
    this.setData({ summary: { ...summary, incomeText: money(summary.income), expenseText: money(summary.expense), balanceText: money(summary.balance) }, records: list });
  },
  chooseMonth(event) { this.setData({ month: event.detail.value }); this.loadData(); },
  chooseType(event) { this.setData({ type: event.currentTarget.dataset.type }); this.loadData(); },
  add() { wx.navigateTo({ url: '/pages/finance-form/index' }); },
  edit(event) { wx.navigateTo({ url: `/pages/finance-form/index?id=${event.currentTarget.dataset.id}` }); },
  remove(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({ title: '删除记录', content: '删除后无法恢复，是否继续？', success: result => { if (result.confirm) { store.deleteFinance(id); this.loadData(); wx.showToast({ title: '已删除', icon: 'success' }); } } });
  },
  goCategory() { wx.navigateTo({ url: '/pages/categories/index?scope=finance' }); }
});
