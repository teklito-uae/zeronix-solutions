<?php

namespace App\Services\Ai;

use Anthropic\Client;

/**
 * Single-purpose wrapper around the Claude Messages API for outreach prospect
 * research. Deliberately not a generic multi-purpose AI client abstraction —
 * this app only needs the one call below, kept to a single request per
 * prospect with a small max_tokens/low effort/compact structured schema to
 * minimize token spend as instructed.
 */
class ClaudeClient
{
    private const MODEL = 'claude-haiku-4-5';

    /**
     * Runs the single research call for one prospect: guesses the industry,
     * an optional trigger event, a one-sentence summary, and up to a couple
     * of likely decision-maker contacts from the scraped text supplied.
     *
     * @return array{
     *     industry_guess: string,
     *     industry_confidence: int,
     *     trigger_event: ?string,
     *     research_summary: string,
     *     contacts: array<int, array{full_name: ?string, guessed_title: string, email: ?string, email_confidence: int, source_notes: string}>
     * }
     */
    public function researchProspect(
        string $companyName,
        string $scrapedText,
        ?string $wikidataNote,
        string $ourServices,
        ?string $targetIndustryNotes,
    ): array {
        $client = new Client(apiKey: config('services.anthropic.key'));

        $prompt = $this->buildPrompt($companyName, $scrapedText, $wikidataNote, $ourServices, $targetIndustryNotes);

        $message = $client->messages->create(
            model: self::MODEL,
            maxTokens: 700,
            outputConfig: [
                'effort' => 'low',
                'format' => [
                    'type' => 'json_schema',
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'industry_guess' => ['type' => 'string'],
                            'industry_confidence' => ['type' => 'integer'],
                            'trigger_event' => ['type' => ['string', 'null']],
                            'research_summary' => ['type' => 'string'],
                            'contacts' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'full_name' => ['type' => ['string', 'null']],
                                        'guessed_title' => ['type' => 'string'],
                                        'email' => ['type' => ['string', 'null']],
                                        'email_confidence' => ['type' => 'integer'],
                                        'source_notes' => ['type' => 'string'],
                                    ],
                                    'required' => ['guessed_title', 'email_confidence', 'source_notes'],
                                    'additionalProperties' => false,
                                ],
                            ],
                        ],
                        'required' => ['industry_guess', 'industry_confidence', 'research_summary', 'contacts'],
                        'additionalProperties' => false,
                    ],
                ],
            ],
            messages: [['role' => 'user', 'content' => $prompt]],
        );

        foreach ($message->content as $block) {
            if ($block->type === 'text') {
                $data = json_decode($block->text, true);
                if (is_array($data)) {
                    return $this->normalize($data);
                }
                break;
            }
        }

        throw new \RuntimeException('Claude returned no parseable JSON research payload.');
    }

    private function buildPrompt(
        string $companyName,
        string $scrapedText,
        ?string $wikidataNote,
        string $ourServices,
        ?string $targetIndustryNotes,
    ): string {
        $lines = [];
        $lines[] = "We are Zeronix, and our services: {$ourServices}";
        if ($targetIndustryNotes) {
            $lines[] = "Target industry hint: {$targetIndustryNotes}";
        }
        $lines[] = "Prospect company: {$companyName}";
        if ($wikidataNote) {
            $lines[] = "Free enrichment signal: {$wikidataNote}";
        }
        $lines[] = "Scraped website text (may be partial/messy):\n{$scrapedText}";
        $lines[] = <<<'TXT'
From the above, return: an industry guess with 0-100 confidence; an optional
trigger_event (a specific, concrete hint like "expanding to a new location" or
"recently hired for a new department" only if the text actually mentions
something like that, else null); a one-sentence research_summary; and up to 2
likely decision-maker contacts (e.g. IT Head, Procurement Head, Operations
Manager) with guessed_title required. For each contact, only set email and a
high email_confidence if an actual email address was found in the text (e.g.
via a mailto: link) — do not fabricate confident-sounding emails. If no email
was found, either leave email null or provide a low-confidence pattern guess
based on the domain, and explain the basis in source_notes (e.g. "found on
/team page" or "pattern-guessed from domain, no name found").
TXT;

        return implode("\n", $lines);
    }

    /**
     * Defensive normalization in case the model omits optional keys despite
     * the schema (e.g. a transient partial response).
     */
    private function normalize(array $data): array
    {
        $contacts = [];
        foreach (($data['contacts'] ?? []) as $c) {
            if (!is_array($c)) {
                continue;
            }
            $contacts[] = [
                'full_name' => $c['full_name'] ?? null,
                'guessed_title' => (string) ($c['guessed_title'] ?? ''),
                'email' => $c['email'] ?? null,
                'email_confidence' => (int) ($c['email_confidence'] ?? 0),
                'source_notes' => (string) ($c['source_notes'] ?? ''),
            ];
        }

        return [
            'industry_guess' => (string) ($data['industry_guess'] ?? ''),
            'industry_confidence' => (int) ($data['industry_confidence'] ?? 0),
            'trigger_event' => $data['trigger_event'] ?? null,
            'research_summary' => (string) ($data['research_summary'] ?? ''),
            'contacts' => $contacts,
        ];
    }
}
