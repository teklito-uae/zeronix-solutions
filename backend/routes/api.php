<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EnquiryController;
use App\Http\Controllers\Api\OutreachCampaignController;
use App\Http\Controllers\Api\OutreachContactController;
use App\Http\Controllers\Api\OutreachMailboxController;
use App\Http\Controllers\Api\OutreachProspectController;
use App\Http\Controllers\Api\OutreachTrackingController;
use App\Http\Controllers\Api\QuoteController;
use App\Http\Controllers\Api\QuotePdfController;
use App\Http\Controllers\Api\QuoteShareController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('guest');

// Public tracking endpoints — the tracking_token itself is the secret, no auth
// possible since these are hit directly by recipients' mail clients/browsers.
Route::get('/outreach/track/open/{token}.png', [OutreachTrackingController::class, 'openPixel']);
Route::get('/outreach/track/click/{token}', [OutreachTrackingController::class, 'click']);
Route::match(['get', 'post'], '/outreach/unsubscribe/{token}', [OutreachTrackingController::class, 'unsubscribe']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/company', [CompanyController::class, 'show']);
    Route::put('/company', [CompanyController::class, 'update']);

    Route::get('/clients', [ClientController::class, 'index']);
    Route::post('/clients', [ClientController::class, 'store']);
    Route::put('/clients/{id}', [ClientController::class, 'update']);
    Route::delete('/clients/{id}', [ClientController::class, 'destroy']);

    Route::get('/catalog', [CatalogController::class, 'index']);
    Route::post('/catalog', [CatalogController::class, 'store']);
    Route::put('/catalog/{id}', [CatalogController::class, 'update']);
    Route::delete('/catalog/{id}', [CatalogController::class, 'destroy']);

    Route::get('/quotes', [QuoteController::class, 'index']);
    Route::post('/quotes', [QuoteController::class, 'store']);
    Route::get('/quotes/{id}', [QuoteController::class, 'show']);
    Route::put('/quotes/{id}', [QuoteController::class, 'update']);
    Route::delete('/quotes/{id}', [QuoteController::class, 'destroy']);
    Route::post('/quotes/{id}/duplicate', [QuoteController::class, 'duplicate']);
    Route::get('/quotes/{id}/html', [QuotePdfController::class, 'html']);
    Route::get('/quotes/{id}/pdf', [QuotePdfController::class, 'pdf']);
    Route::post('/quotes/{id}/share', [QuoteShareController::class, 'store']);
    Route::delete('/quotes/{id}/share', [QuoteShareController::class, 'destroy']);

    Route::get('/enquiries', [EnquiryController::class, 'index']);
    Route::post('/enquiries', [EnquiryController::class, 'store']);
    Route::get('/enquiries/{id}', [EnquiryController::class, 'show']);
    Route::put('/enquiries/{id}', [EnquiryController::class, 'update']);
    Route::delete('/enquiries/{id}', [EnquiryController::class, 'destroy']);
    Route::post('/enquiries/{id}/convert-to-quote', [EnquiryController::class, 'convertToQuote']);

    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::get('/outreach/mailboxes', [OutreachMailboxController::class, 'index']);
    Route::post('/outreach/mailboxes', [OutreachMailboxController::class, 'store']);
    Route::get('/outreach/mailboxes/{id}', [OutreachMailboxController::class, 'show']);
    Route::put('/outreach/mailboxes/{id}', [OutreachMailboxController::class, 'update']);
    Route::delete('/outreach/mailboxes/{id}', [OutreachMailboxController::class, 'destroy']);
    Route::post('/outreach/mailboxes/{id}/test', [OutreachMailboxController::class, 'testConnection']);

    Route::get('/outreach/campaigns', [OutreachCampaignController::class, 'index']);
    Route::post('/outreach/campaigns', [OutreachCampaignController::class, 'store']);
    Route::get('/outreach/campaigns/{id}', [OutreachCampaignController::class, 'show']);
    Route::put('/outreach/campaigns/{id}', [OutreachCampaignController::class, 'update']);
    Route::delete('/outreach/campaigns/{id}', [OutreachCampaignController::class, 'destroy']);
    Route::put('/outreach/campaigns/{id}/steps', [OutreachCampaignController::class, 'syncSteps']);

    Route::get('/outreach/campaigns/{campaignId}/prospects', [OutreachProspectController::class, 'index']);
    Route::post('/outreach/campaigns/{campaignId}/prospects', [OutreachProspectController::class, 'store']);
    Route::get('/outreach/campaigns/{campaignId}/prospects/{id}', [OutreachProspectController::class, 'show']);
    Route::put('/outreach/campaigns/{campaignId}/prospects/{id}', [OutreachProspectController::class, 'update']);
    Route::delete('/outreach/campaigns/{campaignId}/prospects/{id}', [OutreachProspectController::class, 'destroy']);
    Route::post('/outreach/campaigns/{campaignId}/prospects/{id}/research', [OutreachProspectController::class, 'research']);
    Route::post('/outreach/campaigns/{campaignId}/prospects/{id}/activate', [OutreachProspectController::class, 'activate']);
    Route::post('/outreach/campaigns/{campaignId}/prospects/{id}/convert-to-enquiry', [OutreachProspectController::class, 'convertToEnquiry']);

    Route::post('/outreach/prospects/{prospectId}/contacts', [OutreachContactController::class, 'store']);
    Route::put('/outreach/prospects/{prospectId}/contacts/{id}', [OutreachContactController::class, 'update']);
    Route::delete('/outreach/prospects/{prospectId}/contacts/{id}', [OutreachContactController::class, 'destroy']);
});
