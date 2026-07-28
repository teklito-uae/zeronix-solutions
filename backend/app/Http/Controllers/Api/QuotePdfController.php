<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Quote;
use App\Services\QuoteHtmlRenderer;
use App\Services\QuotePdfGenerator;
use Illuminate\Http\Request;

class QuotePdfController extends Controller
{
    public function html(int $id, QuoteHtmlRenderer $renderer)
    {
        [$quote, $company] = $this->load($id);
        if (!$quote) {
            return response('Not found', 404);
        }

        $html = $renderer->renderQuoteHtml($quote, $company);

        return response($html, 200)->header('Content-Type', 'text/html');
    }

    public function pdf(Request $request, int $id, QuotePdfGenerator $generator)
    {
        [$quote, $company] = $this->load($id);
        if (!$quote) {
            return response('Not found', 404);
        }

        try {
            $bytes = $generator->generate($quote, $company);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['error' => 'PDF generation failed', 'message' => $e->getMessage()], 500);
        }

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return response($bytes, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$quote['quote_no'].'.pdf"',
        ]);
    }

    /**
     * @return array{0: ?array<string, mixed>, 1: array<string, mixed>}
     */
    private function load(int $id): array
    {
        $quote = Quote::find($id);
        if (!$quote) {
            return [null, []];
        }

        return [$quote->toArray(), Company::singleton()->toArray()];
    }
}
