const api = require('../../utils/api');

Page({
  data: {
    loading: true,
    submitting: false,
    shift: null,
    products: [],
    productOptions: [],
    productIndex: 0,
    selectedProduct: null,
    selectedProductLabel: '',
    selectedProductMinPrice: '',
    quantity: '1',
    unitPrice: '',
    cart: [],
    cartCount: 0,
    hasItems: false,
    totalCents: 0,
    totalYuan: '0.00'
  },

  onLoad() {
    this.loadForm();
  },

  async loadForm() {
    this.setData({ loading: true });
    try {
      const results = await Promise.all([
        api.getCurrentShift(),
        api.getProducts()
      ]);
      const shift = results[0] || null;
      const products = Array.isArray(results[1]) ? results[1] : [];

      if (!shift) {
        this.setData({ loading: false });
        wx.showModal({
          title: '无法登记销售',
          content: '当前没有进行中的班次，请联系合伙人排班',
          showCancel: false,
          success() {
            wx.navigateBack();
          }
        });
        return;
      }

      if (!products.length) {
        this.setData({ loading: false });
        wx.showModal({
          title: '暂无可售产品',
          content: '当前没有在售产品，请联系合伙人维护产品',
          showCancel: false,
          success() {
            wx.navigateBack();
          }
        });
        return;
      }

      const productOptions = products.map((product) => {
        return `${product.product_code} ${product.name}（最低 ¥${api.centsToYuan(product.min_price_cents)}）`;
      });

      this.setData({
        shift,
        products,
        productOptions,
        productIndex: 0,
        selectedProduct: products[0],
        selectedProductLabel: productOptions[0],
        selectedProductMinPrice: api.centsToYuan(products[0].min_price_cents),
        unitPrice: api.centsToYuan(products[0].min_price_cents),
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 3000
      });
    }
  },

  onProductChange(event) {
    const index = Number(event.detail.value);
    const product = this.data.products[index];
    if (!product) {
      return;
    }
    this.setData({
      productIndex: index,
      selectedProduct: product,
      selectedProductLabel: this.data.productOptions[index],
      selectedProductMinPrice: api.centsToYuan(product.min_price_cents),
      unitPrice: api.centsToYuan(product.min_price_cents)
    });
  },

  onQuantityInput(event) {
    this.setData({ quantity: event.detail.value });
  },

  onUnitPriceInput(event) {
    this.setData({ unitPrice: event.detail.value });
  },

  onAddItem() {
    const product = this.data.selectedProduct;
    if (!product) {
      wx.showToast({ title: '请先选择产品', icon: 'none' });
      return;
    }

    const quantityText = String(this.data.quantity).trim();
    if (!/^[1-9]\d*$/.test(quantityText)) {
      wx.showToast({ title: '数量必须为正整数', icon: 'none' });
      return;
    }
    const quantity = Number(quantityText);
    if (!Number.isSafeInteger(quantity)) {
      wx.showToast({ title: '数量过大', icon: 'none' });
      return;
    }

    const unitPriceCents = api.yuanToCents(this.data.unitPrice);
    if (unitPriceCents === null) {
      wx.showToast({ title: '请输入有效单价', icon: 'none' });
      return;
    }
    if (unitPriceCents < product.min_price_cents) {
      wx.showToast({
        title: `单价不能低于最低售价 ¥${api.centsToYuan(product.min_price_cents)}`,
        icon: 'none',
        duration: 3000
      });
      return;
    }

    const lineCents = quantity * unitPriceCents;
    if (!Number.isSafeInteger(lineCents)) {
      wx.showToast({ title: '金额过大', icon: 'none' });
      return;
    }

    const item = {
      key: `${product.product_id}-${Date.now()}-${this.data.cart.length}`,
      productId: product.product_id,
      name: product.name,
      productCode: product.product_code,
      quantity,
      unitPriceCents,
      unitPriceYuan: api.centsToYuan(unitPriceCents),
      lineCents,
      lineAmountYuan: api.centsToYuan(lineCents)
    };
    const cart = this.data.cart.concat(item);
    const totalCents = cart.reduce((sum, row) => sum + row.lineCents, 0);

    this.setData({
      cart,
      cartCount: cart.length,
      hasItems: true,
      totalCents,
      totalYuan: api.centsToYuan(totalCents)
    });
    wx.showToast({ title: '已加入清单', icon: 'success' });
  },

  onRemoveItem(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index) || index < 0 || index >= this.data.cart.length) {
      return;
    }
    const cart = this.data.cart.slice();
    cart.splice(index, 1);
    const totalCents = cart.reduce((sum, row) => sum + row.lineCents, 0);
    this.setData({
      cart,
      cartCount: cart.length,
      hasItems: cart.length > 0,
      totalCents,
      totalYuan: api.centsToYuan(totalCents)
    });
  },

  async onSubmit() {
    if (this.data.submitting || !this.data.cart.length || !this.data.shift) {
      return;
    }

    const random = Math.floor(Math.random() * 1000000);
    const clientTxnId = 'MP-' + Date.now() + '-' + random;
    const items = this.data.cart.map((item) => {
      return {
        product_id: item.productId,
        quantity: item.quantity,
        final_unit_price_cents: item.unitPriceCents
      };
    });

    this.setData({ submitting: true });
    try {
      const result = await api.createSale({
        client_txn_id: clientTxnId,
        shift_id: this.data.shift.shift_id,
        items
      });
      const saleNo = `S${result.sale_id}`;
      wx.showToast({
        title: `成功 ${saleNo} ¥${api.centsToYuan(result.total_cents)}`,
        icon: 'success',
        duration: 3000
      });
      this.setData({
        cart: [],
        cartCount: 0,
        hasItems: false,
        totalCents: 0,
        totalYuan: '0.00'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none',
        duration: 3000
      });
    } finally {
      this.setData({ submitting: false });
    }
  }
});