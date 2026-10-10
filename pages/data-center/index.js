const store = require('../../utils/storage');
const transfer = require('../../utils/transfer');

Page({
  data: { financeCount: 0, studyCount: 0, userCount: 0, lastError: '' },
  onShow() { this.loadData(); },
  loadData() { const state = store.getState(); this.setData({ financeCount: state.financeRecords.length, studyCount: state.studyRecords.length, userCount: state.users.length, lastError: '' }); },
  exportData(event) {
    const type = event.currentTarget.dataset.type; const state = store.getState(); const stamp = new Date().toISOString().slice(0, 10);
    let filename; let content;
    if (type === 'json') { filename = `校园账学簿备份_${stamp}.json`; content = JSON.stringify(state, null, 2); }
    else if (type === 'csv') { filename = `校园账学簿记录_${stamp}.csv`; content = transfer.stateToCsv(state); }
    else { filename = `校园账学簿记录_${stamp}.xls`; content = transfer.stateToExcelXml(state); }
    wx.showLoading({ title: '正在生成' });
    transfer.openExport(filename, content).then(result => {
      wx.hideLoading();
      if (result.opened) wx.showToast({ title: '文件已打开', icon: 'success' });
      else if (result.shared) wx.showToast({ title: '已调起发送', icon: 'success' });
      else wx.showModal({ title: '文件已生成', content: `文件已保存：${result.filename}\n当前设备不支持直接预览，请在文件管理中打开。`, showCancel: false });
    }).catch(() => { wx.hideLoading(); wx.showToast({ title: '导出失败，请重试', icon: 'none' }); });
  },
  importData() {
    transfer.chooseAndRead().then(file => {
      const payload = transfer.parseImport(file.name, file.text, store.getState());
      wx.showActionSheet({ itemList: ['合并导入（保留当前数据）', '覆盖导入（替换当前数据）'], success: choice => {
        store.importState(payload, choice.tapIndex === 1 ? 'replace' : 'merge'); this.loadData(); wx.showToast({ title: '导入成功', icon: 'success' });
      } });
    }).catch(error => { if (error && error.errMsg && /cancel/i.test(error.errMsg)) return; this.setData({ lastError: error.message || '文件格式不正确' }); wx.showToast({ title: '导入失败', icon: 'none' }); });
  },
  resetData() { wx.showModal({ title: '恢复演示数据', content: '当前所有本地数据将被覆盖，此操作不可撤销。', confirmColor: '#E85952', success: result => { if (result.confirm) { store.reset(); this.loadData(); wx.showToast({ title: '已恢复', icon: 'success' }); } } }); }
});
