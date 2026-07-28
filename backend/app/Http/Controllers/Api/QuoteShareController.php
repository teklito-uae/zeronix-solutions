<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quote;
use Illuminate\Support\Str;

class QuoteShareController extends Controller
{
    public function store(int $id)
    {
        $quote = Quote::findOrFail($id);

        if (!$quote->share_token) {
            $quote->share_token = Str::random(40);
            $quote->save();
        }

        return response()->json([
            'share_token' => $quote->share_token,
            'share_url' => url("/share/{$quote->share_token}"),
        ]);
    }

    public function destroy(int $id)
    {
        $quote = Quote::findOrFail($id);
        $quote->share_token = null;
        $quote->save();

        return response()->json(['ok' => true]);
    }
}
