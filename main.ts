import { PDFDocument, PDFPage, PageSizes, degrees } from "pdf-lib";
import { transformPdf } from "./transform-pdf";

export interface PdfData {
  bytes: ArrayBuffer;
  doc: PDFDocument;
}

export const CONFIG: {
  sourceUrl: string;
  size: "A4" | "Letter";
} = {
  sourceUrl: "/test-zine-24.pdf",
  // sourceUrl: "/git-zine-test-136.pdf",
  size: "A4",
};

function display() {
  console.log("display start");
  const btnSelector = "#embed";
  const btn = document.querySelector(btnSelector) as HTMLButtonElement;

  if (btn) {
    btn.addEventListener("click", run);
  } else {
    throw new Error(
      `Cannot add event listener because the button ${btnSelector} does not exist`
    );
  }
  console.log("display end");
}

display();

async function run() {
  console.log("run start");
  let pdfDocument = await getPdf();
  let editedPdfDocument = await transformPdf(pdfDocument);
  await embedPdf(editedPdfDocument);
  console.log("run end");
}

export async function getPdf(): Promise<PdfData> {
  console.log("get start");
  const bytes = await fetch(CONFIG.sourceUrl).then((res) => res.arrayBuffer());
  const doc = await PDFDocument.load(bytes);
  console.log("get end");
  return {
    bytes,
    doc,
  };
}

async function embedPdf(pdf: PDFDocument) {
  console.log("embed start");
  const pdfDataUri = await pdf.saveAsBase64({ dataUri: true });

  const pdfContainer = document.querySelector("#pdf") as HTMLIFrameElement;
  if (pdfContainer) {
    pdfContainer.src = pdfDataUri;
  } else {
    throw new Error(
      `Cannot embed pdf on page because the iframe container does not exist`
    );
  }
  console.log("embed end");
}
