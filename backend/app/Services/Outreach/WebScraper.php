<?php

namespace App\Services\Outreach;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Spatie\Browsershot\Browsershot;
use Symfony\Component\DomCrawler\Crawler;

/**
 * Free, no-API-key scraper for prospect research: fetches the homepage plus a
 * few likely candidate paths via Laravel's Http facade (fast, no headless
 * browser) and extracts title/meta description/visible text plus contact
 * hints (mailto: links, "Name — Title" patterns). Falls back to Browsershot
 * (already installed for PDF rendering) only when the plain HTTP fetch
 * yields very little text, which usually means a JS-rendered SPA.
 */
class WebScraper
{
    private const CANDIDATE_PATHS = ['', '/about', '/about-us', '/contact', '/team', '/our-team'];

    private const MAX_CHARS = 3000;

    private const MIN_TEXT_FOR_STATIC_FETCH = 200;

    private const TIMEOUT_SECONDS = 8;

    /**
     * @return array{text: string, contact_hints: array<int, string>}
     */
    public function scrape(string $websiteUrl): array
    {
        $base = rtrim($websiteUrl, '/');

        $chunks = [];
        $contactHints = [];

        foreach (self::CANDIDATE_PATHS as $path) {
            $url = $base.$path;

            try {
                $response = Http::timeout(self::TIMEOUT_SECONDS)
                    ->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; ZeronixOutreachBot/1.0)'])
                    ->get($url);
            } catch (\Throwable $e) {
                continue; // unreachable path/host — ignore and try the next candidate
            }

            if (!$response->successful()) {
                continue; // ignore 404s and other non-2xx responses
            }

            $html = $response->body();
            if (trim($html) === '') {
                continue;
            }

            [$pageText, $pageHints] = $this->extractFromHtml($html);
            if ($pageText !== '') {
                // Prioritize homepage + about page content by placing them first.
                $chunks[] = $pageText;
            }
            $contactHints = array_merge($contactHints, $pageHints);

            if (mb_strlen(implode(' ', $chunks)) >= self::MAX_CHARS) {
                break;
            }
        }

        $combinedText = trim(implode("\n\n", $chunks));

        // Fallback to a headless-browser render only when the static fetch
        // yielded very little text — a strong signal of a JS-rendered SPA.
        if (mb_strlen($combinedText) < self::MIN_TEXT_FOR_STATIC_FETCH) {
            try {
                $rendered = $this->renderWithBrowsershot($base);
                if ($rendered !== '') {
                    [$pageText, $pageHints] = $this->extractFromHtml($rendered, isFullDocument: false);
                    if (mb_strlen($pageText) > mb_strlen($combinedText)) {
                        $combinedText = $pageText;
                    }
                    $contactHints = array_merge($contactHints, $pageHints);
                }
            } catch (\Throwable $e) {
                Log::warning('Outreach WebScraper Browsershot fallback failed', [
                    'website_url' => $websiteUrl,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return [
            'text' => mb_substr($combinedText, 0, self::MAX_CHARS),
            'contact_hints' => array_values(array_unique($contactHints)),
        ];
    }

    /**
     * @return array{0: string, 1: array<int, string>}
     */
    private function extractFromHtml(string $html, bool $isFullDocument = true): array
    {
        $mailtoHints = $this->extractMailtoHints($html);
        $namePatternHints = $this->extractNameTitleHints($html);

        $crawler = new Crawler();
        try {
            if ($isFullDocument) {
                $crawler->addHtmlContent($html);
            } else {
                $crawler->addHtmlContent('<html><body>'.$html.'</body></html>');
            }
        } catch (\Throwable $e) {
            return ['', array_merge($mailtoHints, $namePatternHints)];
        }

        $title = '';
        $metaDescription = '';
        try {
            $titleNode = $crawler->filter('title')->first();
            if (count($titleNode) > 0) {
                $title = trim($titleNode->text(''));
            }
        } catch (\Throwable) {
        }
        try {
            $metaNode = $crawler->filter('meta[name="description"]')->first();
            if (count($metaNode) > 0) {
                $metaDescription = trim((string) $metaNode->attr('content'));
            }
        } catch (\Throwable) {
        }

        // Strip script/style before pulling body text so we don't send JS/CSS
        // noise to the model.
        try {
            $crawler->filter('script, style, noscript')->each(function (Crawler $node) {
                $domNode = $node->getNode(0);
                $domNode?->parentNode?->removeChild($domNode);
            });
        } catch (\Throwable) {
        }

        $bodyText = '';
        try {
            $bodyNode = $crawler->filter('body')->first();
            $bodyText = count($bodyNode) > 0 ? $bodyNode->text('') : $crawler->text('');
        } catch (\Throwable) {
            $bodyText = '';
        }
        $bodyText = preg_replace('/\s+/', ' ', $bodyText) ?? '';
        $bodyText = trim($bodyText);

        $parts = array_filter([
            $title ? "Title: {$title}" : '',
            $metaDescription ? "Description: {$metaDescription}" : '',
            $bodyText,
        ]);

        return [implode("\n", $parts), array_merge($mailtoHints, $namePatternHints)];
    }

    /**
     * @return array<int, string>
     */
    private function extractMailtoHints(string $html): array
    {
        if (!preg_match_all('/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i', $html, $matches)) {
            return [];
        }

        return array_map(fn ($email) => "mailto found: {$email}", array_unique($matches[1]));
    }

    /**
     * Simple "Name — Title" / "Name, Title" pattern scan over the plain text
     * (after stripping tags) as extra contact hints for the model — this is
     * a heuristic signal, not a guaranteed match.
     *
     * @return array<int, string>
     */
    private function extractNameTitleHints(string $html): array
    {
        $text = trim(preg_replace('/\s+/', ' ', strip_tags($html)) ?? '');
        $hints = [];

        // "John Smith — IT Manager" or "John Smith - Procurement Head" or "John Smith, CTO"
        if (preg_match_all('/\b([A-Z][a-zA-Z\'\-]+(?:\s+[A-Z][a-zA-Z\'\-]+){1,2})\s*[\-\x{2013}\x{2014},]\s*([A-Z][A-Za-z&\/ ]{2,40})\b/u', $text, $matches, PREG_SET_ORDER)) {
            foreach (array_slice($matches, 0, 5) as $m) {
                $hints[] = "possible contact: {$m[1]} — {$m[2]}";
            }
        }

        return $hints;
    }

    private function renderWithBrowsershot(string $url): string
    {
        $browsershot = Browsershot::url($url)
            ->setNodeModulePath(base_path('node_modules'))
            ->setIncludePath('$PATH:/usr/local/bin:/opt/homebrew/bin:'.dirname(PHP_BINARY))
            ->noSandbox()
            ->newHeadless()
            ->waitUntilNetworkIdle(false)
            ->timeout(30)
            ->writeOptionsToFile();

        $chromePath = $this->resolveChromePath();
        if ($chromePath) {
            $browsershot->setChromePath($chromePath);
        }

        return $browsershot->bodyHtml();
    }

    /**
     * Mirrors QuotePdfGenerator::resolveChromePath — Puppeteer's Chrome cache
     * location is version-specific, so resolve whatever's actually present.
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

            $matches = glob($root.'/chrome/*/chrome-*/chrome');
            if ($matches) {
                sort($matches);

                return end($matches);
            }
        }

        return null;
    }
}
