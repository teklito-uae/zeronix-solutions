<?php

namespace App\Console\Commands;

use App\Models\OutreachProspect;
use App\Services\Outreach\SequenceAdvancer;
use Illuminate\Console\Command;

class OutreachAdvanceSequences extends Command
{
    protected $signature = 'outreach:advance-sequences';

    protected $description = 'Queue the next sequence-step email for active prospects whose cool-off period has elapsed';

    public function handle(SequenceAdvancer $advancer): int
    {
        $prospects = OutreachProspect::where('status', 'active')->get();
        $queued = 0;

        foreach ($prospects as $prospect) {
            if ($advancer->queueNextStep($prospect)) {
                $queued++;
            }
        }

        $this->info("Queued next step for {$queued} prospect(s).");

        return self::SUCCESS;
    }
}
