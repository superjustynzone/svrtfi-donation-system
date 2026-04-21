/* eslint-disable no-undef */
import { getPool } from '../_db.js';
import supabase from '../_supabase.js';
import { Buffer } from 'buffer';
import path from 'path';
import { createRequire } from 'module';

export default async function handler(req, res) {
  const slug = req.query.slug || [];
  const pool = getPool();

  // GET /api/transactions -> list with pagination and filters
  if (req.method === 'GET' && slug.length === 0) {
    const { page = 1, limit = 15, search = '', status = '', startDate = '', endDate = '' } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    try {
      const conditions = [];
      const values = [];
      let idx = 1;

      if (search) {
        conditions.push(`(dn.first_name ILIKE $${idx} OR dn.last_name ILIKE $${idx} OR pt.payment_reference ILIKE $${idx})`);
        values.push(`%${search}%`);
        idx++;
      }
      if (status) {
        conditions.push(`pt.payment_status = $${idx}`);
        values.push(status);
        idx++;
      }
      if (startDate) {
        conditions.push(`pt.created_at >= $${idx}`);
        values.push(startDate);
        idx++;
      }
      if (endDate) {
        conditions.push(`pt.created_at <= $${idx}::date + interval '1 day'`);
        values.push(endDate);
        idx++;
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const dataQuery = await pool.query(`
        SELECT
          pt.payment_id AS transaction_id,
          pt.donation_id,
          pt.payment_reference AS reference_number,
          pt.amount,
          pt.payment_status AS status,
          COALESCE(d.payment_method, 'N/A') AS payment_method,
          pt.created_at,
          COALESCE(
            NULLIF(CONCAT(COALESCE(dn.first_name,''), ' ', COALESCE(dn.last_name,'')), ' '),
            'Anonymous'
          ) AS donor_name,
          c.campaign_name,
          d.currency,
          d.frequency,
          d.initiated_at,
          d.completed_at,
          d.message,
          pt.receipt_upload
        FROM payment_transactions pt
        LEFT JOIN donations d ON pt.donation_id = d.donation_id
        LEFT JOIN donors dn ON d.donor_id = dn.donor_id
        LEFT JOIN campaigns c ON pt.campaign_id = c.campaign_id
        ${where}
        ORDER BY pt.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...values, parseInt(limit, 10), offset]);

      const statsQuery = await pool.query(`
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE pt.payment_status = 'completed')::int as completed,
          COUNT(*) FILTER (WHERE pt.payment_status = 'pending')::int as pending,
          COALESCE(SUM(pt.amount), 0)::float as total_amount
        FROM payment_transactions pt
        LEFT JOIN donations d ON pt.donation_id = d.donation_id
        LEFT JOIN donors dn ON d.donor_id = dn.donor_id
        ${where}
      `, values);

      const stats = statsQuery.rows[0] || { total: 0, completed: 0, pending: 0, total_amount: 0 };

      res.json({
        transactions: dataQuery.rows,
        total: stats.total,
        stats: { completed: stats.completed, pending: stats.pending, totalAmount: stats.total_amount },
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      });
    } catch (err) {
      console.error('transactions GET error:', err);
      res.status(500).json({ error: err.message });
    }

    return;
  }

  // PATCH /api/transactions/:id/status
  if ((req.method === 'PATCH' || req.method === 'POST') && slug.length >= 2 && slug[1] === 'status') {
    const transactionId = slug[0];
    const { status: newStatus, receiptBase64, fileName, receiptPath: providedPath } = req.body || {};

    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');

      // Fetch existing transaction
      const existingRes = await client.query(`SELECT amount, campaign_id, payment_status, donation_id FROM payment_transactions WHERE payment_id = $1 LIMIT 1`, [transactionId]);
      if (existingRes.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      const existing = existingRes.rows[0];
      const amount = parseFloat(existing.amount || 0);
      const campaignId = existing.campaign_id;
      const oldStatus = existing.payment_status;
      const donationId = existing.donation_id;

      // Handle receipt upload if provided as base64
      let receiptUploadPath = providedPath || null;
      if (receiptBase64 && fileName) {
        const buffer = Buffer.from(receiptBase64, 'base64');
        const bucket = 'receipts';
        const name = `receipt-${Date.now()}-${fileName}`.replace(/\s+/g, '_');
        const { data, error } = await supabase.storage.from(bucket).upload(name, buffer, { contentType: 'application/octet-stream', upsert: true });
        if (error) {
          console.error('Supabase receipt upload error:', error);
          await client.query('ROLLBACK');
          res.status(500).json({ error: error.message || error });
          return;
        }
        receiptUploadPath = data.path;
      }

      // Update payment_transactions
      let updateQuery;
      if (receiptUploadPath) {
        updateQuery = await client.query(`UPDATE payment_transactions SET payment_status = $1, receipt_upload = $3 WHERE payment_id = $2 RETURNING *`, [newStatus, transactionId, receiptUploadPath]);
      } else {
        updateQuery = await client.query(`UPDATE payment_transactions SET payment_status = $1 WHERE payment_id = $2 RETURNING *`, [newStatus, transactionId]);
      }

      // Update donations.completed_at if needed
      if (newStatus === 'completed') {
        await client.query(`UPDATE donations SET completed_at = NOW(), status = 'completed' WHERE donation_id = (SELECT donation_id FROM payment_transactions WHERE payment_id = $1)`, [transactionId]);
      } else if ((oldStatus || '').toLowerCase() === 'completed' && (newStatus || '').toLowerCase() !== 'completed') {
        await client.query(`UPDATE donations SET completed_at = NULL WHERE donation_id = (SELECT donation_id FROM payment_transactions WHERE payment_id = $1)`, [transactionId]);
      }

      // Adjust campaign current_amount depending on status transition
      const countable = ['completed', 'pending'];
      const wasCountable = countable.includes((oldStatus || '').toLowerCase());
      const isCountable = countable.includes((newStatus || '').toLowerCase());

      if (wasCountable && !isCountable) {
        await client.query(`UPDATE campaigns SET current_amount = GREATEST(COALESCE(current_amount,0) - $1, 0), updated_at = NOW() WHERE campaign_id = $2`, [amount, campaignId]);
      } else if (!wasCountable && isCountable) {
        await client.query(`UPDATE campaigns SET current_amount = COALESCE(current_amount,0) + $1, updated_at = NOW() WHERE campaign_id = $2`, [amount, campaignId]);
      }

      await client.query('COMMIT');

      // Non-blocking: trigger donation completion flows if completed
      if ((newStatus || '').toLowerCase() === 'completed') {
        try {
          // Import CommonJS EmailService dynamically and call processDonationCompletion
          const require = createRequire(import.meta.url);
          const emailServicePath = path.resolve(process.cwd(), 'server', 'EmailService.js');
          try {
            const emailService = require(emailServicePath);
            if (emailService && typeof emailService.processDonationCompletion === 'function') {
              // don't await
              emailService.processDonationCompletion(donationId).catch(err => console.error('TXN EMAIL COMPLETION ERROR:', err));
            }
          } catch (impErr) {
            console.error('Failed to require EmailService for donation completion:', impErr.message || impErr);
          }
        } catch (err) {
          console.error('Error dispatching donation completion:', err);
        }
      }

      res.json(updateQuery.rows[0]);
    } catch (err) {
      if (client) await client.query('ROLLBACK');
      console.error('transactions PATCH error:', err);
      res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }

    return;
  }

  res.status(405).setHeader('Allow', 'GET, PATCH').end();
}
