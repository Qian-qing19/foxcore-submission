const config = require('../../config');
const api = require('../../utils/api');

Page({
  data: {
    demoMode: config.USE_MOCK === true,
    username: '',
    loading: true,
    hasShift: false,
    eventName: '',
    boothText: '',
    shiftTime: '',
    todaySales: '0.00',
    monthSales: '0.00',
    monthCommission: '0.00'
  },

  onShow() {
    const user = wx.getStorageSync('user');
    this.setData({
      username: user && user.username ? user.username : ''
    });
    this.loadDashboard();
  },

  async loadDashboard() {
    this.setData({ loading: true });
    try {
      const results = await Promise.all([
        api.getSummary(),
        api.getCurrentShift()
      ]);
      const summary = results[0] || {};
      const shift = results[1] || null;

      if (shift) {
        const boothParts = [shift.booth_code, shift.location].filter(Boolean);
        this.setData({
          hasShift: true,
          eventName: shift.event_name || '未命名活动',
          boothText: boothParts.join(' · '),
          shiftTime: `${this.formatDateTime(shift.start_time)} 至 ${this.formatDateTime(shift.end_time)}`
        });
      } else {
        this.setData({
          hasShift: false,
          eventName: '',
          boothText: '',
          shiftTime: ''
        });
      }

      this.setData({
        todaySales: api.centsToYuan(summary.today_sales_cents || 0),
        monthSales: api.centsToYuan(summary.month_sales_cents || 0),
        monthCommission: api.centsToYuan(summary.month_commission_cents || 0)
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '工作台加载失败',
        icon: 'none',
        duration: 3000
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  formatDateTime(value) {
    if (!value) {
      return '--';
    }
    return String(value).replace('T', ' ').slice(0, 16);
  },

  onGoSale() {
    if (!this.data.hasShift) {
      wx.showToast({
        title: '当前没有进行中的班次',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({ url: '/pages/sale/sale' });
  },

  onGoSales() {
    wx.navigateTo({ url: '/pages/sales/sales' });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success(result) {
        if (result.confirm) {
          api.clearSession();
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  }
});