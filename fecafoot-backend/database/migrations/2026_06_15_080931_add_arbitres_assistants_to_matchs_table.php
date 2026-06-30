<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('matchs', function (Blueprint $table) {
            $table->foreignId('arbitre_assistant_1_id')
                ->nullable()
                ->after('arbitre_principal_id')
                ->constrained('arbitres')
                ->nullOnDelete();

            $table->foreignId('arbitre_assistant_2_id')
                ->nullable()
                ->after('arbitre_assistant_1_id')
                ->constrained('arbitres')
                ->nullOnDelete();

            $table->foreignId('quatrieme_arbitre_id')
                ->nullable()
                ->after('arbitre_assistant_2_id')
                ->constrained('arbitres')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matchs', function (Blueprint $table) {
            $table->dropForeign(['arbitre_assistant_1_id']);
            $table->dropColumn('arbitre_assistant_1_id');

            $table->dropForeign(['arbitre_assistant_2_id']);
            $table->dropColumn('arbitre_assistant_2_id');

            $table->dropForeign(['quatrieme_arbitre_id']);
            $table->dropColumn('quatrieme_arbitre_id');
        });
    }
};
