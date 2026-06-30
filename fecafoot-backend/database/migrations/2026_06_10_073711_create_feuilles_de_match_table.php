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
       Schema::create('feuilles_de_match', function (Blueprint $table) {
    $table->id();
    $table->foreignId('match_id')->unique()->constrained('matchs')->cascadeOnDelete();
    $table->enum('statut', ['soumise', 'validee', 'verrouillee'])->default('soumise');
    $table->integer('score_final_dom')->default(0);
    $table->integer('score_final_ext')->default(0);
    $table->text('incidents_rapport')->nullable();
    $table->string('chemin_pdf')->nullable();
    $table->timestamp('date_generation')->nullable();
    $table->foreignId('validee_par_id')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feuilles_de_match');
    }
};
