import { getPool } from '../../_db.js';
import supabase from '../../_supabase.js';
import { Buffer } from 'buffer';

function getSlugParts(req) {
  const slug = req.query && req.query.slug;
  if (!slug) return [];
  return Array.isArray(slug) ? slug : String(slug).split('/').filter(Boolean);
}

function storageKeyFromPublicUrl(url) {
  if (!url) return null;
  const marker = '/storage/v1/object/public/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

async function logAudit(pool, { userId = null, action = '', details = '' }) {
  try {
    await pool.query('INSERT INTO audit_logs (user_id, action, details) VALUES ($1,$2,$3)', [userId, action, details]);
  } catch (err) {
    console.error('logAudit error (ignored):', err.message || err);
  }
}

export default async function handler(req, res) {
  const pool = getPool();
  const slug = getSlugParts(req);

  // POST /api/stories/create — accepts images array with base64
  if (req.method === 'POST' && slug.length === 1 && slug[0] === 'create') {
    const body = req.body || {};
    const { foundation_id, title, content, tags, author, is_published, scheduled_publish_at, images, userId } = body;
    const publishedFlag = is_published === true || is_published === 'true';

    if (!title || !foundation_id) return res.status(400).json({ error: 'title and foundation_id required' });

    try {
      const publishedDate = publishedFlag ? new Date() : null;
      const result = await pool.query(`INSERT INTO stories (foundation_id, title, content, tags, author, is_published, published_at, scheduled_publish_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING story_id`, [foundation_id, title, content, tags, author, publishedFlag, publishedDate, scheduled_publish_at || null]);
      const storyId = result.rows[0].story_id;

      // Upload images to Supabase and insert story_images
      if (Array.isArray(images) && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (!img || !img.contentBase64 || !img.fileName) continue;
          const buffer = Buffer.from(img.contentBase64, 'base64');
          const key = `stories/${storyId}/${Date.now()}-${img.fileName}`;
          const { error: uploadErr } = await supabase.storage.from('stories').upload(key, buffer, { contentType: img.contentType || 'image/*', upsert: true });
          if (uploadErr) { console.error('story image upload err', uploadErr); continue; }
          const publicUrl = supabase.storage.from('stories').getPublicUrl(key).data.publicUrl;
          await pool.query('INSERT INTO story_images (story_id, image_file, order_index) VALUES ($1,$2,$3)', [storyId, publicUrl, i]);
        }
      }

      await logAudit(pool, { userId: userId || null, action: 'Story: Created', details: `Created story: ${title}` });
      return res.json({ message: 'Story created', story_id: storyId });
    } catch (err) {
      console.error('stories/create error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/stories/all (admin)
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'all') {
    try {
      const q = `SELECT s.*, f.foundation_name, f.image_logo as foundation_logo, COALESCE((SELECT json_agg(json_build_object('image_id', si.image_id, 'image_file', si.image_file, 'order_index', si.order_index) ORDER BY si.order_index) FROM story_images si WHERE si.story_id = s.story_id), '[]') as images FROM stories s LEFT JOIN foundations f ON s.foundation_id = f.foundation_id ORDER BY s.created_at DESC`;
      const result = await pool.query(q);
      return res.json(result.rows);
    } catch (err) {
      console.error('stories/all error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/stories/published (public)
  if (req.method === 'GET' && slug.length === 1 && slug[0] === 'published') {
    try {
      const q = `SELECT s.*, f.foundation_name, f.image_logo as foundation_logo, COALESCE((SELECT json_agg(json_build_object('image_id', si.image_id, 'image_file', si.image_file, 'order_index', si.order_index) ORDER BY si.order_index) FROM story_images si WHERE si.story_id = s.story_id), '[]') as images FROM stories s LEFT JOIN foundations f ON s.foundation_id = f.foundation_id WHERE s.is_published = true ORDER BY s.published_at DESC`;
      const result = await pool.query(q);
      return res.json(result.rows);
    } catch (err) {
      console.error('stories/published error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/stories/foundation/:id
  if (req.method === 'GET' && slug.length === 2 && slug[0] === 'foundation') {
    const foundationId = slug[1];
    try {
      const q = `SELECT s.*, f.foundation_name, f.image_logo as foundation_logo, COALESCE((SELECT json_agg(json_build_object('image_id', si.image_id, 'image_file', si.image_file, 'order_index', si.order_index) ORDER BY si.order_index) FROM story_images si WHERE si.story_id = s.story_id), '[]') as images FROM stories s LEFT JOIN foundations f ON s.foundation_id = f.foundation_id WHERE s.foundation_id = $1 ORDER BY s.created_at DESC`;
      const result = await pool.query(q, [foundationId]);
      return res.json(result.rows);
    } catch (err) {
      console.error('stories/foundation error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/stories/:id
  if (req.method === 'GET' && slug.length === 1) {
    const id = slug[0];
    try {
      const q = `SELECT s.*, f.foundation_name, f.image_logo as foundation_logo, COALESCE((SELECT json_agg(json_build_object('image_id', si.image_id, 'image_file', si.image_file, 'order_index', si.order_index) ORDER BY si.order_index) FROM story_images si WHERE si.story_id = s.story_id), '[]') as images FROM stories s LEFT JOIN foundations f ON s.foundation_id = f.foundation_id WHERE s.story_id = $1`;
      const result = await pool.query(q, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json(result.rows[0]);
    } catch (err) {
      console.error('stories/:id error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH /api/stories/status/:id -> slug ['status', id]
  if ((req.method === 'PATCH' || req.method === 'POST') && slug.length === 2 && slug[0] === 'status') {
    const storyId = slug[1];
    const { is_published, userId } = req.body || {};
    try {
      const publishedFlag = is_published === true || is_published === 'true';
      const publishedDate = publishedFlag ? new Date() : null;
      const result = await pool.query(`UPDATE stories SET is_published=$1, published_at=$2, scheduled_publish_at=NULL, updated_at=NOW() WHERE story_id=$3 RETURNING story_id`, [publishedFlag, publishedDate, storyId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      await logAudit(pool, { userId: userId || null, action: 'Story: Status Updated', details: `Story ID ${storyId} status changed to ${publishedFlag ? 'published' : 'draft'}` });
      return res.json({ message: 'Story status updated' });
    } catch (err) {
      console.error('stories/status error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH /api/stories/schedule/:id -> slug ['schedule', id]
  if ((req.method === 'PATCH' || req.method === 'POST') && slug.length === 2 && slug[0] === 'schedule') {
    const storyId = slug[1];
    const { scheduled_publish_at, userId } = req.body || {};
    try {
      const result = await pool.query(`UPDATE stories SET is_published=false, published_at=NULL, scheduled_publish_at=$1, updated_at=NOW() WHERE story_id=$2 RETURNING story_id`, [scheduled_publish_at, storyId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      await logAudit(pool, { userId: userId || null, action: 'Story: Scheduled', details: `Story ID ${storyId} scheduled for ${scheduled_publish_at}` });
      return res.json({ message: 'Story scheduled' });
    } catch (err) {
      console.error('stories/schedule error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT /api/stories/update/:id -> slug ['update', id]
  if ((req.method === 'PUT' || req.method === 'POST') && slug.length === 2 && slug[0] === 'update') {
    const storyId = slug[1];
    const body = req.body || {};
    const { foundation_id, title, content, tags, author, is_published, scheduled_publish_at, images, keepExistingImages, userId } = body;
    try {
      const publishedFlag = is_published === true || is_published === 'true';
      const publishedDate = publishedFlag ? new Date() : null;

      await pool.query(`UPDATE stories SET foundation_id=$1, title=$2, content=$3, tags=$4, author=$5, is_published=$6, published_at=$7, scheduled_publish_at=$8, updated_at=NOW() WHERE story_id=$9`, [foundation_id, title, content, tags, author, publishedFlag, publishedDate, scheduled_publish_at || null, storyId]);

      // Determine keepExistingImages array
      let imagesToKeep = [];
      if (keepExistingImages) imagesToKeep = Array.isArray(keepExistingImages) ? keepExistingImages : [keepExistingImages];

      // Delete images not in keep list (remove from storage and DB)
      const delQuery = imagesToKeep.length > 0 ? `SELECT image_id, image_file FROM story_images WHERE story_id=$1 AND image_id != ALL($2::bigint[])` : `SELECT image_id, image_file FROM story_images WHERE story_id=$1`;
      const delParams = imagesToKeep.length > 0 ? [storyId, imagesToKeep] : [storyId];
      const imagesToDelete = await pool.query(delQuery, delParams);
      for (const img of imagesToDelete.rows) {
        try { const key = storageKeyFromPublicUrl(img.image_file); if (key) await supabase.storage.from('stories').remove([key]); } catch (e) { console.error('delete story image err', e); }
      }
      const delDbQuery = imagesToKeep.length > 0 ? `DELETE FROM story_images WHERE story_id=$1 AND image_id != ALL($2::bigint[])` : `DELETE FROM story_images WHERE story_id=$1`;
      await pool.query(delDbQuery, delParams);

      // Upload new images if provided
      if (Array.isArray(images) && images.length > 0) {
        const lastOrderRes = await pool.query(`SELECT COALESCE(MAX(order_index), -1) as max FROM story_images WHERE story_id=$1`, [storyId]);
        let nextOrder = (lastOrderRes.rows[0].max || -1) + 1;
        for (const img of images) {
          if (!img || !img.contentBase64 || !img.fileName) continue;
          const buffer = Buffer.from(img.contentBase64, 'base64');
          const key = `stories/${storyId}/${Date.now()}-${img.fileName}`;
          const { error: uploadErr } = await supabase.storage.from('stories').upload(key, buffer, { contentType: img.contentType || 'image/*', upsert: true });
          if (uploadErr) { console.error('upload err', uploadErr); continue; }
          const publicUrl = supabase.storage.from('stories').getPublicUrl(key).data.publicUrl;
          await pool.query('INSERT INTO story_images (story_id, image_file, order_index) VALUES ($1,$2,$3)', [storyId, publicUrl, nextOrder++]);
        }
      }

      await logAudit(pool, { userId: userId || null, action: 'Story: Updated', details: `Updated story ID ${storyId}: ${title || ''}` });
      return res.json({ message: 'Story updated' });
    } catch (err) {
      console.error('stories/update error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE /api/stories/delete/:id -> slug ['delete', id]
  if (req.method === 'DELETE' && slug.length === 2 && slug[0] === 'delete') {
    const storyId = slug[1];
    const { userId } = req.body || {};
    try {
      const imgs = await pool.query('SELECT image_file FROM story_images WHERE story_id=$1', [storyId]);
      for (const img of imgs.rows) {
        try { const key = storageKeyFromPublicUrl(img.image_file); if (key) await supabase.storage.from('stories').remove([key]); } catch (e) { console.error('delete story storage err', e); }
      }
      await pool.query('DELETE FROM stories WHERE story_id=$1', [storyId]);
      await logAudit(pool, { userId: userId || null, action: 'Story: Deleted', details: `Deleted story ID ${storyId}` });
      return res.json({ message: 'Story deleted' });
    } catch (err) {
      console.error('stories/delete error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/stories/:id/media  — add media items
  if (req.method === 'POST' && slug.length === 1) {
    const storyId = slug[0];
    const body = req.body || {};
    const { images, userId } = body;
    if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ error: 'images array required' });
    try {
      const lastOrderRes = await pool.query(`SELECT COALESCE(MAX(order_index), -1) as max FROM story_images WHERE story_id=$1`, [storyId]);
      let nextOrder = (lastOrderRes.rows[0].max || -1) + 1;
      const inserted = [];
      for (const img of images) {
        if (!img || !img.contentBase64 || !img.fileName) continue;
        const buffer = Buffer.from(img.contentBase64, 'base64');
        const key = `stories/${storyId}/${Date.now()}-${img.fileName}`;
        const { error: uploadErr } = await supabase.storage.from('stories').upload(key, buffer, { contentType: img.contentType || 'image/*', upsert: true });
        if (uploadErr) { console.error('upload err', uploadErr); continue; }
        const publicUrl = supabase.storage.from('stories').getPublicUrl(key).data.publicUrl;
        const ins = await pool.query('INSERT INTO story_images (story_id, image_file, order_index) VALUES ($1,$2,$3) RETURNING *', [storyId, publicUrl, nextOrder++]);
        inserted.push(ins.rows[0]);
      }
      await logAudit(pool, { userId: userId || null, action: 'Story: Media Added', details: `Added ${inserted.length} images to story ${storyId}` });
      return res.json({ inserted });
    } catch (err) {
      console.error('stories/add media error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE /api/stories/media/:imageId -> slug ['media', id]
  if (req.method === 'DELETE' && slug.length === 2 && slug[0] === 'media') {
    const imageId = slug[1];
    const { userId } = req.body || {};
    try {
      const m = await pool.query('SELECT image_file FROM story_images WHERE image_id=$1', [imageId]);
      if (m.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      const fileUrl = m.rows[0].image_file;
      try { const key = storageKeyFromPublicUrl(fileUrl); if (key) await supabase.storage.from('stories').remove([key]); } catch (e) { console.error('delete storage err', e); }
      await pool.query('DELETE FROM story_images WHERE image_id=$1', [imageId]);
      await logAudit(pool, { userId: userId || null, action: 'Story: Media Deleted', details: `Deleted image ${imageId}` });
      return res.json({ message: 'Deleted' });
    } catch (err) {
      console.error('stories/delete media error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/stories/media/reorder -> slug ['media','reorder'] body: { story_id, order: [image_id,...] }
  if (req.method === 'POST' && slug.length === 2 && slug[0] === 'media' && slug[1] === 'reorder') {
    const { story_id, order, userId } = req.body || {};
    if (!story_id || !Array.isArray(order)) return res.status(400).json({ error: 'story_id and order[] required' });
    try {
      for (let i = 0; i < order.length; i++) {
        const imageId = order[i];
        await pool.query('UPDATE story_images SET order_index=$1 WHERE image_id=$2 AND story_id=$3', [i, imageId, story_id]);
      }
      await logAudit(pool, { userId: userId || null, action: 'Story: Media Reordered', details: `Reordered images for story ${story_id}` });
      return res.json({ message: 'Reordered' });
    } catch (err) {
      console.error('stories/reorder error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/stories/process-scheduled  — manual trigger for scheduled stories
  if (req.method === 'POST' && slug.length === 1 && slug[0] === 'process-scheduled') {
    try {
      const now = new Date();
      const result = await pool.query(`UPDATE stories SET is_published = true, published_at = scheduled_publish_at, scheduled_publish_at = NULL, updated_at = NOW() WHERE is_published = false AND scheduled_publish_at IS NOT NULL AND scheduled_publish_at <= $1 RETURNING story_id, title`, [now]);
      return res.json({ processed: result.rowCount, rows: result.rows });
    } catch (err) {
      console.error('stories/process-scheduled error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).setHeader('Allow', 'GET,POST,PUT,PATCH,DELETE').end();
}
