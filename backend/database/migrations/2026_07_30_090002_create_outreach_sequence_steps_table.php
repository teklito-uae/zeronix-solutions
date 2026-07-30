<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outreach_sequence_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('outreach_campaigns')->cascadeOnDelete();
            $table->integer('step_number');
            $table->integer('wait_days')->default(0); // cool-off since previous step (business days)
            $table->string('subject_template');
            $table->longText('body_template'); // Tiptap HTML with {{tokens}}
            $table->boolean('is_final_step')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outreach_sequence_steps');
    }
};
