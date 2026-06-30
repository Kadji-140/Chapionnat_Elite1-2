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
  // 1. Créer la table SANS les contraintes CHECK
        Schema::create('classement_clubs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->cascadeOnDelete();
            $table->foreignId('poule_id')->constrained('poules')->cascadeOnDelete();
            
            // ⭐ CORRIGÉ : saison_id pour historique des classements
            $table->foreignId('saison_id')->constrained('saisons')->cascadeOnDelete();
            
            $table->integer('points')->default(0);
            $table->integer('victoires')->default(0);
            $table->integer('nuls')->default(0);
            $table->integer('defaites')->default(0);
            $table->integer('buts_pour')->default(0);
            $table->integer('buts_contre')->default(0);
            $table->integer('diff_buts')->default(0);
            $table->integer('nb_matchs')->default(0);
            $table->integer('cartons_jaunes')->default(0);
            $table->integer('cartons_rouges')->default(0);
            
            $table->integer('points_penalite')->default(0);
            $table->text('motif_penalite')->nullable();
            $table->integer('position')->default(0);
            
            $table->timestamps();

            $table->unique(['club_id', 'poule_id', 'saison_id']);
        });
        
        // ⭐ Contrainte CHECK après création
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE classement_clubs ADD CONSTRAINT chk_stats_positives
                CHECK (victoires >= 0 AND nuls >= 0 AND defaites >= 0
                       AND buts_pour >= 0 AND buts_contre >= 0 AND nb_matchs >= 0)");
        }
    }

   
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classement_clubs');
    }
};
