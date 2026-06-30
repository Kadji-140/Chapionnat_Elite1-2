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
        Schema::create('votes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('match_id')->constrained('matchs')->cascadeOnDelete();
    $table->foreignId('joueur_id')->constrained('joueurs')->cascadeOnDelete();
    $table->foreignId('mobile_user_id')->constrained('mobile_users')->cascadeOnDelete();
    $table->timestamps();

    $table->unique(['match_id', 'mobile_user_id']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};
