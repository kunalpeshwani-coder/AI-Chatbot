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
        // Anonymous visitors chatting through an embedded public widget have no
        // logged-in user, so user_id must become nullable.
        DB::statement('ALTER TABLE conversations MODIFY user_id BIGINT UNSIGNED NULL');

        Schema::table('conversations', function (Blueprint $table) {
            $table->foreignId('chatbot_id')->nullable()->after('domain_id')
                ->constrained('chatbots')->cascadeOnDelete();
            $table->string('visitor_token', 64)->nullable()->after('chatbot_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('chatbot_id');
            $table->dropColumn('visitor_token');
        });

        DB::statement('ALTER TABLE conversations MODIFY user_id BIGINT UNSIGNED NOT NULL');
    }
};
