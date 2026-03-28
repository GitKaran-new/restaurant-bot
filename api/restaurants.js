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

  // GET — list all, or get one by slug (with menu)
  if (req.method === 'GET') {
    const { slug } = req.query;

    if (slug) {
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      const { data: menu } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true)
        .order('sort_order');

      return res.json({ restaurant, menu: menu || [] });
    }

    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    return res.json({ restaurants: restaurants || [] });
  }

  // POST — create restaurant
  if (req.method === 'POST') {
    const { slug, name, tagline, logo_emoji } = req.body;
    if (!slug || !name) {
      return res.status(400).json({ error: 'slug and name are required' });
    }

    const { data, error } = await supabase
      .from('restaurants')
      .insert({ slug, name, tagline: tagline || 'AI Waiter · Always available', logo_emoji: logo_emoji || '🍛' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ restaurant: data });
  }

  // PATCH — update restaurant
  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { data, error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ restaurant: data });
  }

  // DELETE — delete restaurant
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
