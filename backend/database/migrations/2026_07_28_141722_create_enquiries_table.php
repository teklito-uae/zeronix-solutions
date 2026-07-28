<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enquiries', function (Blueprint $table) {
            $table->id();
            $table->string('enquiry_no')->unique();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('contact_name');
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('company_name')->nullable();
            // Networking | Cloud | Cybersecurity | Software Development |
            // IT Support & Maintenance | Hardware Supply | CCTV & Surveillance | Other
            $table->string('service_type');
            $table->string('title', 255);
            $table->longText('scope_of_work')->nullable(); // Tiptap HTML
            $table->string('budget_range')->nullable();
            $table->string('priority')->default('medium'); // low|medium|high
            $table->string('source')->default('other'); // website|referral|call|email|walkin|other
            $table->string('status')->default('new'); // new|in_review|quoted|won|lost|on_hold
            $table->foreignId('converted_quote_id')->nullable()->constrained('quotes')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enquiries');
    }
};
