<?php

namespace App\Services;

use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;
use Spatie\Browsershot\Browsershot;

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

        $margin = QuoteHtmlRenderer::CONTENT_PAGE_MARGIN;
        $contentHtml = $this->renderer->renderContentHtml($rest, $quote, $company);
        $contentPdf = $this->browsershot($contentHtml)
            ->margins(
                $this->mmToFloat($margin['top']),
                $this->mmToFloat($margin['right']),
                $this->mmToFloat($margin['bottom']),
                $this->mmToFloat($margin['left']),
            )
            ->showBrowserHeaderAndFooter()
            ->headerHtml($this->renderer->renderHeaderTemplate($company, $quote))
            ->footerHtml($this->renderer->renderFooterTemplate($company))
            ->format('A4')
            ->pdf();

        if (!$cover) {
            return $contentPdf;
        }

        $coverHtml = $this->renderer->renderCoverHtml($cover, $quote, $company);
        $coverPdf = $this->browsershot($coverHtml)
            ->margins(0, 0, 0, 0)
            ->format('A4')
            ->pdf();

        return $this->mergePdfs([$coverPdf, $contentPdf]);
    }

    private function mmToFloat(string $value): float
    {
        return (float) str_replace('mm', '', $value);
    }

    private function browsershot(string $html): Browsershot
    {
        $browsershot = Browsershot::html($html)
            ->setNodeModulePath(base_path('node_modules'))
            ->setIncludePath('$PATH:/usr/local/bin:/opt/homebrew/bin:'.dirname(PHP_BINARY))
            ->noSandbox()
            ->newHeadless()
            ->waitUntilNetworkIdle(false)
            ->timeout(60)
            ->showBackground()
            // Our HTML embeds base64 fonts/logos and can be very large; on
            // Windows the whole command (incl. HTML) is passed via an env
            // var capped at ~32K UTF-16 code units, so write it to a temp
            // file instead of inlining it on the command line.
            ->writeOptionsToFile();

        $chromePath = $this->resolveChromePath();
        if ($chromePath) {
            $browsershot->setChromePath($chromePath);
        }

        return $browsershot;
    }

    /**
     * Puppeteer (installed in backend/node_modules) downloads Chrome into the
     * OS-level puppeteer cache (e.g. %USERPROFILE%\.cache\puppeteer on
     * Windows). The exact folder name is version-specific, so resolve
     * whatever build is actually present instead of hardcoding a version.
     * Override with the BROWSERSHOT_CHROME_PATH env var if needed.
     */
    private function resolveChromePath(): ?string
    {
        if ($override = env('BROWSERSHOT_CHROME_PATH')) {
            return $override;
        }

        $cacheRoots = array_filter([
            getenv('PUPPETEER_CACHE_DIR'),
            getenv('USERPROFILE') ? getenv('USERPROFILE').'/.cache/puppeteer' : null,
            getenv('HOME') ? getenv('HOME').'/.cache/puppeteer' : null,
        ]);

        foreach ($cacheRoots as $root) {
            $matches = glob($root.'/chrome/*/chrome-win64/chrome.exe');
            if ($matches) {
                sort($matches);

                return end($matches);
            }

            // linux/mac build layout
            $matches = glob($root.'/chrome/*/chrome-*/chrome');
            if ($matches) {
                sort($matches);

                return end($matches);
            }
        }

        return null;
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
