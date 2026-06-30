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
        if (\DB::getDriverName() !== 'sqlite') {
            \DB::statement("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
            
            \DB::statement("ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
                'but', 'carton', 'fin_match', 'coup_envoi',
                'transfert', 'contestation', 'article', 'systeme',
                'effectif_soumis', 'joueur_valide', 'joueur_rejete',
                'compte_cree', 'mercato', 'alerte',
                'contestation_soumise', 'contestation_traitee', 'match_homologue', 'penalite_appliquee', 'signalement_club',
                'match_demarre', 'match_cloture', 'match_programme', 'match_deprogramme', 'article_rejete', 'article_valide',
                'rapport_soumis', 'match_demarre_retard', 'rappel_match', 'match_non_demarre', 'compo_manquante', 'litige_non_resolu'
            ))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (\DB::getDriverName() !== 'sqlite') {
            \DB::statement("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
            
            \DB::statement("ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
                'but', 'carton', 'fin_match', 'coup_envoi',
                'transfert', 'contestation', 'article', 'systeme',
                'effectif_soumis', 'joueur_valide', 'joueur_rejete',
                'compte_cree', 'mercato', 'alerte',
                'contestation_soumise', 'contestation_traitee', 'match_homologue', 'penalite_appliquee', 'signalement_club',
                'match_demarre', 'match_cloture', 'match_programme', 'match_deprogramme', 'article_rejete', 'article_valide'
            ))");
        }
    }
};
