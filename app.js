const store = require('./utils/storage');

App({
  globalData: { appName: '校园账学簿' },
  onLaunch() {
    // 首次使用自动准备可体验的数据；后续所有操作使用 wx.setStorageSync 持久化。
    store.initialize();
  }
});
