import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — list menu items for a restaurant
  if (req.method === 'GET') {
    const { restaurant_id } = req.query;
    if (!restaurant_id) return res.status(400).json({ error: 'restaurant_id required' });

    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant_id)
      .order('category')
      .order('sort_order');

    return res.json({ items: data || [] });
  }

  // POST — add menu item
  if (req.method === 'POST') {
    const { restaurant_id, category, name, price, description, is_spicy, sort_order } = req.body;
    if (!restaurant_id || !name || !price || !category) {
      return res.status(400).json({ error: 'restaurant_id, category, name, price required' });
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert({ restaurant_id, category, name, price: parseInt(price), description, is_spicy: !!is_spicy, sort_order: sort_order || 0 })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ item: data });
  }

  // PATCH — update menu item
  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    if (updates.price) updates.price = parseInt(updates.price);

    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ item: data });
  }

  // DELETE — delete menu item
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
