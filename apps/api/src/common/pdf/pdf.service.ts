import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

export interface OfficialPdfInput {
  title: string;
  code: string;
  subtitle?: string;
  lines: Array<{ label: string; value: string }>;
  traceabilityToken?: string;
}

@Injectable()
export class PdfService {
  async renderOfficial(input: OfficialPdfInput): Promise<Buffer> {
    const document = await PDFDocument.create();
    const page = document.addPage([595, 842]);
    const regular = await document.embedFont(StandardFonts.Helvetica);
    const bold = await document.embedFont(StandardFonts.HelveticaBold);
    const teal = rgb(0.17, 0.54, 0.51);
    page.drawRectangle({ x: 0, y: 790, width: 595, height: 52, color: rgb(0.07, 0.18, 0.28) });
    page.drawText('MediFlow', { x: 42, y: 809, size: 18, font: bold, color: rgb(1, 1, 1) });
    page.drawText('CLINIQUE SAINT-CLAIR · DOCUMENT OFFICIEL', { x: 42, y: 797, size: 7, font: regular, color: rgb(0.7, 0.85, 0.86) });
    page.drawText(input.title, { x: 42, y: 732, size: 24, font: bold, color: rgb(0.09, 0.17, 0.3) });
    page.drawText(input.code, { x: 42, y: 708, size: 11, font: bold, color: teal });
    if (input.subtitle) page.drawText(input.subtitle, { x: 42, y: 688, size: 10, font: regular, color: rgb(0.35, 0.42, 0.5) });
    let y = 642;
    for (const line of input.lines) {
      page.drawText(line.label.toUpperCase(), { x: 42, y, size: 7, font: bold, color: rgb(0.5, 0.57, 0.65) });
      page.drawText(line.value, { x: 42, y: y - 17, size: 11, font: regular, color: rgb(0.09, 0.17, 0.3) });
      page.drawLine({ start: { x: 42, y: y - 28 }, end: { x: 553, y: y - 28 }, thickness: 0.6, color: rgb(0.88, 0.91, 0.94) });
      y -= 61;
    }
    if (input.traceabilityToken) {
      const qr = await QRCode.toBuffer(input.traceabilityToken, { margin: 1, width: 180 });
      const qrImage = await document.embedPng(qr);
      page.drawImage(qrImage, { x: 430, y: 85, width: 92, height: 92 });
      page.drawText('Vérification / traçabilité', { x: 411, y: 72, size: 7, font: bold, color: teal });
    }
    page.drawLine({ start: { x: 42, y: 55 }, end: { x: 553, y: 55 }, thickness: 0.8, color: teal });
    page.drawText('MediFlow · Pièce générée électroniquement · Conservation dans la GED', { x: 42, y: 38, size: 7.5, font: regular, color: rgb(0.45, 0.52, 0.6) });
    page.drawText('Page 1 / 1', { x: 508, y: 38, size: 7.5, font: regular, color: rgb(0.45, 0.52, 0.6) });
    return Buffer.from(await document.save());
  }
}
