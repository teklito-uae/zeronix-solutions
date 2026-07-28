<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatalogItem;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function index()
    {
        return response()->json(CatalogItem::orderBy('description', 'asc')->get());
    }

    public function store(Request $request)
    {
        $description = $request->input('description');
        if (!$description) {
            return response()->json(['error' => 'description is required'], 400);
        }

        $item = CatalogItem::create([
            'description' => $description,
            'scope' => $request->input('scope', ''),
            'unit' => $request->input('unit', '1'),
            'unit_price' => $request->input('unit_price', 0),
        ]);

        return response()->json($item, 201);
    }

    public function update(Request $request, int $id)
    {
        $item = CatalogItem::findOrFail($id);
        $item->update([
            'description' => $request->input('description'),
            'scope' => $request->input('scope', ''),
            'unit' => $request->input('unit', '1'),
            'unit_price' => $request->input('unit_price', 0),
        ]);

        return response()->json($item->fresh());
    }

    public function destroy(int $id)
    {
        CatalogItem::where('id', $id)->delete();

        return response()->noContent();
    }
}
