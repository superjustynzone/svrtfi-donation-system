import supabase from './_supabase.js';
import { Buffer } from 'buffer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').end();
    return;
  }

  const { contentBase64, fileName } = req.body || {};
  if (!contentBase64 || !fileName) {
    res.status(400).json({ message: 'contentBase64 and fileName are required' });
    return;
  }

  try {
    const buffer = Buffer.from(contentBase64, 'base64');
    const bucket = 'receipt_sequences';
    const name = fileName;

    const { data, error } = await supabase.storage.from(bucket).upload(name, buffer, { contentType: 'text/csv', upsert: true });
    if (error) {
      console.error('Supabase receipt sequences upload error:', error.message || error);
      return res.status(500).json({ error: error.message || error });
    }

    res.json({ success: true, path: data.path });
  } catch (err) {
    console.error('receipt-sequences-upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
