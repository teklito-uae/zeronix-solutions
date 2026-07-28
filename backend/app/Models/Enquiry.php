<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enquiry extends Model
{
    protected $fillable = [
        'enquiry_no',
        'client_id',
        'contact_name',
        'contact_email',
        'contact_phone',
        'company_name',
        'service_type',
        'title',
        'scope_of_work',
        'budget_range',
        'priority',
        'source',
        'status',
        'converted_quote_id',
        'notes',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function convertedQuote(): BelongsTo
    {
        return $this->belongsTo(Quote::class, 'converted_quote_id');
    }
}
