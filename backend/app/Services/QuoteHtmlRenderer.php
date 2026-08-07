<?php

namespace App\Services;

/**
 * Faithful PHP port of the old Node renderer:
 *   server/src/renderQuoteHtml.ts + server/src/theme.ts + server/src/fonts.ts
 *
 * Produces the exact same HTML/CSS document(s) so the PDF output (via
 * Browsershot/Puppeteer) keeps the same visual design as the original app.
 */
class QuoteHtmlRenderer
{
    /** Port of server/src/theme.ts */
    private const THEME = [
        'accentGreen' => '#3ddc84',
        'accentGreenDark' => '#1f9d57',
        'darkNavy' => '#120c2e',
        'navySoft' => '#241c4a',
        'black' => '#020402',
        'tableHeaderBg' => '#120c2e',
        'tableHeaderText' => '#ffffff',
        'tableZebra' => '#f7f8fb',
        'borderGray' => '#e2e5eb',
        'textGray' => '#2b2f38',
        'mutedGray' => '#6b7280',
    ];

    private const FONT_STACK = "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

    /** Port of server/src/renderQuoteHtml.ts::CONTENT_PAGE_MARGIN */
    public const CONTENT_PAGE_MARGIN = [
        'top' => '30mm',
        'bottom' => '22mm',
        'left' => '18mm',
        'right' => '18mm',
    ];

    private static ?string $fontFaceCssCache = null;

    // ------------------------------------------------------------------
    // Public API (mirrors the exported functions in renderQuoteHtml.ts)
    // ------------------------------------------------------------------

    /**
     * Splits a quote's blocks into the leading cover block (if any) and the rest.
     *
     * @param  array<int, array<string, mixed>>  $blocks
     * @return array{cover: ?array<string, mixed>, rest: array<int, array<string, mixed>>}
     */
    public function splitCoverFromBlocks(array $blocks): array
    {
        $first = $blocks[0] ?? null;
        if ($first && ($first['type'] ?? null) === 'cover') {
            return ['cover' => $first, 'rest' => array_slice($blocks, 1)];
        }

        return ['cover' => null, 'rest' => $blocks];
    }

    /** Standalone full-bleed cover page — its own PDF page, no header/footer, zero margin. */
    public function renderCoverHtml(array $cover, array $quote, array $company): string
    {
        $fontFace = $this->fontFaceCss();
        $coverStyle = $this->coverStyle();
        $title = $this->esc($quote['quote_no'] ?? '');
        $fontStack = self::FONT_STACK;
        $coverMarkup = $this->coverMarkup($cover, $quote, $company);

        return <<<HTML
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>{$title} — Cover</title>
<style>
  @page { size: A4; margin: 0; }
  {$fontFace}
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body { font-family: {$fontStack}; -webkit-font-smoothing: antialiased; }
  {$coverStyle}
</style>
</head>
<body>
{$coverMarkup}
</body>
</html>
HTML;
    }

    /** The rest of the quote (everything after the cover) — normal margins, header, footer, watermark. */
    public function renderContentHtml(array $blocks, array $quote, array $company): string
    {
        $body = implode("\n", array_map(fn ($b) => $this->renderBlock($b), $blocks));
        $logo = $company['logo_data_url'] ?? '';
        $watermark = $logo ? "<div class=\"watermark\"><img src=\"{$logo}\" alt=\"\"/></div>" : '';
        $title = $this->esc($quote['quote_no'] ?? '');
        $margin = self::CONTENT_PAGE_MARGIN;
        $sharedStyle = $this->sharedStyle();
        $fontFace = $this->fontFaceCss();

        return <<<HTML
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>{$title}</title>
<style>
  @page { size: A4; margin: {$margin['top']} {$margin['right']} {$margin['bottom']} {$margin['left']}; }
  {$fontFace}
  {$sharedStyle}
</style>
</head>
<body>
{$watermark}
{$body}
</body>
</html>
HTML;
    }

    /** Full single-document preview (cover + content together) — used for the in-browser HTML preview route only. */
    public function renderQuoteHtml(array $quote, array $company): string
    {
        ['cover' => $cover, 'rest' => $rest] = $this->splitCoverFromBlocks($quote['blocks'] ?? []);
        $coverHtml = $cover ? $this->coverMarkup($cover, $quote, $company) : '';
        $body = implode("\n", array_map(fn ($b) => $this->renderBlock($b), $rest));
        $logo = $company['logo_data_url'] ?? '';
        $watermark = $logo ? "<div class=\"watermark\"><img src=\"{$logo}\" alt=\"\"/></div>" : '';
        $title = $this->esc($quote['quote_no'] ?? '');
        $margin = self::CONTENT_PAGE_MARGIN;
        $sharedStyle = $this->sharedStyle();
        $coverStyle = $this->coverStyle();
        $fontFace = $this->fontFaceCss();

        return <<<HTML
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>{$title}</title>
<style>
  @page { size: A4; margin: {$margin['top']} {$margin['right']} {$margin['bottom']} {$margin['left']}; }
  {$fontFace}
  {$sharedStyle}
  {$coverStyle}
  .cover-page-wrap { margin: -{$margin['top']} -{$margin['right']} 0 -{$margin['left']}; }
</style>
</head>
<body>
{$watermark}
<div class="cover-page-wrap">{$coverHtml}</div>
<div class="pagebreak"></div>
{$body}
</body>
</html>
HTML;
    }

    public function renderHeaderTemplate(array $company, array $quote): string
    {
        $fontFace = $this->fontFaceCss();
        $logoSrc = $company['logo_data_url'] ?? '';
        $logo = $logoSrc
            ? "<img src=\"{$logoSrc}\" style=\"height:11mm; max-width:55mm; object-fit:contain;\" />"
            : '<span style="font-weight:700; font-size:9pt; color:'.self::THEME['darkNavy'].';">'.$this->esc($company['name'] ?? '').'</span>';
        $quoteNo = $this->esc($quote['quote_no'] ?? '');
        $pageBox = $this->pageBoxStyle();

        return <<<HTML
<style>{$fontFace}</style>
<div class="hdr" style="{$pageBox} display:flex; align-items:center; justify-content:space-between; padding:3mm 0 4.5mm 0; border-bottom:0.5pt solid #dcdfe6;">
    {$logo}
    <span style="font-size:7.5pt; color:#8a8f99; letter-spacing:0.3px;">{$quoteNo}</span>
</div>
HTML;
    }

    public function renderFooterTemplate(array $company): string
    {
        $fontFace = $this->fontFaceCss();
        $pageBox = $this->pageBoxStyle();

        return <<<HTML
<style>{$fontFace}</style>
<div class="ftr" style="{$pageBox} display:flex; align-items:center; justify-content:space-between; padding-top:2.5mm; border-top:0.5pt solid #dcdfe6; font-size:8pt; color:#6b7280;">
    <span>www.zeronix.ae</span>
    <span><span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>
HTML;
    }

    // ------------------------------------------------------------------
    // Block rendering
    // ------------------------------------------------------------------

    private function renderBlock(array $block): string
    {
        return match ($block['type'] ?? null) {
            'heading' => $this->renderHeading($block),
            'richtext' => '<div class="richtext">'.($block['html'] ?? '').'</div>',
            'table' => $this->renderTable($block),
            'pricetable' => $this->renderPriceTable($block),
            'divider' => '<hr class="divider"/>',
            'pagebreak' => '<div class="pagebreak"></div>',
            'signature' => $this->renderSignature($block),
            'about' => $this->renderAbout($block),
            default => '',
        };
    }

    private function renderHeading(array $block): string
    {
        $number = !empty($block['number']) ? $this->esc($block['number']).'. ' : '';

        return '<h2 class="section-heading">'.$number.$this->esc($block['text'] ?? '').'</h2>';
    }

    private function renderTable(array $block): string
    {
        $headers = implode('', array_map(fn ($h) => '<th>'.$this->esc($h).'</th>', $block['headers'] ?? []));
        $rows = implode('', array_map(
            fn ($r) => '<tr>'.implode('', array_map(fn ($c) => '<td>'.$this->esc($c).'</td>', $r)).'</tr>',
            $block['rows'] ?? []
        ));

        return <<<HTML
        <div class="table-wrap">
        <table class="generic-table">
          <thead><tr>{$headers}</tr></thead>
          <tbody>{$rows}</tbody>
        </table>
        </div>
HTML;
    }

    private function renderPriceTable(array $block): string
    {
        $rows = $block['rows'] ?? [];
        $vatPercent = (float) ($block['vatPercent'] ?? 0);

        $subtotal = 0.0;
        foreach ($rows as $r) {
            $subtotal += (float) ($r['unit'] ?? 0) * (float) ($r['unitPrice'] ?? 0);
        }
        $vat = $subtotal * ($vatPercent / 100);
        $grand = $subtotal + $vat;

        $rowsHtml = implode('', array_map(function ($r) {
            $unit = $r['unit'] ?? 0;

            return '<tr>'
                .'<td>'.$this->esc($r['description'] ?? '').'</td>'
                .'<td class="muted">'.$this->esc($r['scope'] ?? '').'</td>'
                .'<td class="num">'.$this->esc($unit).'</td>'
                .'<td class="num">'.$this->money((float) ($r['unitPrice'] ?? 0)).'</td>'
                .'</tr>';
        }, $rows));

        // Match the JS template literal behaviour of interpolating the raw number.
        $vatPercentDisplay = $this->esc($vatPercent == (int) $vatPercent ? (string) (int) $vatPercent : (string) $vatPercent);

        return <<<HTML
        <div class="table-wrap">
        <table class="price-table">
          <thead>
            <tr><th>Description</th><th>Scope</th><th class="num">Unit</th><th class="num">Price (AED)</th></tr>
          </thead>
          <tbody>
            {$rowsHtml}
          </tbody>
        </table>
        </div>
        <div class="totals-box">
          <div class="totals-row"><span>Subtotal</span><span>AED {$this->money($subtotal)}</span></div>
          <div class="totals-row"><span>VAT ({$vatPercentDisplay}%)</span><span>AED {$this->money($vat)}</span></div>
          <div class="totals-row totals-grand"><span>Grand Total</span><span>AED {$this->money($grand)}</span></div>
        </div>
        <div class="amount-words"><span class="amount-words-label">Amount in Words:</span> {$this->esc($this->amountInWords($grand))}</div>
HTML;
    }

    private function renderSignature(array $block): string
    {
        $leftCompany = $this->esc($block['leftCompany'] ?? '');
        $leftName = $this->esc($block['leftName'] ?? '');
        $rightLabel = $this->esc($block['rightLabel'] ?? '');

        return <<<HTML
        <div class="signature-block">
          <div class="signature-col">
            <div class="signature-label">Prepared By</div>
            <div class="signature-company">{$leftCompany}</div>
            <div class="signature-sub">Authorized Signatory</div>
            <div class="signature-line">Name: <b>{$leftName}</b></div>
            <div class="signature-line">Signature: ______________________</div>
          </div>
          <div class="signature-col">
            <div class="signature-label">Accepted By</div>
            <div class="signature-company">{$rightLabel}</div>
            <div class="signature-sub">Authorized Signatory</div>
            <div class="signature-line">Name: ______________________</div>
            <div class="signature-line">Signature: ______________________</div>
          </div>
        </div>
HTML;
    }

    private function renderAbout(array $block): string
    {
        $heading = $this->esc($block['heading'] ?? 'About Us');
        $description = $block['description'] ?? '';
        $services = $block['services'] ?? [];

        $servicesHtml = implode('', array_map(function ($s) {
            $title = $this->esc($s['title'] ?? '');
            $desc = $this->esc($s['description'] ?? '');

            return <<<HTML
            <div class="about-service">
              <div class="about-service-title">{$title}</div>
              <div class="about-service-desc">{$desc}</div>
            </div>
HTML;
        }, $services));

        return <<<HTML
        <div class="about-block">
          <h2 class="section-heading">{$heading}</h2>
          <div class="richtext">{$description}</div>
          <div class="about-services">
            {$servicesHtml}
          </div>
        </div>
HTML;
    }

    private function coverMarkup(array $cover, array $quote, array $company): string
    {
        $logoSrc = $company['logo_dark_data_url'] ?? '';
        if (!$logoSrc) {
            $logoSrc = $company['logo_data_url'] ?? '';
        }
        $logo = $logoSrc
            ? '<img class="cover-logo" src="'.$logoSrc.'" alt="'.$this->esc($company['name'] ?? '').'"/>'
            : '<div class="cover-logo-text">'.$this->esc($company['name'] ?? '').'</div>';

        $title = str_replace("\n", '<br/>', $this->esc($cover['title'] ?? ''));
        $trn = !empty($company['trn'])
            ? ' &nbsp;&middot;&nbsp; TRN '.$this->esc($company['trn'])
            : '';

        return <<<HTML
  <section class="cover">
    <div class="cover-splash"></div>
    <div class="cover-noise"></div>
    <div class="cover-top">{$logo}</div>
    <div class="cover-mid">
      <div class="cover-eyebrow">Proposal</div>
      <h1>{$title}</h1>
      <div class="cover-rule"></div>
    </div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <div class="cover-meta-label">Prepared For</div>
        <div class="cover-meta-value">{$this->esc($cover['preparedFor'] ?? '')}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Prepared By</div>
        <div class="cover-meta-value">{$this->esc($cover['preparedBy'] ?? '')}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Quote No.</div>
        <div class="cover-meta-value cover-meta-value-sub">{$this->esc($quote['quote_no'] ?? '')}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Date</div>
        <div class="cover-meta-value cover-meta-value-sub">{$this->fmtDate($quote['quote_date'] ?? null)}</div>
      </div>
    </div>
    <div class="cover-foot">{$this->esc($company['address'] ?? '')}{$trn}</div>
  </section>
HTML;
    }

    // ------------------------------------------------------------------
    // Small formatting helpers (ported 1:1 from renderQuoteHtml.ts)
    // ------------------------------------------------------------------

    private function esc(mixed $s): string
    {
        return htmlspecialchars((string) ($s ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function money(float $n): string
    {
        return number_format($n, 2, '.', ',');
    }

    private const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    private const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    private function threeDigitsToWords(int $n): string
    {
        $parts = [];
        if ($n >= 100) {
            $parts[] = self::ONES[intdiv($n, 100)].' Hundred';
            $n %= 100;
        }
        if ($n >= 20) {
            $parts[] = self::TENS[intdiv($n, 10)].($n % 10 ? '-'.self::ONES[$n % 10] : '');
        } elseif ($n > 0) {
            $parts[] = self::ONES[$n];
        }

        return implode(' ', $parts);
    }

    private function integerToWords(int $n): string
    {
        if ($n === 0) {
            return 'Zero';
        }

        $scales = [
            [1_000_000_000, 'Billion'],
            [1_000_000, 'Million'],
            [1_000, 'Thousand'],
            [1, ''],
        ];

        $parts = [];
        foreach ($scales as [$scale, $label]) {
            if ($n >= $scale) {
                $chunk = intdiv($n, $scale);
                $n %= $scale;
                $parts[] = $label !== '' ? $this->threeDigitsToWords($chunk).' '.$label : $this->threeDigitsToWords($chunk);
            }
        }

        return trim(implode(' ', $parts));
    }

    /** e.g. 1575.5 -> "AED One Thousand Five Hundred Seventy-Five and 50/100 Only" */
    private function amountInWords(float $amount, string $currency = 'AED'): string
    {
        $whole = (int) floor($amount);
        $fils = (int) round(($amount - $whole) * 100);
        $wholeWords = $this->integerToWords($whole);
        $filsPart = $fils > 0 ? ' and '.str_pad((string) $fils, 2, '0', STR_PAD_LEFT).'/100' : '';

        return "{$currency} {$wholeWords}{$filsPart} Only";
    }

    private function fmtDate(?string $s): string
    {
        if (!$s) {
            return '—';
        }
        $ts = strtotime($s);
        if ($ts === false) {
            return $s;
        }

        return date('d M Y', $ts);
    }

    /** JS encodeURIComponent-equivalent (keeps A-Za-z0-9 - _ . ! ~ * ' ( ) unescaped). */
    private function jsEncodeUriComponent(string $s): string
    {
        $encoded = rawurlencode($s);

        return str_replace(
            ['%21', '%2A', '%27', '%28', '%29'],
            ['!', '*', "'", '(', ')'],
            $encoded
        );
    }

    // ------------------------------------------------------------------
    // Fonts / CSS
    // ------------------------------------------------------------------

    /** Self-hosted Inter, inlined as base64 so PDF rendering never depends on network access. */
    private function fontFaceCss(): string
    {
        if (self::$fontFaceCssCache !== null) {
            return self::$fontFaceCssCache;
        }

        $weights = [
            400 => 'inter-latin-400-normal.woff2',
            600 => 'inter-latin-600-normal.woff2',
            700 => 'inter-latin-700-normal.woff2',
            800 => 'inter-latin-800-normal.woff2',
        ];

        $fontDir = resource_path('fonts');
        $css = '';
        foreach ($weights as $weight => $file) {
            $bytes = file_get_contents($fontDir.DIRECTORY_SEPARATOR.$file);
            $dataUri = 'data:font/woff2;base64,'.base64_encode($bytes);
            $css .= "\n  @font-face {\n"
                ."    font-family: 'Inter';\n"
                ."    font-style: normal;\n"
                ."    font-weight: {$weight};\n"
                ."    font-display: swap;\n"
                ."    src: url(\"{$dataUri}\") format('woff2');\n"
                ."  }";
        }

        return self::$fontFaceCssCache = $css;
    }

    /** Irregular green paint-splash — a blob plus scattered drips, tucked into the corner. */
    private function splashSvgDataUri(): string
    {
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">'
            .'<defs>'
            .'<radialGradient id="g1" cx="62%" cy="34%" r="55%">'
            .'<stop offset="0%" stop-color="#3ddc84" stop-opacity="0.5"/>'
            .'<stop offset="55%" stop-color="#3ddc84" stop-opacity="0.22"/>'
            .'<stop offset="100%" stop-color="#3ddc84" stop-opacity="0"/>'
            .'</radialGradient>'
            .'<radialGradient id="g2" cx="50%" cy="50%" r="50%">'
            .'<stop offset="0%" stop-color="#3ddc84" stop-opacity="0.45"/>'
            .'<stop offset="100%" stop-color="#3ddc84" stop-opacity="0"/>'
            .'</radialGradient>'
            .'<filter id="b1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>'
            .'<filter id="b2" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9"/></filter>'
            .'</defs>'
            .'<path fill="url(#g1)" filter="url(#b1)" d="M470 40C540 20 596 78 578 142C640 158 652 232 600 268C624 328 580 392 512 384C512 448 440 484 384 448C352 492 274 480 264 424C198 432 156 372 182 320C124 300 118 232 172 200C160 148 210 96 268 108C284 56 350 24 400 44C420 24 448 24 470 40Z"/>'
            .'<circle cx="560" cy="330" r="46" fill="url(#g2)" filter="url(#b2)"/>'
            .'<circle cx="150" cy="450" r="30" fill="url(#g2)" filter="url(#b2)" opacity="0.7"/>'
            .'<circle cx="500" cy="470" r="18" fill="url(#g2)" filter="url(#b2)" opacity="0.6"/>'
            .'</svg>';

        return 'data:image/svg+xml,'.$this->jsEncodeUriComponent($svg);
    }

    /** Fine film-grain noise tile, overlaid at low opacity for texture. */
    private function noiseSvgDataUri(): string
    {
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>';

        return 'data:image/svg+xml,'.$this->jsEncodeUriComponent($svg);
    }

    private function pageBoxStyle(): string
    {
        return 'font-family:'.self::FONT_STACK.'; width:100%; margin:0 18mm; box-sizing:border-box;';
    }

    private function sharedStyle(): string
    {
        $t = self::THEME;
        $fontStack = self::FONT_STACK;

        return <<<CSS
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: {$fontStack};
    color: {$t['textGray']};
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
    color: {$t['darkNavy']};
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
  .richtext h1 { font-size: 14.5pt; font-weight: 700; color: {$t['darkNavy']}; margin: 4mm 0 2mm; }
  .richtext h2 { font-size: 12.5pt; font-weight: 700; color: {$t['darkNavy']}; margin: 4mm 0 2mm; }
  .richtext h3 { font-size: 11pt; font-weight: 700; color: {$t['darkNavy']}; margin: 3mm 0 2mm; }
  .richtext mark { background: #fef08a; padding: 0 0.5mm; border-radius: 0.5mm; }

  /* ---------- Tables ---------- */
  .table-wrap {
    border: 1px solid {$t['borderGray']};
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
    background: {$t['tableHeaderBg']};
    color: {$t['tableHeaderText']};
    text-align: left;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    font-size: 8.5pt;
    padding: 4mm 3.5mm;
    border-bottom: 2px solid {$t['accentGreen']};
  }
  table.generic-table td, table.price-table td {
    padding: 2.8mm 3.5mm;
    border-top: 1px solid {$t['borderGray']};
    vertical-align: top;
  }
  table.generic-table tbody tr:nth-child(even),
  table.price-table tbody tr:nth-child(even) {
    background: {$t['tableZebra']};
  }
  table.price-table td.muted { color: {$t['mutedGray']}; }
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
    color: {$t['mutedGray']};
  }
  .totals-row.totals-grand {
    color: {$t['darkNavy']};
    font-weight: 700;
    font-size: 11.5pt;
    border-top: 1.5px solid {$t['darkNavy']};
    margin-top: 1mm;
    padding-top: 3mm;
  }
  .amount-words {
    clear: both;
    margin-top: 4mm;
    padding-top: 3mm;
    border-top: 1px solid {$t['borderGray']};
    font-size: 9pt;
    font-style: italic;
    color: {$t['mutedGray']};
  }
  .amount-words-label {
    font-style: normal;
    font-weight: 600;
    color: {$t['darkNavy']};
    margin-right: 1mm;
  }

  .divider { border: none; border-top: 1px solid {$t['borderGray']}; margin: 6mm 0; }

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
    border-top: 2px solid {$t['darkNavy']};
    padding-top: 3mm;
  }
  .signature-label { font-weight: 700; color: {$t['darkNavy']}; font-size: 10.5pt; margin-bottom: 1mm; }
  .signature-company { margin-bottom: 1mm; }
  .signature-sub { color: {$t['mutedGray']}; font-size: 8.5pt; margin-bottom: 4mm; }
  .signature-line { margin-bottom: 4mm; }

  /* ---------- About the company ---------- */
  .about-services {
    display: flex;
    flex-wrap: wrap;
    gap: 4mm;
    margin: 4mm 0 2mm;
  }
  .about-service {
    flex: 1 1 calc(50% - 4mm);
    min-width: 70mm;
    border: 1px solid {$t['borderGray']};
    border-radius: 2mm;
    padding: 3.5mm;
  }
  .about-service-title {
    font-weight: 700;
    color: {$t['darkNavy']};
    font-size: 10pt;
    margin-bottom: 1mm;
  }
  .about-service-desc {
    font-size: 9pt;
    color: {$t['mutedGray']};
  }
CSS;
    }

    private function coverStyle(): string
    {
        $t = self::THEME;
        $splash = $this->splashSvgDataUri();
        $noise = $this->noiseSvgDataUri();

        return <<<CSS
  .cover {
    position: relative;
    height: 297mm;
    width: 210mm;
    padding: 16mm 20mm 14mm 20mm;
    background: linear-gradient(165deg, {$t['darkNavy']} 0%, {$t['black']} 78%);
    color: white;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .cover-splash {
    position: absolute;
    top: -50mm; right: -55mm;
    width: 190mm; height: 190mm;
    background-image: url("{$splash}");
    background-size: 100% 100%;
    mix-blend-mode: screen;
  }
  .cover-noise {
    position: absolute;
    inset: 0;
    background-image: url("{$noise}");
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
    color: {$t['accentGreen']};
    font-weight: 600;
    margin-bottom: 4mm;
  }
  .cover-mid h1 {
    color: {$t['accentGreen']};
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
    background: {$t['accentGreen']};
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
    color: {$t['accentGreen']};
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
CSS;
    }
}
