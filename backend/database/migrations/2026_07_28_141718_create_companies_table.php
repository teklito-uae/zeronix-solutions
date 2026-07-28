<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('Zeronix Technology LLC');
            $table->text('address')->nullable();
            $table->string('trn')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->longText('logo_data_url')->nullable();
            $table->longText('logo_dark_data_url')->nullable();
            $table->text('default_payment_terms')->nullable();
            $table->text('default_terms')->nullable();
            $table->string('default_signatory')->nullable();
            $table->timestamps();
        });

        // Seed the singleton company row (id = 1) with the same defaults as the old
        // Node/SQLite app (server/src/db.ts) so the app isn't blank before the
        // sqlite import command runs.
        DB::table('companies')->insert([
            'id' => 1,
            'name' => 'Zeronix Technology LLC',
            'address' => '#19 Khurram Building, Al-Raffa Street, Bur Dubai',
            'trn' => '104865090500003',
            'phone' => '+971 50 981 1669 | +97156 785 0662',
            'email' => 'info@zeronix.ae | tech@zeronix.ae',
            'logo_data_url' => '',
            'logo_dark_data_url' => '',
            'default_payment_terms' => "60% Advance upon approval of the proposal.\n40% Balance upon successful completion of the project.",
            'default_terms' => '',
            'default_signatory' => 'ISMAIL THASRIF KM',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
