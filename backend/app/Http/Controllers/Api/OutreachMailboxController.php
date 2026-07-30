<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OutreachMailbox;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mime\Email;

class OutreachMailboxController extends Controller
{
    private const FIELDS = [
        'name', 'from_name', 'from_email',
        'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_encryption',
        'imap_host', 'imap_port', 'imap_username', 'imap_password', 'imap_encryption', 'imap_folder',
        'daily_send_cap', 'is_default',
    ];

    public function index()
    {
        return response()->json(OutreachMailbox::orderByDesc('is_default')->orderBy('name')->get());
    }

    public function show(int $id)
    {
        return response()->json(OutreachMailbox::findOrFail($id));
    }

    public function store(Request $request)
    {
        $data = $request->only(self::FIELDS);
        if (!$data['name'] ?? null) {
            return response()->json(['error' => 'name is required'], 400);
        }

        $mailbox = OutreachMailbox::create($data + ['status' => 'pending_test']);

        return response()->json($mailbox, 201);
    }

    public function update(Request $request, int $id)
    {
        $mailbox = OutreachMailbox::findOrFail($id);

        $data = [];
        foreach (self::FIELDS as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->input($field);
            }
        }

        // Re-test on next send if connection details changed.
        if (array_intersect(array_keys($data), ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'imap_host', 'imap_port', 'imap_username', 'imap_password'])) {
            $data['status'] = 'pending_test';
        }

        $mailbox->update($data);

        return response()->json($mailbox->fresh());
    }

    public function destroy(int $id)
    {
        OutreachMailbox::where('id', $id)->delete();

        return response()->noContent();
    }

    /**
     * Round-trip test: sends a test email to the mailbox's own address via SMTP,
     * then opens an IMAP connection to confirm the folder is reachable.
     */
    public function testConnection(int $id)
    {
        $mailbox = OutreachMailbox::findOrFail($id);
        $errors = [];

        try {
            $transport = new EsmtpTransport($mailbox->smtp_host, (int) $mailbox->smtp_port, $mailbox->smtp_encryption === 'ssl');
            $transport->setUsername($mailbox->smtp_username);
            $transport->setPassword($mailbox->smtp_password);

            $email = (new Email())
                ->from($mailbox->from_email)
                ->to($mailbox->from_email)
                ->subject('Zeronix Outreach — mailbox connection test')
                ->text('This is a test email confirming your SMTP connection is working.');

            $transport->send($email);
        } catch (\Throwable $e) {
            $errors[] = 'SMTP: '.$e->getMessage();
        }

        try {
            $cm = new \Webklex\PHPIMAP\ClientManager();
            $client = $cm->make([
                'host' => $mailbox->imap_host,
                'port' => (int) $mailbox->imap_port,
                'encryption' => $mailbox->imap_encryption,
                'validate_cert' => true,
                'username' => $mailbox->imap_username,
                'password' => $mailbox->imap_password,
                'protocol' => 'imap',
            ]);
            $client->connect();
            $client->getFolder($mailbox->imap_folder ?: 'INBOX');
            $client->disconnect();
        } catch (\Throwable $e) {
            $errors[] = 'IMAP: '.$e->getMessage();
        }

        if ($errors) {
            $mailbox->update(['status' => 'error', 'last_error' => implode(' | ', $errors)]);
            Log::warning('Outreach mailbox test failed', ['mailbox_id' => $id, 'errors' => $errors]);

            return response()->json(['ok' => false, 'errors' => $errors], 422);
        }

        $mailbox->update(['status' => 'active', 'last_error' => null]);

        return response()->json(['ok' => true]);
    }
}
