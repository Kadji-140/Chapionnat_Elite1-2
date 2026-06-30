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
        // 1. Modifications de tables existantes
        Schema::table('matchs', function (Blueprint $table) {
            $table->dateTime('first_half_started_at')->nullable();
            $table->dateTime('second_half_started_at')->nullable();
        });

        Schema::table('clubs', function (Blueprint $table) {
            $table->integer('nb_abonnes')->default(0);
        });

        Schema::table('joueurs', function (Blueprint $table) {
            $table->integer('nb_abonnes')->default(0);
            $table->string('valeur_marchande')->nullable();
        });

        // 2. Création des nouvelles tables
        Schema::create('palmares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->cascadeOnDelete();
            $table->string('titre');
            $table->string('annee');
            $table->timestamps();
        });

        Schema::create('club_statistiques_saison', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->cascadeOnDelete();
            $table->foreignId('saison_id')->constrained('saisons')->cascadeOnDelete();
            $table->jsonb('forme_actuelle')->nullable();
            $table->double('tirs_par_match')->default(0);
            $table->double('tirs_cadres_par_match')->default(0);
            $table->double('passes_reussies_par_match')->default(0);
            $table->integer('cartons_jaunes_total')->default(0);
            $table->integer('cartons_rouges_total')->default(0);
            $table->double('tacles_par_match')->default(0);
            $table->timestamps();

            $table->unique(['club_id', 'saison_id']);
        });

        Schema::create('joueur_statistiques_saison', function (Blueprint $table) {
            $table->id();
            $table->foreignId('joueur_id')->constrained('joueurs')->cascadeOnDelete();
            $table->foreignId('saison_id')->constrained('saisons')->cascadeOnDelete();
            $table->integer('matchs_joues')->default(0);
            $table->integer('titularisations')->default(0);
            $table->integer('minutes_jouees')->default(0);
            $table->integer('buts')->default(0);
            $table->integer('passes_decisives')->default(0);
            $table->integer('tirs')->default(0);
            $table->integer('tirs_cadres')->default(0);
            $table->integer('tacles')->default(0);
            $table->integer('interceptions')->default(0);
            $table->integer('duels_gagnes')->default(0);
            $table->integer('cartons_jaunes')->default(0);
            $table->integer('cartons_rouges')->default(0);
            $table->integer('fautes_commises')->default(0);
            $table->timestamps();

            $table->unique(['joueur_id', 'saison_id']);
        });

        Schema::create('historique_carriere', function (Blueprint $table) {
            $table->id();
            $table->foreignId('joueur_id')->constrained('joueurs')->cascadeOnDelete();
            $table->string('saison'); // ex: "24-25"
            $table->string('club_nom');
            $table->integer('matchs_joues')->default(0);
            $table->integer('buts')->default(0);
            $table->integer('passes')->default(0);
            $table->timestamps();
        });

        Schema::create('favoris_clubs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mobile_user_id')->constrained('mobile_users')->cascadeOnDelete();
            $table->foreignId('club_id')->constrained('clubs')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['mobile_user_id', 'club_id']);
        });

        Schema::create('favoris_joueurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mobile_user_id')->constrained('mobile_users')->cascadeOnDelete();
            $table->foreignId('joueur_id')->constrained('joueurs')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['mobile_user_id', 'joueur_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('favoris_joueurs');
        Schema::dropIfExists('favoris_clubs');
        Schema::dropIfExists('historique_carriere');
        Schema::dropIfExists('joueur_statistiques_saison');
        Schema::dropIfExists('club_statistiques_saison');
        Schema::dropIfExists('palmares');

        Schema::table('joueurs', function (Blueprint $table) {
            $table->dropColumn(['nb_abonnes', 'valeur_marchande']);
        });

        Schema::table('clubs', function (Blueprint $table) {
            $table->dropColumn(['nb_abonnes']);
        });

        Schema::table('matchs', function (Blueprint $table) {
            $table->dropColumn(['first_half_started_at', 'second_half_started_at']);
        });
    }
};
