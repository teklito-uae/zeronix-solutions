<?php

namespace App\Services\Outreach;

use App\Models\OutreachProspect;
use App\Models\OutreachSend;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class SequenceAdvancer
{
    public function __construct(private readonly TemplateRenderer $renderer)
    {
    }

    /**
     * Creates the next scheduled send for a prospect (the first step if none
     * sent yet, or the next step after the configured cool-off). Returns null
     * if the prospect has no verified contact, no next step, or already has
     * a pending/active send.
     */
    public function queueNextStep(OutreachProspect $prospect): ?OutreachSend
    {
        $campaign = $prospect->campaign()->with('sequenceSteps', 'mailbox')->first();
        if (!$campaign || !$campaign->mailbox_id) {
            return null;
        }

        if ($prospect->sends()->whereIn('status', ['scheduled', 'sending'])->exists()) {
            return null;
        }

        $contact = $prospect->contacts()
            ->whereIn('email_verification_status', ['smtp_verified', 'unverified'])
            ->whereNotNull('email')
            ->orderByDesc('email_confidence')
            ->first();
        if (!$contact) {
            return null;
        }

        $lastSend = $prospect->sends()->where('status', 'sent')->orderByDesc('sent_at')->first();
        $nextStepNumber = $lastSend ? $lastSend->sequenceStep->step_number + 1 : 1;

        $step = $campaign->sequenceSteps->firstWhere('step_number', $nextStepNumber);
        if (!$step) {
            return null;
        }

        $sendDays = $campaign->send_days ?: ['sun', 'mon', 'tue', 'wed', 'thu'];
        $scheduledAt = $lastSend
            ? BusinessDays::add(Carbon::parse($lastSend->sent_at), $step->wait_days, $sendDays)
            : Carbon::now();

        return OutreachSend::create([
            'prospect_id' => $prospect->id,
            'contact_id' => $contact->id,
            'sequence_step_id' => $step->id,
            'mailbox_id' => $campaign->mailbox_id,
            'subject' => $this->renderer->render($step->subject_template, $prospect, $contact),
            'body_html' => $this->renderer->render($step->body_template, $prospect, $contact),
            'in_reply_to' => $lastSend?->message_id,
            'tracking_token' => (string) Str::uuid(),
            'status' => 'scheduled',
            'scheduled_at' => $scheduledAt,
        ]);
    }
}
