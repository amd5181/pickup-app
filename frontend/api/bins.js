const { google } = require('googleapis');
const { getAuthClient } = require('./sheetsAuth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const SHEET_ID = process.env.SHEET_ID;

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'Pickup App'!A2:C19`,
    });

    const raw = result.data.values || [];
    const cleaned = raw.map(row => row.slice(1));
    res.status(200).json(cleaned);
  } catch (err) {
    console.error('GET /api/bins error:', err);
    res.status(500).json({ error: 'Failed to fetch bin data' });
  }
};

