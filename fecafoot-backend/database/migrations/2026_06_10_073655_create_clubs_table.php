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
Schema::create('clubs', function (Blueprint $table) {
        $table->id();
        $table->string('nom')->unique();
        $table->string('ville');
        $table->enum('division', ['elite_one', 'elite_two']);
        $table->string('logo_url')->nullable();
        
        // ⭐ Temporairement, pas de foreign key
        $table->unsignedBigInteger('responsable_id')->nullable();
        // $table->foreign('responsable_id')->references('id')->on('users')->nullOnDelete(); // COMMENTÉ
        
        $table->string('stade')->nullable();
        $table->string('president')->nullable();
        $table->string('couleurs')->nullable();
        $table->integer('annee_creation')->nullable();
        $table->boolean('profile_completed')->default(false);
        $table->string('site_web')->nullable();
        $table->string('telephone')->nullable();
        $table->text('presentation')->nullable();
        $table->boolean('est_actif')->default(true);
        $table->timestamps();
        $table->softDeletes();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clubs');
    }
};
