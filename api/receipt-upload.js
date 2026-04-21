import supabase from './_supabase.js';
import { Buffer } from 'buffer';
import { getPool } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').end();
    return;
  }

  const { contentBase64, fileName, transaction_id } = req.body || {};
  if (!contentBase64 || !fileName) {
    res.status(400).json({ message: 'contentBase64 and fileName are required' });
    return;
  }

  try {
    const buffer = Buffer.from(contentBase64, 'base64');
    const bucket = 'receipts';
    const name = fileName;

    const { data, error } = await supabase.storage.from(bucket).upload(name, buffer, { contentType: 'image/*', upsert: true });
    if (error) {
      console.error('Supabase receipt upload error:', error.message || error);
      return res.status(500).json({ error: error.message || error });
    }

    // Optionally update DB transaction with receipt path
    if (transaction_id) {
      try {
        const pool = getPool();
        await pool.query('UPDATE transactions SET receipt_image_path = $1 WHERE transaction_id = $2', [data.path, transaction_id]);
      } catch (dbErr) {
        console.error('Failed to update transaction with receipt path:', dbErr.message);
      }
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(name);
    res.json({ success: true, path: data.path, publicUrl: publicData.publicUrl });
  } catch (err) {
    console.error('receipt-upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
