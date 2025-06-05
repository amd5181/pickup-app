import { google } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const credentials = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'credentials.json'), 'utf-8')
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const sheetId = process.env.SHEET_ID;

    const { bin, employee, date } = req.body;

    if (!bin) {
        return res.status(400).json({ error: 'Missing bin' });
    }

    // Get all rows
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'Pickup App'!A2:A19`

    });

    const rows = getRes.data.values || [];

    // Debugging output
    console.log("🧪 Raw sheet rows:", JSON.stringify(rows, null, 2));
    console.log("🔎 Looking for bin:", bin);

    // Stringified match
    const rowIndex = rows.findIndex(row => row[0]?.toString() === bin.toString());
    console.log("✅ Match found at index:", rowIndex);

    if (rowIndex === -1) {
      return res.status(404).json({ error: `Bin ${bin} not found` });
    }

    // Update the row (index + 2 because A2 is the first row we're checking)
    const updateRange = `'Pickup App'!A${rowIndex + 2}:C${rowIndex + 2}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: updateRange,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[bin, employee, date]],
      },
    });

    res.status(200).json({ message: `Bin ${bin} updated successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update bin' });
  }
}
