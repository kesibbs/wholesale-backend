const express = require('express');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(morgan('combined'));
app.use(express.json());

// In-memory wholesale catalog: unit prices drop at bulk quantities.
let products = [
  { id: 1, sku: 'RICE-25KG', name: 'Rice 25kg bag', unitPrice: 32.5, bulkQty: 40, bulkPrice: 29.0, stock: 1200 },
  { id: 2, sku: 'OIL-5L', name: 'Sunflower oil 5L', unitPrice: 11.9, bulkQty: 100, bulkPrice: 10.4, stock: 3400 },
  { id: 3, sku: 'SUGAR-50KG', name: 'Sugar 50kg sack', unitPrice: 48.0, bulkQty: 20, bulkPrice: 44.5, stock: 800 },
  { id: 4, sku: 'FLOUR-25KG', name: 'Wheat flour 25kg', unitPrice: 21.75, bulkQty: 60, bulkPrice: 19.9, stock: 2100 }
];
let orders = [];
let nextOrderId = 1;

app.get('/', (req, res) => {
  res.json({
    service: 'wholesale-backend',
    version: '1.0.0',
    node: process.version,
    endpoints: ['/health', '/api/products', '/api/products/:id', '/api/orders']
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/products', (req, res) => res.json(products));

app.get('/api/products/:id', (req, res) => {
  const p = products.find(x => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'product not found' });
  res.json(p);
});

app.post('/api/orders', (req, res) => {
  const { customer, items } = req.body || {};
  if (!customer || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customer and non-empty items[] required' });
  }
  const lines = [];
  for (const item of items) {
    const p = products.find(x => x.id === Number(item.productId));
    if (!p) return res.status(400).json({ error: `unknown productId ${item.productId}` });
    const qty = Number(item.qty) || 0;
    if (qty < 1) return res.status(400).json({ error: `invalid qty for productId ${item.productId}` });
    if (qty > p.stock) return res.status(409).json({ error: `insufficient stock for ${p.sku}` });
    const price = qty >= p.bulkQty ? p.bulkPrice : p.unitPrice;
    lines.push({ sku: p.sku, qty, price, lineTotal: +(qty * price).toFixed(2) });
  }
  lines.forEach(l => {
    const p = products.find(x => x.sku === l.sku);
    p.stock -= l.qty;
  });
  const order = {
    id: nextOrderId++,
    customer,
    lines,
    total: +lines.reduce((s, l) => s + l.lineTotal, 0).toFixed(2),
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  res.status(201).json(order);
});

app.get('/api/orders', (req, res) => res.json(orders));

app.listen(PORT, () => console.log(`wholesale-backend listening on ${PORT}`));
