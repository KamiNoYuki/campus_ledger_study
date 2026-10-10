const store = require('../../utils/storage');
const analytics = require('../../utils/analytics');
const charts = require('../../utils/charts');
const { monthString, money, minutesText } = require('../../utils/format');

Page({
  data: { month: monthString(), tab: 'finance', finance: {}, study: {}, financeCats: [], studyCats: [], streak: 0, selectedUser: {}, canvasWidth: 320, pieCanvasHeight: 220, barCanvasHeight: 220 },
  onLoad() { this.setCanvasSize(); this.handleResize = () => this.setCanvasSize(); if (wx.onWindowResize) wx.onWindowResize(this.handleResize); },
  onShow() { this.loadData(); },
  onReady() { this.isReady = true; this.loadData(); },
  setCanvasSize() {
    const info = wx.getSystemInfoSync ? wx.getSystemInfoSync() : { windowWidth: 375 };
    const canvasWidth = Math.max(240, Math.floor(Number(info.windowWidth || 375) - 56));
    this.setData({ canvasWidth, pieCanvasHeight: 220, barCanvasHeight: 220 });
  },
  loadData() {
    const state = store.getState(); const user = store.currentUser(state); const financeRecords = analytics.userFinance(state, user.id); const studyRecords = analytics.userStudy(state, user.id);
    const finance = analytics.financeSummary(financeRecords, this.data.month); const study = analytics.studySummary(studyRecords, state.categories, this.data.month);
    const financeCats = analytics.groupByCategory(finance.records, state.categories, 'expense');
    const expenseTotal = financeCats.reduce((sum, item) => sum + Number(item.value), 0);
    financeCats.forEach(item => { item.valueText = money(item.value); item.percent = expenseTotal ? Math.round(item.value / expenseTotal * 100) : 0; });
    const studyCats = study.bySubject;
    this.chartData = { financeCats, studyCats, financeRecords, studyRecords };
    this.setData({ selectedUser: user, finance: { ...finance, expenseText: money(finance.expense), incomeText: money(finance.income) }, study: { ...study, minutesText: minutesText(study.minutes) }, financeCats, studyCats, streak: analytics.consecutiveDays(studyRecords) }, () => { if (this.isReady) this.drawCharts(); });
  },
  drawCharts() {
    if (!this.chartData) return;
    const { financeCats, financeRecords, studyRecords } = this.chartData;
    if (this.data.tab === 'finance') {
      charts.drawPie('financePie', financeCats, { width: this.data.canvasWidth, height: this.data.pieCanvasHeight });
      charts.drawBars('expenseBars', analytics.monthlyExpense(financeRecords), '元', { width: this.data.canvasWidth, height: this.data.barCanvasHeight });
    } else charts.drawBars('studyBars', analytics.dailyStudy(studyRecords), '分钟', { width: this.data.canvasWidth, height: this.data.barCanvasHeight });
  },
  chooseMonth(event) { this.setData({ month: event.detail.value }); this.loadData(); },
  switchTab(event) { this.setData({ tab: event.currentTarget.dataset.tab }, () => setTimeout(() => this.drawCharts(), 40)); },
  onUnload() { if (wx.offWindowResize && this.handleResize) wx.offWindowResize(this.handleResize); },
  goDataCenter() { wx.navigateTo({ url: '/pages/data-center/index' }); }
});
