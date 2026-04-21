import { getPool } from './_db.js';

export default async function handler(req, res) {
  const pool = getPool();

  if (req.method === 'GET') {
    const { campaign_id } = req.query || {};
    try {
      let query = `SELECT s.*, COALESCE(s.first_name, u.first_name) as first_name, COALESCE(s.last_name, u.last_name) as last_name, c.campaign_name FROM subscribers s LEFT JOIN users u ON s.user_id = u.user_id LEFT JOIN campaigns c ON s.campaign_id = c.campaign_id`;
      const params = [];
      if (campaign_id && campaign_id !== 'all' && campaign_id !== 'global') {
        query += ` WHERE s.campaign_id = $1`;
        params.push(campaign_id);
      }
      query += ` ORDER BY subscribed_at DESC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      console.error('Subscribers GET error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    const { email, first_name, last_name, newsletter, campaign_id } = req.body || {};
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    try {
      const existing = await pool.query('SELECT * FROM subscribers WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        res.status(400).json({ message: 'Email already exists in mailing list' });
        return;
      }

      const campaignId = (campaign_id && campaign_id !== 'global' && campaign_id !== '') ? campaign_id : null;
      const result = await pool.query(
        'INSERT INTO subscribers (email, first_name, last_name, full_name, newsletters_opt_in, campaign_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [email, first_name, last_name, `${first_name || ''} ${last_name || ''}`.trim(), newsletter || false, campaignId]
      );

      res.json({ message: 'Subscriber added successfully', subscriber: result.rows[0] });
    } catch (err) {
      console.error('Subscribers POST error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === 'DELETE') {
    // Expect /api/subscribers?id=123
    const id = req.query && (req.query.id || req.query.subscriber_id);
    if (!id) {
      res.status(400).json({ message: 'id query parameter is required' });
      return;
    }
    try {
      await pool.query('DELETE FROM subscribers WHERE subscriber_id = $1', [id]);
      res.json({ message: 'Subscriber removed successfully' });
    } catch (err) {
      console.error('Subscribers DELETE error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).setHeader('Allow', 'GET,POST,DELETE').end();
}
