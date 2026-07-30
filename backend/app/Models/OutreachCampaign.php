<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OutreachCampaign extends Model
{
    protected $fillable = [
        'name',
        'mailbox_id',
        'service_focus',
        'target_industry_notes',
        'status',
        'daily_new_send_limit',
        'send_window_start',
        'send_window_end',
        'send_days',
        'unsubscribe_footer_text',
    ];

    protected function casts(): array
    {
        return [
            'send_days' => 'array',
        ];
    }

    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(OutreachMailbox::class, 'mailbox_id');
    }

    public function sequenceSteps(): HasMany
    {
        return $this->hasMany(OutreachSequenceStep::class, 'campaign_id')->orderBy('step_number');
    }

    public function prospects(): HasMany
    {
        return $this->hasMany(OutreachProspect::class, 'campaign_id');
    }
}
