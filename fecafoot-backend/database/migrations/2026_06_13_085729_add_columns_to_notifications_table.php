<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ajoute les colonnes nécessaires au système de notifications in-app.
     */
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Colonne "lu" (alias de lue pour compatibilité)
            if (!\Schema::hasColumn('notifications', 'lu')) {
                $table->boolean('lu')->default(false)->after('lue');
            }
            // Lien vers la ressource concernée
            if (!\Schema::hasColumn('notifications', 'lien')) {
                $table->string('lien')->nullable()->after('lu');
            }
            // Métadonnées JSON optionnelles
            if (!\Schema::hasColumn('notifications', 'metadata')) {
                $table->json('metadata')->nullable()->after('lien');
            }
        });

        // Étendre l'enum type pour inclure les types de gestion (PostgreSQL uniquement)
        if (\DB::getDriverName() !== 'sqlite') {
            \DB::statement("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
            \DB::statement("ALTER TABLE notifications ALTER COLUMN type TYPE varchar(50)");

            // Ajouter le nouveau check constraint
            \DB::statement("ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
                'but', 'carton', 'fin_match', 'coup_envoi',
                'transfert', 'contestation', 'article', 'systeme',
                'effectif_soumis', 'joueur_valide', 'joueur_rejete',
                'compte_cree', 'mercato', 'alerte', 'signalement_club'
            ))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumnIfExists('lu');
            $table->dropColumnIfExists('lien');
            $table->dropColumnIfExists('metadata');
        });
    }
};
