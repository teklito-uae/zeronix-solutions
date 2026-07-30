<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OutreachSequenceStep extends Model
{
    protected $fillable = [
        'campaign_id',
        'step_number',
        'wait_days',
        'subject_template',
        'body_template',
        'is_final_step',
    ];

    protected function casts(): array
    {
        return [
            'is_final_step' => 'boolean',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(OutreachCampaign::class, 'campaign_id');
    }
}
