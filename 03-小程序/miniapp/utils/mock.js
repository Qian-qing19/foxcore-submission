const token = 'mock-token';

const user = {
  user_id: 2,
  username: 'sales01',
  role: '销售顾问',
  salesperson_id: 1
};

const shift = {
  shift_id: 901,
  event_name: '秋日音乐节',
  booth_code: 'A-01',
  location: '入口左侧',
  start_time: '2026-11-26T09:00',
  end_time: '2026-11-27T06:00'
};

const products = [
  { product_id: 1, product_code: 'P001', name: '帆布托特包', min_price_cents: 9600, category: '文创' },
  { product_id: 2, product_code: 'P002', name: '搪瓷马克杯', min_price_cents: 2900, category: '家居' },
  { product_id: 3, product_code: 'P003', name: '黑胶唱片', min_price_cents: 1800, category: '音像' },
  { product_id: 4, product_code: 'P004', name: '手工香薰蜡烛', min_price_cents: 10900, category: '家居' },
  { product_id: 5, product_code: 'P005', name: '复古金属徽章', min_price_cents: 4500, category: '配饰' },
  { product_id: 6, product_code: 'P006', name: '棉麻围巾', min_price_cents: 6800, category: '服饰' }
];

const summary = {
  today_sales_cents: 12500,
  month_sales_cents: 473150,
  month_commission_cents: 42586
};

const salesPage = {
  sales: [
    {
      sale_id: 304,
      sale_no: 'S304',
      sale_time: '2026-11-26 10:12:00',
      total_cents: 12500,
      status: '已计佣',
      item_count: 2,
      commission_cents: 1125
    },
    {
      sale_id: 303,
      sale_no: 'S303',
      sale_time: '2026-11-25 16:40:00',
      total_cents: 7600,
      status: '已计佣',
      item_count: 3,
      commission_cents: 684
    },
    {
      sale_id: 302,
      sale_no: 'S302',
      sale_time: '2026-11-25 11:05:00',
      total_cents: 29700,
      status: '已计佣',
      item_count: 3,
      commission_cents: 2673
    },
    {
      sale_id: 301,
      sale_no: 'S301',
      sale_time: '2026-11-24 18:20:00',
      total_cents: 22100,
      status: '作废',
      item_count: 3,
      commission_cents: 0
    },
    {
      sale_id: 299,
      sale_no: 'S299',
      sale_time: '2026-11-24 09:30:00',
      total_cents: 16800,
      status: '已计佣',
      item_count: 1,
      commission_cents: 1512
    }
  ],
  page: 1,
  page_size: 20,
  total: 5,
  total_pages: 1
};

let nextSaleId = 900;

function pad2(value) {
  return String(value).padStart(2, '0');
}

function currentDateTime() {
  const now = new Date();
  const date = [
    now.getFullYear(),
    pad2(now.getMonth() + 1),
    pad2(now.getDate())
  ].join('-');
  const time = [
    pad2(now.getHours()),
    pad2(now.getMinutes()),
    pad2(now.getSeconds())
  ].join(':');
  return `${date} ${time}`;
}

function createSale(payload) {
  const items = payload && Array.isArray(payload.items) ? payload.items : [];
  const totalCents = items.reduce((sum, item) => {
    const quantity = Number(item.quantity);
    const unitPriceCents = Number(item.final_unit_price_cents);
    return sum + quantity * unitPriceCents;
  }, 0);

  nextSaleId += 1;
  const saleId = nextSaleId;

  salesPage.sales.unshift({
    sale_id: saleId,
    sale_no: `S${saleId}`,
    sale_time: currentDateTime(),
    total_cents: totalCents,
    status: '已计佣',
    item_count: items.length,
    commission_cents: Math.floor(totalCents * 9 / 100)
  });
  salesPage.total += 1;
  salesPage.total_pages = Math.ceil(salesPage.total / salesPage.page_size);

  summary.today_sales_cents += totalCents;
  summary.month_sales_cents += totalCents;

  return { sale_id: saleId, total_cents: totalCents };
}

module.exports = {
  token,
  user,
  shift,
  products,
  summary,
  salesPage,
  createSale
};