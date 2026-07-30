<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OutreachEmailEvent extends Model
{
    protected $fillable = [
        'send_id',
        'event_type',
        'occurred_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function send(): BelongsTo
    {
        return $this->belongsTo(OutreachSend::class, 'send_id');
    }
}
