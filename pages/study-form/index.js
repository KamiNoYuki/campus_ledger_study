const store = require('../../utils/storage');
const { dateString } = require('../../utils/format');

Page({
  data: { id: '', isEdit: false, subjects: [], subjectIndex: 0, moods: ['专注', '充实', '平稳', '轻松'], moodIndex: 0, form: { minutes: '', date: dateString(), note: '' } },
  onLoad(query) {
    const state = store.getState(); const record = query.id && state.studyRecords.find(item => item.id === query.id); const subjects = state.categories.filter(item => item.scope === 'study');
    const subjectIndex = Math.max(0, subjects.findIndex(item => item.id === (record && record.subjectId))); const moodIndex = Math.max(0, this.data.moods.indexOf(record && record.mood));
    this.setData({ id: record ? record.id : '', isEdit: !!record, subjects, subjectIndex, moodIndex, form: { minutes: record ? String(record.minutes) : '', date: record ? record.date : dateString(), note: record ? record.note : '' } });
    wx.setNavigationBarTitle({ title: record ? '编辑学习打卡' : '学习打卡' });
  },
  subjectChange(event) { this.setData({ subjectIndex: Number(event.detail.value) }); }, moodChange(event) { this.setData({ moodIndex: Number(event.detail.value) }); }, dateChange(event) { this.setData({ 'form.date': event.detail.value }); },
  input(event) { this.setData({ [`form.${event.currentTarget.dataset.key}`]: event.detail.value }); },
  submit() {
    const minutes = Number(this.data.form.minutes); const subject = this.data.subjects[this.data.subjectIndex];
    if (!minutes || minutes <= 0 || !subject) { wx.showToast({ title: '请填写学习时长和科目', icon: 'none' }); return; }
    const payload = { subjectId: subject.id, minutes, date: this.data.form.date, note: this.data.form.note.trim(), mood: this.data.moods[this.data.moodIndex] };
    if (this.data.isEdit) store.updateStudy(this.data.id, payload); else store.addStudy(payload);
    wx.showToast({ title: this.data.isEdit ? '已保存' : '打卡成功', icon: 'success' }); setTimeout(() => wx.navigateBack(), 500);
  }
});
