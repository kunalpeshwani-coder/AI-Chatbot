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
        // Documents can now belong to either an admin-managed domain OR a client's own
        // chatbot, so domain_id must become nullable (raw SQL avoids needing doctrine/dbal).
        DB::statement('ALTER TABLE documents MODIFY domain_id BIGINT UNSIGNED NULL');

        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('chatbot_id')->nullable()->after('domain_id')
                ->constrained('chatbots')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('chatbot_id');
        });

        DB::statement('ALTER TABLE documents MODIFY domain_id BIGINT UNSIGNED NOT NULL');
    }
};
