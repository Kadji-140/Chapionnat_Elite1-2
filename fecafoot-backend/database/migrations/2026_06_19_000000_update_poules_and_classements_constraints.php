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
        // 1. Ajouter la colonne classement_gele à la table poules
        Schema::table('poules', function (Blueprint $table) {
            $table->boolean('classement_gele')->default(false);
        });

        // 2. Ajouter les contraintes d'intégrité SQL
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE classement_clubs ADD CONSTRAINT chk_points_positifs CHECK (points >= 0)");
            // Index unique partiel pour position > 0 (évite les conflits sur les positions à 0 par défaut)
            DB::statement("CREATE UNIQUE INDEX uq_classement_poule_position ON classement_clubs(poule_id, position) WHERE position > 0");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('poules', function (Blueprint $table) {
            $table->dropColumn('classement_gele');
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE classement_clubs DROP CONSTRAINT IF EXISTS chk_points_positifs");
            DB::statement("DROP INDEX IF EXISTS uq_classement_poule_position");
        }
    }
};
