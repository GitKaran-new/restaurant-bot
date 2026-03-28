import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — fetch today's orders for a restaurant (by slug)
  if (req.method === 'GET') {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'slug query param required' });

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: true });

    return res.json({ orders: orders || [] });
  }

  // POST — place a new order
  if (req.method === 'POST') {
    const { items, total, table, restaurant_id } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items in order' });
    if (!restaurant_id) return res.status(400).json({ error: 'restaurant_id required' });

    const { data, error } = await supabase
      .from('orders')
      .insert({
        restaurant_id,
        table_number: table || '?',
        items,
        total,
        status: 'new'
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ success: true, order: data });
  }

  // PATCH — update order status
  if (req.method === 'PATCH') {
    const { id, status } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(404).json({ error: 'Order not found' });
    return res.json({ success: true, order: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
