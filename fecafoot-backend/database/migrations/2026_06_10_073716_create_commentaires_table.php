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
        Schema::create('commentaires', function (Blueprint $table) {
    $table->id();
    $table->foreignId('match_id')->constrained('matchs')->cascadeOnDelete();
    $table->foreignId('mobile_user_id')->nullable()->constrained('mobile_users')->nullOnDelete();
    $table->text('texte');
    $table->string('pseudo_auteur')->nullable();
    $table->boolean('est_modere')->default(false);
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commentaires');
    }
};
