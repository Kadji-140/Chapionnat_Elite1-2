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
        Schema::table('composition_joueurs', function (Blueprint $table) {
            $table->string('poste_id')->nullable();
            $table->integer('poste_index')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('composition_joueurs', function (Blueprint $table) {
            $table->dropColumn(['poste_id', 'poste_index']);
        });
    }
};
