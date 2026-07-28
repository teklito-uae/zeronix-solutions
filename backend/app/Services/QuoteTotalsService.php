<?php

namespace App\Services;

class QuoteTotalsService
{
    /**
     * Port of client/src/lib/priceMath.ts::computeTotals, extended to walk a
     * quote's full `blocks` array and aggregate across every `pricetable`
     * block found (subtotal is the sum across all pricetable blocks; VAT is
     * applied using the first pricetable block's vatPercent).
     *
     * @param  array<int, array<string, mixed>>  $blocks
     * @return array{subtotal: float, vat: float, grand_total: float}
     */
    public function compute(array $blocks): array
    {
        $subtotal = 0.0;
        $vatPercent = null;

        foreach ($blocks as $block) {
            if (!is_array($block) || ($block['type'] ?? null) !== 'pricetable') {
                continue;
            }

            if ($vatPercent === null) {
                $vatPercent = (float) ($block['vatPercent'] ?? 0);
            }

            foreach ($block['rows'] ?? [] as $row) {
                $unit = (float) ($row['unit'] ?? 0);
                $unitPrice = (float) ($row['unitPrice'] ?? 0);
                $subtotal += $unit * $unitPrice;
            }
        }

        $vatPercent ??= 0;
        $vat = $subtotal * ($vatPercent / 100);
        $grandTotal = $subtotal + $vat;

        return [
            'subtotal' => round($subtotal, 2),
            'vat' => round($vat, 2),
            'grand_total' => round($grandTotal, 2),
        ];
    }
}
