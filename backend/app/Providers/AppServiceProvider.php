<?php

namespace App\Providers;

use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // WAMP's bundled MySQL/MariaDB defaults to utf8mb4 with an InnoDB
        // key-length limit that's too small for a full 255-char VARCHAR
        // unique index; cap default string length like pre-5.7.7 MySQL apps.
        Schema::defaultStringLength(191);

        // This app is API-only (no 'login' web route to redirect guests to);
        // without this, unauthenticated requests that don't send
        // Accept: application/json (e.g. a plain browser navigation to a
        // PDF link) crash with a RouteNotFoundException instead of a 401.
        Authenticate::redirectUsing(fn () => null);
    }
}
