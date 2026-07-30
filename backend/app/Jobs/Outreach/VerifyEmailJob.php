<?php

namespace App\Jobs\Outreach;

use App\Models\OutreachContact;
use App\Models\OutreachMailbox;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Best-effort SMTP RCPT TO handshake check (no DATA/no actual send) run
 * before a contact's email is trusted for real sending. Real-world SMTP
 * verification is unreliable — catch-all domains and greylisting produce
 * both false positives and false negatives (see the outreach plan doc's
 * risk #6) — so this only ever sets a confident smtp_verified/smtp_invalid
 * result on an unambiguous 250/550-551-553 response and otherwise leaves the
 * contact's status as unverified rather than guessing.
 */
class VerifyEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private const CONNECT_TIMEOUT = 5;

    private const STREAM_TIMEOUT = 5;

    public function __construct(private readonly int $contactId)
    {
    }

    public function handle(): void
    {
        $contact = OutreachContact::with('prospect.campaign.mailbox')->find($this->contactId);
        if (!$contact || !$contact->email || $contact->email_verification_status !== 'unverified') {
            return;
        }

        try {
            $mailbox = $contact->prospect?->campaign?->mailbox;
            $result = $this->verify($contact->email, $mailbox);
            if ($result !== null) {
                $contact->update(['email_verification_status' => $result]);
            }
        } catch (\Throwable $e) {
            Log::warning('Outreach VerifyEmailJob failed', [
                'contact_id' => $this->contactId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Returns 'smtp_verified'/'smtp_invalid' on an unambiguous response, or
     * null to leave the contact's status untouched (unverified).
     */
    private function verify(string $email, ?OutreachMailbox $mailbox): ?string
    {
        $domain = trim((string) substr((string) strrchr($email, '@'), 1));
        if ($domain === '') {
            return null;
        }

        foreach ($this->resolveMxHosts($domain) as $host) {
            $result = $this->attemptHandshake($host, $email, $mailbox);
            if ($result !== null) {
                return $result;
            }
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    private function resolveMxHosts(string $domain): array
    {
        if (function_exists('getmxrr') && getmxrr($domain, $hosts, $weights) && !empty($hosts)) {
            array_multisort($weights, $hosts);

            return $hosts;
        }

        // No MX record — some domains route mail straight to their A record.
        return [$domain];
    }

    private function attemptHandshake(string $host, string $email, ?OutreachMailbox $mailbox): ?string
    {
        $fromEmail = $mailbox?->from_email ?: 'verify@zeronix.local';

        $socket = @stream_socket_client(
            "tcp://{$host}:25",
            $errno,
            $errstr,
            self::CONNECT_TIMEOUT
        );
        if (!$socket) {
            return null; // couldn't connect — port 25 blocked, host down, etc.
        }

        stream_set_timeout($socket, self::STREAM_TIMEOUT);

        try {
            $this->readResponse($socket); // greeting banner

            $this->sendCommand($socket, 'EHLO zeronix.local');
            $this->readResponse($socket);

            $this->sendCommand($socket, "MAIL FROM:<{$fromEmail}>");
            $this->readResponse($socket);

            $this->sendCommand($socket, "RCPT TO:<{$email}>");
            $rcptResponse = $this->readResponse($socket);

            $this->sendCommand($socket, 'QUIT');

            $code = (int) substr(trim($rcptResponse), 0, 3);

            if ($code === 250) {
                return 'smtp_verified';
            }
            if (in_array($code, [550, 551, 553], true)) {
                return 'smtp_invalid';
            }

            return null; // ambiguous/greylisted response — leave unverified
        } finally {
            fclose($socket);
        }
    }

    private function sendCommand($socket, string $command): void
    {
        fwrite($socket, $command."\r\n");
    }

    /**
     * Reads a (possibly multi-line) SMTP response, e.g. lines like "250-foo"
     * followed by a final "250 bar" line.
     *
     * @param  resource  $socket
     */
    private function readResponse($socket): string
    {
        $response = '';
        while (!feof($socket)) {
            $line = fgets($socket, 512);
            if ($line === false) {
                break;
            }
            $response = $line;
            // Continuation lines have a hyphen after the 3-digit code; the
            // final line has a space instead.
            if (preg_match('/^\d{3} /', $line)) {
                break;
            }
        }

        return $response;
    }
}
