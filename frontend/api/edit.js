const { google } = require('googleapis');
const { getAuthClient } = require('./sheetsAuth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { oldBin, newBin, name, date } = req.body;

  if ([oldBin, newBin].some(n => isNaN(parseInt(n))) || !name || !date) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  const rowOld = parseInt(oldBin) + 1;
  const rowNew = parseInt(newBin) + 1;
  const sheetName = `'Pickup App'`;

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const SHEET_ID = process.env.SHEET_ID;

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
      // Just update existing bin
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!B${rowOld}:C${rowOld}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[name, date]] },
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('POST /api/edit error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

