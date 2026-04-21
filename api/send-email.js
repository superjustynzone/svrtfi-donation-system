import nodemailer from 'nodemailer';
import { getPool } from './_db.js';

// Cache transporter between invocations
function getTransporter() {
  if (global.__transporter) return global.__transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = (process.env.SMTP_ENCRYPTION || '').toLowerCase() === 'ssl/tls' || port === 465;

  if (!host || !port) {
    throw new Error('SMTP_HOST and SMTP_PORT are required for sending email');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  global.__transporter = transporter;
  return transporter;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').end();
    return;
  }

  const { to, subject, message } = req.body || {};
  if (!to || !subject || !message) {
    res.status(400).json({ message: 'Missing to, subject or message' });
    return;
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_SENDER || process.env.SMTP_USER,
      to,
      subject,
      html: message,
    });

    // Log email to DB where available (best-effort)
    try {
      const pool = getPool();
      await pool.query(
        'INSERT INTO email_logs (to_address, subject, body, sent_at, meta) VALUES ($1, $2, $3, NOW(), $4)',
        [to, subject, message, JSON.stringify({ messageId: info.messageId })]
      );
    } catch (dbErr) {
      // non-fatal
      console.error('Failed to log email:', dbErr.message);
    }

    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('Email send failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
