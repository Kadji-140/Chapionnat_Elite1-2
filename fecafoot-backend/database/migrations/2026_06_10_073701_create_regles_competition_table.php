<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;


return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('regles_competition', function (Blueprint $table) {
    $table->id();
    $table->foreignId('competition_id')->unique()->constrained('competitions')->cascadeOnDelete();

    // Structure de la phase régulière
    $table->integer('nb_clubs');           // Total des clubs participants
    $table->enum('format', ['poule_unique', 'poules_multiples']); // ⭐ NOUVEAU
    $table->integer('nb_poules');          // 1 pour Elite1, 2 pour Elite2
    
    // ⭐ NOUVEAU : Calcul automatique du nombre de matchs par club
    $table->integer('nb_matchs_par_club')->nullable(); // (nb_clubs - 1) * 2

    // Playoffs
    $table->boolean('a_playoffs')->default(false);
    $table->integer('nb_clubs_playoffs_up')->nullable();
    $table->integer('nb_clubs_playoffs_down')->nullable();
    $table->boolean('points_reportes_playoffs')->default(false);

    // Barrages inter-divisions
    $table->boolean('a_barrage')->default(false);
    $table->integer('nb_clubs_barrage')->nullable();

    // Promotions / Relégations directes
    $table->integer('nb_promus_directs')->default(0);
    $table->integer('nb_relegues_directs')->default(0);

    // Critères de départage (ordre de priorité stocké en JSON)
    $table->jsonb('criteres_egalite');

    // Règles de points
    $table->integer('points_victoire')->default(3);
    $table->integer('points_nul')->default(1);
    $table->integer('points_defaite')->default(0);

    // Tapis vert
    $table->integer('score_forfait_vainqueur')->default(3);
    $table->integer('score_forfait_perdant')->default(0);
    $table->integer('points_penalite_forfait')->default(0);

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('regles_competition');
    }
};
