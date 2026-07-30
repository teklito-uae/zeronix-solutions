<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OutreachContact extends Model
{
    protected $fillable = [
        'prospect_id',
        'full_name',
        'guessed_title',
        'email',
        'email_confidence',
        'email_verification_status',
        'source_notes',
    ];

    public function prospect(): BelongsTo
    {
        return $this->belongsTo(OutreachProspect::class, 'prospect_id');
    }

    public function sends(): HasMany
    {
        return $this->hasMany(OutreachSend::class, 'contact_id');
    }
}
