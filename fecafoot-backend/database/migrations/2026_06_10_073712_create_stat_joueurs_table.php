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
Schema::create('stat_joueurs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('joueur_id')->constrained('joueurs')->cascadeOnDelete();
    $table->foreignId('competition_id')->constrained('competitions')->cascadeOnDelete();
    $table->integer('buts')->default(0);
    $table->integer('passes_decisives')->default(0);
    $table->integer('cartons_jaunes')->default(0);
    $table->integer('cartons_rouges')->default(0);
    $table->integer('minutes_jouees')->default(0);
    $table->integer('nb_matchs')->default(0);
    $table->integer('tirs_au_but_marques')->default(0);
    $table->timestamps();

    $table->unique(['joueur_id', 'competition_id']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stat_joueurs');
    }
};
