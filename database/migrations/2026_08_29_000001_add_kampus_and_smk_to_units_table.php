<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->string('kampus')->nullable()->after('nama');
            $table->enum('jenis', ['SD', 'SMP', 'SMA', 'SMK', 'TK', 'BTM', 'Sumart', 'Umci', 'Lainnya'])->change();
        });

        // Unit lama semuanya milik Kampus B
        DB::table('units')
            ->where('nama', 'like', '%Kampus B%')
            ->update(['kampus' => 'Kampus B']);
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn('kampus');
            $table->enum('jenis', ['SD', 'SMP', 'SMA', 'TK', 'BTM', 'Sumart', 'Umci', 'Lainnya'])->change();
        });
    }
};
