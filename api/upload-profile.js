import supabase from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').end();
    return;
  }

  const { bucket = 'profiles', fileName, contentBase64, contentType } = req.body || {};
  if (!fileName || !contentBase64) {
    res.status(400).json({ message: 'fileName and contentBase64 are required' });
    return;
  }

  try {
    const buffer = Buffer.from(contentBase64, 'base64');

    const { data, error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
    });

    if (error) {
      console.error('Supabase upload error:', error.message || error);
      res.status(500).json({ error: error.message || error });
      return;
    }

    // return a public or signed URL
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    res.json({ success: true, path: data?.path, publicUrl: publicData.publicUrl });
  } catch (err) {
    console.error('Upload handler error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
