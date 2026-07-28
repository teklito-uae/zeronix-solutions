<?php

namespace App\Services;

use App\Models\Enquiry;
use Illuminate\Support\Facades\DB;

class EnquiryNumberGenerator
{
    /**
     * Same pattern as QuoteNumberGenerator but prefix ENQ-{year}-.
     */
    public function next(): string
    {
        return DB::transaction(function () {
            $year = date('Y');
            $prefix = "ENQ-{$year}-";

            $row = Enquiry::where('enquiry_no', 'like', "{$prefix}%")
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();

            $seq = 1;
            if ($row) {
                $tail = substr($row->enquiry_no, strlen($prefix));
                $parsed = (int) $tail;
                if ($parsed > 0 || $tail === '0') {
                    $seq = $parsed + 1;
                }
            }

            return $prefix.str_pad((string) $seq, 6, '0', STR_PAD_LEFT);
        });
    }
}
