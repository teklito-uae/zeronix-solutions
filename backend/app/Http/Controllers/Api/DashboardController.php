<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enquiry;
use App\Models\Quote;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $quotesTotal = Quote::count();
        $quotesByStatus = [
            'draft' => Quote::where('status', 'draft')->count(),
            'sent' => Quote::where('status', 'sent')->count(),
            'accepted' => Quote::where('status', 'accepted')->count(),
        ];
        $acceptedValueTotal = (float) Quote::where('status', 'accepted')->sum('grand_total_amount');

        $enquiriesTotal = Enquiry::count();
        $enquiriesByStatus = [
            'new' => Enquiry::where('status', 'new')->count(),
            'in_review' => Enquiry::where('status', 'in_review')->count(),
            'quoted' => Enquiry::where('status', 'quoted')->count(),
            'won' => Enquiry::where('status', 'won')->count(),
            'lost' => Enquiry::where('status', 'lost')->count(),
            'on_hold' => Enquiry::where('status', 'on_hold')->count(),
        ];

        // Conversion rate: enquiries that have actually been turned into a
        // quote (converted_quote_id is set), divided by total enquiries.
        $convertedCount = Enquiry::whereNotNull('converted_quote_id')->count();
        $conversionRate = $enquiriesTotal > 0 ? round($convertedCount / $enquiriesTotal, 4) : 0.0;

        $monthlyTrend = $this->monthlyTrend();

        return response()->json([
            'quotes_total' => $quotesTotal,
            'quotes_by_status' => $quotesByStatus,
            'accepted_value_total' => $acceptedValueTotal,
            'enquiries_total' => $enquiriesTotal,
            'enquiries_by_status' => $enquiriesByStatus,
            'conversion_rate' => $conversionRate,
            'monthly_trend' => $monthlyTrend,
        ]);
    }

    /**
     * Last 12 months, each { month: 'YYYY-MM', quotes_created, quotes_accepted }.
     * quotes_created = created_at in that month.
     * quotes_accepted = updated_at in that month AND status = accepted (approximate).
     */
    private function monthlyTrend(): array
    {
        $months = [];
        $now = Carbon::now()->startOfMonth();
        for ($i = 11; $i >= 0; $i--) {
            $months[] = $now->copy()->subMonths($i);
        }

        $createdCounts = Quote::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as ym, COUNT(*) as c")
            ->groupBy('ym')
            ->pluck('c', 'ym');

        $acceptedCounts = Quote::selectRaw("DATE_FORMAT(updated_at, '%Y-%m') as ym, COUNT(*) as c")
            ->where('status', 'accepted')
            ->groupBy('ym')
            ->pluck('c', 'ym');

        return array_map(function (Carbon $month) use ($createdCounts, $acceptedCounts) {
            $key = $month->format('Y-m');

            return [
                'month' => $key,
                'quotes_created' => (int) ($createdCounts[$key] ?? 0),
                'quotes_accepted' => (int) ($acceptedCounts[$key] ?? 0),
            ];
        }, $months);
    }
}
