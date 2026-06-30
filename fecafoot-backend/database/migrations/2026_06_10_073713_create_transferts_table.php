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
        Schema::create('transferts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('joueur_id')->constrained('joueurs')->restrictOnDelete();
            $table->foreignId('club_cedant_id')->constrained('clubs')->restrictOnDelete();
            $table->foreignId('club_acquereur_id')->constrained('clubs')->restrictOnDelete();
            $table->foreignId('saison_id')->constrained('saisons')->restrictOnDelete();
            $table->decimal('montant', 12, 2)->nullable();
            $table->enum('statut', ['en_attente', 'valide', 'rejete'])->default('en_attente');
            $table->text('motif_rejet')->nullable();
            $table->foreignId('valide_par_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('date_demande');
            $table->dateTime('date_validation')->nullable();
            $table->timestamps();
        });

        // 2. ⭐ MAINTENANT ajouter la contrainte CHECK (après la création de la table)
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE transferts ADD CONSTRAINT chk_clubs_transfert_differents
                CHECK (club_cedant_id <> club_acquereur_id)");
        }
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transferts');
    }
};
