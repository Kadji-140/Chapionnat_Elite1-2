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
        Schema::create('composition_joueurs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('composition_id')->constrained('compositions')->cascadeOnDelete();
    $table->foreignId('joueur_id')->constrained('joueurs')->cascadeOnDelete();
    $table->enum('role', ['titulaire', 'remplacant']);
    $table->boolean('est_capitaine')->default(false);
    $table->integer('minute_entree')->nullable();
    $table->integer('minute_sortie')->nullable();
    $table->timestamps();

    $table->unique(['composition_id', 'joueur_id']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('composition_joueurs');
    }
};
