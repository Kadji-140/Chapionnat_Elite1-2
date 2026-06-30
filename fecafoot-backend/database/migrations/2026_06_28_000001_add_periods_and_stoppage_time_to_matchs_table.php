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
        Schema::table('matchs', function (Blueprint $table) {
            $table->string('periode')->default('1ere_mi_temps');
            $table->integer('temps_additionnel_1er')->default(0);
            $table->integer('temps_additionnel_2e')->default(0);
            $table->integer('temps_additionnel_prolongation_1')->default(0);
            $table->integer('temps_additionnel_prolongation_2')->default(0);
            $table->integer('duree_prolongation')->default(15);
            $table->timestamp('prolongation_started_at')->nullable();
            $table->timestamp('second_half_prolongation_started_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matchs', function (Blueprint $table) {
            $table->dropColumn([
                'periode',
                'temps_additionnel_1er',
                'temps_additionnel_2e',
                'temps_additionnel_prolongation_1',
                'temps_additionnel_prolongation_2',
                'duree_prolongation',
                'prolongation_started_at',
                'second_half_prolongation_started_at'
            ]);
        });
    }
};
