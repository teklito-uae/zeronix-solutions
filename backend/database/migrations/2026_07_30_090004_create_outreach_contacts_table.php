<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outreach_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prospect_id')->constrained('outreach_prospects')->cascadeOnDelete();
            $table->string('full_name')->nullable();
            $table->string('guessed_title')->nullable(); // e.g. IT Head, Procurement Manager
            $table->string('email')->nullable();
            $table->integer('email_confidence')->nullable(); // 0-100
            $table->string('email_verification_status')->default('unverified'); // unverified|smtp_verified|smtp_invalid|risky|skipped
            $table->text('source_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outreach_contacts');
    }
};
