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
     Schema::create('competitions', function (Blueprint $table) {
            $table->id();
            
            // ⭐ AJOUTÉ : lien direct vers la saison (clé étrangère)
            $table->foreignId('saison_id')->constrained('saisons')->cascadeOnDelete();
            
            $table->enum('niveau', ['elite_one', 'elite_two']);
            $table->string('nom'); // Ex: "MTN Elite One 2025-2026"
            $table->enum('statut', ['planifiee', 'en_cours', 'terminee'])->default('planifiee');
            $table->timestamps();

            // Une seule compétition par niveau par saison
            $table->unique(['saison_id', 'niveau']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competitions');
    }
};
