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
    // 1. Créer la table
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('action');
            $table->string('entite_concernee');
            $table->unsignedBigInteger('entite_id')->nullable();
            $table->jsonb('anciennes_valeurs')->nullable();
            $table->jsonb('nouvelles_valeurs')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('timestamp')->useCurrent();
            $table->timestamps();
        });

        // 2. ⭐ Ajouter les index (après la création de la table)
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("CREATE INDEX idx_audit_action ON audit_logs (action)");
            DB::statement("CREATE INDEX idx_audit_user ON audit_logs (user_id, timestamp DESC)");
        }

        // 3. ⭐ Sécurité : révoquer les droits UPDATE/DELETE (après la création)
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC");
        }
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
