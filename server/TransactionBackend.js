// TransactionBackend.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/transactions
router.get("/", async (req, res) => {
  const { page = 1, limit = 15, search = '', status = '', startDate = '', endDate = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  console.log(`[TXN] request - Page:${page} Limit:${limit} Search:"${search}" Status:"${status}"`);

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
        d.message
      FROM payment_transactions pt
      LEFT JOIN donations d ON pt.donation_id = d.donation_id
      LEFT JOIN donors dn ON d.donor_id = dn.donor_id
      LEFT JOIN campaigns c ON pt.campaign_id = c.campaign_id
      ${where}
      ORDER BY pt.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...values, parseInt(limit), offset]);

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

    const stats = statsQuery.rows[0];

    res.json({
      transactions: dataQuery.rows,
      total: stats.total,
      stats: {
        completed: stats.completed,
        pending: stats.pending,
        totalAmount: stats.total_amount
      },
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error("TXN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/transactions/:id/status
router.patch("/:id/status", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    await client.query("BEGIN");

    // 1. Fetch current transaction details
    const existing = await client.query(
      `SELECT amount, campaign_id, payment_status 
       FROM payment_transactions 
       WHERE payment_id = $1`, [id]
    );

    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Transaction not found" });
    }

    const { amount, campaign_id, payment_status: oldStatus } = existing.rows[0];
    const txnAmount = parseFloat(amount || 0);

    // 2. Update status in payment_transactions
    const result = await client.query(
      `UPDATE payment_transactions SET payment_status = $1 WHERE payment_id = $2 RETURNING *`,
      [newStatus, id]
    );

    // 3. Update status in donations table as well (if needed, though status is usually kept in pt)
    // Actually, looking at the schema, 'donations' doesn't have a status column, 
    // but it has a 'completed_at' column.
    if (newStatus === 'completed') {
      await client.query(
        `UPDATE donations SET completed_at = NOW() WHERE donation_id = (SELECT donation_id FROM payment_transactions WHERE payment_id = $1)`,
        [id]
      );
    } else if (oldStatus === 'completed' && newStatus !== 'completed') {
      await client.query(
        `UPDATE donations SET completed_at = NULL WHERE donation_id = (SELECT donation_id FROM payment_transactions WHERE payment_id = $1)`,
        [id]
      );
    }

    // 4. Adjust campaign current_amount
    const countable = ['completed', 'pending'];
    const wasCountable = countable.includes(oldStatus?.toLowerCase());
    const isCountable = countable.includes(newStatus?.toLowerCase());

    if (wasCountable && !isCountable) {
      // Move from countable -> not countable: SUBTRACT
      await client.query(
        `UPDATE campaigns SET current_amount = GREATEST(COALESCE(current_amount,0) - $1, 0), updated_at = NOW() WHERE campaign_id = $2`,
        [txnAmount, campaign_id]
      );
    } else if (!wasCountable && isCountable) {
      // Move from not countable -> countable: ADD
      await client.query(
        `UPDATE campaigns SET current_amount = COALESCE(current_amount,0) + $1, updated_at = NOW() WHERE campaign_id = $2`,
        [txnAmount, campaign_id]
      );
    }

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
