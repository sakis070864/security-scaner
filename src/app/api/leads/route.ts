import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = '19NVFuzAgrO8XlLWkaYzyOtU_eSpESEOPQxR9T-iN7Pk';

export async function POST(request: Request) {
  try {
    const { email, url, grade, score, timestamp } = await request.json();

    if (!email || !url) {
      return NextResponse.json({ error: 'Email and URL are required' }, { status: 400 });
    }

    // Parse service account credentials from environment variable
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) {
      console.error('GOOGLE_SERVICE_ACCOUNT_JSON not set');
      // Still return success to the user — don't block their experience
      return NextResponse.json({ success: true });
    }

    let credentials;
    try {
      credentials = JSON.parse(credentialsJson);
    } catch {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON');
      return NextResponse.json({ success: true });
    }

    // Authenticate with Google Sheets API
    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
    await doc.loadInfo();

    // Use the first sheet
    const sheet = doc.sheetsByIndex[0];

    // Ensure headers exist (creates them if the sheet is empty)
    try {
      await sheet.loadHeaderRow();
    } catch {
      // Sheet has no headers yet — set them up
      await sheet.setHeaderRow(['Date', 'Email', 'Website', 'Grade', 'Score']);
    }

    // Append the lead data
    await sheet.addRow({
      Date: new Date(timestamp || Date.now()).toLocaleString('en-US', { timeZone: 'America/New_York' }),
      Email: email,
      Website: url,
      Grade: grade || 'N/A',
      Score: score !== undefined ? `${score}%` : 'N/A',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Leads API Error:', error);
    // Always return success to the user — lead capture failure should be silent
    return NextResponse.json({ success: true });
  }
}
