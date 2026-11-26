App({
  globalData: {
    user: null
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    const user = wx.getStorageSync('user');
    if (token) {
      this.globalData.user = user || null;
    }
  }
});