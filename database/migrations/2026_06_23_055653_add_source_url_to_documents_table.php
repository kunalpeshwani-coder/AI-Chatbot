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
        // Website-URL sources don't have a stored file, so file_path must become nullable.
        match (Schema::getConnection()->getDriverName()) {
            'pgsql' => DB::statement('ALTER TABLE documents ALTER COLUMN file_path DROP NOT NULL'),
            default => DB::statement('ALTER TABLE documents MODIFY file_path VARCHAR(255) NULL'),
        };

        Schema::table('documents', function (Blueprint $table) {
            $table->string('source_url')->nullable()->after('original_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('source_url');
        });

        match (Schema::getConnection()->getDriverName()) {
            'pgsql' => DB::statement('ALTER TABLE documents ALTER COLUMN file_path SET NOT NULL'),
            default => DB::statement('ALTER TABLE documents MODIFY file_path VARCHAR(255) NOT NULL'),
        };
    }
};
