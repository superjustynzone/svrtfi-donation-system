import supabase from './_supabase.js';
import { Buffer } from 'buffer';
import { getPool } from './_db.js';
import { parse } from 'csv-parse/sync';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').end();
    return;
  }

  const { contentBase64, fileName, campaign_id } = req.body || {};
  if (!contentBase64) {
    res.status(400).json({ message: 'contentBase64 is required' });
    return;
  }

  try {
    const buffer = Buffer.from(contentBase64, 'base64');

    // Upload raw CSV to storage for auditing
    const bucket = 'imports';
    const name = fileName || `import_${Date.now()}.csv`;
    const { data: uploadData, error: uploadErr } = await supabase.storage.from(bucket).upload(name, buffer, { contentType: 'text/csv', upsert: true });
    if (uploadErr) {
      console.error('Supabase import upload error:', uploadErr);
    }

    // Parse CSV (simple synchronous parse)
    const csvText = buffer.toString('utf8');
    const records = parse(csvText, { columns: true, skip_empty_lines: true });

    const pool = getPool();
    const inserted = [];

    for (const row of records) {
      const email = (row.email || row.Email || row['E-mail'] || '').trim();
      if (!email) continue;
      const first_name = (row.first_name || row.firstName || row.FirstName || row.first || '').trim();
      const last_name = (row.last_name || row.lastName || row.LastName || row.last || '').trim();

      try {
        const exists = await pool.query('SELECT subscriber_id FROM subscribers WHERE email = $1', [email]);
        if (exists.rows.length > 0) continue;

        const result = await pool.query(
          'INSERT INTO subscribers (email, first_name, last_name, full_name, campaign_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [email, first_name || null, last_name || null, `${first_name || ''} ${last_name || ''}`.trim(), campaign_id || null]
        );
        inserted.push(result.rows[0]);
      } catch (err) {
        console.error('Error inserting subscriber row:', err.message);
      }
    }

    res.json({ success: true, uploadedPath: uploadData?.path, insertedCount: inserted.length });
  } catch (err) {
    console.error('subscribers-import error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
