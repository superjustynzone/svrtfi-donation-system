/* eslint-disable no-undef */
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';

async function main(){
  const BASE = process.env.BASE_URL || 'http://localhost:3000';
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) { console.error('Please set JWT_SECRET in env'); process.exit(1); }

  const token = jwt.sign({ role: 'admin', user_id: 1 }, JWT_SECRET, { expiresIn: '1h' });
  console.log('Using token (first 40 chars):', token.slice(0,40)+'...');

  try {
    console.log('Calling summary...');
    const s = await fetch(`${BASE}/api/admin/reports/summary`, { headers: { Authorization: `Bearer ${token}` } });
    const sj = await s.json();
    console.log('Summary status:', s.status);
    console.log(JSON.stringify(sj, null, 2));
  } catch (err) {
    console.error('Summary call failed', err);
  }

  try {
    console.log('Calling download (small range)...');
    const d = await fetch(`${BASE}/api/admin/reports/download?startDate=2000-01-01&endDate=2099-01-01`, { headers: { Authorization: `Bearer ${token}` } });
    if (d.status === 200) {
      const csv = await d.text();
      await fs.mkdir('./tmp', { recursive: true });
      await fs.writeFile('./tmp/donation_report.csv', csv, 'utf8');
      console.log('Saved CSV to ./tmp/donation_report.csv (length:', csv.length, ')');
    } else {
      const json = await d.json().catch(()=>null);
      console.log('Download status:', d.status, 'response:', json);
    }
  } catch (err) {
    console.error('Download call failed', err);
  }
}

main().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1); });
