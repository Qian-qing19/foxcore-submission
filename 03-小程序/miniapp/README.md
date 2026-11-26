# Foxcore 微信小程序端

供销售顾问现场使用，包含登录、当前班次、登记销售和我的销售。项目不使用第三方 UI 库、npm、云开发或外部 CDN。

## 目录

```text
miniapp/
  app.js
  app.json
  app.wxss
  config.js
  project.config.json
  sitemap.json
  utils/api.js
  pages/login/
  pages/home/
  pages/sale/
  pages/sales/
```

## 本地联调

1. 启动 Foxcore Flask 后端，默认地址为 `http://127.0.0.1:5000`。
2. 在微信开发者工具中导入 `miniapp/` 目录。
3. 项目 AppID 为 `touristappid`，`setting.urlCheck` 已关闭，便于本地联调。
4. 如后端地址变化，只修改 `config.js` 中的 `BASE_URL`，不要添加结尾斜杠。

`config.js`：

```js
module.exports = {
  BASE_URL: 'http://127.0.0.1:5000'
};
```

`127.0.0.1` 仅适用于开发者工具本机联调。真机调试时应改为手机可访问的电脑局域网地址，并按微信平台要求配置合法请求域名。

## 页面与接口

- 登录页：`POST /api/login`，成功后保存 token 和 user。
- 首页：`GET /api/summary`、`GET /api/shifts/current`。
- 登记销售：`GET /api/shifts/current`、`GET /api/products`、`POST /api/sales`。
- 我的销售：`GET /api/sales?page=N`，每页 20 条，触底加载下一页。

所有 API 请求统一封装在 `utils/api.js`，自动携带 `Authorization: Bearer <token>`。遇到 401 时清除本地 token 和 user 并跳转登录页。

## 前端约定

- 金额在 JavaScript 中以整数分保存和计算，展示时统一转换为两位小数元。
- 销售提交使用全局唯一 `client_txn_id`，格式为 `MP-<时间戳>-<随机数>`。
- `POST /api/sales` 不返回 `sale_no`，成功提示按接口实现显示为 `S<sale_id>`。
- WXML 只绑定页面预处理后的展示字段，不调用 JavaScript 函数。