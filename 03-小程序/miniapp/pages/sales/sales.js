const api = require('../../utils/api');

Page({
  data: {
    sales: [],
    page: 0,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
    loading: false,
    firstLoading: false,
    loadingMore: false
  },

  onShow() {
    this.loadPage(1, true);
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) {
      return;
    }
    this.loadPage(this.data.page + 1, false);
  },

  async loadPage(page, replace) {
    if (this.data.loading) {
      return;
    }

    this.setData({
      loading: true,
      firstLoading: replace,
      loadingMore: !replace
    });

    try {
      const result = await api.listSales(page);
      const rows = Array.isArray(result.sales) ? result.sales : [];
      const decorated = rows.map((item) => {
        let statusClass = 'status-normal';
        if (item.status === '作废') {
          statusClass = 'status-void';
        } else if (item.status === '待计佣') {
          statusClass = 'status-pending';
        }
        return {
          ...item,
          saleNo: item.sale_no || `S${item.sale_id}`,
          timeDisplay: this.formatDateTime(item.sale_time),
          amountYuan: api.centsToYuan(item.total_cents),
          statusClass
        };
      });
      const sales = replace ? decorated : this.data.sales.concat(decorated);

      this.setData({
        sales,
        page: result.page,
        pageSize: result.page_size,
        total: result.total,
        totalPages: result.total_pages,
        hasMore: result.page < result.total_pages
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '销售记录加载失败',
        icon: 'none',
        duration: 3000
      });
    } finally {
      this.setData({
        loading: false,
        firstLoading: false,
        loadingMore: false
      });
    }
  },

  formatDateTime(value) {
    if (!value) {
      return '--';
    }
    return String(value).replace('T', ' ').slice(0, 16);
  }
});