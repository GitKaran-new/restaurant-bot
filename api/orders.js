// In-memory store (resets on server restart)
// For production, replace with a real database like Supabase or MongoDB
let orders = [];
let orderCounter = 1;

export default function handler(req, res) {
  // Allow cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/orders — fetch all orders
  if (req.method === 'GET') {
    return res.status(200).json({ orders });
  }

  // POST /api/orders — place a new order
  if (req.method === 'POST') {
    const { items, total, table } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    const newOrder = {
      id: orderCounter++,
      table: table || '?',
      items,
      total,
      status: 'new',       // new → preparing → ready → served
      time: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    orders.push(newOrder);
    return res.status(201).json({ success: true, order: newOrder });
  }

  // PATCH /api/orders — update order status
  if (req.method === 'PATCH') {
    const { id, status } = req.body;
    const order = orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = status;
    order.updatedAt = new Date().toISOString();
    return res.status(200).json({ success: true, order });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
