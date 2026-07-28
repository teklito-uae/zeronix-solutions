<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = [
        'name',
        'address',
        'trn',
        'phone',
        'email',
        'logo_data_url',
        'logo_dark_data_url',
        'default_payment_terms',
        'default_terms',
        'default_signatory',
    ];

    /**
     * Always operate on the singleton row (id = 1), creating it with sane
     * defaults if it somehow doesn't exist yet (e.g. fresh test DB).
     */
    public static function singleton(): self
    {
        return static::firstOrCreate(['id' => 1], [
            'name' => 'Zeronix Technology LLC',
        ]);
    }
}
