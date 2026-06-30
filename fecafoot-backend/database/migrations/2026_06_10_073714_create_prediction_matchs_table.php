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
// 1. Créer la table SANS la contrainte CHECK
        Schema::create('prediction_matchs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->unique()->constrained('matchs')->cascadeOnDelete();
            $table->float('proba_victoire_dom');
            $table->float('proba_nul');
            $table->float('proba_victoire_ext');
            $table->string('phase_competition')->nullable();
            $table->boolean('terrain_neutre')->default(false);
            $table->string('modele_version')->nullable();
            $table->timestamp('date_calcul');
            $table->timestamps();
        });

        // 2. ⭐ MAINTENANT ajouter la contrainte CHECK (après la création de la table)
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE prediction_matchs ADD CONSTRAINT chk_probas_valides
                CHECK (proba_victoire_dom >= 0 AND proba_nul >= 0 AND proba_victoire_ext >= 0
                       AND proba_victoire_dom <= 1 AND proba_nul <= 1 AND proba_victoire_ext <= 1)");
        }
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prediction_matchs');
    }
};
