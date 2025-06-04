const { google } = require('googleapis');
const { getAuthClient } = require('./sheetsAuth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const bin = parseInt(req.query.binNumber); // e.g., /api/clear?binNumber=4
  if (isNaN(bin)) {
    return res.status(400).json({ error: 'Invalid bin number' });
  }

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const SHEET_ID = process.env.SHEET_ID;
    const row = bin + 1;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'Pickup App'!B${row}:C${row}`,
      valueInputOption: 'RAW',
      requestBody: { values: [['', '']] },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('POST /api/clear error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
