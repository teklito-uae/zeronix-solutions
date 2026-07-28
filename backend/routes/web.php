<?php

use App\Http\Controllers\ShareController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Public, unauthenticated quote-sharing links — deliberately outside the
// auth:sanctum-gated /api/* surface so a customer can open the link without
// a Zeronix account, and so link-preview crawlers (WhatsApp, Slack, etc.)
// can fetch the OG meta tags directly.
Route::get('/share/{token}', [ShareController::class, 'show']);
Route::get('/share/{token}/pdf', [ShareController::class, 'pdf']);
