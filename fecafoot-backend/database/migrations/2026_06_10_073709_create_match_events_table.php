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
        Schema::create('match_events', function (Blueprint $table) {
    $table->id();
    $table->foreignId('match_id')->constrained('matchs')->cascadeOnDelete();
    $table->foreignId('joueur_id')->nullable()->constrained('joueurs')->nullOnDelete();
    $table->foreignId('joueur_remplacant_id')->nullable()->constrained('joueurs')->nullOnDelete();
    $table->foreignId('saisi_par_id')->constrained('users')->restrictOnDelete();
    
    // ⭐ NOUVEAU : Club concerné par l'événement
    $table->foreignId('club_id')->nullable()->constrained('clubs')->nullOnDelete();

    $table->enum('type', [
        'but',
        'but_csc',
        'penalty_marque',
        'penalty_rate',
        'carton_jaune',
        'carton_rouge',
        'carton_jaune_rouge',
        'remplacement',
        'incident',
        'temps_additionnel',
        'debut_match',
        'mi_temps',
        'reprise',
        'fin_match',
        'debut_prolongation',
        'fin_prolongation',
        'tab'
    ]);

    $table->integer('minute')->nullable();
    $table->integer('minute_additionnelle')->nullable();
    $table->timestamp('timestamp_event');
    $table->text('description')->nullable();
    $table->enum('statut', ['valide', 'conteste', 'corrige', 'annule'])->default('valide');

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('match_events');
    }
};
