<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enquiry;
use App\Models\Quote;
use App\Services\DefaultQuoteTemplate;
use App\Services\EnquiryNumberGenerator;
use App\Services\QuoteNumberGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EnquiryController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q', '');
        $status = $request->query('status', '');

        $query = Enquiry::query()->with('client');

        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('title', 'like', "%{$q}%")
                    ->orWhere('enquiry_no', 'like', "%{$q}%")
                    ->orWhere('contact_name', 'like', "%{$q}%")
                    ->orWhere('company_name', 'like', "%{$q}%");
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        return response()->json($query->orderByDesc('updated_at')->get());
    }

    public function show(int $id)
    {
        $enquiry = Enquiry::with('client', 'convertedQuote')->find($id);
        if (!$enquiry) {
            return response()->json(['error' => 'not found'], 404);
        }

        return response()->json($enquiry);
    }

    public function store(Request $request, EnquiryNumberGenerator $enquiryNumbers)
    {
        $contactName = $request->input('contact_name');
        $companyName = $request->input('company_name');

        if (!$contactName && !$companyName) {
            return response()->json(['error' => 'contact_name or company_name is required'], 400);
        }

        $enquiry = Enquiry::create([
            'enquiry_no' => $enquiryNumbers->next(),
            'client_id' => $request->input('client_id') ?: null,
            'contact_name' => $contactName ?: $companyName,
            'contact_email' => $request->input('contact_email'),
            'contact_phone' => $request->input('contact_phone'),
            'company_name' => $companyName,
            'service_type' => $request->input('service_type', 'Other'),
            'title' => $request->input('title', 'Untitled Enquiry'),
            'scope_of_work' => $request->input('scope_of_work', ''),
            'budget_range' => $request->input('budget_range'),
            'priority' => $request->input('priority', 'medium'),
            'source' => $request->input('source', 'other'),
            'status' => $request->input('status', 'new'),
            'notes' => $request->input('notes'),
        ]);

        return response()->json($enquiry, 201);
    }

    public function update(Request $request, int $id)
    {
        $enquiry = Enquiry::find($id);
        if (!$enquiry) {
            return response()->json(['error' => 'not found'], 404);
        }

        $fields = [
            'client_id', 'contact_name', 'contact_email', 'contact_phone',
            'company_name', 'service_type', 'title', 'scope_of_work',
            'budget_range', 'priority', 'source', 'status', 'notes',
        ];

        $data = [];
        foreach ($fields as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->input($field);
            }
        }

        $enquiry->update($data);

        return response()->json($enquiry->fresh());
    }

    public function destroy(int $id)
    {
        Enquiry::where('id', $id)->delete();

        return response()->noContent();
    }

    public function convertToQuote(int $id, QuoteNumberGenerator $quoteNumbers)
    {
        $enquiry = Enquiry::find($id);
        if (!$enquiry) {
            return response()->json(['error' => 'not found'], 404);
        }

        $blocks = DefaultQuoteTemplate::buildDefaultBlocks();

        // Prepend a "Scope of Work" heading + the enquiry's rich-text scope
        // right after the cover block (if any).
        $scopeBlocks = [
            ['id' => 'h-scope-'.Str::random(8), 'type' => 'heading', 'text' => 'SCOPE OF WORK', 'number' => '1'],
            ['id' => 'rt-scope-'.Str::random(8), 'type' => 'richtext', 'html' => $enquiry->scope_of_work ?: ''],
        ];

        $insertAt = ($blocks[0]['type'] ?? null) === 'cover' ? 1 : 0;
        array_splice($blocks, $insertAt, 0, $scopeBlocks);

        $quote = Quote::create([
            'quote_no' => $quoteNumbers->next(),
            'quote_date' => now()->format('Y-m-d'),
            'due_date' => null,
            'client_id' => $enquiry->client_id,
            'status' => 'draft',
            'title' => $enquiry->title,
            'blocks' => $blocks,
        ]);

        $enquiry->update([
            'converted_quote_id' => $quote->id,
            'status' => 'quoted',
        ]);

        return response()->json($quote, 201);
    }
}
