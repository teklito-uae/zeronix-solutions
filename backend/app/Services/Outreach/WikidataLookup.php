<?php

namespace App\Services\Outreach;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Free, no-key best-effort enrichment lookup against Wikidata's public REST
 * API. Purely optional signal fed into the single Claude research call —
 * any failure or no-match here must never block or fail the research
 * pipeline, so every call site should be wrapped defensively (this class
 * already swallows its own errors and returns null).
 */
class WikidataLookup
{
    private const TIMEOUT_SECONDS = 3;

    /**
     * Looks up the company by name and returns a short one-line summary of
     * what was found (e.g. an instance-of/industry label), or null if
     * nothing confident was found or the lookup failed for any reason.
     */
    public function lookup(string $companyName): ?string
    {
        try {
            $entityId = $this->searchEntity($companyName);
            if (!$entityId) {
                return null;
            }

            return $this->describeEntity($entityId, $companyName);
        } catch (\Throwable $e) {
            Log::warning('Outreach WikidataLookup failed', ['company' => $companyName, 'error' => $e->getMessage()]);

            return null;
        }
    }

    private function searchEntity(string $companyName): ?string
    {
        $response = Http::timeout(self::TIMEOUT_SECONDS)->get('https://www.wikidata.org/w/api.php', [
            'action' => 'wbsearchentities',
            'search' => $companyName,
            'language' => 'en',
            'format' => 'json',
            'type' => 'item',
            'limit' => 3,
        ]);

        if (!$response->successful()) {
            return null;
        }

        $results = $response->json('search') ?? [];
        if (!$results) {
            return null;
        }

        // Only trust a confident match: the top result's label should
        // roughly match the company name we searched for.
        $top = $results[0];
        $label = strtolower((string) ($top['label'] ?? ''));
        if (!$label || !str_contains($label, strtolower($companyName)) && !str_contains(strtolower($companyName), $label)) {
            return null;
        }

        return $top['id'] ?? null;
    }

    private function describeEntity(string $entityId, string $companyName): ?string
    {
        $response = Http::timeout(self::TIMEOUT_SECONDS)->get('https://www.wikidata.org/w/api.php', [
            'action' => 'wbgetentities',
            'ids' => $entityId,
            'props' => 'labels|claims|descriptions',
            'languages' => 'en',
            'format' => 'json',
        ]);

        if (!$response->successful()) {
            return null;
        }

        $entity = $response->json("entities.{$entityId}");
        if (!$entity) {
            return null;
        }

        $description = $entity['descriptions']['en']['value'] ?? null;
        $instanceOfLabel = $this->resolveInstanceOfLabel($entity);

        if ($instanceOfLabel) {
            return "Wikidata: {$companyName} is listed as a {$instanceOfLabel}.";
        }

        if ($description) {
            return "Wikidata description: {$description}";
        }

        return null;
    }

    private function resolveInstanceOfLabel(array $entity): ?string
    {
        $instanceOfClaims = $entity['claims']['P31'] ?? null;
        if (!$instanceOfClaims) {
            return null;
        }

        $targetId = $instanceOfClaims[0]['mainsnak']['datavalue']['value']['id'] ?? null;
        if (!$targetId) {
            return null;
        }

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)->get('https://www.wikidata.org/w/api.php', [
                'action' => 'wbgetentities',
                'ids' => $targetId,
                'props' => 'labels',
                'languages' => 'en',
                'format' => 'json',
            ]);

            if (!$response->successful()) {
                return null;
            }

            return $response->json("entities.{$targetId}.labels.en.value");
        } catch (\Throwable) {
            return null;
        }
    }
}
