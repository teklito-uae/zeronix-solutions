import type { Block, Company, CoverBlock, Quote } from "./types.js";
import { theme } from "./theme.js";
import { FONT_FACE_CSS, FONT_STACK } from "./fonts.js";

function esc(s: string | number | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number): string {
  return n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function threeDigitsToWords(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

function integerToWords(n: number): string {
  if (n === 0) return "Zero";
  const scales: [number, string][] = [
    [1_000_000_000, "Billion"],
    [1_000_000, "Million"],
    [1_000, "Thousand"],
    [1, ""],
  ];
  const parts: string[] = [];
  for (const [scale, label] of scales) {
    if (n >= scale) {
      const chunk = Math.floor(n / scale);
      n %= scale;
      parts.push(label ? `${threeDigitsToWords(chunk)} ${label}` : threeDigitsToWords(chunk));
    }
  }
  return parts.join(" ").trim();
}

/** e.g. 1575.5 -> "AED One Thousand Five Hundred Seventy-Five and 50/100 Only" */
function amountInWords(amount: number, currency = "AED"): string {
  const whole = Math.floor(amount);
  const fils = Math.round((amount - whole) * 100);
  const wholeWords = integerToWords(whole);
  const filsPart = fils > 0 ? ` and ${String(fils).padStart(2, "0")}/100` : "";
  return `${currency} ${wholeWords}${filsPart} Only`;
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Splits a quote's blocks into the leading cover block (if any) and the rest. */
export function splitCoverFromBlocks(blocks: Block[]): { cover: CoverBlock | null; rest: Block[] } {
  const first = blocks[0];
  if (first && first.type === "cover") {
    return { cover: first, rest: blocks.slice(1) };
  }
  return { cover: null, rest: blocks };
}

function renderBlock(block: Block): string {
  switch (block.type) {
    case "heading":
      return `<h2 class="section-heading">${block.number ? esc(block.number) + ". " : ""}${esc(block.text)}</h2>`;
    case "richtext":
      return `<div class="richtext">${block.html}</div>`;
    case "table":
      return `
        <div class="table-wrap">
        <table class="generic-table">
          <thead><tr>${block.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
          <tbody>${block.rows
            .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
            .join("")}</tbody>
        </table>
        </div>`;
    case "pricetable": {
      const subtotal = block.rows.reduce((sum, r) => sum + r.unit * r.unitPrice, 0);
      const vat = subtotal * (block.vatPercent / 100);
      const grand = subtotal + vat;
      return `
        <div class="table-wrap">
        <table class="price-table">
          <thead>
            <tr><th>Description</th><th>Scope</th><th class="num">Unit</th><th class="num">Price (AED)</th></tr>
          </thead>
          <tbody>
            ${block.rows
              .map(
                (r) => `<tr>
                  <td>${esc(r.description)}</td>
                  <td class="muted">${esc(r.scope)}</td>
                  <td class="num">${esc(r.unit)}</td>
                  <td class="num">${money(r.unitPrice)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
        </div>
        <div class="totals-box">
          <div class="totals-row"><span>Subtotal</span><span>AED ${money(subtotal)}</span></div>
          <div class="totals-row"><span>VAT (${block.vatPercent}%)</span><span>AED ${money(vat)}</span></div>
          <div class="totals-row totals-grand"><span>Grand Total</span><span>AED ${money(grand)}</span></div>
        </div>
        <div class="amount-words"><span class="amount-words-label">Amount in Words:</span> ${esc(amountInWords(grand))}</div>`;
    }
    case "divider":
      return `<hr class="divider"/>`;
    case "pagebreak":
      return `<div class="pagebreak"></div>`;
    case "signature":
      return `
        <div class="signature-block">
          <div class="signature-col">
            <div class="signature-label">Prepared By</div>
            <div class="signature-company">${esc(block.leftCompany)}</div>
            <div class="signature-sub">Authorized Signatory</div>
            <div class="signature-line">Name: <b>${esc(block.leftName)}</b></div>
            <div class="signature-line">Signature: ______________________</div>
          </div>
          <div class="signature-col">
            <div class="signature-label">Accepted By</div>
            <div class="signature-company">${esc(block.rightLabel)}</div>
            <div class="signature-sub">Authorized Signatory</div>
            <div class="signature-line">Name: ______________________</div>
            <div class="signature-line">Signature: ______________________</div>
          </div>
        </div>`;
    default:
      return "";
  }
}

const SHARED_STYLE = `
  ${FONT_FACE_CSS}
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: ${FONT_STACK};
    color: ${theme.textGray};
    font-size: 10.5pt;
    line-height: 1.6;
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }

  /* ---------- Watermark (repeats on every printed page via position:fixed) ---------- */
  .watermark {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: -1;
    pointer-events: none;
  }
  .watermark img {
    width: 110mm;
    opacity: 0.05;
    filter: grayscale(1);
  }

  .pagebreak { page-break-after: always; }

  /* ---------- Section headings ---------- */
  .section-heading {
    color: ${theme.darkNavy};
    font-size: 13.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin: 9mm 0 4mm 0;
  }
  .section-heading:first-child { margin-top: 0; }

  .richtext p { margin: 2mm 0; }
  .richtext ul, .richtext ol { margin: 2mm 0; padding-left: 5.5mm; }
  .richtext li { margin-bottom: 1.2mm; }
  .richtext h1 { font-size: 14.5pt; font-weight: 700; color: ${theme.darkNavy}; margin: 4mm 0 2mm; }
  .richtext h2 { font-size: 12.5pt; font-weight: 700; color: ${theme.darkNavy}; margin: 4mm 0 2mm; }
  .richtext h3 { font-size: 11pt; font-weight: 700; color: ${theme.darkNavy}; margin: 3mm 0 2mm; }
  .richtext mark { background: #fef08a; padding: 0 0.5mm; border-radius: 0.5mm; }

  /* ---------- Tables ---------- */
  .table-wrap {
    border: 1px solid ${theme.borderGray};
    border-radius: 2mm;
    overflow: hidden;
    margin: 4mm 0;
  }
  table.generic-table, table.price-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
  }
  table.generic-table th, table.price-table th {
    background: ${theme.tableHeaderBg};
    color: ${theme.tableHeaderText};
    text-align: left;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    font-size: 8.5pt;
    padding: 4mm 3.5mm;
    border-bottom: 2px solid ${theme.accentGreen};
  }
  table.generic-table td, table.price-table td {
    padding: 2.8mm 3.5mm;
    border-top: 1px solid ${theme.borderGray};
    vertical-align: top;
  }
  table.generic-table tbody tr:nth-child(even),
  table.price-table tbody tr:nth-child(even) {
    background: ${theme.tableZebra};
  }
  table.price-table td.muted { color: ${theme.mutedGray}; }
  table.price-table td.num, table.price-table th.num { text-align: right; white-space: nowrap; }

  .totals-box {
    margin: 3mm 0 0 auto;
    width: 78mm;
    font-size: 9.5pt;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 1.8mm 0;
    color: ${theme.mutedGray};
  }
  .totals-row.totals-grand {
    color: ${theme.darkNavy};
    font-weight: 700;
    font-size: 11.5pt;
    border-top: 1.5px solid ${theme.darkNavy};
    margin-top: 1mm;
    padding-top: 3mm;
  }
  .amount-words {
    clear: both;
    margin-top: 4mm;
    padding-top: 3mm;
    border-top: 1px solid ${theme.borderGray};
    font-size: 9pt;
    font-style: italic;
    color: ${theme.mutedGray};
  }
  .amount-words-label {
    font-style: normal;
    font-weight: 600;
    color: ${theme.darkNavy};
    margin-right: 1mm;
  }

  .divider { border: none; border-top: 1px solid ${theme.borderGray}; margin: 6mm 0; }

  /* ---------- Signature block ---------- */
  .signature-block {
    display: flex;
    justify-content: space-between;
    margin-top: 10mm;
    gap: 12mm;
  }
  .signature-col {
    flex: 1;
    font-size: 9.5pt;
    border-top: 2px solid ${theme.darkNavy};
    padding-top: 3mm;
  }
  .signature-label { font-weight: 700; color: ${theme.darkNavy}; font-size: 10.5pt; margin-bottom: 1mm; }
  .signature-company { margin-bottom: 1mm; }
  .signature-sub { color: ${theme.mutedGray}; font-size: 8.5pt; margin-bottom: 4mm; }
  .signature-line { margin-bottom: 4mm; }
`;

export const CONTENT_PAGE_MARGIN = { top: "30mm", bottom: "22mm", left: "18mm", right: "18mm" };

/** Irregular green paint-splash — a blob plus scattered drips, tucked into the corner. */
function splashSvgDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <radialGradient id="g1" cx="62%" cy="34%" r="55%">
        <stop offset="0%" stop-color="#3ddc84" stop-opacity="0.5"/>
        <stop offset="55%" stop-color="#3ddc84" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#3ddc84" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="g2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#3ddc84" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#3ddc84" stop-opacity="0"/>
      </radialGradient>
      <filter id="b1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id="b2" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9"/></filter>
    </defs>
    <path fill="url(#g1)" filter="url(#b1)" d="M470 40C540 20 596 78 578 142C640 158 652 232 600 268C624 328 580 392 512 384C512 448 440 484 384 448C352 492 274 480 264 424C198 432 156 372 182 320C124 300 118 232 172 200C160 148 210 96 268 108C284 56 350 24 400 44C420 24 448 24 470 40Z"/>
    <circle cx="560" cy="330" r="46" fill="url(#g2)" filter="url(#b2)"/>
    <circle cx="150" cy="450" r="30" fill="url(#g2)" filter="url(#b2)" opacity="0.7"/>
    <circle cx="500" cy="470" r="18" fill="url(#g2)" filter="url(#b2)" opacity="0.6"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Fine film-grain noise tile, overlaid at low opacity for texture. */
function noiseSvgDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const COVER_STYLE = `
  .cover {
    position: relative;
    height: 297mm;
    width: 210mm;
    padding: 16mm 20mm 14mm 20mm;
    background: linear-gradient(165deg, ${theme.darkNavy} 0%, ${theme.black} 78%);
    color: white;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .cover-splash {
    position: absolute;
    top: -50mm; right: -55mm;
    width: 190mm; height: 190mm;
    background-image: url("${splashSvgDataUri()}");
    background-size: 100% 100%;
    mix-blend-mode: screen;
  }
  .cover-noise {
    position: absolute;
    inset: 0;
    background-image: url("${noiseSvgDataUri()}");
    background-repeat: repeat;
    mix-blend-mode: overlay;
    opacity: 0.6;
  }
  .cover-top { position: relative; }
  .cover-logo { height: 14mm; max-width: 75mm; object-fit: contain; object-position: left; }
  .cover-logo-text { font-size: 14pt; font-weight: 700; letter-spacing: 0.5px; }

  .cover-mid { position: relative; margin-top: 60mm; }
  .cover-eyebrow {
    text-transform: uppercase;
    letter-spacing: 3px;
    font-size: 9pt;
    color: ${theme.accentGreen};
    font-weight: 600;
    margin-bottom: 4mm;
  }
  .cover-mid h1 {
    color: ${theme.accentGreen};
    font-size: 30pt;
    font-weight: 800;
    line-height: 1.2;
    margin: 0;
    max-width: 140mm;
  }
  .cover-rule {
    position: relative;
    width: 22mm;
    height: 1.4mm;
    background: ${theme.accentGreen};
    margin: 8mm 0 0 0;
    border-radius: 1mm;
  }

  .cover-meta {
    position: relative;
    margin-top: auto;
    border-top: 0.75pt solid rgba(255,255,255,0.22);
    padding-top: 5mm;
  }
  .cover-meta-item {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8mm;
    padding: 3mm 0;
    border-bottom: 0.75pt solid rgba(255,255,255,0.12);
  }
  .cover-meta-item:last-child { border-bottom: none; }
  .cover-meta-label {
    text-transform: uppercase;
    letter-spacing: 1.8px;
    font-size: 7.5pt;
    font-weight: 600;
    color: ${theme.accentGreen};
    white-space: nowrap;
  }
  .cover-meta-value { font-size: 11pt; font-weight: 600; color: white; text-align: right; }
  .cover-meta-value-sub { font-size: 9.5pt; font-weight: 400; color: rgba(255,255,255,0.7); }

  .cover-foot {
    position: relative;
    margin-top: 7mm;
    font-size: 8pt;
    color: rgba(255,255,255,0.4);
  }
`;

function coverMarkup(cover: CoverBlock, quote: Quote, company: Company): string {
  const logoSrc = company.logo_dark_data_url || company.logo_data_url;
  const logo = logoSrc
    ? `<img class="cover-logo" src="${logoSrc}" alt="${esc(company.name)}"/>`
    : `<div class="cover-logo-text">${esc(company.name)}</div>`;

  return `
  <section class="cover">
    <div class="cover-splash"></div>
    <div class="cover-noise"></div>
    <div class="cover-top">${logo}</div>
    <div class="cover-mid">
      <div class="cover-eyebrow">Proposal</div>
      <h1>${esc(cover.title).replace(/\n/g, "<br/>")}</h1>
      <div class="cover-rule"></div>
    </div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <div class="cover-meta-label">Prepared For</div>
        <div class="cover-meta-value">${esc(cover.preparedFor)}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Prepared By</div>
        <div class="cover-meta-value">${esc(cover.preparedBy)}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Quote No.</div>
        <div class="cover-meta-value cover-meta-value-sub">${esc(quote.quote_no)}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Date</div>
        <div class="cover-meta-value cover-meta-value-sub">${fmtDate(quote.quote_date)}</div>
      </div>
    </div>
    <div class="cover-foot">${esc(company.address)}${company.trn ? ` &nbsp;·&nbsp; TRN ${esc(company.trn)}` : ""}</div>
  </section>`;
}

/** Standalone full-bleed cover page — its own PDF page, no header/footer, zero margin. */
export function renderCoverHtml(cover: CoverBlock, quote: Quote, company: Company): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>${esc(quote.quote_no)} — Cover</title>
<style>
  @page { size: A4; margin: 0; }
  ${FONT_FACE_CSS}
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body { font-family: ${FONT_STACK}; -webkit-font-smoothing: antialiased; }
  ${COVER_STYLE}
</style>
</head>
<body>
${coverMarkup(cover, quote, company)}
</body>
</html>`;
}

/** The rest of the quote (everything after the cover) — rendered with normal margins, header, footer, watermark. */
export function renderContentHtml(blocks: Block[], quote: Quote, company: Company): string {
  const body = blocks.map(renderBlock).join("\n");
  const watermark = company.logo_data_url
    ? `<div class="watermark"><img src="${company.logo_data_url}" alt=""/></div>`
    : "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>${esc(quote.quote_no)}</title>
<style>
  @page { size: A4; margin: ${CONTENT_PAGE_MARGIN.top} ${CONTENT_PAGE_MARGIN.right} ${CONTENT_PAGE_MARGIN.bottom} ${CONTENT_PAGE_MARGIN.left}; }
  ${SHARED_STYLE}
</style>
</head>
<body>
${watermark}
${body}
</body>
</html>`;
}

/** Full single-document preview (cover + content together) — used for the in-browser HTML preview route only. */
export function renderQuoteHtml(quote: Quote, company: Company): string {
  const { cover, rest } = splitCoverFromBlocks(quote.blocks);
  const coverHtml = cover ? coverMarkup(cover, quote, company) : "";
  const body = rest.map(renderBlock).join("\n");
  const watermark = company.logo_data_url
    ? `<div class="watermark"><img src="${company.logo_data_url}" alt=""/></div>`
    : "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>${esc(quote.quote_no)}</title>
<style>
  @page { size: A4; margin: ${CONTENT_PAGE_MARGIN.top} ${CONTENT_PAGE_MARGIN.right} ${CONTENT_PAGE_MARGIN.bottom} ${CONTENT_PAGE_MARGIN.left}; }
  ${SHARED_STYLE}
  ${COVER_STYLE}
  .cover-page-wrap { margin: -${CONTENT_PAGE_MARGIN.top} -${CONTENT_PAGE_MARGIN.right} 0 -${CONTENT_PAGE_MARGIN.left}; }
</style>
</head>
<body>
${watermark}
<div class="cover-page-wrap">${coverHtml}</div>
<div class="pagebreak"></div>
${body}
</body>
</html>`;
}

function pageBoxStyle(): string {
  return `font-family:${FONT_STACK}; width:100%; margin:0 18mm; box-sizing:border-box;`;
}

export function renderHeaderTemplate(company: Company, quote: Quote): string {
  const logo = company.logo_data_url
    ? `<img src="${company.logo_data_url}" style="height:11mm; max-width:55mm; object-fit:contain;" />`
    : `<span style="font-weight:700; font-size:9pt; color:${theme.darkNavy};">${esc(company.name)}</span>`;
  return `
  <style>${FONT_FACE_CSS}</style>
  <div class="hdr" style="${pageBoxStyle()} display:flex; align-items:center; justify-content:space-between; padding:3mm 0 4.5mm 0; border-bottom:0.5pt solid #dcdfe6;">
    ${logo}
    <span style="font-size:7.5pt; color:#8a8f99; letter-spacing:0.3px;">${esc(quote.quote_no)}</span>
  </div>`;
}

export function renderFooterTemplate(company: Company): string {
  return `
  <style>${FONT_FACE_CSS}</style>
  <div class="ftr" style="${pageBoxStyle()} display:flex; align-items:center; justify-content:space-between; padding-top:2.5mm; border-top:0.5pt solid #dcdfe6; font-size:8pt; color:#6b7280;">
    <span>www.zeronix.ae</span>
    <span><span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`;
}
