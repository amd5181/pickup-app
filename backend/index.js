const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const SHEET_ID = process.env.SHEET_ID;

// CORS for your deployed frontend (add localhost for local testing as needed)
app.use(cors({
  origin: [
    'https://pickup-app-sigma.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  keyFile: './credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Health check endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint works.' });
});

// Get all bin data
app.get('/bins', async (req, res) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'Pickup App'!A2:C19`,
    });
    const raw = result.data.values || [];
    const cleaned = raw.map(row => row.slice(1)); // Remove the Bin column
    res.json(cleaned);
  } catch (err) {
    console.error('Error fetching bins:', err);
    res.status(500).json({ error: 'Failed to fetch bins.' });
  }
});

// Clear a bin (set employee + date blank)
app.post('/bins/:binNumber/clear', async (req, res) => {
  const bin = parseInt(req.params.binNumber);
  const row = bin + 1;
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'Pickup App'!B${row}:C${row}`,
      valueInputOption: 'RAW',
      requestBody: { values: [['', '']] },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing bin:', err);
    res.status(500).json({ success: false, error: 'Failed to clear bin.' });
  }
});

// Edit name/date and optionally move to new bin
app.post('/bins/:binNumber/edit', async (req, res) => {
  const oldBin = parseInt(req.params.binNumber);
  const { name, date, newBin } = req.body;
  const rowOld = oldBin + 1;
  const rowNew = newBin + 1;
  const sheetName = `'Pickup App'`;
  try {
    if (oldBin !== newBin) {
      // Write to new bin
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!B${rowNew}:C${rowNew}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[name, date]] },
      });
      // Clear old bin
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!B${rowOld}:C${rowOld}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['', '']] },
      });
    } else {
      // Just update current bin
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!B${rowOld}:C${rowOld}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[name, date]] },
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error editing bin:', err);
    res.status(500).json({ success: false, error: 'Failed to edit bin.' });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
