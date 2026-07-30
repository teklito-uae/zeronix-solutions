<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outreach_suppressions', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('reason')->default('manual'); // unsubscribed|bounced_hard|manual|complaint
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outreach_suppressions');
    }
};
