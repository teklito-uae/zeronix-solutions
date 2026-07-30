<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OutreachProspect extends Model
{
    protected $fillable = [
        'campaign_id',
        'company_name',
        'website_url',
        'industry_guess',
        'industry_confidence',
        'research_summary',
        'trigger_event',
        'status',
        'researched_at',
        'research_error',
        'converted_client_id',
        'converted_enquiry_id',
    ];

    protected function casts(): array
    {
        return [
            'researched_at' => 'datetime',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(OutreachCampaign::class, 'campaign_id');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(OutreachContact::class, 'prospect_id');
    }

    public function sends(): HasMany
    {
        return $this->hasMany(OutreachSend::class, 'prospect_id');
    }

    public function convertedClient(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'converted_client_id');
    }

    public function convertedEnquiry(): BelongsTo
    {
        return $this->belongsTo(Enquiry::class, 'converted_enquiry_id');
    }
}
