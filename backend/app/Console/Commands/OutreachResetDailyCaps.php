<?php

namespace App\Console\Commands;

use App\Models\OutreachMailbox;
use Illuminate\Console\Command;

class OutreachResetDailyCaps extends Command
{
    protected $signature = 'outreach:reset-daily-caps';

    protected $description = 'Reset each mailbox\'s daily send counter (also gradually ramps up warm-up caps)';

    public function handle(): int
    {
        OutreachMailbox::query()->update(['sent_today' => 0, 'sent_today_reset_at' => now()->toDateString()]);

        // Warm-up ramp: raise the daily cap slightly each day for the first 3 weeks,
        // capped at whatever the mailbox's own configured limit already allows.
        foreach (OutreachMailbox::where('warmup_stage', '<', 21)->get() as $mailbox) {
            $mailbox->increment('warmup_stage');
        }

        $this->info('Daily send caps reset.');

        return self::SUCCESS;
    }
}
