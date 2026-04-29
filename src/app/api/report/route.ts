import { NextResponse } from 'next/server';
import { generateComplianceReport, ScanResultData } from '@/lib/pdfGenerator';

export async function POST(request: Request) {
  try {
    const scanData: ScanResultData = await request.json();

    // Basic validation
    if (!scanData.url || !scanData.grade || scanData.score === undefined) {
      return NextResponse.json({ error: 'Invalid scan data' }, { status: 400 });
    }

    const pdfBuffer = await generateComplianceReport(scanData);

    // Return the PDF as a downloadable file
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Security_Report_${new URL(scanData.url).hostname}_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF report' }, { status: 500 });
  }
}
