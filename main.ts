import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument, PageSizes, degrees } from "pdf-lib";

export interface PdfData {
  bytes: ArrayBuffer;
  doc: PDFDocument;
}

const currentDate = new Date().toISOString();

export const CONFIG: {
  sourcePath: string;
  outputPath: string;
  size: "A4" | "Letter";
} = {
  sourcePath: "source/test-136.pdf",
  outputPath: `result/${currentDate}.pdf`,
  size: "A4",
};

async function run() {
  let pdfDocument = await getPdf();
  let editedPdfDocument = await transformPdf(pdfDocument);
  await downloadPdf(editedPdfDocument);
}

run();

export async function getPdf(): Promise<PdfData> {
  const filePath = new URL(CONFIG.sourcePath, import.meta.url);
  const bytes = await readFile(filePath);
  const doc = await PDFDocument.load(bytes);
  return {
    bytes,
    doc,
  };
}

export async function transformPdf(sourcePdf: PdfData): Promise<PDFDocument> {
  const pagesNum = sourcePdf.doc.getPageCount();
  let newPageOrder = getNewOrder(pagesNum);

  let reorderedPdf = reorder(sourcePdf.doc, newPageOrder);
  let combinedPdf = combine(reorderedPdf);
  return combinedPdf;
}

async function downloadPdf(pdf: PDFDocument) {
  const bytes = await pdf.save();
  await writeFile(CONFIG.outputPath, bytes);
}

// when printing a half-size zine we need to reorder the pages such that when we fold each page in half, the content appears in the right order
// when given a page count, this function returns an array with the pages in the right order. e.g. for a 6-page pdf it returns:
// [ 7, 0, 1, 6, 5, 2, 3, 4 ]
function getNewOrder(num: number) {
  let result: number[] = [];
  let n = normalizeNumber(num, 4);

  let i = 0;
  let j = n - 1;

  let currentPage = 1;

  while (i < j) {
    if (currentPage % 2 === 0) {
      result.push(n - j);
      result.push(n - i);
    } else {
      result.push(n - i);
      result.push(n - j);
    }
    i++;
    j--;
    currentPage++;
  }
  // transform the resulting array into index zero
  let i0result = result.map((a) => a - 1);
  return i0result;
}

// takes a number "n" and a divisor "d" to test it against. if "n" is divisible by "d", then the function returns "n". if it's not divisble then the function returns the next integer that is. e.g. normalizeNumber(72, 10) returns 80
// when creating a new pdf, we need the page count to be a multiple of 4
function normalizeNumber(n: number, d: number) {
  let remainder = n % d;
  if (remainder === 0) {
    return n;
  } else {
    let quotient = Math.floor(n / d);
    return (quotient + 1) * d;
  }
}

function reorder(pdfDoc: PDFDocument, newOrder: number[]) {
  const pages = pdfDoc.getPages();

  for (let currentPage = 0; currentPage < newOrder.length; currentPage++) {
    pdfDoc.removePage(currentPage);
    pdfDoc.insertPage(currentPage, pages[newOrder[currentPage]]);
  }
  return pdfDoc;
}

async function combine(source: PDFDocument) {
  const targetPdf = await PDFDocument.create();
  let targetPageIdx = 0;

  let srcPages = source.getPages();

  srcPages.forEach(async (value, index: number, array) => {
    if (index % 2) {
      return;
    } else {
      const zinePage = targetPdf.addPage(PageSizes[CONFIG.size]);
      const [width, height] = PageSizes[CONFIG.size];

      const [first, second] = await targetPdf.embedPages([
        array[index],
        array[index + 1],
      ]);

      zinePage.drawPage(first, {
        x: 0,
        y: height,
        rotate: degrees(-90),
        width: height / 2,
        height: width,
      });

      zinePage.drawPage(second, {
        x: 0,
        y: height / 2,
        width: height / 2,
        height: width,
        rotate: degrees(-90),
      });

      if (targetPageIdx % 2) {
        zinePage.setRotation(degrees(180));
      }
      targetPageIdx++;
    }
  });
  return targetPdf;
}
