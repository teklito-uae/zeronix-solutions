<?php

namespace App\Services;

use App\Models\Quote;
use Illuminate\Support\Facades\DB;

class QuoteNumberGenerator
{
    /**
     * Port of server/src/quoteNumber.ts::nextQuoteNumber().
     * Format: ZN-QT-{year}-{seq zero-padded to 6 digits}.
     */
    public function next(): string
    {
        return DB::transaction(function () {
            $year = date('Y');
            $prefix = "ZN-QT-{$year}-";

            $row = Quote::where('quote_no', 'like', "{$prefix}%")
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();

            $seq = 1;
            if ($row) {
                $tail = substr($row->quote_no, strlen($prefix));
                $parsed = (int) $tail;
                if ($parsed > 0 || $tail === '0') {
                    $seq = $parsed + 1;
                }
            }

            return $prefix.str_pad((string) $seq, 6, '0', STR_PAD_LEFT);
        });
    }
}
