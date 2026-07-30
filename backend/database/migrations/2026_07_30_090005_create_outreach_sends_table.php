<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outreach_sends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prospect_id')->constrained('outreach_prospects')->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained('outreach_contacts')->cascadeOnDelete();
            $table->foreignId('sequence_step_id')->constrained('outreach_sequence_steps')->cascadeOnDelete();
            $table->foreignId('mailbox_id')->constrained('outreach_mailboxes')->cascadeOnDelete();

            $table->string('subject');
            $table->longText('body_html');
            $table->string('message_id')->nullable(); // RFC Message-ID for threading
            $table->string('in_reply_to')->nullable();
            $table->string('tracking_token')->unique();

            $table->string('status')->default('scheduled'); // scheduled|sending|sent|failed|bounced|skipped_suppressed
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->text('failed_reason')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outreach_sends');
    }
};
