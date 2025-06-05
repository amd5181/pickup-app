import { google } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const credentials = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'credentials.json'), 'utf-8')
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const sheetId = process.env.SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'Pickup App'!A2:C19`,
    });

    const rows = response.data.values || [];

    // Ensure exactly 18 bins
    const bins = Array.from({ length: 18 }, (_, i) => {
      const row = rows[i] || [];
      return {
        bin: (i + 1).toString(),
        employee: row[1] || '',
        date: row[2] || '',
      };
    });

    res.status(200).json(bins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching bins' });
  }
}
