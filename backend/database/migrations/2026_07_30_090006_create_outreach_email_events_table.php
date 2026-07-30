<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outreach_email_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('send_id')->constrained('outreach_sends')->cascadeOnDelete();
            $table->string('event_type'); // open|click|reply|bounce|unsubscribe
            $table->timestamp('occurred_at');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outreach_email_events');
    }
};
