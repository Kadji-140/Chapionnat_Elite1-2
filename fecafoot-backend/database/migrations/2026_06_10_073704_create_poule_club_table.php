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
       Schema::create('poule_club', function (Blueprint $table) {
    $table->id();
    $table->foreignId('poule_id')->constrained('poules')->cascadeOnDelete();
    $table->foreignId('club_id')->constrained('clubs')->cascadeOnDelete();
    
    // ⭐ NOUVEAU : Saison d'affectation (évite les conflits entre saisons)
    $table->foreignId('saison_id')->constrained('saisons')->cascadeOnDelete();
    
    $table->integer('ordre_tirage')->nullable();
    $table->date('date_affectation')->useCurrent();
    $table->timestamps();

    $table->unique(['poule_id', 'club_id', 'saison_id']); // ⭐ Modifié
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('poule_club');
    }
};
