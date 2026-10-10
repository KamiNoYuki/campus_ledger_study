const store = require('../../utils/storage');

const iconOptions = ['🍜', '🚌', '📚', '🧴', '🏆', '💼', '🎮', '🏠', '∑', 'A', '</>', '📖', '🔬', '🎨'];
const colorOptions = ['#4263EB', '#12B886', '#F59F00', '#E85952', '#9775FA', '#15AABF'];

Page({
  data: { scope: 'finance', title: '收支分类管理', tabs: [{ id: 'expense', name: '消费' }, { id: 'income', name: '收入' }], filterType: 'expense', list: [], showForm: false, isEdit: false, form: { id: '', name: '', type: 'expense', icon: '📦', color: '#4263EB', targetMinutes: '600' }, icons: iconOptions, colors: colorOptions },
  onLoad(query) {
    const scope = query.scope === 'study' ? 'study' : 'finance';
    this.setData({ scope, title: scope === 'study' ? '学习科目管理' : '收支分类管理' }); wx.setNavigationBarTitle({ title: scope === 'study' ? '学习科目管理' : '收支分类管理' }); this.loadData();
  },
  loadData() { const state = store.getState(); const list = state.categories.filter(item => item.scope === this.data.scope && (this.data.scope === 'study' || item.type === this.data.filterType)); this.setData({ list }); },
  switchType(event) { this.setData({ filterType: event.currentTarget.dataset.type }); this.loadData(); },
  add() { this.setData({ showForm: true, isEdit: false, form: { id: '', name: '', type: this.data.filterType, icon: this.data.scope === 'study' ? '📖' : '📦', color: '#4263EB', targetMinutes: '600' } }); },
  edit(event) { const item = store.getState().categories.find(category => category.id === event.currentTarget.dataset.id); if (item) this.setData({ showForm: true, isEdit: true, form: { ...item, targetMinutes: String(item.targetMinutes || 600) } }); },
  close() { this.setData({ showForm: false }); },
  input(event) { this.setData({ [`form.${event.currentTarget.dataset.key}`]: event.detail.value }); },
  chooseIcon(event) { this.setData({ 'form.icon': event.currentTarget.dataset.icon }); },
  chooseColor(event) { this.setData({ 'form.color': event.currentTarget.dataset.color }); },
  save() {
    const form = this.data.form; if (!form.name.trim()) { wx.showToast({ title: '请输入分类名称', icon: 'none' }); return; }
    store.saveCategory({ ...form, name: form.name.trim(), scope: this.data.scope, type: this.data.scope === 'finance' ? form.type : undefined, targetMinutes: this.data.scope === 'study' ? Math.max(0, Number(form.targetMinutes || 0)) : undefined });
    this.close(); this.loadData(); wx.showToast({ title: '已保存', icon: 'success' });
  },
  remove(event) {
    const item = store.getState().categories.find(category => category.id === event.currentTarget.dataset.id); if (!item) return; wx.showModal({ title: '删除分类', content: `确定删除“${item.name}”？`, success: result => { if (result.confirm) { const outcome = store.deleteCategory(item.id); if (outcome.ok) { this.loadData(); wx.showToast({ title: '已删除', icon: 'success' }); } else wx.showToast({ title: outcome.message, icon: 'none' }); } } });
  }
});
