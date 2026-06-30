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
Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('nom');
        $table->string('prenom');
        $table->string('email')->unique();
        $table->string('password');
        $table->enum('role', ['admin', 'responsable_club', 'coach', 'commissaire', 'journaliste']);
        
        // ⭐ Temporairement, pas de foreign key
        $table->unsignedBigInteger('club_id')->nullable();
        // $table->foreign('club_id')->references('id')->on('clubs')->nullOnDelete(); // COMMENTÉ
        
        $table->boolean('peut_creer_admin')->default(false);
        $table->boolean('acces_actif')->default(true);
        $table->string('villes')->nullable();
        $table->timestamp('date_derniere_activite')->nullable();
        $table->boolean('premiere_connexion')->default(true);
        $table->timestamp('email_verified_at')->nullable();
        $table->rememberToken();
        $table->timestamps();
        $table->softDeletes();
    });

// Contrainte CHECK sur le rôle (PostgreSQL uniquement)
if (DB::connection()->getDriverName() === 'pgsql') {
    DB::statement("ALTER TABLE users ADD CONSTRAINT chk_users_role
        CHECK (role IN ('admin','responsable_club','coach','commissaire','journaliste'))");
}

// Index partiel pour un seul responsable actif par club (PostgreSQL uniquement)
if (DB::connection()->getDriverName() === 'pgsql') {
    DB::statement("CREATE UNIQUE INDEX uq_club_responsable_active
        ON users (club_id) WHERE role = 'responsable_club' AND deleted_at IS NULL");
}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
