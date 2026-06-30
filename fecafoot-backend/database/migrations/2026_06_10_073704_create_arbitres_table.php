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
       Schema::create('arbitres', function (Blueprint $table) {
    $table->id();
    $table->string('nom');
    $table->string('prenom');
    $table->string('num_licence')->unique();
    $table->enum('specification', ['central', 'assistant', 'quatrieme']); // ⭐ Corrigé
    $table->string('region')->nullable();
    $table->string('villes')->nullable();              // ⭐ NOUVEAU
    $table->boolean('disponible')->default(true);      // ⭐ NOUVEAU
    $table->boolean('actif')->default(true);
    $table->timestamps();
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('arbitres');
    }
};
