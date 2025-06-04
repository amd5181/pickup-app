const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');

const app = express();

// ✅ CORS MUST COME FIRST — BEFORE any routes
app.use(cors()); // Open for testing, restrict later if needed
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SHEET_ID = process.env.SHEET_ID;

// ✅ Auth client for Google Sheets
const auth = new google.auth.GoogleAuth({
  keyFile: './credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// ✅ Routes
app.get('/bins', async (req, res, next) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'Pickup App'!A2:C19`,
    });
    const raw = result.data.values || [];
    const cleaned = raw.map(row => row.slice(1));  // remove Bin column
    res.json(cleaned);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.post('/bins/:binNumber/clear', async (req, res) => {
  const bin = parseInt(req.params.binNumber);
  const row = bin + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `'Pickup App'!B${row}:C${row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['', '']] },
  });
  res.json({ success: true });
});

app.post('/bins/:binNumber/edit', async (req, res) => {
  const oldBin = parseInt(req.params.binNumber);
  const { name, date, newBin } = req.body;
  const rowOld = oldBin + 1;
  const rowNew = newBin + 1;
  const sheetName = `'Pickup App'`;

  try {
    if (oldBin !== newBin) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!B${rowNew}:C${rowNew}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[name, date]] },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!B${rowOld}:C${rowOld}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['', '']] },
      });
    } else {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!B${rowOld}:C${rowOld}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[name, date]] },
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
