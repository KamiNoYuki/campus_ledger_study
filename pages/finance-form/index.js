const store = require('../../utils/storage');
const { dateString } = require('../../utils/format');

Page({
  data: { id: '', isEdit: false, types: ['消费', '收入'], typeIndex: 0, categories: [], categoryIndex: 0, form: { amount: '', date: dateString(), note: '' } },
  onLoad(query) {
    const state = store.getState(); const record = query.id && state.financeRecords.find(item => item.id === query.id); const type = record ? record.type : (query.type || 'expense');
    this.setData({ id: record ? record.id : '', isEdit: !!record, typeIndex: type === 'income' ? 1 : 0, form: { amount: record ? String(record.amount) : '', date: record ? record.date : dateString(), note: record ? record.note : '' } });
    this.loadCategories(record ? record.categoryId : '');
    wx.setNavigationBarTitle({ title: record ? '编辑收支记录' : '新增收支记录' });
  },
  loadCategories(selectedId) {
    const type = this.data.typeIndex === 1 ? 'income' : 'expense'; const categories = store.getState().categories.filter(item => item.scope === 'finance' && item.type === type);
    const found = categories.findIndex(item => item.id === selectedId);
    this.setData({ categories, categoryIndex: found > -1 ? found : 0 });
  },
  typeChange(event) { this.setData({ typeIndex: Number(event.currentTarget.dataset.index) }); this.loadCategories(''); },
  categoryChange(event) { this.setData({ categoryIndex: Number(event.detail.value) }); },
  input(event) { const key = event.currentTarget.dataset.key; this.setData({ [`form.${key}`]: event.detail.value }); },
  dateChange(event) { this.setData({ 'form.date': event.detail.value }); },
  submit() {
    const form = this.data.form; const amount = Number(form.amount); const category = this.data.categories[this.data.categoryIndex];
    if (!amount || amount <= 0 || !category) { wx.showToast({ title: '请填写金额和分类', icon: 'none' }); return; }
    const payload = { type: this.data.typeIndex === 1 ? 'income' : 'expense', amount, categoryId: category.id, date: form.date, note: form.note.trim() };
    if (this.data.isEdit) store.updateFinance(this.data.id, payload); else store.addFinance(payload);
    wx.showToast({ title: this.data.isEdit ? '已保存' : '记录成功', icon: 'success' }); setTimeout(() => wx.navigateBack(), 500);
  }
});
