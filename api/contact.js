// Vercel Serverless - /api/contact.js
// POST: { name, email, message } -> saves to data/contacts.json via lowdb

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFile = path.join(__dirname, '..', 'data', 'contacts.json');

// Initialize lowdb
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { contacts: [] });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only' });

  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message required' });
    }

    await db.read();
    db.data.contacts = db.data.contacts || [];
    db.data.contacts.push({
      name: String(name),
      email: String(email),
      message: String(message),
      date: new Date().toISOString()
    });
    await db.write();

    return res.status(200).json({ success: true, message: 'Message saved successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to save: ' + error.message });
  }
}