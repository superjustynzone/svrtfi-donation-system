/* eslint-disable no-undef, no-unused-vars */
import { getPool } from '../../../_db.js';
import jwt from 'jsonwebtoken';
import { Buffer } from 'buffer';
import supabase from '../../../_supabase.js';

function getSlugParts(req) {
  const slug = req.query && req.query.slug;
  if (!slug) return [];
  return Array.isArray(slug) ? slug : String(slug).split('/').filter(Boolean);
}

function verifyAdminToken(req) {
  try {
    const header = req.headers && (req.headers.authorization || req.headers.Authorization);
    const token = header ? String(header).split(' ')[1] : null;
    if (!token) throw new Error('No token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.role) throw new Error('Invalid token');
    if (!['admin', 'finance', 'encoder', 'auditor'].includes(decoded.role)) throw new Error('Access denied');
    return decoded;
  } catch (err) {
    return null;
  }
}

export default async function handler(req, res) {
  const pool = getPool();
  const slug = getSlugParts(req);

  // All admin report routes require admin JWT
  const user = verifyAdminToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  // GET /api/admin/reports/summary
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'summary') {
    try {
      const { startDate, endDate, campaignId, foundationId, donorId, userId } = req.query;
      let whereClauses = ["(pt.payment_status = 'completed' OR pt.payment_status = 'failed')"];
      let params = [];

      if (startDate) { params.push(startDate); whereClauses.push(`d.initiated_at >= $${params.length}`); }
      if (endDate) { params.push(endDate); whereClauses.push(`d.initiated_at::date <= $${params.length}`); }
      if (campaignId) { params.push(campaignId); whereClauses.push(`d.campaign_id = $${params.length}`); }
      if (donorId) { params.push(donorId); whereClauses.push(`d.donor_id = $${params.length}`); }
      if (userId) { params.push(userId); whereClauses.push(`d.user_id = $${params.length}`); }
      if (foundationId) { params.push(foundationId); whereClauses.push(`d.campaign_id IN (SELECT campaign_id FROM foundation_campaigns WHERE foundation_id = $${params.length})`); }

      const whereString = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : 'WHERE 1=1';

      const statsResult = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN pt.payment_status = 'completed' THEN d.amount ELSE 0 END), 0) as total_amount,
                COUNT(*) as total_count,
                COALESCE(AVG(CASE WHEN pt.payment_status = 'completed' THEN d.amount END), 0) as avg_amount,
                COALESCE(MAX(CASE WHEN pt.payment_status = 'completed' THEN d.amount END), 0) as max_donation,
                COUNT(CASE WHEN pt.payment_status = 'failed' THEN 1 END) as failed_count
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            ${whereString}
        `, params);

      const topCampaigns = await pool.query(`
            SELECT c.campaign_name, COALESCE(SUM(d.amount), 0) as total
            FROM donations d
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            ${whereString} AND pt.payment_status = 'completed'
            GROUP BY c.campaign_name
            ORDER BY total DESC
            LIMIT 10
        `, params);

      const recentDonations = await pool.query(`
            SELECT 
                d.*, 
                c.campaign_name,
                COALESCE(NULLIF(TRIM(dn.first_name || ' ' || dn.last_name), ''), dn.email, 'Anonymous') as donor_name,
                dn.email as donor_email
            FROM donations d
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            ${whereString} AND pt.payment_status = 'completed' AND dn.email IS NOT NULL AND dn.email != ''
            ORDER BY d.initiated_at DESC
            LIMIT 10
        `, params);

      const topDonors = await pool.query(`
            SELECT 
                COALESCE(NULLIF(TRIM(dn.first_name || ' ' || dn.last_name), ''), dn.email, 'Anonymous') as donor_name,
                SUM(d.amount) as total_amount,
                COUNT(d.donation_id) as donation_count
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            ${whereString} AND pt.payment_status = 'completed' AND dn.email IS NOT NULL AND dn.email != ''
            GROUP BY dn.donor_id, dn.first_name, dn.last_name, dn.email
            ORDER BY total_amount DESC
            LIMIT 10
        `, params);

      return res.json({ summary: statsResult.rows[0], topCampaigns: topCampaigns.rows, topDonors: topDonors.rows, recentDonations: recentDonations.rows });
    } catch (err) {
      console.error('Summary report error:', err);
      return res.status(500).json({ message: 'Failed to generate summary', error: err.message });
    }
  }

  // GET /api/admin/reports/advanced-table
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'advanced-table') {
    try {
      const donationsQuery = await pool.query(`
            SELECT 
                d.donation_id, d.amount, d.payment_method, d.initiated_at,
                c.campaign_name, pt.payment_status, pt.payment_reference,
                COALESCE(NULLIF(TRIM(dn.first_name || ' ' || dn.last_name), ''), dn.email, 'Anonymous') as donor_name,
                dn.email as donor_email
            FROM donations d
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            ORDER BY d.initiated_at DESC LIMIT 2000
        `);
      return res.json(donationsQuery.rows);
    } catch (err) {
      console.error('Advanced table fetch error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/admin/reports/trends
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'trends') {
    try {
      const { interval = 'month', startDate, endDate, campaignId, foundationId, donorId, userId } = req.query;
      const allowedIntervals = { week: "DATE_TRUNC('week', d.initiated_at)", month: "DATE_TRUNC('month', d.initiated_at)", day: "DATE_TRUNC('day', d.initiated_at)" };
      const dbInterval = allowedIntervals[interval] || allowedIntervals['month'];

      let whereClauses = ["pt.payment_status = 'completed'"];
      let params = [];
      if (startDate) { params.push(startDate); whereClauses.push(`d.initiated_at >= $${params.length}`); }
      if (endDate) { params.push(endDate); whereClauses.push(`d.initiated_at <= $${params.length}`); }
      if (campaignId) { params.push(campaignId); whereClauses.push(`d.campaign_id = $${params.length}`); }
      if (donorId) { params.push(donorId); whereClauses.push(`d.donor_id = $${params.length}`); }
      if (userId) { params.push(userId); whereClauses.push(`d.user_id = $${params.length}`); }
      if (foundationId) { params.push(foundationId); whereClauses.push(`d.campaign_id IN (SELECT campaign_id FROM foundation_campaigns WHERE foundation_id = $${params.length})`); }

      const whereString = 'WHERE ' + whereClauses.join(' AND ');
      const query = `
            SELECT 
                ${dbInterval} as period,
                COALESCE(SUM(d.amount), 0) as total_amount,
                COUNT(*) as donation_count
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            ${whereString}
            GROUP BY period
            ORDER BY period ASC
            LIMIT 50
        `;
      const result = await pool.query(query, params);
      return res.json(result.rows);
    } catch (err) {
      console.error('Trends report error:', err);
      return res.status(500).json({ message: 'Failed to generate trends', error: err.message });
    }
  }

  // GET /api/admin/reports/download
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'download') {
    try {
      const { startDate, endDate, campaignId, foundationId, donorId, userId } = req.query;
      let whereClauses = ["pt.payment_status = 'completed'"];
      let params = [];
      if (startDate) { params.push(startDate); whereClauses.push(`d.initiated_at >= $${params.length}`); }
      if (endDate) { params.push(endDate); whereClauses.push(`d.initiated_at::date <= $${params.length}`); }
      if (campaignId) { params.push(campaignId); whereClauses.push(`d.campaign_id = $${params.length}`); }
      if (donorId) { params.push(donorId); whereClauses.push(`d.donor_id = $${params.length}`); }
      if (userId) { params.push(userId); whereClauses.push(`d.user_id = $${params.length}`); }
      if (foundationId) { params.push(foundationId); whereClauses.push(`d.campaign_id IN (SELECT campaign_id FROM foundation_campaigns WHERE foundation_id = $${params.length})`); }

      const whereString = 'WHERE ' + whereClauses.join(' AND ');
      const query = `
            SELECT 
                d.donation_id,
                d.initiated_at as date,
                COALESCE(NULLIF(TRIM(dn.first_name || ' ' || dn.last_name), ''), dn.email, 'Anonymous') as donor_name,
                c.campaign_name,
                d.amount,
                d.payment_method,
                pt.payment_reference,
                dn.email as donor_email
            FROM donations d
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            ${whereString} AND dn.email IS NOT NULL AND dn.email != ''
            ORDER BY d.initiated_at DESC
        `;
      // Safety: don't return huge exports directly in serverless — offer async option
      const MAX_ROWS = parseInt(req.query.maxRows || '10000', 10);
      const asyncExport = String(req.query.async || '').toLowerCase() === 'true';

      // count rows first
      const countQuery = `SELECT COUNT(*)::int as cnt FROM donations d JOIN payment_transactions pt ON d.donation_id = pt.donation_id LEFT JOIN donors dn ON d.donor_id = dn.donor_id ${whereString} AND dn.email IS NOT NULL AND dn.email != ''`;
      const countRes = await pool.query(countQuery, params);
      const totalRows = parseInt(countRes.rows[0].cnt, 10) || 0;

      if (totalRows > MAX_ROWS && !asyncExport) {
        return res.status(413).json({ message: `Result set too large (${totalRows} rows). Use async=true to generate an export or reduce the date range.` });
      }

      const result = await pool.query(query, params);

      const header = ['Donation ID','Date','Donor','Campaign','Amount','Method','Reference'];
      const rows = result.rows.map(r => [
        r.donation_id,
        new Date(r.date).toISOString(),
        (r.donor_name || '').replace(/,/g, ' '),
        (r.campaign_name || '').replace(/,/g, ' '),
        r.amount,
        r.payment_method,
        r.payment_reference
      ]);
      const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');

      if (asyncExport) {
        // upload to Supabase storage and return public URL
        try {
          const buffer = Buffer.from(csvContent, 'utf8');
          const key = `imports/exports/donation_report_${Date.now()}.csv`;
          const { error: uploadErr } = await supabase.storage.from('imports').upload(key, buffer, { contentType: 'text/csv', upsert: true });
          if (uploadErr) throw uploadErr;
          const publicUrl = supabase.storage.from('imports').getPublicUrl(key).data.publicUrl;
          return res.json({ url: publicUrl, rows: totalRows });
        } catch (uerr) {
          console.error('Async export upload failed:', uerr);
          // fall back to direct send
        }
      }

      res.setHeader('Content-Type','text/csv');
      res.setHeader('Content-Disposition','attachment; filename=donation_report.csv');
      return res.send(csvContent);
    } catch (err) {
      console.error('Export error:', err);
      return res.status(500).json({ message: 'Failed to export report', error: err.message });
    }
  }

  // GET /api/admin/reports/distribution
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'distribution') {
    try {
      const { startDate, endDate, campaignId, foundationId, donorId, userId } = req.query;
      let whereClauses = ["pt.payment_status = 'completed'"];
      let params = [];
      if (startDate) { params.push(startDate); whereClauses.push(`d.initiated_at >= $${params.length}`); }
      if (endDate) { params.push(endDate); whereClauses.push(`d.initiated_at::date <= $${params.length}`); }
      if (campaignId) { params.push(campaignId); whereClauses.push(`d.campaign_id = $${params.length}`); }
      if (foundationId) { params.push(foundationId); whereClauses.push(`d.campaign_id IN (SELECT campaign_id FROM foundation_campaigns WHERE foundation_id = $${params.length})`); }
      if (donorId) { params.push(donorId); whereClauses.push(`d.donor_id = $${params.length}`); }

      const whereString = 'WHERE ' + whereClauses.join(' AND ');
      const query = `
            SELECT 
                c.campaign_name as label,
                SUM(d.amount) as value
            FROM donations d
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            ${whereString}
            GROUP BY c.campaign_name
            ORDER BY value DESC
            LIMIT 10
        `;
      const result = await pool.query(query, params);
      return res.json(result.rows);
    } catch (err) {
      console.error('DISTRIBUTION ERROR:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  // GET /api/admin/reports/payment-methods
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'payment-methods') {
    try {
      const { startDate, endDate, campaignId, foundationId, donorId, userId } = req.query;
      let whereClauses = ["pt.payment_status = 'completed'"];
      let params = [];
      if (startDate) { params.push(startDate); whereClauses.push(`d.initiated_at >= $${params.length}`); }
      if (endDate) { params.push(endDate); whereClauses.push(`d.initiated_at::date <= $${params.length}`); }
      if (campaignId) { params.push(campaignId); whereClauses.push(`d.campaign_id = $${params.length}`); }
      if (foundationId) { params.push(foundationId); whereClauses.push(`d.campaign_id IN (SELECT campaign_id FROM foundation_campaigns WHERE foundation_id = $${params.length})`); }

      const whereString = 'WHERE ' + whereClauses.join(' AND ');
      const statsResult = await pool.query(`
            SELECT 
                d.payment_method as label,
                COUNT(*) as value
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            ${whereString}
            GROUP BY d.payment_method
            ORDER BY value DESC
        `, params);
      return res.json(statsResult.rows);
    } catch (err) {
      console.error('PAYMENT METHODS ERROR:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  return res.status(405).setHeader('Allow','GET').end();
}
