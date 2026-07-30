<?php

namespace App\Services\Outreach;

use App\Models\OutreachContact;
use App\Models\OutreachProspect;

class TemplateRenderer
{
    /**
     * Fills {{tokens}} in a subject/body template from scraped/entered prospect
     * and contact facts. Missing tokens resolve to an empty string rather than
     * leaking the raw placeholder into a sent email.
     */
    public function render(string $template, OutreachProspect $prospect, OutreachContact $contact): string
    {
        $tokens = [
            'company_name' => $prospect->company_name,
            'contact_name' => $contact->full_name ?: 'there',
            'contact_title' => $contact->guessed_title ?: '',
            'industry' => $prospect->industry_guess ?: '',
            'trigger_event' => $prospect->trigger_event ?: '',
        ];

        return preg_replace_callback('/\{\{\s*(\w+)\s*\}\}/', function ($m) use ($tokens) {
            return $tokens[$m[1]] ?? '';
        }, $template);
    }
}
