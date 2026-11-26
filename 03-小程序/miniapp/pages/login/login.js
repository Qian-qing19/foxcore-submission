const api = require('../../utils/api');

Page({
  data: {
    username: '',
    password: '',
    submitting: false
  },

  onLoad() {
    const token = wx.getStorageSync('token');
    if (token) {
      wx.reLaunch({ url: '/pages/home/home' });
    }
  },

  onUsernameInput(event) {
    this.setData({ username: event.detail.value });
  },

  onPasswordInput(event) {
    this.setData({ password: event.detail.value });
  },

  async onLogin() {
    if (this.data.submitting) {
      return;
    }

    const username = this.data.username.trim();
    const password = this.data.password;
    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const result = await api.login(username, password);
      wx.setStorageSync('token', result.token);
      wx.setStorageSync('user', result.user);
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.user = result.user;
      }
      wx.reLaunch({ url: '/pages/home/home' });
    } catch (error) {
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none',
        duration: 3000
      });
    } finally {
      this.setData({ submitting: false });
    }
  }
});