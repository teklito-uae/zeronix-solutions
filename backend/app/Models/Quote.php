<?php

namespace App\Models;

use App\Services\QuoteTotalsService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Quote extends Model
{
    protected $fillable = [
        'quote_no',
        'quote_date',
        'due_date',
        'client_id',
        'status',
        'title',
        'blocks',
        'subtotal_amount',
        'vat_amount',
        'grand_total_amount',
    ];

    protected function casts(): array
    {
        return [
            'blocks' => 'array',
            'quote_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'subtotal_amount' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'grand_total_amount' => 'decimal:2',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    protected static function booted(): void
    {
        // Recompute stored totals from the blocks JSON any time it changes,
        // whether the quote is being created or updated.
        static::saving(function (Quote $quote) {
            if ($quote->isDirty('blocks')) {
                $totals = app(QuoteTotalsService::class)->compute($quote->blocks ?? []);
                $quote->subtotal_amount = $totals['subtotal'];
                $quote->vat_amount = $totals['vat'];
                $quote->grand_total_amount = $totals['grand_total'];
            }
        });
    }
}
