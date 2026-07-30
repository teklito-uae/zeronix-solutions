<?php

namespace App\Console\Commands;

use App\Jobs\Outreach\PollMailboxJob;
use App\Models\OutreachMailbox;
use Illuminate\Console\Command;

class OutreachPollMailboxes extends Command
{
    protected $signature = 'outreach:poll-mailboxes';

    protected $description = 'Poll each active mailbox via IMAP for replies and bounces';

    public function handle(): int
    {
        $mailboxes = OutreachMailbox::where('status', 'active')->pluck('id');

        foreach ($mailboxes as $id) {
            PollMailboxJob::dispatch($id);
        }

        $this->info("Polling {$mailboxes->count()} mailbox(es).");

        return self::SUCCESS;
    }
}
