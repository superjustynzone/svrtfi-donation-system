/* eslint-disable no-undef, no-unused-vars */
import { getPool } from '../../../_db.js';
import supabase from '../../../_supabase.js';
import jwt from 'jsonwebtoken';
import { Buffer } from 'buffer';

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

  // Helper: read raw body (for multipart parsing)
  async function getRawBody(request) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      request.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      request.on('end', () => resolve(Buffer.concat(chunks)));
      request.on('error', reject);
    });
  }

  // Very small multipart/form-data parser for single-file uploads (works for small files)
  async function parseMultipart(request) {
    const contentType = request.headers['content-type'] || request.headers['Content-Type'];
    if (!contentType || !contentType.includes('multipart/form-data')) return null;
    const boundaryMatch = contentType.match(/boundary=(.*)$/);
    if (!boundaryMatch) return null;
    const boundary = boundaryMatch[1];
    const raw = await getRawBody(request);
    const parts = raw.toString('binary').split(`--${boundary}`);
    const result = {};
    for (let part of parts) {
      part = part.trim();
      if (!part || part === '--') continue;
      const [rawHeaders, ...rest] = part.split('\r\n\r\n');
      const body = rest.join('\r\n\r\n');
      const headers = rawHeaders.split('\r\n');
      let name = null; let filename = null; let contentType = null;
      for (const h of headers) {
        const cd = h.match(/Content-Disposition: form-data; name="?([^";]+)"?(; filename="?([^";]+)"?)?/i);
        if (cd) { name = cd[1]; if (cd[3]) filename = cd[3]; }
        const ct = h.match(/Content-Type: (.*)/i);
        if (ct) contentType = ct[1].trim();
      }
      if (!name) continue;
      // Trim trailing CRLF if present
      let partBody = body;
      if (partBody.endsWith('\r\n')) partBody = partBody.slice(0, -2);
      if (filename) {
        // binary string -> Buffer
        const buffer = Buffer.from(partBody, 'binary');
        result[name] = { filename, contentType, buffer };
      } else {
        result[name] = partBody;
      }
    }
    return result;
  }

  // GET /api/admin/smtp-settings
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'smtp-settings') {
    const user = verifyAdminToken(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const result = await pool.query('SELECT * FROM smtp_settings ORDER BY id DESC LIMIT 1');
      if (result.rows.length > 0) return res.json(result.rows[0]);
      return res.json({ provider: 'Gmail', host: 'smtp.gmail.com', port: 465, user_email: '', sender_email: '', encryption: 'SSL/TLS' });
    } catch (err) {
      console.error('Error fetching SMTP settings:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/admin/smtp-settings
  if (req.method === 'POST' && slug.length === 1 && slug[0] === 'smtp-settings') {
    const user = verifyAdminToken(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const { provider, host, port, user_email, password, encryption } = req.body || {};
      const existing = await pool.query('SELECT id FROM smtp_settings LIMIT 1');

      if (existing.rows.length > 0) {
        const id = existing.rows[0].id;
        const finalUser = provider === 'SendGrid' ? 'apikey' : user_email;
        let updateFields = ['provider = $1', 'host = $2', 'port = $3', 'user_email = $4', 'encryption = $5', 'sender_email = $6', 'updated_at = NOW()'];
        let values = [provider, host, port, finalUser, encryption, req.body.sender_email || finalUser];
        if (password && password !== '********' && password.trim() !== '') { updateFields.push(`password = $${values.length + 1}`); values.push(password); }
        await pool.query(`UPDATE smtp_settings SET ${updateFields.join(', ')} WHERE id = $${values.length + 1}`, [...values, id]);
      } else {
        const finalUser = provider === 'SendGrid' ? 'apikey' : user_email;
        await pool.query('INSERT INTO smtp_settings (provider, host, port, user_email, password, encryption, sender_email) VALUES ($1,$2,$3,$4,$5,$6,$7)', [provider, host, port, finalUser, password, encryption, req.body.sender_email || finalUser]);
      }

      // try to clear transporter cache in legacy EmailService if available
      try {
        const { clearTransporterCache } = await import('../../../server/EmailService.js');
        if (typeof clearTransporterCache === 'function') clearTransporterCache();
      } catch (e) {
        // ignore - best effort
        try {
          // CommonJS fallback
          const em = require('../../../server/EmailService.js');
          if (em && typeof em.clearTransporterCache === 'function') em.clearTransporterCache();
        } catch (er) {
          // ignore
        }
      }

      return res.json({ message: 'SMTP settings updated successfully!' });
    } catch (err) {
      console.error('Error saving SMTP settings:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/admin/site-settings
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'site-settings') {
    const user = verifyAdminToken(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const result = await pool.query('SELECT setting_key, setting_value FROM site_settings');
      const settings = {};
      result.rows.forEach(row => { settings[row.setting_key] = row.setting_value; });
      return res.json(settings);
    } catch (err) {
      console.error('Error fetching site settings:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT /api/admin/site-settings
  if ((req.method === 'PUT' || req.method === 'POST') && slug.length === 1 && slug[0] === 'site-settings') {
    const user = verifyAdminToken(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const { setting_key, setting_value } = req.body || {};
      if (!setting_key) return res.status(400).json({ message: 'setting_key required' });
      await pool.query(`INSERT INTO site_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`, [setting_key, setting_value]);
      return res.json({ message: 'Setting updated successfully!' });
    } catch (err) {
      console.error('Error saving site setting:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/admin/receipt-sequences/template
  if (req.method === 'GET' && slug.length === 2 && slug[0] === 'receipt-sequences' && slug[1] === 'template') {
    const csvContent = 'sequence_number\nREC-0001\nREC-0002\nREC-0003';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=receipt_sequences_template.csv');
    return res.status(200).send(csvContent);
  }

  // GET /api/admin/receipt-sequences
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'receipt-sequences') {
    try {
      const result = await pool.query('SELECT * FROM receipt_sequences ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      console.error('Error fetching sequences:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/admin/receipt-sequences/upload — expects JSON: { fileName, contentBase64 }
  if (req.method === 'POST' && slug.length === 2 && slug[0] === 'receipt-sequences' && slug[1] === 'upload') {
    try {
      let fileName = null; let contentBase64 = null;
      const contentType = req.headers['content-type'] || req.headers['Content-Type'] || '';
      if (contentType.includes('multipart/form-data')) {
        // parse form-data
        const parts = await parseMultipart(req);
        if (!parts || !parts.file) return res.status(400).json({ message: 'file form field required' });
        fileName = parts.file.filename || 'upload.csv';
        contentBase64 = parts.file.buffer.toString('base64');
      } else {
        const body = req.body || {};
        fileName = body.fileName;
        contentBase64 = body.contentBase64;
      }
      if (!fileName || !contentBase64) return res.status(400).json({ message: 'fileName and contentBase64 required (serverless)' });

      // Save raw CSV to imports bucket (best-effort)
      try {
        const buffer = Buffer.from(contentBase64, 'base64');
        const key = `imports/receipt_sequences/${Date.now()}-${fileName}`;
        await supabase.storage.from('imports').upload(key, buffer, { contentType: 'text/csv', upsert: true });
      } catch (uerr) {
        console.error('Warning: failed to upload raw CSV to imports bucket:', uerr?.message || uerr);
      }

      // Parse CSV content
      const csvText = Buffer.from(contentBase64, 'base64').toString('utf8');
      const rows = csvText.split(/\r?\n/).map(r => r.trim()).filter(r => r !== '');
      if (rows.length === 0) return res.status(400).json({ message: 'CSV is empty' });

      // Determine start index (skip header if present)
      let startIndex = 0;
      const firstRowLower = rows[0].split(',')[0].trim().toLowerCase();
      if (firstRowLower.includes('sequence') || firstRowLower.includes('receipt')) startIndex = 1;

      // Overwrite existing sequences
      await pool.query('TRUNCATE TABLE receipt_sequences RESTART IDENTITY CASCADE');

      let successCount = 0; let duplicateCount = 0; let errorCount = 0;
      for (let i = startIndex; i < rows.length; i++) {
        const sequence = rows[i].split(',')[0].trim();
        if (!sequence) continue;
        try {
          const existing = await pool.query('SELECT sequence_number FROM receipt_sequences WHERE sequence_number = $1', [sequence]);
          if (existing.rows.length === 0) {
            await pool.query('INSERT INTO receipt_sequences (sequence_number, is_used) VALUES ($1, FALSE)', [sequence]);
            successCount++;
          } else {
            duplicateCount++;
          }
        } catch (e) {
          console.error('Sequence import error:', e);
          errorCount++;
        }
      }

      return res.json({ message: `Sequences imported: ${successCount} successful, ${duplicateCount} duplicates skipped.`, stats: { successCount, duplicateCount, errorCount } });
    } catch (err) {
      console.error('❌ CSV Sequence Import Error:', err);
      return res.status(500).json({ message: 'Error parsing CSV file', error: err.message });
    }
  }

  return res.status(405).setHeader('Allow','GET,POST,PUT').end();
}
