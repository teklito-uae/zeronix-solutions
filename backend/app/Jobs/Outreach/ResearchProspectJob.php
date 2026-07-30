<?php

namespace App\Jobs\Outreach;

use App\Models\Company;
use App\Models\OutreachProspect;
use App\Services\Ai\ClaudeClient;
use App\Services\Outreach\WebScraper;
use App\Services\Outreach\WikidataLookup;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Runs the whole Phase 2 research pipeline for one prospect: free
 * scrape+enrich (no LLM calls) followed by exactly one Claude call. On
 * success this fills in the prospect's research fields and creates
 * OutreachContact rows; on any recoverable failure (bad URL, site down,
 * model hiccup) it records research_error and leaves status as
 * pending_research so the UI's retry button works, matching the idempotency
 * guard style used by SendOutreachEmailJob.
 */
class ResearchProspectJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $prospectId)
    {
    }

    public function handle(WebScraper $scraper, WikidataLookup $wikidata, ClaudeClient $claude): void
    {
        $prospect = OutreachProspect::with('campaign')->find($this->prospectId);
        if (!$prospect || $prospect->status !== 'pending_research') {
            return;
        }

        try {
            $scraped = $prospect->website_url
                ? $scraper->scrape($prospect->website_url)
                : ['text' => '', 'contact_hints' => []];

            $scrapedText = $scraped['text'];
            if (!empty($scraped['contact_hints'])) {
                $scrapedText .= "\n\nContact hints found on the site:\n".implode("\n", $scraped['contact_hints']);
            }
            $scrapedText = mb_substr($scrapedText, 0, 3000);

            $wikidataNote = $wikidata->lookup($prospect->company_name);

            $company = Company::singleton();
            $campaign = $prospect->campaign;

            $result = $claude->researchProspect(
                companyName: $prospect->company_name,
                scrapedText: $scrapedText !== '' ? $scrapedText : 'No text could be scraped from the website.',
                wikidataNote: $wikidataNote,
                ourServices: $campaign?->service_focus ?: ($company->name.' provides IT infrastructure setup and ICT product supply.'),
                targetIndustryNotes: $campaign?->target_industry_notes,
            );

            $this->applyResult($prospect, $result);
        } catch (\Throwable $e) {
            Log::warning('Outreach ResearchProspectJob failed', [
                'prospect_id' => $this->prospectId,
                'error' => $e->getMessage(),
            ]);

            $prospect->update([
                'research_error' => 'Research failed: '.$this->shortMessage($e->getMessage()),
            ]);
        }
    }

    /**
     * @param  array{industry_guess: string, industry_confidence: int, trigger_event: ?string, research_summary: string, contacts: array<int, array{full_name: ?string, guessed_title: string, email: ?string, email_confidence: int, source_notes: string}>}  $result
     */
    private function applyResult(OutreachProspect $prospect, array $result): void
    {
        $contacts = $result['contacts'] ?? [];
        $hasEmail = false;
        foreach ($contacts as $c) {
            if (!empty($c['email'])) {
                $hasEmail = true;
                break;
            }
        }

        $status = match (true) {
            $hasEmail => 'contact_found',
            !empty($contacts) => 'no_contact_found',
            default => 'researched',
        };

        $prospect->update([
            'industry_guess' => $result['industry_guess'] ?: null,
            'industry_confidence' => $result['industry_confidence'],
            'research_summary' => $result['research_summary'] ?: null,
            'trigger_event' => $result['trigger_event'] ?: null,
            'researched_at' => now(),
            'research_error' => null,
            'status' => $status,
        ]);

        foreach ($contacts as $c) {
            $contact = $prospect->contacts()->create([
                'full_name' => $c['full_name'] ?: null,
                'guessed_title' => $c['guessed_title'] ?: null,
                'email' => $c['email'] ?: null,
                'email_confidence' => $c['email_confidence'],
                'email_verification_status' => 'unverified',
                'source_notes' => $c['source_notes'] ?: null,
            ]);

            if ($contact->email) {
                VerifyEmailJob::dispatch($contact->id);
            }
        }
    }

    private function shortMessage(string $message): string
    {
        return mb_substr($message, 0, 300);
    }
}
