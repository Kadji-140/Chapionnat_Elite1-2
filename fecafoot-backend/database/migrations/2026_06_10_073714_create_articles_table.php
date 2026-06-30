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
Schema::create('articles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('auteur_id')->constrained('users')->restrictOnDelete();
    $table->foreignId('valide_par_id')->nullable()->constrained('users')->nullOnDelete();
    $table->string('titre');
    $table->text('contenu');
    $table->string('image_principale')->nullable();
    $table->enum('categorie', ['actualite', 'match', 'club', 'joueur', 'transfert', 'officiel']);
    $table->enum('statut', ['brouillon', 'soumis', 'valide', 'rejete', 'publie'])->default('brouillon');
    $table->text('motif_rejet')->nullable();
    $table->timestamp('date_publication')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
