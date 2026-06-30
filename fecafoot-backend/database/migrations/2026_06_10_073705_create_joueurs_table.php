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
        Schema::create('joueurs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('club_id')->constrained('clubs')->restrictOnDelete();
    $table->string('nom');
    $table->string('prenom');
    $table->date('date_naissance');
    $table->string('nationalite')->nullable();
    $table->string('num_licence')->unique();
    
    // ⭐ Postes plus détaillés
    $table->enum('poste', [
        'gardien',
        'defenseur_central',
        'lateral_droit',
        'lateral_gauche',
        'milieu_defensif',
        'milieu_central',
        'milieu_offensif',
        'ailier_droit',
        'ailier_gauche',
        'attaquant_centre',
        'avant_centre'
    ]);
    
    $table->integer('num_maillot');
    $table->string('photo_url')->nullable();           // ⭐ Renommé
    $table->integer('taille_cm')->nullable();          // ⭐ NOUVEAU
    $table->integer('poids_kg')->nullable();           // ⭐ NOUVEAU
    
    // Statut du joueur
    $table->enum('statut', ['actif', 'suspendu', 'blesse', 'transfert', 'inactif'])->default('actif');

    // Validation par l'admin
    $table->enum('statut_validation', ['en_attente', 'valide', 'rejete'])->default('en_attente');
    
    // ⭐ NOUVEAU : Pour la validation par lot
    $table->boolean('est_soumis')->default(false);
    $table->text('motif_rejet')->nullable();

    $table->timestamps();
    $table->softDeletes();

    $table->unique(['club_id', 'num_maillot']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('joueurs');
    }
};
