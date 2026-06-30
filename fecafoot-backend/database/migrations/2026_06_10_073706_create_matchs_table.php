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
        Schema::create('matchs', function (Blueprint $table) {
            $table->id();
            
            // ⭐ CORRIGÉ : competition_id pour accès direct
            $table->foreignId('competition_id')->constrained('competitions')->cascadeOnDelete();
            $table->foreignId('phase_id')->nullable()->constrained('phases')->restrictOnDelete();
            $table->foreignId('poule_id')->nullable()->constrained('poules')->restrictOnDelete();
            
            $table->integer('journee')->nullable();
            $table->enum('type', ['regulier', 'playoff_up', 'playoff_down', 'barrage'])->default('regulier');
            
            $table->foreignId('club_domicile_id')->constrained('clubs')->restrictOnDelete();
            $table->foreignId('club_exterieur_id')->constrained('clubs')->restrictOnDelete();
            $table->foreignId('commissaire_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('arbitre_principal_id')->nullable()->constrained('arbitres')->nullOnDelete();
            
            $table->dateTime('date_heure')->nullable();
            $table->string('stade', 150)->nullable();
            $table->boolean('terrain_neutre')->default(false);
            
            // Scores terrain
            $table->integer('score_domicile_terrain')->default(0);
            $table->integer('score_exterieur_terrain')->default(0);
            
            // Scores officiels
            $table->integer('score_domicile_officiel')->nullable();
            $table->integer('score_exterieur_officiel')->nullable();
            
            // Prolongations
            $table->integer('score_domicile_prolongation')->nullable();
            $table->integer('score_exterieur_prolongation')->nullable();
            
            // Tirs au but
            $table->integer('score_domicile_tab')->nullable();
            $table->integer('score_exterieur_tab')->nullable();
            
            // Forfait
            $table->boolean('est_forfait')->default(false);
            $table->foreignId('club_forfait_id')->nullable()->constrained('clubs')->nullOnDelete();
            
            $table->enum('statut', ['programme', 'en_cours', 'mi_temps', 'termine', 'homologue', 'reporte', 'annule', 'litige'])->default('programme');
            $table->boolean('est_homologue')->default(false);
            $table->timestamp('date_homologation')->nullable();
            
            $table->text('motif_report')->nullable();
            $table->dateTime('date_heure_report')->nullable();
            
            $table->timestamps();
        });
        
        // ⭐ Contraintes CHECK après création
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE matchs ADD CONSTRAINT chk_clubs_differents
                CHECK (club_domicile_id <> club_exterieur_id)");
            
            DB::statement("ALTER TABLE matchs ADD CONSTRAINT chk_scores_positifs
                CHECK (score_domicile_terrain >= 0 AND score_exterieur_terrain >= 0)");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('matchs');
    }
};
