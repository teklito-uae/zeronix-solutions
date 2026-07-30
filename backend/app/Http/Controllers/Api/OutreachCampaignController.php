<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OutreachCampaign;
use App\Models\OutreachSequenceStep;
use Illuminate\Http\Request;

class OutreachCampaignController extends Controller
{
    public function index()
    {
        $campaigns = OutreachCampaign::withCount([
            'prospects',
            'prospects as replied_count' => fn ($q) => $q->where('status', 'replied'),
            'prospects as converted_count' => fn ($q) => $q->where('status', 'converted'),
        ])->orderByDesc('updated_at')->get();

        return response()->json($campaigns);
    }

    public function show(int $id)
    {
        $campaign = OutreachCampaign::with('mailbox', 'sequenceSteps')->findOrFail($id);

        return response()->json($campaign);
    }

    public function store(Request $request)
    {
        $name = $request->input('name');
        if (!$name) {
            return response()->json(['error' => 'name is required'], 400);
        }

        $campaign = OutreachCampaign::create([
            'name' => $name,
            'mailbox_id' => $request->input('mailbox_id'),
            'service_focus' => $request->input('service_focus'),
            'target_industry_notes' => $request->input('target_industry_notes'),
            'status' => 'draft',
            'daily_new_send_limit' => $request->input('daily_new_send_limit', 10),
            'send_window_start' => $request->input('send_window_start', '09:00:00'),
            'send_window_end' => $request->input('send_window_end', '17:00:00'),
            'send_days' => $request->input('send_days', ['sun', 'mon', 'tue', 'wed', 'thu']),
            'unsubscribe_footer_text' => $request->input('unsubscribe_footer_text'),
        ]);

        return response()->json($campaign, 201);
    }

    public function update(Request $request, int $id)
    {
        $campaign = OutreachCampaign::findOrFail($id);

        $fields = [
            'name', 'mailbox_id', 'service_focus', 'target_industry_notes', 'status',
            'daily_new_send_limit', 'send_window_start', 'send_window_end', 'send_days',
            'unsubscribe_footer_text',
        ];

        $data = [];
        foreach ($fields as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->input($field);
            }
        }

        $campaign->update($data);

        return response()->json($campaign->fresh());
    }

    public function destroy(int $id)
    {
        OutreachCampaign::where('id', $id)->delete();

        return response()->noContent();
    }

    /**
     * Replaces the campaign's entire sequence-step list in one call — the sequence
     * editor UI submits the full ordered list rather than diffing individual steps.
     */
    public function syncSteps(Request $request, int $id)
    {
        $campaign = OutreachCampaign::findOrFail($id);
        $steps = $request->input('steps', []);

        if (count($steps) > 5) {
            return response()->json(['error' => 'a sequence is capped at 5 steps'], 400);
        }

        $campaign->sequenceSteps()->delete();

        foreach ($steps as $i => $step) {
            OutreachSequenceStep::create([
                'campaign_id' => $campaign->id,
                'step_number' => $i + 1,
                'wait_days' => $i === 0 ? 0 : ($step['wait_days'] ?? 4),
                'subject_template' => $step['subject_template'] ?? '',
                'body_template' => $step['body_template'] ?? '',
                'is_final_step' => $i === count($steps) - 1,
            ]);
        }

        return response()->json($campaign->fresh('sequenceSteps'));
    }
}
