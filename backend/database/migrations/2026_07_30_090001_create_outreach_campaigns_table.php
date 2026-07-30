<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outreach_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('mailbox_id')->nullable()->constrained('outreach_mailboxes')->nullOnDelete();
            $table->text('service_focus')->nullable();
            $table->text('target_industry_notes')->nullable();
            $table->string('status')->default('draft'); // draft|researching|active|paused|completed

            $table->integer('daily_new_send_limit')->default(10);
            $table->time('send_window_start')->default('09:00:00');
            $table->time('send_window_end')->default('17:00:00');
            $table->json('send_days')->nullable(); // e.g. ["sun","mon","tue","wed","thu"]

            $table->text('unsubscribe_footer_text')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outreach_campaigns');
    }
};
