<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OutreachMailbox extends Model
{
    protected $fillable = [
        'name',
        'from_name',
        'from_email',
        'smtp_host',
        'smtp_port',
        'smtp_username',
        'smtp_password',
        'smtp_encryption',
        'imap_host',
        'imap_port',
        'imap_username',
        'imap_password',
        'imap_encryption',
        'imap_folder',
        'daily_send_cap',
        'sent_today',
        'sent_today_reset_at',
        'warmup_stage',
        'warmup_started_at',
        'status',
        'last_imap_check_at',
        'last_error',
        'is_default',
    ];

    protected $hidden = [
        'smtp_password',
        'imap_password',
    ];

    protected function casts(): array
    {
        return [
            'smtp_password' => 'encrypted',
            'imap_password' => 'encrypted',
            'sent_today_reset_at' => 'date',
            'warmup_started_at' => 'datetime',
            'last_imap_check_at' => 'datetime',
            'is_default' => 'boolean',
        ];
    }

    public function campaigns(): HasMany
    {
        return $this->hasMany(OutreachCampaign::class, 'mailbox_id');
    }

    public function sends(): HasMany
    {
        return $this->hasMany(OutreachSend::class, 'mailbox_id');
    }
}
