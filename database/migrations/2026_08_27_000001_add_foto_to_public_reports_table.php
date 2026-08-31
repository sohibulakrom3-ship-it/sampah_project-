<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('public_reports', function (Blueprint $table) {
            $table->string('foto', 500)->nullable()
                ->comment('Bukti foto laporan (path di storage/public/laporan).');
        });
    }

    public function down(): void
    {
        Schema::table('public_reports', function (Blueprint $table) {
            $table->dropColumn('foto');
        });
    }
};
