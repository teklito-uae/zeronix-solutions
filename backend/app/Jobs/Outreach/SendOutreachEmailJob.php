<?php

namespace App\Jobs\Outreach;

use App\Models\OutreachSend;
use App\Models\OutreachSuppression;
use App\Services\Outreach\BusinessDays;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mime\Email;

class SendOutreachEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $sendId)
    {
    }

    public function handle(): void
    {
        $send = OutreachSend::with(['prospect.campaign', 'contact', 'mailbox'])->find($this->sendId);
        if (!$send || $send->status !== 'scheduled') {
            return;
        }

        $mailbox = $send->mailbox;
        $campaign = $send->prospect->campaign;
        $contact = $send->contact;

        if (OutreachSuppression::where('email', $contact->email)->exists()) {
            $send->update(['status' => 'skipped_suppressed', 'failed_reason' => 'recipient is on the suppression list']);

            return;
        }

        if (!$this->withinSendWindow($campaign)) {
            // Not sending outside business hours/days — the dispatch-due-sends
            // scheduler will pick this back up on the next run inside the window.
            return;
        }

        $this->resetDailyCapIfNewDay($mailbox);
        if ($mailbox->sent_today >= $mailbox->daily_send_cap) {
            return; // cap reached for today, try again tomorrow
        }

        $send->update(['status' => 'sending']);

        $messageId = sprintf('<%s@%s>', (string) Str::uuid(), $this->domainOf($mailbox->from_email));
        $body = $this->injectTracking($send->body_html, $send->tracking_token, $campaign);

        try {
            $transport = new EsmtpTransport($mailbox->smtp_host, (int) $mailbox->smtp_port, $mailbox->smtp_encryption === 'ssl');
            $transport->setUsername($mailbox->smtp_username);
            $transport->setPassword($mailbox->smtp_password);

            $mimeEmail = (new Email())
                ->from(sprintf('%s <%s>', $mailbox->from_name, $mailbox->from_email))
                ->to($contact->email)
                ->subject($send->subject)
                ->html($body);
            $mimeEmail->getHeaders()->addIdHeader('Message-ID', ltrim(rtrim($messageId, '>'), '<'));
            if ($send->in_reply_to) {
                $mimeEmail->getHeaders()->addTextHeader('In-Reply-To', $send->in_reply_to);
                $mimeEmail->getHeaders()->addTextHeader('References', $send->in_reply_to);
            }

            $transport->send($mimeEmail);

            $send->update(['status' => 'sent', 'sent_at' => now(), 'message_id' => $messageId]);
            $mailbox->increment('sent_today');
            $send->prospect->update(['status' => 'active']);
        } catch (\Throwable $e) {
            $send->update(['status' => 'failed', 'failed_reason' => $e->getMessage()]);
        }
    }

    private function withinSendWindow($campaign): bool
    {
        $now = Carbon::now();
        $sendDays = $campaign->send_days ?: ['sun', 'mon', 'tue', 'wed', 'thu'];

        if (!BusinessDays::isSendableDay($now, $sendDays)) {
            return false;
        }

        $start = Carbon::parse($campaign->send_window_start)->setDateFrom($now);
        $end = Carbon::parse($campaign->send_window_end)->setDateFrom($now);

        return $now->between($start, $end);
    }

    private function resetDailyCapIfNewDay($mailbox): void
    {
        $today = Carbon::today();
        if (!$mailbox->sent_today_reset_at || !$mailbox->sent_today_reset_at->isSameDay($today)) {
            $mailbox->update(['sent_today' => 0, 'sent_today_reset_at' => $today]);
        }
    }

    private function domainOf(string $email): string
    {
        return Str::after($email, '@') ?: 'zeronix.local';
    }

    private function injectTracking(string $html, string $token, $campaign): string
    {
        $base = config('app.url');

        $html = preg_replace_callback(
            '/href="(https?:\/\/[^"]+)"/i',
            fn ($m) => 'href="'.$base.'/api/outreach/track/click/'.$token.'?u='.urlencode($m[1]).'"',
            $html
        );

        $pixel = '<img src="'.$base.'/api/outreach/track/open/'.$token.'.png" width="1" height="1" style="display:none" alt="" />';
        $unsubscribe = '<p style="font-size:11px;color:#888;margin-top:24px;">'
            .($campaign->unsubscribe_footer_text ?: 'If you\'d rather not receive these emails,')
            .' <a href="'.$base.'/api/outreach/unsubscribe/'.$token.'">unsubscribe here</a>.</p>';

        return $html.$unsubscribe.$pixel;
    }
}
