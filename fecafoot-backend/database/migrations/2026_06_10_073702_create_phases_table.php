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
       Schema::create('phases', function (Blueprint $table) {
            $table->id();
            
            // ⭐ CORRIGÉ : lien direct vers competition (plus simple)
            $table->foreignId('competition_id')->constrained('competitions')->cascadeOnDelete();
            
            $table->string('nom', 100);
            $table->enum('type', ['reguliere', 'playoff_up', 'playoff_down', 'barrage']);
            $table->integer('ordre');
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->enum('statut', ['planifiee', 'en_cours', 'terminee', 'gelee'])->default('planifiee');
            $table->boolean('est_terminee')->default(false);
            $table->timestamps();

            $table->unique(['competition_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('phases');
    }
};
