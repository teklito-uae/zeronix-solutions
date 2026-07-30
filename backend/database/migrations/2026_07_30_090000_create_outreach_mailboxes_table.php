<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outreach_mailboxes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('from_name');
            $table->string('from_email');

            $table->string('smtp_host');
            $table->integer('smtp_port')->default(587);
            $table->string('smtp_username');
            $table->text('smtp_password'); // encrypted cast
            $table->string('smtp_encryption')->default('tls'); // tls|ssl|null

            $table->string('imap_host');
            $table->integer('imap_port')->default(993);
            $table->string('imap_username');
            $table->text('imap_password'); // encrypted cast
            $table->string('imap_encryption')->default('ssl');
            $table->string('imap_folder')->default('INBOX');

            $table->integer('daily_send_cap')->default(10);
            $table->integer('sent_today')->default(0);
            $table->date('sent_today_reset_at')->nullable();

            $table->integer('warmup_stage')->default(0);
            $table->timestamp('warmup_started_at')->nullable();

            $table->string('status')->default('pending_test'); // pending_test|active|error|disabled
            $table->timestamp('last_imap_check_at')->nullable();
            $table->text('last_error')->nullable();

            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outreach_mailboxes');
    }
};
