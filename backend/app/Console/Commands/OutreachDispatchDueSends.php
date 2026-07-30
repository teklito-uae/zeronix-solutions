<?php

namespace App\Console\Commands;

use App\Jobs\Outreach\SendOutreachEmailJob;
use App\Models\OutreachSend;
use Illuminate\Console\Command;

class OutreachDispatchDueSends extends Command
{
    protected $signature = 'outreach:dispatch-due-sends';

    protected $description = 'Dispatch queued jobs for outreach sends whose scheduled_at has passed';

    public function handle(): int
    {
        $due = OutreachSend::where('status', 'scheduled')
            ->where('scheduled_at', '<=', now())
            ->pluck('id');

        foreach ($due as $id) {
            SendOutreachEmailJob::dispatch($id);
        }

        $this->info("Dispatched {$due->count()} outreach send(s).");

        return self::SUCCESS;
    }
}
