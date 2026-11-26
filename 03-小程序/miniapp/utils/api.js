const config = require('../config');
const mock = require('./mock');

const { BASE_URL } = config;

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function clearSession() {
  wx.removeStorageSync(TOKEN_KEY);
  wx.removeStorageSync(USER_KEY);
  if (typeof getApp === 'function') {
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.user = null;
    }
  }
}

function redirectToLogin() {
  if (typeof getCurrentPages !== 'function') {
    wx.reLaunch({ url: '/pages/login/login' });
    return;
  }
  const pages = getCurrentPages();
  const currentPage = pages.length ? pages[pages.length - 1].route : '';
  if (currentPage !== 'pages/login/login') {
    wx.reLaunch({ url: '/pages/login/login' });
  }
}

function getMockResponse(method, path, data) {
  const normalizedMethod = String(method || 'GET').toUpperCase();
  const pathname = String(path || '').split('?')[0];

  if (normalizedMethod === 'POST' && pathname === '/api/login') {
    return { token: mock.token, user: mock.user };
  }
  if (normalizedMethod === 'GET' && pathname === '/api/me') {
    return mock.user;
  }
  if (normalizedMethod === 'GET' && pathname === '/api/shifts/current') {
    return mock.shift;
  }
  if (normalizedMethod === 'GET' && pathname === '/api/products') {
    return mock.products;
  }
  if (normalizedMethod === 'GET' && pathname === '/api/summary') {
    return mock.summary;
  }
  if (normalizedMethod === 'POST' && pathname === '/api/sales') {
    return mock.createSale(data);
  }
  if (normalizedMethod === 'GET' && pathname === '/api/sales') {
    return mock.salesPage;
  }

  return undefined;
}

function request(options) {
  const path = options.path;
  const method = options.method || 'GET';
  const data = options.data || {};
  const auth = options.auth !== false;
  const redirectOn401 = options.redirectOn401 !== false;
  const token = auth ? wx.getStorageSync(TOKEN_KEY) : '';

  if (auth && !token) {
    clearSession();
    if (redirectOn401) {
      redirectToLogin();
    }
    return Promise.reject(new Error('请先登录'));
  }

  const header = {
    'content-type': 'application/json'
  };
  if (token) {
    header.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method,
      data,
      header,
      timeout: 15000,
      success(response) {
        const statusCode = response.statusCode;
        if (statusCode >= 200 && statusCode < 300) {
          resolve(response.data);
          return;
        }

        if (statusCode === 401) {
          clearSession();
          if (redirectOn401) {
            redirectToLogin();
          }
        }

        const body = response.data;
        const message = body && typeof body === 'object' && body.error
          ? body.error
          : `请求失败（${statusCode}）`;
        reject(new Error(message));
      },
      fail(error) {
        if (config.USE_MOCK) {
          const mockResponse = getMockResponse(method, path, data);
          if (mockResponse !== undefined) {
            resolve(mockResponse);
            return;
          }
        }

        const message = error && error.errMsg && error.errMsg.indexOf('timeout') >= 0
          ? '请求超时，请稍后重试'
          : '网络连接失败，请检查服务地址';
        reject(new Error(message));
      }
    });
  });
}

function login(username, password) {
  return request({
    path: '/api/login',
    method: 'POST',
    data: { username, password },
    auth: false,
    redirectOn401: false
  });
}

function getMe() {
  return request({ path: '/api/me' });
}

function getCurrentShift() {
  return request({ path: '/api/shifts/current' });
}

function getProducts() {
  return request({ path: '/api/products' });
}

function getSummary() {
  return request({ path: '/api/summary' });
}

function createSale(payload) {
  return request({
    path: '/api/sales',
    method: 'POST',
    data: payload
  });
}

function listSales(page) {
  return request({ path: `/api/sales?page=${page}` });
}

function centsToYuan(cents) {
  const value = Number(cents);
  if (!Number.isInteger(value)) {
    return '0.00';
  }
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  const yuan = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${sign}${yuan}.${fraction}`;
}

function yuanToCents(value) {
  const text = String(value === null || value === undefined ? '' : value).trim();
  if (!/^\d+(?:\.\d{0,2})?$/.test(text)) {
    return null;
  }
  const parts = text.split('.');
  const yuan = Number(parts[0]);
  const fraction = (parts[1] || '').padEnd(2, '0');
  return yuan * 100 + Number(fraction);
}

module.exports = {
  request,
  login,
  getMe,
  getCurrentShift,
  getProducts,
  getSummary,
  createSale,
  listSales,
  centsToYuan,
  yuanToCents,
  clearSession
};