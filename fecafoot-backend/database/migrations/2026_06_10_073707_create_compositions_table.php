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
        Schema::create('compositions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('match_id')->constrained('matchs')->cascadeOnDelete();
    $table->foreignId('club_id')->constrained('clubs')->cascadeOnDelete();
    $table->enum('statut', ['brouillon', 'soumise', 'confirmee'])->default('brouillon');
    $table->boolean('est_confirmee')->default(false);
    $table->string('formation', 10)->nullable();
    $table->dateTime('date_confirmation')->nullable();
    $table->timestamps();

    $table->unique(['match_id', 'club_id']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compositions');
    }
};
