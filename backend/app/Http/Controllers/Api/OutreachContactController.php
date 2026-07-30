<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OutreachContact;
use App\Models\OutreachProspect;
use Illuminate\Http\Request;

class OutreachContactController extends Controller
{
    public function store(Request $request, int $prospectId)
    {
        $prospect = OutreachProspect::findOrFail($prospectId);

        $contact = OutreachContact::create([
            'prospect_id' => $prospect->id,
            'full_name' => $request->input('full_name'),
            'guessed_title' => $request->input('guessed_title'),
            'email' => $request->input('email'),
            'email_confidence' => $request->input('email_confidence', 50),
            'email_verification_status' => 'unverified',
            'source_notes' => $request->input('source_notes', 'Manually entered'),
        ]);

        if ($prospect->status === 'pending_research' || $prospect->status === 'researched') {
            $prospect->update(['status' => 'contact_found']);
        }

        return response()->json($contact, 201);
    }

    public function update(Request $request, int $prospectId, int $id)
    {
        $contact = OutreachContact::where('prospect_id', $prospectId)->findOrFail($id);

        $fields = ['full_name', 'guessed_title', 'email', 'email_confidence', 'email_verification_status', 'source_notes'];
        $data = [];
        foreach ($fields as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->input($field);
            }
        }

        $contact->update($data);

        return response()->json($contact->fresh());
    }

    public function destroy(int $prospectId, int $id)
    {
        OutreachContact::where('prospect_id', $prospectId)->where('id', $id)->delete();

        return response()->noContent();
    }
}
