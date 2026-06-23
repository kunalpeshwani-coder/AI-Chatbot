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
        DB::statement('ALTER TABLE documents MODIFY file_path VARCHAR(255) NULL');

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

        DB::statement('ALTER TABLE documents MODIFY file_path VARCHAR(255) NOT NULL');
    }
};
