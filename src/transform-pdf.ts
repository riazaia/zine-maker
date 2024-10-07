import { PDFDocument, PDFPage, PageSizes, degrees } from "pdf-lib";
import { PdfData } from "./main";
import { CONFIG } from "./main";

export async function transformPdf(sourcePdf: PdfData): Promise<PDFDocument> {
  console.log("trans start");
  const pagesNum = sourcePdf.doc.getPageCount();
  let newPageOrder = getNewOrder(pagesNum);

  let reorderedPdf = reorder(sourcePdf.doc, newPageOrder);
  let combinedPdf = combine(reorderedPdf);
  console.log("trans end");
  return combinedPdf;
}

function getNewOrder(num: number) {
  console.log("order arr start");
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
  let i0result = result.map((a) => a - 1);
  console.log("order arr end");
  return i0result;
}

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
  console.log("reorder start");
  const pages = pdfDoc.getPages();

  for (let currentPage = 0; currentPage < newOrder.length; currentPage++) {
    pdfDoc.removePage(currentPage);
    pdfDoc.insertPage(currentPage, pages[newOrder[currentPage]]);
  }
  console.log("reorder end");
  return pdfDoc;
}

async function combine(source: PDFDocument) {
  console.log("combine start");
  const targetPdf = await PDFDocument.create();
  let targetPageIdx = 0;

  let srcPages = source.getPages();

  srcPages.forEach(async (value, index: number, array) => {
    if (index % 2) {
      return;
    } else {
      console.log(`Using page ${index + 1} and ${index + 2}`);

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
  console.log("combine end");
  return targetPdf;
}
