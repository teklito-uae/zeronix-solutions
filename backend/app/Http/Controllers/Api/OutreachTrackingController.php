<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OutreachSend;
use App\Models\OutreachSuppression;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OutreachTrackingController extends Controller
{
    private const PIXEL = "GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;";

    public function openPixel(string $token)
    {
        $send = OutreachSend::where('tracking_token', $token)->first();
        if ($send) {
            $send->events()->create(['event_type' => 'open', 'occurred_at' => now()]);
        }

        return response(self::PIXEL, 200, ['Content-Type' => 'image/gif']);
    }

    public function click(Request $request, string $token)
    {
        $url = $request->query('u', config('app.frontend_url', config('app.url')));

        $send = OutreachSend::where('tracking_token', $token)->first();
        if ($send) {
            $send->events()->create([
                'event_type' => 'click',
                'occurred_at' => now(),
                'metadata' => ['url' => $url],
            ]);
        }

        return redirect()->away($url);
    }

    public function unsubscribe(string $token)
    {
        $send = OutreachSend::with('contact', 'prospect')->where('tracking_token', $token)->first();

        if ($send) {
            DB::transaction(function () use ($send) {
                OutreachSuppression::firstOrCreate(
                    ['email' => $send->contact->email],
                    ['reason' => 'unsubscribed']
                );
                $send->prospect->update(['status' => 'unsubscribed']);
                $send->events()->create(['event_type' => 'unsubscribe', 'occurred_at' => now()]);
            });
        }

        return response(
            '<html><body style="font-family:sans-serif;text-align:center;padding:60px;">'
            .'<h2>You\'ve been unsubscribed</h2><p>You will not receive further emails from this sender.</p>'
            .'</body></html>',
            200,
            ['Content-Type' => 'text/html']
        );
    }
}
