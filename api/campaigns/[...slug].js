import { getPool } from '../../_db.js';
import supabase from '../../_supabase.js';
import { Buffer } from 'buffer';

function getSlugParts(req) {
  // Vercel/Next-style catch-all provides query.slug as array; in some runtimes use req.query.slug
  const slug = req.query && req.query.slug;
  if (!slug) return [];
  return Array.isArray(slug) ? slug : String(slug).split('/').filter(Boolean);
}

export default async function handler(req, res) {
  const pool = getPool();
  const slug = getSlugParts(req);

  // GET /api/campaigns/all
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'all') {
    try {
      const result = await pool.query(`SELECT c.campaign_id, c.campaign_name, c.campaign_type, c.campaign_description, c.goal_amount, c.current_amount, c.start_date, c.end_date, c.file_url, c.media_type, c.is_featured, c.status, c.created_at, c.updated_at, c.receipt_email_subject, c.receipt_email_message, f.foundation_id, f.foundation_name, f.image_logo as foundation_logo, ( SELECT json_agg(json_build_object('media_id', cm.media_id, 'file_url', cm.file_url)) FROM campaign_media cm WHERE cm.campaign_id = c.campaign_id ) as media FROM campaigns c LEFT JOIN foundation_campaigns fc ON c.campaign_id = fc.campaign_id LEFT JOIN foundations f ON fc.foundation_id = f.foundation_id ORDER BY c.created_at DESC`);
      res.json(result.rows);
    } catch (err) {
      console.error('campaigns/all error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  // GET /api/campaigns/published
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'published') {
    try {
      const result = await pool.query(`SELECT c.campaign_id, c.campaign_name, c.campaign_type, c.campaign_description, c.goal_amount, c.current_amount, c.start_date, c.end_date, c.file_url, c.media_type, c.is_featured, c.status, c.created_at, c.updated_at, f.foundation_id, f.foundation_name, f.image_logo as foundation_logo, ( SELECT json_agg(json_build_object('media_id', cm.media_id, 'file_url', cm.file_url)) FROM campaign_media cm WHERE cm.campaign_id = c.campaign_id ) as media FROM campaigns c LEFT JOIN foundation_campaigns fc ON c.campaign_id = fc.campaign_id LEFT JOIN foundations f ON fc.foundation_id = f.foundation_id WHERE c.status = 'publish' ORDER BY c.is_featured DESC, c.created_at DESC`);
      res.json(result.rows);
    } catch (err) {
      console.error('campaigns/published error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  // GET /api/campaigns/:id
  if (req.method === 'GET' && slug.length === 1) {
    const id = slug[0];
    try {
      const campaignResult = await pool.query(`SELECT c.*, f.foundation_id, f.foundation_name, f.image_logo as foundation_logo, f.about_foundation as foundation_desc, ( SELECT json_agg(json_build_object('media_id', cm.media_id, 'file_url', cm.file_url)) FROM campaign_media cm WHERE cm.campaign_id = c.campaign_id ) as media FROM campaigns c LEFT JOIN foundation_campaigns fc ON c.campaign_id = fc.campaign_id LEFT JOIN foundations f ON fc.foundation_id = f.foundation_id WHERE c.campaign_id = $1`, [id]);
      if (campaignResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(campaignResult.rows[0]);
    } catch (err) {
      console.error('campaigns/:id error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  // POST /api/campaigns/create — accepts JSON with base64 images in `images: [{fileName, contentBase64, contentType}, ...]`
  if (req.method === 'POST' && slug.length === 1 && slug[0] === 'create') {
    const body = req.body || {};
    const { campaign_name, campaign_type, campaign_description, foundation_id, goal_amount, start_date, end_date, is_featured, images } = body;
    if (!campaign_name || !foundation_id) return res.status(400).json({ error: 'campaign_name and foundation_id required' });

    try {
      // Insert campaign as draft
      const campaignResult = await pool.query(`INSERT INTO campaigns (campaign_name, campaign_type, campaign_description, goal_amount, start_date, end_date, is_featured, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'draft') RETURNING campaign_id`, [campaign_name, campaign_type, campaign_description, goal_amount || null, start_date || null, end_date || null, (is_featured === true || is_featured === 'true')]);
      const campaignId = campaignResult.rows[0].campaign_id;

      // Associate with foundation
      await pool.query('INSERT INTO foundation_campaigns (foundation_id, campaign_id) VALUES ($1,$2)', [foundation_id, campaignId]);

      // Upload images to Supabase and insert campaign_media; first image becomes file_url
      let mainFileUrl = null;
      if (Array.isArray(images) && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (!img || !img.contentBase64 || !img.fileName) continue;
          const buffer = Buffer.from(img.contentBase64, 'base64');
          const key = `campaigns/${campaignId}/${Date.now()}-${img.fileName}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage.from('campaigns').upload(key, buffer, { contentType: img.contentType || 'image/*' , upsert: true });
          if (uploadErr) {
            console.error('campaign image upload error:', uploadErr);
            continue;
          }
          const publicUrl = supabase.storage.from('campaigns').getPublicUrl(key).data.publicUrl;
          if (!mainFileUrl) mainFileUrl = publicUrl;
          await pool.query('INSERT INTO campaign_media (campaign_id, file_url, media_type) VALUES ($1,$2,$3)', [campaignId, publicUrl, 'image']);
        }
      }

      if (mainFileUrl) {
        await pool.query('UPDATE campaigns SET file_url = $1, media_type = $2 WHERE campaign_id = $3', [mainFileUrl, 'image', campaignId]);
      }

      res.json({ message: 'Campaign created', campaign_id: campaignId });
    } catch (err) {
      console.error('campaigns/create error:', err.message);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).setHeader('Allow', 'GET,POST').end();
}

// --- Admin helpers and endpoints ---

// Helper: best-effort audit logger
async function logAudit(pool, { userId = null, action = '', details = '' }) {
  try {
    await pool.query('INSERT INTO audit_logs (user_id, action, details) VALUES ($1,$2,$3)', [userId, action, details]);
  } catch (err) {
    // non-fatal
    console.error('logAudit error (ignored):', err.message || err);
  }
}

// Utility to get storage key from public URL (works for Supabase public urls)
function storageKeyFromPublicUrl(url) {
  if (!url) return null;
  const marker = '/storage/v1/object/public/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

export async function adminHandler(req, res) {
  const pool = getPool();
  // PATCH /api/campaigns/status/:id
  if (req.method === 'PATCH' && Array.isArray(req.query.slug) && req.query.slug[0] === 'status' && req.query.slug[1]) {
    const campaignId = req.query.slug[1];
    const { status, userId } = req.body || {};
    if (!['draft', 'publish'].includes(status)) return res.status(400).json({ error: "Status must be 'draft' or 'publish'" });
    try {
      const result = await pool.query('UPDATE campaigns SET status = $1, updated_at = NOW() WHERE campaign_id = $2 RETURNING campaign_id, status', [status, campaignId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
      await logAudit(pool, { userId: userId || null, action: `Campaign: ${status}`, details: `Campaign ID ${campaignId} status changed to ${status}` });
      return res.json({ message: 'Status updated', campaign: result.rows[0] });
    } catch (err) {
      console.error('admin status error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT /api/campaigns/update/:id  — accepts images array similar to create
  if ((req.method === 'PUT' || req.method === 'POST') && Array.isArray(req.query.slug) && req.query.slug[0] === 'update' && req.query.slug[1]) {
    const campaignId = req.query.slug[1];
    const body = req.body || {};
    const { campaign_name, campaign_type, campaign_description, foundation_id, goal_amount, start_date, end_date, is_featured, images, userId } = body;
    try {
      const check = await pool.query('SELECT file_url FROM campaigns WHERE campaign_id = $1', [campaignId]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });

      const oldFileUrl = check.rows[0].file_url;

      // If images provided, clear existing campaign_media and delete from storage
      if (Array.isArray(images) && images.length > 0) {
        const mediaRows = await pool.query('SELECT media_id, file_url FROM campaign_media WHERE campaign_id = $1', [campaignId]);
        for (const m of mediaRows.rows) {
          try {
            const key = storageKeyFromPublicUrl(m.file_url);
            if (key) await supabase.storage.from('campaigns').remove([key]);
          } catch (e) {
            console.error('Failed to delete old campaign media object:', e.message || e);
          }
        }
        await pool.query('DELETE FROM campaign_media WHERE campaign_id = $1', [campaignId]);
      }

      // Upload new images if any
      let mainFileUrl = null;
      if (Array.isArray(images) && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (!img || !img.contentBase64 || !img.fileName) continue;
          const buffer = Buffer.from(img.contentBase64, 'base64');
          const key = `campaigns/${campaignId}/${Date.now()}-${img.fileName}`;
          const { error: uploadErr } = await supabase.storage.from('campaigns').upload(key, buffer, { contentType: img.contentType || 'image/*', upsert: true });
          if (uploadErr) { console.error('upload err', uploadErr); continue; }
          const publicUrl = supabase.storage.from('campaigns').getPublicUrl(key).data.publicUrl;
          if (!mainFileUrl) mainFileUrl = publicUrl;
          await pool.query('INSERT INTO campaign_media (campaign_id, file_url, media_type) VALUES ($1,$2,$3)', [campaignId, publicUrl, 'image']);
        }
      }

      // If mainFileUrl not set and oldFileUrl exists, keep it. Otherwise update file_url
      const fileUrlToSet = mainFileUrl || oldFileUrl || null;

      await pool.query(`UPDATE campaigns SET campaign_name=$1, campaign_type=$2, campaign_description=$3, goal_amount=$4, start_date=$5, end_date=$6, file_url=$7, media_type=$8, is_featured=$9, updated_at=NOW() WHERE campaign_id = $10`, [campaign_name, campaign_type, campaign_description, goal_amount || null, start_date || null, end_date || null, fileUrlToSet, fileUrlToSet ? 'image' : null, (is_featured === true || is_featured === 'true'), campaignId]);

      if (foundation_id) {
        await pool.query('DELETE FROM foundation_campaigns WHERE campaign_id = $1', [campaignId]);
        await pool.query('INSERT INTO foundation_campaigns (foundation_id, campaign_id) VALUES ($1,$2)', [foundation_id, campaignId]);
      }

      await logAudit(pool, { userId: userId || null, action: 'Campaign: Updated', details: `Updated campaign ID ${campaignId}: ${campaign_name || ''}` });
      return res.json({ message: 'Campaign updated' });
    } catch (err) {
      console.error('admin update error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE /api/campaigns/delete/:id
  if (req.method === 'DELETE' && Array.isArray(req.query.slug) && req.query.slug[0] === 'delete' && req.query.slug[1]) {
    const campaignId = req.query.slug[1];
    const { userId } = req.body || {};
    try {
      const mediaRows = await pool.query('SELECT file_url FROM campaign_media WHERE campaign_id = $1', [campaignId]);
      for (const m of mediaRows.rows) {
        try { const key = storageKeyFromPublicUrl(m.file_url); if (key) await supabase.storage.from('campaigns').remove([key]); } catch (e) { console.error('delete media obj err', e); }
      }
      // Also delete main campaign file if present
      const campRes = await pool.query('SELECT file_url FROM campaigns WHERE campaign_id = $1', [campaignId]);
      if (campRes.rows.length > 0 && campRes.rows[0].file_url) {
        try { const k = storageKeyFromPublicUrl(campRes.rows[0].file_url); if (k) await supabase.storage.from('campaigns').remove([k]); } catch (e) { console.error('delete main file err', e); }
      }

      await pool.query('DELETE FROM campaigns WHERE campaign_id = $1', [campaignId]);
      await logAudit(pool, { userId: userId || null, action: 'Campaign: Deleted', details: `Deleted campaign ID ${campaignId}` });
      return res.json({ message: 'Campaign deleted' });
    } catch (err) {
      console.error('admin delete error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/campaigns/:id/media  — add media items
  if (req.method === 'POST' && Array.isArray(req.query.slug) && req.query.slug.length === 1) {
    const campaignId = req.query.slug[0];
    const body = req.body || {};
    const { images, userId } = body;
    if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ error: 'images array required' });
    try {
      let inserted = [];
      for (const img of images) {
        if (!img || !img.contentBase64 || !img.fileName) continue;
        const buffer = Buffer.from(img.contentBase64, 'base64');
        const key = `campaigns/${campaignId}/${Date.now()}-${img.fileName}`;
  const { error: uploadErr } = await supabase.storage.from('campaigns').upload(key, buffer, { contentType: img.contentType || 'image/*', upsert: true });
  if (uploadErr) { console.error('upload err', uploadErr); continue; }
        const publicUrl = supabase.storage.from('campaigns').getPublicUrl(key).data.publicUrl;
        const ins = await pool.query('INSERT INTO campaign_media (campaign_id, file_url, media_type) VALUES ($1,$2,$3) RETURNING *', [campaignId, publicUrl, 'image']);
        inserted.push(ins.rows[0]);
      }
      await logAudit(pool, { userId: userId || null, action: 'Campaign: Media Added', details: `Added ${inserted.length} media to campaign ${campaignId}` });
      return res.json({ inserted });
    } catch (err) {
      console.error('add media error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE /api/campaigns/media/:mediaId  — delete single media by id
  if (req.method === 'DELETE' && Array.isArray(req.query.slug) && req.query.slug[0] === 'media' && req.query.slug[1]) {
    const mediaId = req.query.slug[1];
    const { userId } = req.body || {};
    try {
      const m = await pool.query('SELECT file_url FROM campaign_media WHERE media_id = $1', [mediaId]);
      if (m.rows.length === 0) return res.status(404).json({ error: 'Media not found' });
      const fileUrl = m.rows[0].file_url;
      try { const key = storageKeyFromPublicUrl(fileUrl); if (key) await supabase.storage.from('campaigns').remove([key]); } catch (e) { console.error('delete storage object err', e); }
      await pool.query('DELETE FROM campaign_media WHERE media_id = $1', [mediaId]);
      await logAudit(pool, { userId: userId || null, action: 'Campaign: Media Deleted', details: `Deleted media ${mediaId}` });
      return res.json({ message: 'Deleted' });
    } catch (err) {
      console.error('delete media error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/campaigns/media/reorder  — body: { campaign_id, order: [media_id,...], userId }
  if (req.method === 'POST' && Array.isArray(req.query.slug) && req.query.slug[0] === 'media' && req.query.slug[1] === 'reorder') {
    const { campaign_id, order, userId } = req.body || {};
    if (!campaign_id || !Array.isArray(order)) return res.status(400).json({ error: 'campaign_id and order[] required' });
    try {
      // Update uploaded_at to reflect new order (earliest = first in order)
      let base = Date.now();
      for (let i = 0; i < order.length; i++) {
        const mediaId = order[i];
        const ts = new Date(base + i * 1000); // 1s apart
        await pool.query('UPDATE campaign_media SET uploaded_at = $1 WHERE media_id = $2 AND campaign_id = $3', [ts, mediaId, campaign_id]);
      }
      await logAudit(pool, { userId: userId || null, action: 'Campaign: Media Reordered', details: `Reordered media for campaign ${campaign_id}` });
      return res.json({ message: 'Reordered' });
    } catch (err) {
      console.error('reorder media error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // If not matched, return method not allowed for admin actions
  return res.status(405).setHeader('Allow', 'GET,POST,PUT,PATCH,DELETE').end();
}
