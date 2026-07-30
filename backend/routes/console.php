<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('outreach:dispatch-due-sends')->everyFiveMinutes();
Schedule::command('outreach:advance-sequences')->hourly();
Schedule::command('outreach:poll-mailboxes')->everyFifteenMinutes();
Schedule::command('outreach:reset-daily-caps')->dailyAt('00:05');
