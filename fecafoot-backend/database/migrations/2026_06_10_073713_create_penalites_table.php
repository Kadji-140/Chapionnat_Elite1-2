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
Schema::create('penalites', function (Blueprint $table) {
    $table->id();
    $table->foreignId('club_id')->constrained('clubs')->restrictOnDelete();
    $table->foreignId('saison_id')->constrained('saisons')->restrictOnDelete();
    $table->foreignId('match_id')->nullable()->constrained('matchs')->nullOnDelete();
    $table->enum('type', ['retrait_points', 'forfait', 'amende', 'autre']);
    $table->integer('points_retires')->default(0);
    $table->text('motif');
    $table->foreignId('appliquee_par_id')->constrained('users')->restrictOnDelete();
    $table->dateTime('date_application');
    $table->boolean('active')->default(true);
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('penalites');
    }
};
