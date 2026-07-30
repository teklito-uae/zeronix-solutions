<?php

namespace App\Jobs\Outreach;

use App\Models\OutreachMailbox;
use App\Models\OutreachSend;
use App\Models\OutreachSuppression;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Webklex\PHPIMAP\ClientManager;

class PollMailboxJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $mailboxId)
    {
    }

    public function handle(): void
    {
        $mailbox = OutreachMailbox::find($this->mailboxId);
        if (!$mailbox || $mailbox->status !== 'active') {
            return;
        }

        try {
            $client = (new ClientManager())->make([
                'host' => $mailbox->imap_host,
                'port' => (int) $mailbox->imap_port,
                'encryption' => $mailbox->imap_encryption,
                'validate_cert' => true,
                'username' => $mailbox->imap_username,
                'password' => $mailbox->imap_password,
                'protocol' => 'imap',
            ]);
            $client->connect();
            $folder = $client->getFolder($mailbox->imap_folder ?: 'INBOX');

            $since = $mailbox->last_imap_check_at ?? now()->subDays(2);
            $messages = $folder->query()->since($since)->get();

            foreach ($messages as $message) {
                $this->attribute($message);
            }

            $client->disconnect();
            $mailbox->update(['last_imap_check_at' => now(), 'last_error' => null]);
        } catch (\Throwable $e) {
            Log::warning('Outreach IMAP poll failed', ['mailbox_id' => $mailbox->id, 'error' => $e->getMessage()]);
            $mailbox->update(['last_error' => $e->getMessage()]);
        }
    }

    private function attribute($message): void
    {
        $inReplyTo = (string) ($message->getInReplyTo() ?? '');
        $references = (string) ($message->getReferences() ?? '');
        $subject = (string) ($message->getSubject() ?? '');
        $from = $message->getFrom()[0]->mail ?? null;

        $send = null;
        if ($inReplyTo || $references) {
            $candidates = array_filter(array_map('trim', explode(' ', $inReplyTo.' '.$references)));
            foreach ($candidates as $messageId) {
                $send = OutreachSend::where('message_id', 'like', '%'.trim($messageId, '<>').'%')->first();
                if ($send) {
                    break;
                }
            }
        }

        // Fallback: match by recipient address when threading headers are stripped.
        if (!$send && $from) {
            $send = OutreachSend::whereHas('contact', fn ($q) => $q->where('email', $from))
                ->where('status', 'sent')
                ->orderByDesc('sent_at')
                ->first();
        }

        if (!$send) {
            return;
        }

        $isBounce = str_contains(strtolower($subject), 'delivery status')
            || str_contains(strtolower($subject), 'undeliverable')
            || str_contains(strtolower((string) $from), 'mailer-daemon');

        DB::transaction(function () use ($send, $isBounce) {
            if ($isBounce) {
                $send->update(['status' => 'bounced']);
                $send->events()->create(['event_type' => 'bounce', 'occurred_at' => now()]);
                OutreachSuppression::firstOrCreate(
                    ['email' => $send->contact->email],
                    ['reason' => 'bounced_hard']
                );
                $send->prospect->update(['status' => 'bounced']);

                return;
            }

            $send->events()->create(['event_type' => 'reply', 'occurred_at' => now()]);

            // Stop-on-reply: cancel any not-yet-sent follow-ups for this prospect.
            $send->prospect->sends()->where('status', 'scheduled')->update(['status' => 'skipped_suppressed', 'failed_reason' => 'prospect replied']);
            $send->prospect->update(['status' => 'replied']);
        });
    }
}
