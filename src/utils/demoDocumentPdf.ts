import jsPDF from 'jspdf';
import type { ChunkItem, DocumentItem } from '../types';

// Seeded records are metadata/chunks, not source files. Label their PDF accordingly.
export function openDemoDocumentPreview(doc: DocumentItem, chunks: ChunkItem[]): void {
  const pdf = new jsPDF();
  let y = 20;
  const clean = (text: string) => text
    .replace(/₹/g, 'INR ')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/[^\x20-\x7E\n]/g, ' ');
  const addText = (text: string, fontSize = 11) => {
    pdf.setFontSize(fontSize);
    for (const line of pdf.splitTextToSize(clean(text), 170)) {
      if (y > 275) { pdf.addPage(); y = 20; }
      pdf.text(line, 20, y);
      y += fontSize * 0.5 + 2;
    }
    y += 5;
  };

  addText('TRUSTRACE - GENERATED DEMO PREVIEW', 15);
  addText('This PDF is assembled from demo metadata and stored excerpts. It is NOT the original source file.', 10);
  addText(doc.title, 14);
  addText(`Classification: ${doc.classification} | Department: ${doc.department} | Version: ${doc.version}`);
  addText(`Owner: ${doc.ownerName} | Type: ${doc.docType}`);
  addText('Summary', 13);
  addText(doc.summary || 'No summary is available for this record.');
  addText('Available excerpts', 13);
  if (!chunks.length) addText('No document excerpts are available for this record.');
  for (const chunk of chunks) {
    addText(`Page ${chunk.page} - ${chunk.id}`, 11);
    addText(chunk.content);
  }
  const url = URL.createObjectURL(pdf.output('blob'));
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
