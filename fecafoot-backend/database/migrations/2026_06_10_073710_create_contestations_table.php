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
        Schema::create('contestations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('match_event_id')->constrained('match_events')->cascadeOnDelete();
    $table->foreignId('coach_id')->constrained('users')->restrictOnDelete();
    $table->text('motif');
    $table->enum('statut', ['en_attente', 'acceptee', 'rejetee'])->default('en_attente');
    $table->text('decision')->nullable();
    $table->foreignId('traitee_par_id')->nullable()->constrained('users')->nullOnDelete();
    $table->dateTime('date_contestation');
    $table->dateTime('date_decision')->nullable();
    $table->timestamps();

    $table->unique(['match_event_id', 'coach_id']);
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contestations');
    }
};
