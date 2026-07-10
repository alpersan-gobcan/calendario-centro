import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Path to the ODT template in the public folder
    const templatePath = path.join(process.cwd(), 'public', 'PLANTILLA AUTORIZACIONES.odt');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: "Plantilla no encontrada en public/PLANTILLA AUTORIZACIONES.odt" }, { status: 404 });
    }

    // Load the zip file
    const zip = new AdmZip(templatePath);
    
    // ODT files store their main text in content.xml
    const contentXmlEntry = zip.getEntry('content.xml');
    if (!contentXmlEntry) {
      return NextResponse.json({ error: "Formato de plantilla inválido" }, { status: 500 });
    }

    let contentXml = zip.readAsText(contentXmlEntry);

    // Prepare replacements
    // Note: LibreOffice sometimes splits tags with XML elements if they were formatted partially.
    // Assuming the user pasted them exactly as text without inner formatting.
    // Helper to format dates from YYYY-MM-DD to DD-MM-YYYY
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      return dateString.split(',').map(d => {
        const parts = d.trim().split('-');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return d.trim();
      }).join(', ');
    };

    const now = new Date();
    const currentDay = now.getDate().toString();
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const currentMonth = months[now.getMonth()];
    const currentYear = now.getFullYear().toString();

    const replacements: Record<string, string> = {
      '{{ACTIVIDAD}}': data.activity || '',
      '{{FECHA}}': formatDate(data.dateStr),
      '{{LUGAR}}': data.location || '',
      '{{HORA_SALIDA}}': data.transportDepartureTime || '',
      '{{HORA_LLEGADA}}': data.arrivalTime || '',
      '{{COSTE}}': data.cost || '',
      '{{GRUPOS}}': data.group || '',
      '{{ORGANIZA}}': data.organizer || '',
      '{{ACOMPANANTES}}': data.teachers || '',
      '{{DESCRIPCION}}': data.description || '',
      '{{TIPO_ACTIVIDAD}}': data.authType || '',
      '{{OBSERVACIONES}}': data.notes || '',
      '{{LAST_DAY}}': formatDate(data.lastDay),
      '{{DIA}}': currentDay,
      '{{MES}}': currentMonth,
      '{{AÑO}}': currentYear
    };

    // Helper to escape XML special characters
    const escapeXml = (unsafe: string) => {
      return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    // Replace all tags using regex to handle LibreOffice XML splits (e.g. {{<text:span>LAST_DAY</text:span>}})
    for (const [tag, value] of Object.entries(replacements)) {
      const safeValue = escapeXml(value);
      const chars = tag.split('').map(c => (c === '{' || c === '}') ? '\\' + c : c);
      const pattern = chars.join('(?:<[^>]+>)*');
      const regex = new RegExp(pattern, 'g');
      contentXml = contentXml.replace(regex, safeValue);
    }

    // Update the content.xml in the zip
    zip.updateFile('content.xml', Buffer.from(contentXml, 'utf8'));

    // Generate the final buffer
    const buffer = zip.toBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.oasis.opendocument.text',
        'Content-Disposition': `attachment; filename="Autorizacion.odt"`,
      },
    });

  } catch (error) {
    console.error("Error generating ODT:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
