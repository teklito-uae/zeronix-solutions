<?php

namespace App\Services\Outreach;

use Illuminate\Support\Carbon;

class BusinessDays
{
    private const ABBR = [0 => 'sun', 1 => 'mon', 2 => 'tue', 3 => 'wed', 4 => 'thu', 5 => 'fri', 6 => 'sat'];

    /**
     * Advances $from by $days counting only days present in $sendDays
     * (e.g. ["sun","mon","tue","wed","thu"] for a UAE work week).
     */
    public static function add(Carbon $from, int $days, array $sendDays): Carbon
    {
        $date = $from->copy();
        $remaining = $days;

        while ($remaining > 0) {
            $date->addDay();
            if (in_array(self::ABBR[$date->dayOfWeek], $sendDays, true)) {
                $remaining--;
            }
        }

        return $date;
    }

    public static function isSendableDay(Carbon $date, array $sendDays): bool
    {
        return in_array(self::ABBR[$date->dayOfWeek], $sendDays, true);
    }
}
