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
        Schema::create('saisons', function (Blueprint $table) {
            $table->id();
            $table->string('intitule')->unique();
            $table->date('date_debut');
            $table->date('date_fin');
            $table->enum('statut', ['planifiee', 'en_cours', 'terminee'])->default('planifiee');
            
            
            // La saison est une ENVELOPPE GLOBALE qui contient des compétitions
            
            $table->foreignId('clonee_depuis_id')->nullable()->constrained('saisons')->nullOnDelete();
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('saisons');
    }
};
