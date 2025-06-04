const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');

const app = express();

// ✅ CORS setup for Vercel frontend
app.use(cors({
  origin: 'https://pickup-app-sigma.vercel.app',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.options('*', cors()); // Handle preflight requests

app.use(express.json());

const PORT = process.env.PORT || 3001;
const SHEET_ID = process.env.SHEET_ID;

// Google Sheets auth
const auth = new google.auth.GoogleAuth({
  keyFile: './credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// GET bins
app.get('/bins', async (req, res) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'Pickup App'!A2:C19`,
    });
    const raw = result.data.values || [];
    const cleaned = raw.map(row => row.slice(1)); // Drop "Bin" column
    res.json(cleaned);
  } catch (err) {
    console.error('GET /bins failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST clear a bin
app.post('/bins/:binNumber/clear', async (req, res) => {
  try {
    const bin = parseInt(req.params.binNumber);
    const row = bin + 1;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'Pickup App'!B${row}:C${row}`,
      valueInputOption: 'RAW',
      requestBody: { values: [['', '']] },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('POST /clear failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST edit or move bin
app.post('/bins/:binNumber/edit', async (req, res) => {
  try {
    const oldBin = parseInt(req.params.binNumber);
    const { name, date, newBin } = req.body;

    const rowOld = oldBin + 1;
    const rowNew = newBin + 1;

    if (oldBin !== newBin) {
      // Move to new bin
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'Pickup App'!B${rowNew}:C${rowNew}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[name, date]] },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'Pickup App'!B${rowOld}:C${rowOld}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['', '']] },
      });
    } else {
      // Just update existing
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'Pickup App'!B${rowOld}:C${rowOld}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[name, date]] },
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('POST /edit failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
