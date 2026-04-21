import { getPool } from '../../_db.js';
import { Buffer } from 'buffer';
import supabase from '../../_supabase.js';

function getSlugParts(req) {
  const slug = req.query && req.query.slug;
  if (!slug) return [];
  return Array.isArray(slug) ? slug : String(slug).split('/').filter(Boolean);
}

export default async function handler(req, res) {
  const pool = getPool();
  const slug = getSlugParts(req);

  // POST /api/donations — create donation (core behavior)
  if (req.method === 'POST' && slug.length === 0) {
    const body = req.body || {};
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Minimal port of original: insert donors (simple), donations, payment_transactions, update campaign current_amount
      const { campaign_id, user_id, amount, payment_method, donation_type, is_anonymous, donor_name, donor_email, donor_phone, donor_address, message } = body;
      if (!campaign_id || !amount || parseFloat(amount) <= 0) return res.status(400).json({ message: 'Campaign ID and positive amount required' });

      // donor handling (simplified)
      let donorId = null;
      if (!is_anonymous) {
        const parts = (donor_name || '').trim().split(/\s+/);
        const firstName = parts[0] || null;
        const lastName = parts.slice(1).join(' ') || null;
        const email = donor_email || null;
        if (email) {
          const existing = await client.query('SELECT donor_id FROM donors WHERE email = $1 LIMIT 1', [email]);
          if (existing.rows.length > 0) donorId = existing.rows[0].donor_id;
        }
        if (!donorId) {
          const donorResult = await client.query('INSERT INTO donors (first_name, last_name, email, contact_number, address) VALUES ($1,$2,$3,$4,$5) RETURNING donor_id', [firstName, lastName, donor_email || null, donor_phone || null, donor_address || null]);
          donorId = donorResult.rows[0].donor_id;
        }
      } else {
        const donorResult = await client.query('INSERT INTO donors (first_name, last_name, email) VALUES (NULL, NULL, $1) RETURNING donor_id', [donor_email || null]);
        donorId = donorResult.rows[0].donor_id;
      }

      // create donation
      const transactionId = `TXN-${Date.now().toString().slice(-6)}-${Math.floor(1000+Math.random()*9000)}`;
      const frequency = donation_type === 'monthly' ? 'monthly' : 'one_time';
      const next_due_date = frequency === 'monthly' ? new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] : null;
      const donationResult = await client.query(`INSERT INTO donations (user_id, campaign_id, donor_id, amount, payment_method, donation_source, currency, frequency, next_due_date, initiated_at, message, status, transaction_id) VALUES ($1,$2,$3,$4,$5,'website','PHP',$6,$7,NOW(),$8,'pending',$9) RETURNING donation_id, initiated_at, transaction_id`, [user_id || null, campaign_id, donorId, parseFloat(amount), payment_method || null, frequency, next_due_date, message || null, transactionId]);
      const donation = donationResult.rows[0];
      const paymentReference = `PAY-${Math.random().toString(36).slice(2,10).toUpperCase()}`;
      await client.query('INSERT INTO payment_transactions (donation_id, campaign_id, payment_reference, amount, payment_status) VALUES ($1,$2,$3,$4,\'pending\')', [donation.donation_id, campaign_id, paymentReference, parseFloat(amount)]);
      await client.query('UPDATE campaigns SET current_amount = COALESCE(current_amount,0) + $1, updated_at = NOW() WHERE campaign_id = $2', [parseFloat(amount), campaign_id]);

      await client.query('COMMIT');
      res.json({ message: 'Donation submitted successfully!', donation_id: donation.donation_id, donor_id: donorId, payment_reference: paymentReference, initiated_at: donation.initiated_at, transaction_id: donation.transaction_id });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('donations POST error:', err.message);
      res.status(500).json({ message: 'Server error: ' + err.message });
    } finally {
      client.release();
    }
    return;
  }

  // GET /api/donations/donors
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'donors') {
    try {
      const result = await pool.query('SELECT * FROM donors ORDER BY donor_id DESC LIMIT 500');
      res.json(result.rows);
    } catch (err) {
      console.error('donations donors error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  // GET /api/donations/stats
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'stats') {
    try {
      const result = await pool.query(`SELECT COUNT(*) as total_donations, COALESCE(SUM(amount),0) as total_amount FROM donations WHERE status = 'completed'`);
      res.json(result.rows[0]);
    } catch (err) {
      console.error('donations stats error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  // GET /api/donations/:id
  if (req.method === 'GET' && slug.length === 1) {
    try {
      const id = slug[0];
      const result = await pool.query('SELECT * FROM donations WHERE donation_id = $1', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error('donations/:id error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).setHeader('Allow', 'GET,POST').end();
}
