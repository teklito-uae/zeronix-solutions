<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Enquiry;
use App\Models\OutreachProspect;
use App\Services\EnquiryNumberGenerator;
use App\Services\Outreach\SequenceAdvancer;
use Illuminate\Http\Request;

class OutreachProspectController extends Controller
{
    public function index(Request $request, int $campaignId)
    {
        $status = $request->query('status', '');
        $query = OutreachProspect::where('campaign_id', $campaignId)->with('contacts');

        if ($status !== '') {
            $query->where('status', $status);
        }

        return response()->json($query->orderByDesc('updated_at')->get());
    }

    public function show(int $campaignId, int $id)
    {
        $prospect = OutreachProspect::where('campaign_id', $campaignId)
            ->with(['contacts', 'sends.events', 'sends.sequenceStep'])
            ->findOrFail($id);

        return response()->json($prospect);
    }

    public function store(Request $request, int $campaignId)
    {
        $companyName = $request->input('company_name');
        if (!$companyName) {
            return response()->json(['error' => 'company_name is required'], 400);
        }

        $prospect = OutreachProspect::create([
            'campaign_id' => $campaignId,
            'company_name' => $companyName,
            'website_url' => $request->input('website_url'),
            'industry_guess' => $request->input('industry_guess'),
            'trigger_event' => $request->input('trigger_event'),
            'status' => 'pending_research',
        ]);

        return response()->json($prospect, 201);
    }

    public function update(Request $request, int $campaignId, int $id)
    {
        $prospect = OutreachProspect::where('campaign_id', $campaignId)->findOrFail($id);

        $fields = ['company_name', 'website_url', 'industry_guess', 'trigger_event', 'status', 'research_summary'];
        $data = [];
        foreach ($fields as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->input($field);
            }
        }

        $prospect->update($data);

        return response()->json($prospect->fresh());
    }

    public function destroy(int $campaignId, int $id)
    {
        OutreachProspect::where('campaign_id', $campaignId)->where('id', $id)->delete();

        return response()->noContent();
    }

    /**
     * Queues the first sequence-step email for a prospect that has at least
     * one contact on file. Subsequent steps are queued automatically by the
     * outreach:advance-sequences scheduled command as cool-off periods elapse.
     */
    public function activate(int $campaignId, int $id, SequenceAdvancer $advancer)
    {
        $prospect = OutreachProspect::where('campaign_id', $campaignId)->findOrFail($id);

        $send = $advancer->queueNextStep($prospect);
        if (!$send) {
            return response()->json(['error' => 'no verified contact or sequence step available for this prospect'], 422);
        }

        $prospect->update(['status' => 'queued']);

        return response()->json($send, 201);
    }

    /**
     * Bridges an engaged prospect into the existing CRM flow, mirroring
     * EnquiryController::convertToQuote's converted_x_id stamping pattern.
     */
    public function convertToEnquiry(int $campaignId, int $id, EnquiryNumberGenerator $enquiryNumbers)
    {
        $prospect = OutreachProspect::where('campaign_id', $campaignId)->with('contacts')->findOrFail($id);

        if ($prospect->converted_enquiry_id) {
            return response()->json(['error' => 'already converted'], 400);
        }

        $bestContact = $prospect->contacts->sortByDesc('email_confidence')->first();

        $client = Client::create([
            'name' => $bestContact->full_name ?? $prospect->company_name,
            'company' => $prospect->company_name,
            'address' => '',
            'phone' => '',
            'email' => $bestContact->email ?? '',
        ]);

        $enquiry = Enquiry::create([
            'enquiry_no' => $enquiryNumbers->next(),
            'client_id' => $client->id,
            'contact_name' => $bestContact->full_name ?? $prospect->company_name,
            'contact_email' => $bestContact->email ?? null,
            'company_name' => $prospect->company_name,
            'service_type' => 'Other',
            'title' => "Outreach lead: {$prospect->company_name}",
            'scope_of_work' => $prospect->research_summary ?? '',
            'source' => 'email',
            'status' => 'new',
            'notes' => "Converted from outreach prospect #{$prospect->id}.",
        ]);

        $prospect->update([
            'status' => 'converted',
            'converted_client_id' => $client->id,
            'converted_enquiry_id' => $enquiry->id,
        ]);

        return response()->json($enquiry, 201);
    }
}
