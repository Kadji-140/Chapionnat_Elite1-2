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
// 1. Créer la table
        Schema::create('talent_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('joueur_id')->constrained('joueurs')->cascadeOnDelete();
            $table->foreignId('saison_id')->constrained('saisons')->cascadeOnDelete();
            $table->float('score_global');
            $table->float('score_offensive');
            $table->float('score_defensive');
            $table->float('score_discipline');
            $table->jsonb('details')->nullable();
            $table->string('modele_version')->nullable();
            $table->timestamp('date_calcul');
            $table->timestamps();

            $table->unique(['joueur_id', 'saison_id']);
        });

        // 2. ⭐ Ajouter l'index GIN (après la création de la table)
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("CREATE INDEX idx_talent_scores_details ON talent_scores USING GIN (details)");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('talent_scores');
    }
};
