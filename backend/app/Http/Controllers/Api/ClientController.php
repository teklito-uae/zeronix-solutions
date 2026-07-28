<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q', '');
        $query = Client::query();
        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('company', 'like', "%{$q}%");
            });
        }

        return response()->json($query->orderBy('name', 'asc')->get());
    }

    public function store(Request $request)
    {
        $name = $request->input('name');
        if (!$name) {
            return response()->json(['error' => 'name is required'], 400);
        }

        $client = Client::create([
            'name' => $name,
            'company' => $request->input('company', ''),
            'address' => $request->input('address', ''),
            'phone' => $request->input('phone', ''),
            'email' => $request->input('email', ''),
        ]);

        return response()->json($client, 201);
    }

    public function update(Request $request, int $id)
    {
        $client = Client::findOrFail($id);
        $client->update([
            'name' => $request->input('name'),
            'company' => $request->input('company', ''),
            'address' => $request->input('address', ''),
            'phone' => $request->input('phone', ''),
            'email' => $request->input('email', ''),
        ]);

        return response()->json($client->fresh());
    }

    public function destroy(int $id)
    {
        Client::where('id', $id)->delete();

        return response()->noContent();
    }
}
