<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EnquiryController;
use App\Http\Controllers\Api\QuoteController;
use App\Http\Controllers\Api\QuotePdfController;
use App\Http\Controllers\Api\QuoteShareController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('guest');

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
});
