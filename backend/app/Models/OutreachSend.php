<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OutreachSend extends Model
{
    protected $fillable = [
        'prospect_id',
        'contact_id',
        'sequence_step_id',
        'mailbox_id',
        'subject',
        'body_html',
        'message_id',
        'in_reply_to',
        'tracking_token',
        'status',
        'scheduled_at',
        'sent_at',
        'failed_reason',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'sent_at' => 'datetime',
        ];
    }

    public function prospect(): BelongsTo
    {
        return $this->belongsTo(OutreachProspect::class, 'prospect_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(OutreachContact::class, 'contact_id');
    }

    public function sequenceStep(): BelongsTo
    {
        return $this->belongsTo(OutreachSequenceStep::class, 'sequence_step_id');
    }

    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(OutreachMailbox::class, 'mailbox_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(OutreachEmailEvent::class, 'send_id');
    }
}
