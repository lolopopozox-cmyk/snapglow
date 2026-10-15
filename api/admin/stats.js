// Vercel Serverless - /api/admin/stats.js
// GET: protected by x-admin-key header -> returns stats + contacts

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contactsFile = path.join(__dirname, '..', 'data', 'contacts.json');
const statsFile = path.join(__dirname, '..', 'data', 'stats.json');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Track page view (POST)
  if (req.method === 'POST') {
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

  // GET - requires admin key
  if (req.method === 'GET') {
    const adminKey = req.headers['x-admin-key'] || '';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'snapglow2024';

    if (adminKey !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
      const statsAdapter = new JSONFile(statsFile);
      const statsDb = new Low(statsAdapter, { totalViews: 0, dailyViews: {} });
      await statsDb.read();

      const contactsAdapter = new JSONFile(contactsFile);
      const contactsDb = new Low(contactsAdapter, { contacts: [] });
      await contactsDb.read();

      return res.status(200).json({
        success: true,
        totalViews: statsDb.data.totalViews || 0,
        dailyViews: statsDb.data.dailyViews || {},
        contacts: contactsDb.data.contacts || []
      });
    } catch (e) {
      return res.status(200).json({
        success: true,
        totalViews: 0,
        contacts: []
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}