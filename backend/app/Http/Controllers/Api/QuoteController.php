<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quote;
use App\Services\DefaultQuoteTemplate;
use App\Services\QuoteNumberGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuoteController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q', '');

        $query = DB::table('quotes')
            ->leftJoin('clients', 'clients.id', '=', 'quotes.client_id')
            ->select('quotes.*', 'clients.name as client_name');

        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('quotes.title', 'like', "%{$q}%")
                    ->orWhere('quotes.quote_no', 'like', "%{$q}%")
                    ->orWhere('clients.name', 'like', "%{$q}%");
            });
        }

        $rows = $query->orderByDesc('quotes.updated_at')->get();

        return response()->json($rows->map(fn ($row) => $this->rowToQuote($row)));
    }

    public function show(int $id)
    {
        $quote = Quote::find($id);
        if (!$quote) {
            return response()->json(['error' => 'not found'], 404);
        }

        return response()->json($quote);
    }

    public function store(Request $request, QuoteNumberGenerator $quoteNumbers)
    {
        $title = $request->input('title', 'Untitled Quote');
        $clientId = $request->input('client_id');
        $fromTemplate = $request->input('fromTemplate');

        $blocks = $fromTemplate === false ? [] : DefaultQuoteTemplate::buildDefaultBlocks();

        $quote = Quote::create([
            'quote_no' => $quoteNumbers->next(),
            'quote_date' => now()->format('Y-m-d'),
            'due_date' => null,
            'client_id' => $clientId ?: null,
            'status' => 'draft',
            'title' => $title ?: 'Untitled Quote',
            'blocks' => $blocks,
        ]);

        return response()->json($quote, 201);
    }

    public function update(Request $request, int $id)
    {
        $quote = Quote::find($id);
        if (!$quote) {
            return response()->json(['error' => 'not found'], 404);
        }

        $data = [];
        foreach (['title', 'client_id', 'status', 'quote_date', 'due_date', 'blocks'] as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->input($field);
            }
        }

        $quote->update($data);

        return response()->json($quote->fresh());
    }

    public function destroy(int $id)
    {
        Quote::where('id', $id)->delete();

        return response()->noContent();
    }

    public function duplicate(int $id, QuoteNumberGenerator $quoteNumbers)
    {
        $existing = Quote::find($id);
        if (!$existing) {
            return response()->json(['error' => 'not found'], 404);
        }

        $copy = Quote::create([
            'quote_no' => $quoteNumbers->next(),
            'quote_date' => now()->format('Y-m-d'),
            'due_date' => null,
            'client_id' => $existing->client_id,
            'status' => 'draft',
            'title' => "{$existing->title} (Copy)",
            'blocks' => $existing->blocks,
        ]);

        return response()->json($copy, 201);
    }

    private function rowToQuote(object $row): array
    {
        $arr = (array) $row;
        $arr['blocks'] = json_decode($arr['blocks'] ?? '[]', true) ?? [];
        $arr['subtotal_amount'] = isset($arr['subtotal_amount']) ? (float) $arr['subtotal_amount'] : 0.0;
        $arr['vat_amount'] = isset($arr['vat_amount']) ? (float) $arr['vat_amount'] : 0.0;
        $arr['grand_total_amount'] = isset($arr['grand_total_amount']) ? (float) $arr['grand_total_amount'] : 0.0;

        return $arr;
    }
}
