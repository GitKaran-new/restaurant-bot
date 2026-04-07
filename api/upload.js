import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file_data, file_name, content_type } = req.body;

    if (!file_data || !file_name) {
      return res.status(400).json({ error: 'file_data and file_name are required' });
    }

    // file_data is a base64 string from the browser
    const buffer = Buffer.from(file_data, 'base64');
    const ext = file_name.split('.').pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('dish-images')
      .upload(uniqueName, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: content_type || 'image/jpeg'
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('dish-images')
      .getPublicUrl(uniqueName);

    return res.json({ url: urlData.publicUrl });

  } catch (e) {
    return res.status(500).json({ error: e.message || 'Upload failed' });
  }
}
