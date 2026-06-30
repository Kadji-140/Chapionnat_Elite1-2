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
        // Drop the check constraint if using PostgreSQL
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE match_events DROP CONSTRAINT IF EXISTS match_events_type_check');
        }

        Schema::table('match_events', function (Blueprint $table) {
            $table->string('type')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('match_events', function (Blueprint $table) {
            // Restore previous constraint by reverting to enum
            $table->enum('type', [
                'but',
                'but_csc',
                'penalty_marque',
                'penalty_rate',
                'carton_jaune',
                'carton_rouge',
                'carton_jaune_rouge',
                'remplacement',
                'incident',
                'temps_additionnel',
                'debut_match',
                'mi_temps',
                'reprise',
                'fin_match',
                'debut_prolongation',
                'fin_prolongation',
                'tab'
            ])->change();
        });
    }
};
