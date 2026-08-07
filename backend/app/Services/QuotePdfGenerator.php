<?php

namespace App\Services;

use Dompdf\Dompdf;
use Dompdf\Options;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;

class QuotePdfGenerator
{
    public function __construct(private readonly QuoteHtmlRenderer $renderer)
    {
    }

    /**
     * @param  array<string, mixed>  $quote
     * @param  array<string, mixed>  $company
     */
    public function generate(array $quote, array $company): string
    {
        ['cover' => $cover, 'rest' => $rest] = $this->renderer->splitCoverFromBlocks($quote['blocks'] ?? []);

        $contentHtml = $this->renderer->renderContentHtml($rest, $quote, $company);
        $contentPdf = $this->renderPdf($contentHtml, withFooter: true);

        if (!$cover) {
            return $contentPdf;
        }

        $coverHtml = $this->renderer->renderCoverHtml($cover, $quote, $company);
        $coverPdf = $this->renderPdf($coverHtml, withFooter: false);

        return $this->mergePdfs([$coverPdf, $contentPdf]);
    }

    /**
     * dompdf runs entirely in PHP (no Node/Chrome dependency), which is what
     * makes this work on shared hosting where a local headless browser isn't
     * available. Page size/margins come from the @page rule already baked
     * into the HTML by QuoteHtmlRenderer.
     */
    private function renderPdf(string $html, bool $withFooter): string
    {
        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('defaultFont', 'Inter');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        if ($withFooter) {
            $this->drawFooter($dompdf);
        }

        return $dompdf->output();
    }

    /**
     * dompdf has no CSS `counter(page)` support (unlike browsers), so live
     * page-number/page-count text can only be drawn via the Canvas API,
     * which repeats a callback on every page once the total is known.
     */
    private function drawFooter(Dompdf $dompdf): void
    {
        $canvas = $dompdf->getCanvas();
        $fontMetrics = $dompdf->getFontMetrics();
        $font = $fontMetrics->getFont('Inter', 'normal');

        // Content area stops 22mm above the true page bottom (see
        // QuoteHtmlRenderer::CONTENT_PAGE_MARGIN); the footer sits inside
        // that reserved band, comfortably clear of the physical page edge.
        $mm = 72 / 25.4;
        $pageWidth = 210 * $mm;
        $pageHeight = 297 * $mm;
        $marginLeft = 18 * $mm;
        $marginRight = 18 * $mm;
        $lineY = $pageHeight - (14 * $mm);
        $textY = $lineY + (3 * $mm);
        $size = 8.0;
        $color = [0x6b / 255, 0x72 / 255, 0x80 / 255];
        $lineColor = [0xdc / 255, 0xdf / 255, 0xe6 / 255];

        $canvas->page_line($marginLeft, $lineY, $pageWidth - $marginRight, $lineY, $lineColor, 0.5);
        $canvas->page_text($marginLeft, $textY, 'www.zeronix.ae', $font, $size, $color);

        // getTextWidth measures the literal string, and {PAGE_NUM}/
        // {PAGE_COUNT} aren't substituted until draw time — so width is
        // measured against a same-length numeric sample instead of the
        // token text itself, to keep the right-alignment accurate.
        $template = '{PAGE_NUM} of {PAGE_COUNT}';
        $width = $fontMetrics->getTextWidth('99 of 99', $font, $size);
        $canvas->page_text($pageWidth - $marginRight - $width, $textY, $template, $font, $size, $color);
    }

    /**
     * Merge the cover PDF + content PDF page-by-page using FPDI, matching
     * the pdf-lib-based merge in the old Node app (server/src/routes/pdf.ts).
     *
     * @param  array<int, string>  $pdfBinaries
     */
    private function mergePdfs(array $pdfBinaries): string
    {
        $fpdi = new Fpdi();

        foreach ($pdfBinaries as $binary) {
            $pageCount = $fpdi->setSourceFile(StreamReader::createByString($binary));
            for ($i = 1; $i <= $pageCount; $i++) {
                $templateId = $fpdi->importPage($i);
                $size = $fpdi->getTemplateSize($templateId);
                $fpdi->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $fpdi->useTemplate($templateId);
            }
        }

        return $fpdi->Output('S');
    }
}
