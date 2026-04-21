import { getPool } from '../_db.js';

export default async function handler(req, res) {
  const pool = getPool();
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM smtp_settings ORDER BY id DESC LIMIT 1');
      if (result.rows.length > 0) {
        const settings = result.rows[0];
        res.json(settings);
      } else {
        res.json({ provider: 'Gmail', host: 'smtp.gmail.com', port: 465, user_email: '', sender_email: '', encryption: 'SSL/TLS' });
      }
    } catch (err) {
      console.error('SMTP GET error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    const { provider, host, port, user_email, password, encryption } = req.body || {};
    try {
      const existing = await pool.query('SELECT id FROM smtp_settings LIMIT 1');
      if (existing.rows.length > 0) {
        const id = existing.rows[0].id;
        const finalUser = provider === 'SendGrid' ? 'apikey' : user_email;
        let updateFields = ['provider = $1', 'host = $2', 'port = $3', 'user_email = $4', 'encryption = $5', 'sender_email = $6', 'updated_at = NOW()'];
        let values = [provider, host, port, finalUser, encryption, (req.body.sender_email || finalUser)];
        if (password && password !== '********' && password.trim() !== '') {
          updateFields.push(`password = $${values.length + 1}`);
          values.push(password);
        }
        await pool.query(`UPDATE smtp_settings SET ${updateFields.join(', ')} WHERE id = $${values.length + 1}`, [...values, id]);
      } else {
        const finalUser = provider === 'SendGrid' ? 'apikey' : user_email;
        await pool.query('INSERT INTO smtp_settings (provider, host, port, user_email, password, encryption, sender_email) VALUES ($1,$2,$3,$4,$5,$6,$7)', [provider, host, port, finalUser, password, encryption, req.body.sender_email || finalUser]);
      }
      res.json({ message: 'SMTP settings updated successfully!' });
    } catch (err) {
      console.error('SMTP POST error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).setHeader('Allow', 'GET,POST').end();
}
