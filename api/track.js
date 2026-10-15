// Vercel Serverless - /api/track.js
// POST: Increments page view counter

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const statsFile = path.join(__dirname, '..', 'data', 'stats.json');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const adapter = new JSONFile(statsFile);
    const db = new Low(adapter, { totalViews: 0, dailyViews: {} });
    await db.read();
    db.data.totalViews = (db.data.totalViews || 0) + 1;
    const today = new Date().toDateString();
    db.data.dailyViews = db.data.dailyViews || {};
    db.data.dailyViews[today] = (db.data.dailyViews[today] || 0) + 1;
    await db.write();
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(200).json({ success: true });
  }
}