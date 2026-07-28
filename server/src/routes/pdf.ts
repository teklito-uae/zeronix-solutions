import { Router } from "express";
import puppeteer, { Browser } from "puppeteer";
import { PDFDocument } from "pdf-lib";
import { db } from "../db.js";
import {
  renderQuoteHtml,
  renderCoverHtml,
  renderContentHtml,
  renderHeaderTemplate,
  renderFooterTemplate,
  splitCoverFromBlocks,
  CONTENT_PAGE_MARGIN,
} from "../renderQuoteHtml.js";
import type { Company, Quote } from "../types.js";

export const pdfRouter = Router();

let browserPromise: Promise<Browser> | null = null;
function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

function loadQuote(id: string) {
  const row = db.prepare("SELECT * FROM quotes WHERE id = ?").get(id) as any;
  if (!row) return null;
  const quote: Quote = { ...row, blocks: JSON.parse(row.blocks) };
  const company = db.prepare("SELECT * FROM company WHERE id = 1").get() as Company;
  return { quote, company };
}

pdfRouter.get("/:id/html", (req, res) => {
  const data = loadQuote(req.params.id);
  if (!data) return res.status(404).send("Not found");
  res.set("Content-Type", "text/html");
  res.send(renderQuoteHtml(data.quote, data.company));
});

async function htmlToPdf(
  browser: Browser,
  html: string,
  options: {
    margin?: { top: string; bottom: string; left: string; right: string };
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
  }
): Promise<Uint8Array> {
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load", timeout: 15000 });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: options.displayHeaderFooter ?? false,
      headerTemplate: options.headerTemplate ?? "<span></span>",
      footerTemplate: options.footerTemplate ?? "<span></span>",
      margin: options.margin ?? { top: "0", bottom: "0", left: "0", right: "0" },
      timeout: 15000,
    });
  } finally {
    await page.close();
  }
}

pdfRouter.get("/:id/pdf", async (req, res) => {
  const data = loadQuote(req.params.id);
  if (!data) return res.status(404).send("Not found");

  try {
    const browser = await getBrowser();
    const { cover, rest } = splitCoverFromBlocks(data.quote.blocks);

    const contentPdfBytes = await htmlToPdf(browser, renderContentHtml(rest, data.quote, data.company), {
      margin: CONTENT_PAGE_MARGIN,
      displayHeaderFooter: true,
      headerTemplate: renderHeaderTemplate(data.company, data.quote),
      footerTemplate: renderFooterTemplate(data.company),
    });

    let finalBytes: Uint8Array;
    if (cover) {
      const coverPdfBytes = await htmlToPdf(browser, renderCoverHtml(cover, data.quote, data.company), {});
      const merged = await PDFDocument.create();
      const [coverDoc, contentDoc] = await Promise.all([
        PDFDocument.load(coverPdfBytes),
        PDFDocument.load(contentPdfBytes),
      ]);
      const coverPages = await merged.copyPages(coverDoc, coverDoc.getPageIndices());
      coverPages.forEach((p) => merged.addPage(p));
      const contentPages = await merged.copyPages(contentDoc, contentDoc.getPageIndices());
      contentPages.forEach((p) => merged.addPage(p));
      finalBytes = await merged.save();
    } else {
      finalBytes = contentPdfBytes;
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.quote.quote_no}.pdf"`,
    });
    res.send(Buffer.from(finalBytes));
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});
