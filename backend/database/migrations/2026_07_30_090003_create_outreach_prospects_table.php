<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outreach_prospects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('outreach_campaigns')->cascadeOnDelete();
            $table->string('company_name');
            $table->string('website_url')->nullable();
            $table->string('industry_guess')->nullable();
            $table->integer('industry_confidence')->nullable(); // 0-100
            $table->text('research_summary')->nullable();
            $table->text('trigger_event')->nullable();

            // pending_research|researched|contact_found|no_contact_found|queued|active|
            // replied|converted|unsubscribed|bounced|stopped|rejected
            $table->string('status')->default('pending_research');

            $table->timestamp('researched_at')->nullable();
            $table->text('research_error')->nullable();

            $table->foreignId('converted_client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('converted_enquiry_id')->nullable()->constrained('enquiries')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outreach_prospects');
    }
};
