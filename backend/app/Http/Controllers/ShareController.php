<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Quote;
use App\Services\QuotePdfGenerator;
use Illuminate\Http\Request;

class ShareController extends Controller
{
    public function show(string $token)
    {
        $quote = Quote::where('share_token', $token)->firstOrFail();
        $company = Company::singleton();

        $clientName = $quote->client?->name;

        return view('share.quote', [
            'quote' => $quote,
            'company' => $company,
            'clientName' => $clientName,
            'metaTitle' => $quote->title,
            'metaDescription' => $clientName
                ? "Quote prepared for {$clientName} by {$company->name} — {$quote->quote_no}"
                : "Quote from {$company->name} — {$quote->quote_no}",
        ]);
    }

    public function pdf(Request $request, string $token, QuotePdfGenerator $generator)
    {
        $quote = Quote::where('share_token', $token)->firstOrFail();
        $company = Company::singleton();

        try {
            $bytes = $generator->generate($quote->toArray(), $company->toArray());
        } catch (\Throwable $e) {
            report($e);

            return response('PDF generation failed', 500);
        }

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return response($bytes, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$quote->quote_no.'.pdf"',
        ]);
    }
}
