import { getPool } from '../_db.js';

export default async function handler(req, res) {
  const pool = getPool();
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT setting_key, setting_value FROM site_settings');
      const settings = {};
      result.rows.forEach(row => { settings[row.setting_key] = row.setting_value; });
      res.json(settings);
    } catch (err) {
      console.error('Site settings GET error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === 'PUT') {
    const { setting_key, setting_value } = req.body || {};
    if (!setting_key) return res.status(400).json({ error: 'setting_key is required' });
    try {
      await pool.query(`INSERT INTO site_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`, [setting_key, setting_value]);
      res.json({ message: 'Setting updated successfully!' });
    } catch (err) {
      console.error('Site settings PUT error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).setHeader('Allow', 'GET,PUT').end();
}
