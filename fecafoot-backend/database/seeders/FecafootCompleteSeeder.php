<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

/**
 * FecafootCompleteSeeder
 * ======================
 * Seeder unique et complet pour la plateforme FECAFOOT Elite
 * 
 * Contenu :
 * - 4 saisons (2022-2023 à 2025-2026)
 * - 16 clubs Elite One + 16 clubs Elite Two
 * - 20 joueurs par club
 * - Matchs historiques et en cours
 * - Compositions et officiels
 * - Classements réels des saisons passées
 * - Statistiques joueurs détaillées
 * - Transferts, articles, palmarès
 * - Données pour l'application mobile
 */
class FecafootCompleteSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 Démarrage du seeder FECAFOOT complet...');

        DB::statement("SET session_replication_role = 'replica'");
        $this->truncateTables();
        $this->command->info('✅ Tables vidées.');

        // ─── MODULE 0 : AUTH ────────────────────────────────────────────────
        $adminId = $this->seedAdmins();
        $this->command->info('✅ Admins créés.');

        // ─── MODULE 1 : CLUBS & UTILISATEURS ────────────────────────────────
        [$clubIds, $responsableIds, $coachIds] = $this->seedClubsAndUsers();
        $this->command->info('✅ Clubs, responsables et coachs créés.');

        [$commissaireIds, $journalisteIds] = $this->seedOtherUsers();
        $this->command->info('✅ Commissaires et journalistes créés.');

        $arbitreIds = $this->seedArbitres();
        $this->command->info('✅ Arbitres créés.');

        // ─── MODULE 2 : SAISONS & COMPÉTITIONS ──────────────────────────────
        [$saisonIds, $compIds, $phaseIds, $pouleIds] = $this->seedSaisonsAndCompetitions($clubIds);
        $this->command->info('✅ Saisons, compétitions, phases, poules créées.');

        // ─── MODULE 3 : MATCHS ───────────────────────────────────────────────
        $matchIds = $this->seedMatchs($compIds, $phaseIds, $pouleIds, $clubIds, $commissaireIds, $arbitreIds);
        $this->command->info('✅ Matchs créés.');

        // ─── MODULE 4 : ÉVÉNEMENTS & COMPOSITIONS ───────────────────────────
        $this->seedMatchEvents($matchIds, $clubIds, $commissaireIds);
        $this->seedCompositions($matchIds);
        $this->command->info('✅ Événements et compositions créés.');

        // ─── MODULE 5 : CLASSEMENTS & STATS ──────────────────────────────────
        $this->seedClassements($pouleIds, $clubIds, $saisonIds);
        $this->seedStatJoueurs($compIds, $clubIds);
        $this->seedMobileStats($clubIds, $saisonIds);
        $this->seedPalmares($clubIds);
        $this->command->info('✅ Classements, stats et palmarès créés.');

        // ─── MODULE 6 : TRANSFERTS ───────────────────────────────────────────
        $this->seedTransferts($clubIds, $saisonIds, $adminId);
        $this->command->info('✅ Transferts créés.');

        // ─── MODULE 7 : ARTICLES ─────────────────────────────────────────────
        $this->seedArticles($journalisteIds, $adminId);
        $this->command->info('✅ Articles créés.');

        // ─── MODULE 8 : TALENT SCORES ────────────────────────────────────────
        $this->seedTalentScores($clubIds, $saisonIds);
        $this->command->info('✅ Talent Scores créés.');

        DB::statement("SET session_replication_role = 'origin'");

        $this->command->info('');
        $this->command->info('🎉 Seeder FECAFOOT complet terminé !');
        $this->command->info('');
        $this->command->info('📧 COMPTES DE CONNEXION (Mot de passe : password)');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('   👑 Admin        : admin@fecafoot.cm');
        $this->command->info('   🫡 Commissaire  : commissaire1@fecafoot.cm');
        $this->command->info('   📝 Journaliste  : journaliste1@fecafoot.cm');
        $this->command->info('   🏆 Responsable  : resp.canon@fecafoot.cm');
        $this->command->info('   🧑‍🏫 Coach        : coach.canon@fecafoot.cm');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('📊 STATISTIQUES :');
        $this->command->info('   ├─ Clubs Elite One  : 16');
        $this->command->info('   ├─ Clubs Elite Two  : 16');
        $this->command->info('   ├─ Joueurs         : ' . (32 * 20) . ' (20 par club)');
        $this->command->info('   ├─ Matchs          : ' . count($matchIds));
        $this->command->info('   └─ Saisons         : 4 (2022-2023 à 2025-2026)');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // =========================================================================
    // TRUNCATE
    // =========================================================================
    private function truncateTables(): void
    {
        $tables = [
            'audit_logs', 'votes', 'notifications', 'commentaires',
            'talent_scores', 'mobile_users', 'prediction_matchs',
            'articles', 'transferts', 'penalites', 'stat_joueurs',
            'feuilles_de_match', 'classement_clubs', 'contestations',
            'match_events', 'composition_joueurs', 'compositions',
            'matchs', 'joueurs', 'poule_club',
            'poules', 'phases', 'regles_competition', 'competitions',
            'saisons', 'arbitres', 'stades',
            'users', 'clubs',
            'historique_carriere', 'joueur_statistiques_saison',
            'club_statistiques_saison', 'palmares',
            'favoris_clubs', 'favoris_joueurs',
        ];
        foreach ($tables as $table) {
            try {
                DB::statement("TRUNCATE TABLE \"{$table}\" RESTART IDENTITY CASCADE");
            } catch (\Exception $e) {
                // table inexistante
            }
        }
    }

    // =========================================================================
    // MODULE 0 – Admins
    // =========================================================================
    private function seedAdmins(): int
    {
        $id = DB::table('users')->insertGetId([
            'nom'                => 'NGONO',
            'prenom'             => 'Pierre',
            'email'              => 'admin@fecafoot.cm',
            'password'           => Hash::make('password'),
            'role'               => 'admin',
            'peut_creer_admin'   => true,
            'acces_actif'        => true,
            'premiere_connexion' => false,
            'email_verified_at'  => now(),
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        DB::table('users')->insert([
            'nom'                => 'MBARGA',
            'prenom'             => 'Samuel',
            'email'              => 'admin2@fecafoot.cm',
            'password'           => Hash::make('password'),
            'role'               => 'admin',
            'peut_creer_admin'   => false,
            'acces_actif'        => true,
            'premiere_connexion' => false,
            'email_verified_at'  => now(),
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        return $id;
    }

    // =========================================================================
    // MODULE 1 – Clubs & Utilisateurs
    // =========================================================================
    private function seedClubsAndUsers(): array
    {
        // ── CLUBS ELITE ONE (16 clubs) ──────────────────────────────────────
        $eliteOneClubs = [
            ['Canon Sportif de Yaoundé',        'Yaoundé',    'Stade Omnisports Ahmadou Ahidjo', 'Narcisse Mouelle Kombi',  'Vert et Rouge',  1930, 'canon'],
            ['Coton Sport de Garoua',            'Garoua',     'Stade Roumdé Adjia',              'Hajiya Ramatu Bako',      'Jaune et Noir',  1986, 'coton'],
            ['Colombe Sportive du Dja et Lobo', 'Sangmélima', 'Stade Municipal de Sangmélima',   'Richard Towa',            'Bleu et Blanc',  1978, 'colombe'],
            ['Panthère Sportive du Ndé',         'Bangangté',  'Stade Municipal de Bangangté',    'Richard Feudjio',         'Jaune et Vert',  1972, 'panthere'],
            ['Tonnerre Kalara Club de Yaoundé', 'Yaoundé',    'Stade Omnisports Ahmadou Ahidjo', 'Christian Tagne',         'Jaune et Noir',  1934, 'tonnerre'],
            ['Dynamo de Douala',                 'Douala',     'Stade de la Réunification',       'Jules Minka',             'Rouge et Bleu',  1952, 'dynamo'],
            ['Gazelle FA de Garoua',             'Garoua',     'Stade Roumdé Adjia',              'Adoum Garoua',            'Or et Noir',     1999, 'gazelle'],
            ['Stade Renard de Melong',           'Melong',     'Stade Municipal de Melong',       'Hervé Noupeu',            'Vert et Blanc',  1998, 'renard'],
            ['Eding Sport de la Lékié',          'Sa\'a',      'Stade Municipal de Sa\'a',        'Jean Paul Mfou',          'Orange et Blanc',1994, 'eding'],
            ['Feutcheu FC',                      'Bafoussam',  'Stade Municipal de Bafoussam',    'Fokunang Willy',          'Bleu et Blanc',  1935, 'feutcheu'],
            ['Fauve Azur Elite',                 'Douala',     'Stade de la Réunification',       'Jean Paul Messina',       'Bleu Ciel',      2010, 'fauve'],
            ['Aigle Royal de la Menoua',         'Dschang',    'Stade Municipal de Dschang',      'Zacharie Perevet',        'Bleu et Jaune',  1990, 'aigle'],
            ['Unisport de Bafang',               'Bafang',     'Stade Municipal Gaston Ngadjui',  'Emmanuel Tonye Bakot',    'Vert et Blanc',  1988, 'unisport'],
            ['Victoria United FC',               'Limbé',      'Stade Municipal de Limbé',        'Valentin Nkwain',         'Rouge et Blanc', 2002, 'victoria'],
            ['PWD de Bamenda',                   'Bamenda',    'Stade Municipal de Bamenda',      'Forka Lehnjo Henry',      'Vert et Blanc',  1959, 'pwd'],
            ['Les Astres FC de Douala',          'Douala',     'Stade Lépold Moumé Etia',         'Stéphane Bitchong',       'Jaune et Bleu',  1969, 'astres'],
        ];

        // ── CLUBS ELITE TWO (16 clubs) ──────────────────────────────────────
        $eliteTwoClubs = [
            ['APEJES de Mfou',               'Mfou',         'Stade de Mfou',                    'Paul Mfou',              'Vert et Noir',  2003, 'apejes'],
            ['Fovu Club de Baham',           'Baham',        'Stade Municipal de Baham',          'Christophe Djeumfa',     'Vert et Blanc', 1968, 'fovu'],
            ['UMS de Loum',                  'Loum',         'Stade Municipal de Loum',           'Mbida Mbida',            'Bleu et Blanc', 1985, 'ums'],
            ['Racing Club de Bafoussam',     'Bafoussam',    'Stade Municipal de Bafoussam',      'Martin Kamto',           'Bleu et Rouge', 1958, 'racing'],
            ['Dragon FC de Yaoundé',         'Yaoundé',      'Stade Municipal de Yaoundé',        'Henri Awono',            'Or et Noir',    1992, 'dragon'],
            ['Renaissance de Ngoumou',       'Ngoumou',      'Stade Municipal de Ngoumou',        'Pascal Onana',           'Rouge et Blanc',2003, 'renaissance'],
            ['Atlantic FC de Kribi',         'Kribi',        'Stade Municipal de Kribi',          'Simon Meka',             'Bleu et Blanc', 2001, 'atlantic'],
            ['Avion Academy du Nkam',        'Nkam',         'Stade Municipal du Nkam',           'Charles Atangana',       'Orange et Noir',2010, 'avion'],
            ['Unisport FC de Bafang',        'Bafang',       'Stade Municipal de Bafang',         'Cyrille Kagmeni',        'Vert et Blanc', 1995, 'unisport2'],
            ['Aigle Moungo',                 'Nkongsamba',   'Stade Municipal de Nkongsamba',     'Thomas Defo',            'Rouge et Blanc',1996, 'aigle2'],
            ['Djiko FC',                     'Bafoussam',    'Stade Municipal de Bafoussam',      'André Djoumessi',        'Sable et Noir', 2005, 'djiko'],
            ['TKC de Yaoundé',               'Yaoundé',      'Stade Municipal de Yaoundé',        'Bertrand Ndi',           'Vert et Blanc', 2008, 'tkc'],
            ['AS FAP de Yaoundé',            'Yaoundé',      'Stade Omnisports Ahmadou Ahidjo',   'Eric Zé',               'Bleu et Blanc', 1998, 'asfap'],
            ['Fortuna FC de Mfou',           'Mfou',         'Stade de Mfou',                    'Claude Tsimi',           'Bleu et Blanc', 2009, 'fortuna'],
            ['Yde Foot',                     'Yaoundé',      'Stade Municipal de Yaoundé',        'Marcel Yemdji',          'Bleu et Jaune', 2007, 'yde'],
            ['Ngok Etunja',                  'Nkam',         'Stade Municipal du Nkam',           'Sylvain Nkam',           'Jaune et Noir', 2000, 'ngok'],
        ];

        $clubIds        = ['elite_one' => [], 'elite_two' => []];
        $responsableIds = [];
        $coachIds       = [];

        // ─── ELITE ONE ────────────────────────────────────────────────────────
        foreach ($eliteOneClubs as $idx => [$nom, $ville, $stade, $president, $couleurs, $annee, $slug]) {
            $clubId = DB::table('clubs')->insertGetId([
                'nom'               => $nom,
                'ville'             => $ville,
                'division'          => 'elite_one',
                'stade'             => $stade,
                'president'         => $president,
                'couleurs'          => $couleurs,
                'annee_creation'    => $annee,
                'site_web'          => 'https://' . $slug . '.club.cm',
                'telephone'         => '+237 6' . rand(50000000, 99999999),
                'presentation'      => $this->getClubPresentation($nom),
                'nb_abonnes'        => rand(1000, 25000),
                'profile_completed' => true,
                'est_actif'         => true,
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);
            $clubIds['elite_one'][] = $clubId;

            // Responsable
            $respId = DB::table('users')->insertGetId([
                'nom'                => strtoupper(explode(' ', $nom)[0]),
                'prenom'             => 'Responsable',
                'email'              => "resp.{$slug}@fecafoot.cm",
                'password'           => Hash::make('password'),
                'role'               => 'responsable_club',
                'club_id'            => $clubId,
                'acces_actif'        => true,
                'premiere_connexion' => false,
                'email_verified_at'  => now(),
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
            $responsableIds[] = $respId;
            DB::table('clubs')->where('id', $clubId)->update(['responsable_id' => $respId]);

            // Coach
            $coachId = DB::table('users')->insertGetId([
                'nom'                => strtoupper(explode(' ', $nom)[0]),
                'prenom'             => 'Coach',
                'email'              => "coach.{$slug}@fecafoot.cm",
                'password'           => Hash::make('password'),
                'role'               => 'coach',
                'club_id'            => $clubId,
                'acces_actif'        => true,
                'premiere_connexion' => false,
                'email_verified_at'  => now(),
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
            $coachIds[] = $coachId;

            $this->seedJoueurs($clubId, 'elite_one', $idx);
        }

        // ─── ELITE TWO ────────────────────────────────────────────────────────
        foreach ($eliteTwoClubs as $idx => [$nom, $ville, $stade, $president, $couleurs, $annee, $slug]) {
            $clubId = DB::table('clubs')->insertGetId([
                'nom'               => $nom,
                'ville'             => $ville,
                'division'          => 'elite_two',
                'stade'             => $stade,
                'president'         => $president,
                'couleurs'          => $couleurs,
                'annee_creation'    => $annee,
                'site_web'          => 'https://' . $slug . '.club.cm',
                'telephone'         => '+237 6' . rand(50000000, 99999999),
                'presentation'      => $this->getClubPresentation($nom),
                'nb_abonnes'        => rand(200, 8000),
                'profile_completed' => true,
                'est_actif'         => true,
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);
            $clubIds['elite_two'][] = $clubId;

            $respId = DB::table('users')->insertGetId([
                'nom'                => strtoupper(explode(' ', $nom)[0]),
                'prenom'             => 'Responsable',
                'email'              => "resp.{$slug}@fecafoot.cm",
                'password'           => Hash::make('password'),
                'role'               => 'responsable_club',
                'club_id'            => $clubId,
                'acces_actif'        => true,
                'premiere_connexion' => false,
                'email_verified_at'  => now(),
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
            $responsableIds[] = $respId;
            DB::table('clubs')->where('id', $clubId)->update(['responsable_id' => $respId]);

            $coachId = DB::table('users')->insertGetId([
                'nom'                => strtoupper(explode(' ', $nom)[0]),
                'prenom'             => 'Coach',
                'email'              => "coach.{$slug}@fecafoot.cm",
                'password'           => Hash::make('password'),
                'role'               => 'coach',
                'club_id'            => $clubId,
                'acces_actif'        => true,
                'premiere_connexion' => false,
                'email_verified_at'  => now(),
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
            $coachIds[] = $coachId;

            $this->seedJoueurs($clubId, 'elite_two', $idx + 100);
        }

        return [$clubIds, $responsableIds, $coachIds];
    }

    private function getClubPresentation(string $nom): string
    {
        $presentations = [
            'Canon Sportif de Yaoundé' => 'Le Canon Sportif de Yaoundé est un club mythique du football camerounais. Fondé en 1930, il a marqué l\'histoire du football national avec de nombreux titres.',
            'Coton Sport de Garoua' => 'Le Coton Sport de Garoua est le club le plus titré du Cameroun. Fondé en 1986, il domine le football national avec 18 titres de champion.',
            'Colombe Sportive du Dja et Lobo' => 'Club basé à Sangmélima, la Colombe Sportive a connu un essor remarquable ces dernières années.',
            'Panthère Sportive du Ndé' => 'Fondée en 1972 à Bangangté, la Panthère est un club historique du football camerounais.',
            'Dynamo de Douala' => 'Fondé en 1952, la Dynamo de Douala est l\'un des clubs les plus anciens du Cameroun.',
            'Fovu Club de Baham' => 'Club historique de Baham, le Fovu Club évolue en Elite Two et est connu pour sa formation de jeunes talents.',
        ];
        return $presentations[$nom] ?? $nom . ' est un club camerounais de football. Rejoignez-nous pour soutenir notre équipe !';
    }

    // =========================================================================
    // Joueurs
    // =========================================================================
    private function seedJoueurs(int $clubId, string $division, int $seed): void
    {
        $noms = [
            'ABEGA', 'ATEBA', 'BILONG', 'BOYOMO', 'ETOUNDI', 'FOMEKONG', 'HAMIDOU',
            'KAMTO', 'LOGA', 'MBARGA', 'MBIA', 'NKANA', 'NNANGA', 'ONANA',
            'OWONO', 'PASCAL', 'SIYAM', 'TCHAMBA', 'TOKO', 'ZOBO',
        ];
        $prenoms = [
            'Alain', 'Boris', 'Christian', 'David', 'Elvis', 'Franck', 'Georges',
            'Henri', 'Ibrahim', 'Jean', 'Kevin', 'Laurent', 'Marc', 'Nicolas',
            'Olivier', 'Patrick', 'Raoul', 'Sébastien', 'Thomas', 'Yannick',
        ];
        $postes = [
            'gardien', 'gardien', 'defenseur_central', 'defenseur_central',
            'lateral_droit', 'lateral_gauche', 'milieu_defensif', 'milieu_defensif',
            'milieu_central', 'milieu_central', 'milieu_offensif', 'ailier_droit',
            'ailier_gauche', 'attaquant_centre', 'avant_centre', 'defenseur_central',
            'lateral_droit', 'milieu_central', 'ailier_droit', 'attaquant_centre',
        ];
        $nationalites = [
            'Camerounais', 'Camerounais', 'Camerounais', 'Camerounais',
            'Camerounais', 'Camerounais', 'Ivoirien', 'Sénégalais',
        ];
        $valeurs = ['50k €', '100k €', '150k €', '250k €', '400k €', '600k €', '800k €'];

        for ($j = 0; $j < 20; $j++) {
            $nom    = $noms[($seed + $j) % count($noms)];
            $prenom = $prenoms[($seed + $j * 3) % count($prenoms)];
            $poste  = $postes[$j];
            $nat    = $nationalites[($seed + $j) % count($nationalites)];
            $annee  = rand(1992, 2004);
            $mois   = rand(1, 12);
            $jour   = rand(1, 28);

            $prefixe    = $division === 'elite_one' ? 'E1' : 'E2';
            $numLicence = "{$prefixe}-{$clubId}-" . str_pad($j + 1, 3, '0', STR_PAD_LEFT);

            DB::table('joueurs')->insert([
                'club_id'           => $clubId,
                'nom'               => $nom . ($j > 0 ? " {$j}" : ''),
                'prenom'            => $prenom,
                'date_naissance'    => "{$annee}-" . str_pad($mois, 2, '0', STR_PAD_LEFT) . '-' . str_pad($jour, 2, '0', STR_PAD_LEFT),
                'nationalite'       => $nat,
                'num_licence'       => $numLicence,
                'poste'             => $poste,
                'num_maillot'       => $j + 1,
                'taille_cm'         => rand(170, 195),
                'poids_kg'          => rand(65, 90),
                'nb_abonnes'        => rand(50, 3000),
                'valeur_marchande'  => $valeurs[rand(0, count($valeurs) - 1)],
                'statut'            => 'actif',
                'statut_validation' => 'valide',
                'est_soumis'        => true,
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);
        }
    }

    // =========================================================================
    // Commissaires & Journalistes
    // =========================================================================
    private function seedOtherUsers(): array
    {
        $commissaires = [
            ['ESSOMBA', 'Robert',    'commissaire1@fecafoot.cm'],
            ['FOUDA',   'Maurice',   'commissaire2@fecafoot.cm'],
            ['BELLO',   'Adamou',    'commissaire3@fecafoot.cm'],
            ['KENGNE',  'Théophile', 'commissaire4@fecafoot.cm'],
            ['NSEKE',   'Guy',       'commissaire5@fecafoot.cm'],
        ];
        $journalistes = [
            ['NTOUMBA', 'Claude',  'journaliste1@fecafoot.cm'],
            ['ABENA',   'Marie',   'journaliste2@fecafoot.cm'],
            ['SOBZE',   'Patrick', 'journaliste3@fecafoot.cm'],
        ];

        $cIds = [];
        foreach ($commissaires as [$nom, $prenom, $email]) {
            $cIds[] = DB::table('users')->insertGetId([
                'nom'                => $nom,
                'prenom'             => $prenom,
                'email'              => $email,
                'password'           => Hash::make('password'),
                'role'               => 'commissaire',
                'acces_actif'        => true,
                'premiere_connexion' => false,
                'email_verified_at'  => now(),
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
        }

        $jIds = [];
        foreach ($journalistes as [$nom, $prenom, $email]) {
            $jIds[] = DB::table('users')->insertGetId([
                'nom'                => $nom,
                'prenom'             => $prenom,
                'email'              => $email,
                'password'           => Hash::make('password'),
                'role'               => 'journaliste',
                'acces_actif'        => true,
                'premiere_connexion' => false,
                'email_verified_at'  => now(),
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
        }

        return [$cIds, $jIds];
    }

    // =========================================================================
    // Arbitres
    // =========================================================================
    private function seedArbitres(): array
    {
        $arbitres = [
            ['ZAMBO',    'Martin',    'ARB-C-001', 'central',   'Centre',    'Yaoundé'],
            ['MFOU',     'Jean',      'ARB-C-002', 'central',   'Littoral',  'Douala'],
            ['GUIWA',    'Théodore',  'ARB-C-003', 'central',   'Ouest',     'Bafoussam'],
            ['ATEBA',    'Cédric',    'ARB-C-004', 'central',   'Nord',      'Garoua'],
            ['SIMO',     'Alexis',    'ARB-C-005', 'central',   'Centre',    'Yaoundé'],
            ['TCHOUATE', 'René',      'ARB-C-006', 'central',   'Littoral',  'Douala'],
            ['NKOA',     'Herbert',   'ARB-C-007', 'central',   'Sud-Ouest', 'Buea'],
            ['DJOUM',    'Francis',   'ARB-C-008', 'central',   'Adamaoua',  'Ngaoundéré'],
            ['BIYA',     'Pierre',    'ARB-A-001', 'assistant', 'Centre',    'Yaoundé'],
            ['NLEND',    'Léa',       'ARB-A-002', 'assistant', 'Littoral',  'Douala'],
            ['FOUDA',    'Sylvestre', 'ARB-A-003', 'assistant', 'Ouest',     'Bafoussam'],
            ['MVENG',    'Sébastien', 'ARB-A-004', 'assistant', 'Nord',      'Garoua'],
            ['EKOA',     'Martine',   'ARB-A-005', 'assistant', 'Centre',    'Yaoundé'],
            ['NDOUM',    'Paul',      'ARB-A-006', 'assistant', 'Littoral',  'Douala'],
            ['TABI',     'Clément',   'ARB-A-007', 'assistant', 'Ouest',     'Bafoussam'],
            ['BELE',     'Antoine',   'ARB-A-008', 'assistant', 'Sud',       'Ebolowa'],
            ['MANGA',    'Dieudonné', 'ARB-Q-001', 'quatrieme', 'Centre',    'Yaoundé'],
            ['KOUM',     'Bertrand',  'ARB-Q-002', 'quatrieme', 'Littoral',  'Douala'],
            ['NDZIE',    'Roméo',     'ARB-Q-003', 'quatrieme', 'Ouest',     'Bafoussam'],
            ['MANG',     'Arnaud',    'ARB-Q-004', 'quatrieme', 'Est',       'Bertoua'],
        ];

        $ids = [];
        foreach ($arbitres as [$nom, $prenom, $licence, $spec, $region, $ville]) {
            $ids[] = DB::table('arbitres')->insertGetId([
                'nom'           => $nom,
                'prenom'        => $prenom,
                'num_licence'   => $licence,
                'specification' => $spec,
                'region'        => $region,
                'villes'        => $ville,
                'disponible'    => true,
                'actif'         => true,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }
        return $ids;
    }

    // =========================================================================
    // MODULE 2 – Saisons & Compétitions
    // =========================================================================
    private function seedSaisonsAndCompetitions(array $clubIds): array
    {
        // ── SAISON 2022-2023 (terminée) ─────────────────────────────────────
        $saison1Id = DB::table('saisons')->insertGetId([
            'intitule'   => '2022-2023',
            'date_debut' => '2022-10-15',
            'date_fin'   => '2023-05-21',
            'statut'     => 'terminee',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── SAISON 2023-2024 (terminée) ─────────────────────────────────────
        $saison2Id = DB::table('saisons')->insertGetId([
            'intitule'         => '2023-2024',
            'date_debut'       => '2023-09-27',
            'date_fin'         => '2024-04-29',
            'statut'           => 'terminee',
            'clonee_depuis_id' => $saison1Id,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // ── SAISON 2024-2025 (terminée) ─────────────────────────────────────
        $saison3Id = DB::table('saisons')->insertGetId([
            'intitule'         => '2024-2025',
            'date_debut'       => '2024-09-01',
            'date_fin'         => '2025-07-07',
            'statut'           => 'terminee',
            'clonee_depuis_id' => $saison2Id,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // ── SAISON 2025-2026 (EN COURS) ─────────────────────────────────────
        $saison4Id = DB::table('saisons')->insertGetId([
            'intitule'         => '2025-2026',
            'date_debut'       => '2026-01-24',
            'date_fin'         => '2026-07-30',
            'statut'           => 'en_cours',
            'clonee_depuis_id' => $saison3Id,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $saisonIds = [$saison1Id, $saison2Id, $saison3Id, $saison4Id];
        $compIds   = [];
        $phaseIds  = [];
        $pouleIds  = [];

        // ── Compétitions ──────────────────────────────────────────────────────
        // Saison 2022-2023 Elite One
        $e1_2223 = array_map(fn($i) => $clubIds['elite_one'][$i], [0,1,2,3,4,5,6,7,8,9,10,11,13,14,15]);
        [$cId, $phasIds, $pouIds] = $this->createCompetition(
            $saison1Id, 'elite_one', 'MTN Elite One 2022-2023', 'terminee', $e1_2223
        );
        $compIds[] = $cId; $phaseIds[] = $phasIds; $pouleIds[] = $pouIds;

        // Saison 2023-2024 Elite One
        $e1_2324 = array_map(fn($i) => $clubIds['elite_one'][$i], [0,1,2,3,4,5,6,7,8,9,13,14,15]);
        [$cId, $phasIds, $pouIds] = $this->createCompetition(
            $saison2Id, 'elite_one', 'MTN Elite One 2023-2024', 'terminee', $e1_2324
        );
        $compIds[] = $cId; $phaseIds[] = $phasIds; $pouleIds[] = $pouIds;

        // Saison 2024-2025 Elite One
        $e1_2425 = array_map(fn($i) => $clubIds['elite_one'][$i], [0,1,2,3,4,5,6,7,8,9,10,11,13,14]);
        [$cId, $phasIds, $pouIds] = $this->createCompetition(
            $saison3Id, 'elite_one', 'MTN Elite One 2024-2025', 'terminee', $e1_2425
        );
        $compIds[] = $cId; $phaseIds[] = $phasIds; $pouleIds[] = $pouIds;

        // Saison 2024-2025 Elite Two
        $e2_2425 = array_map(fn($i) => $clubIds['elite_two'][$i], range(0, 15));
        [$cId, $phasIds, $pouIds] = $this->createCompetition(
            $saison3Id, 'elite_two', 'MTN Elite Two 2024-2025', 'terminee', $e2_2425
        );
        $compIds[] = $cId; $phaseIds[] = $phasIds; $pouleIds[] = $pouIds;

        // Saison 2025-2026 Elite One (EN COURS)
        $e1_2526 = array_map(fn($i) => $clubIds['elite_one'][$i], [0,1,2,3,4,5,6,7,8,9,10,11,12,13]);
        [$cId, $phasIds, $pouIds] = $this->createCompetition(
            $saison4Id, 'elite_one', 'MTN Elite One 2025-2026', 'en_cours', $e1_2526
        );
        $compIds[] = $cId; $phaseIds[] = $phasIds; $pouleIds[] = $pouIds;

        // Saison 2025-2026 Elite Two (EN COURS)
        $e2_2526 = array_map(fn($i) => $clubIds['elite_two'][$i], range(0, 15));
        [$cId, $phasIds, $pouIds] = $this->createCompetition(
            $saison4Id, 'elite_two', 'MTN Elite Two 2025-2026', 'en_cours', $e2_2526
        );
        $compIds[] = $cId; $phaseIds[] = $phasIds; $pouleIds[] = $pouIds;

        return [$saisonIds, $compIds, $phaseIds, $pouleIds];
    }

    private function createCompetition(int $saisonId, string $niveau, string $nom, string $statut, array $clubsIds): array
    {
        $competitionId = DB::table('competitions')->insertGetId([
            'saison_id'  => $saisonId,
            'niveau'     => $niveau,
            'nom'        => $nom,
            'statut'     => $statut,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('regles_competition')->insert([
            'competition_id'          => $competitionId,
            'nb_clubs'                => count($clubsIds),
            'format'                  => 'poule_unique',
            'nb_poules'               => 1,
            'nb_matchs_par_club'      => (count($clubsIds) - 1) * 2,
            'a_playoffs'              => false,
            'a_barrage'               => false,
            'nb_promus_directs'       => ($niveau === 'elite_two') ? 2 : 0,
            'nb_relegues_directs'     => 2,
            'criteres_egalite'        => json_encode(['points', 'confrontations_directes', 'diff_buts', 'buts_marques', 'fair_play']),
            'points_victoire'         => 3,
            'points_nul'              => 1,
            'points_defaite'          => 0,
            'score_forfait_vainqueur' => 3,
            'score_forfait_perdant'   => 0,
            'points_penalite_forfait' => 1,
            'created_at'              => now(),
            'updated_at'              => now(),
        ]);

        $phaseStatut = ($statut === 'terminee') ? 'terminee' : 'en_cours';
        $phaseId = DB::table('phases')->insertGetId([
            'competition_id' => $competitionId,
            'nom'            => 'Phase Régulière',
            'type'           => 'reguliere',
            'ordre'          => 1,
            'date_debut'     => ($statut === 'terminee') ? '2023-09-15' : '2026-01-24',
            'date_fin'       => ($statut === 'terminee') ? '2024-05-30' : '2026-07-30',
            'statut'         => $phaseStatut,
            'est_terminee'   => ($statut === 'terminee'),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $pouleId = DB::table('poules')->insertGetId([
            'phase_id'        => $phaseId,
            'nom'             => 'Poule Unique',
            'nb_equipes'      => count($clubsIds),
            'classement_gele' => ($statut === 'terminee'),
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        foreach ($clubsIds as $k => $clubId) {
            DB::table('poule_club')->insert([
                'poule_id'         => $pouleId,
                'club_id'          => $clubId,
                'saison_id'        => $saisonId,
                'ordre_tirage'     => $k + 1,
                'date_affectation' => now()->toDateString(),
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);
        }

        return [$competitionId, [$phaseId], [$pouleId]];
    }

    // =========================================================================
    // MODULE 3 – Matchs
    // =========================================================================
    private function seedMatchs(
        array $compIds, array $phaseIds, array $pouleIds,
        array $clubIds, array $commissaireIds, array $arbitreIds
    ): array {
        $matchIds = [];
        $stades = [
            'Stade Omnisports Ahmadou Ahidjo',
            'Stade de la Réunification',
            'Stade Roumdé Adjia',
            'Stade Municipal de Bafoussam',
        ];

        // ── Matchs historiques ──────────────────────────────────────────────
        // Saison 2022-2023
        $this->seedMatchsHistoriques(
            $compIds[0], $phaseIds[0][0], $pouleIds[0][0],
            array_map(fn($i) => $clubIds['elite_one'][$i], [0,1,2,3,4,5,6,7,8,9,10,11,13,14,15]),
            $commissaireIds, $arbitreIds, $stades,
            '2022-10-15', $matchIds
        );

        // Saison 2023-2024
        $this->seedMatchsHistoriques(
            $compIds[1], $phaseIds[1][0], $pouleIds[1][0],
            array_map(fn($i) => $clubIds['elite_one'][$i], [0,1,2,3,4,5,6,7,8,9,13,14,15]),
            $commissaireIds, $arbitreIds, $stades,
            '2023-09-27', $matchIds
        );

        // Saison 2024-2025
        $this->seedMatchsHistoriques(
            $compIds[2], $phaseIds[2][0], $pouleIds[2][0],
            array_map(fn($i) => $clubIds['elite_one'][$i], [0,1,2,3,4,5,6,7,8,9,10,11,13,14]),
            $commissaireIds, $arbitreIds, $stades,
            '2024-09-15', $matchIds
        );

        // ── SAISON EN COURS 2025-2026 ───────────────────────────────────────
        $compE1Id  = $compIds[4];
        $phaseE1Id = $phaseIds[4][0];
        $pouleE1Id = $pouleIds[4][0];
        $e1Clubs   = array_map(fn($i) => $clubIds['elite_one'][$i], [0,1,2,3,4,5,6,7,8,9,10,11,12,13]);

        // Journées 1-8 terminées
        $classementE1 = [0,1,2,3,4,5,6,7,8,9,10,11,12,13];
        for ($journee = 1; $journee <= 8; $journee++) {
            $paires = $this->getPaires($e1Clubs, $journee);
            foreach ($paires as $k => [$dom, $ext]) {
                $idxDom = array_search($dom, $e1Clubs);
                $idxExt = array_search($ext, $e1Clubs);
                $scoreDom = max(0, 2 - abs($idxDom - $idxExt) % 3);
                $scoreExt = rand(0, 1);
                if ($idxDom < 4) { $scoreDom += 1; }
                if ($idxExt < 4 && rand(0, 1) === 0) { $scoreExt += 1; }
                
                $dateHeure = Carbon::parse('2026-01-24')->addWeeks($journee - 1)->setHour(15);
                $matchIds[] = $this->insertMatch([
                    'competition_id'           => $compE1Id,
                    'phase_id'                 => $phaseE1Id,
                    'poule_id'                 => $pouleE1Id,
                    'journee'                  => $journee,
                    'type'                     => 'regulier',
                    'club_domicile_id'         => $dom,
                    'club_exterieur_id'        => $ext,
                    'commissaire_id'           => $commissaireIds[$k % count($commissaireIds)],
                    'arbitre_principal_id'     => $arbitreIds[$k % 8],
                    'arbitre_assistant_1_id'   => $arbitreIds[8 + ($k % 8)],
                    'arbitre_assistant_2_id'   => $arbitreIds[9 + ($k % 7)],
                    'quatrieme_arbitre_id'     => $arbitreIds[16 + ($k % 4)],
                    'date_heure'               => $dateHeure,
                    'stade'                    => $stades[$k % count($stades)],
                    'score_domicile_terrain'   => $scoreDom,
                    'score_exterieur_terrain'  => $scoreExt,
                    'score_domicile_officiel'  => $scoreDom,
                    'score_exterieur_officiel' => $scoreExt,
                    'statut'                   => 'homologue',
                    'est_homologue'            => true,
                    'date_homologation'        => $dateHeure->copy()->addDays(2),
                ]);
            }
        }

        // ── JOURNÉE 9 : MATCHS D'AUJOURD'HUI ──────────────────────────────
        $paires9 = $this->getPaires($e1Clubs, 9);
        $today = Carbon::now()->setHour(0)->setMinute(0)->setSecond(0);

        // Match en cours (Canon vs Coton) - LE CHOC
        $matchIds[] = $this->insertMatch([
            'competition_id'          => $compE1Id,
            'phase_id'                => $phaseE1Id,
            'poule_id'                => $pouleE1Id,
            'journee'                 => 9,
            'type'                    => 'regulier',
            'club_domicile_id'        => $e1Clubs[0], // Canon
            'club_exterieur_id'       => $e1Clubs[1], // Coton
            'commissaire_id'          => $commissaireIds[0],
            'arbitre_principal_id'    => $arbitreIds[0],
            'arbitre_assistant_1_id'  => $arbitreIds[8],
            'arbitre_assistant_2_id'  => $arbitreIds[9],
            'quatrieme_arbitre_id'    => $arbitreIds[16],
            'date_heure'              => $today->copy()->setHour(15)->setMinute(0),
            'stade'                   => 'Stade Omnisports Ahmadou Ahidjo',
            'score_domicile_terrain'  => 1,
            'score_exterieur_terrain' => 1,
            'statut'                  => 'en_cours',
            'est_homologue'           => false,
            'first_half_started_at'   => $today->copy()->setHour(15)->setMinute(0),
            'second_half_started_at'  => $today->copy()->setHour(15)->setMinute(45),
        ]);

        // Autres matchs d'aujourd'hui (programmés)
        foreach ($paires9 as $k => [$dom, $ext]) {
            if ($k === 0) continue; // déjà traité
            $heure = [13, 15, 17, 19, 21][($k - 1) % 5];
            $matchIds[] = $this->insertMatch([
                'competition_id'    => $compE1Id,
                'phase_id'          => $phaseE1Id,
                'poule_id'          => $pouleE1Id,
                'journee'           => 9,
                'type'              => 'regulier',
                'club_domicile_id'  => $dom,
                'club_exterieur_id' => $ext,
                'commissaire_id'    => $commissaireIds[$k % count($commissaireIds)],
                'arbitre_principal_id' => $arbitreIds[$k % 8],
                'arbitre_assistant_1_id' => $arbitreIds[8 + ($k % 8)],
                'date_heure'        => $today->copy()->setHour($heure)->setMinute(0),
                'stade'             => $stades[($k + 1) % count($stades)],
                'statut'            => 'programme',
                'est_homologue'     => false,
            ]);
        }

        // Journées 10-14 programmées
        for ($journee = 10; $journee <= 14; $journee++) {
            $paires = $this->getPaires($e1Clubs, $journee);
            foreach ($paires as $k => [$dom, $ext]) {
                $matchIds[] = $this->insertMatch([
                    'competition_id'    => $compE1Id,
                    'phase_id'          => $phaseE1Id,
                    'poule_id'          => $pouleE1Id,
                    'journee'           => $journee,
                    'type'              => 'regulier',
                    'club_domicile_id'  => $dom,
                    'club_exterieur_id' => $ext,
                    'date_heure'        => Carbon::now()->addWeeks($journee - 9)->setHour(15)->addMinutes($k * 30),
                    'stade'             => $stades[$k % count($stades)],
                    'statut'            => 'programme',
                    'est_homologue'     => false,
                ]);
            }
        }

        // ── ELITE TWO 2025-2026 ─────────────────────────────────────────────
        $compE2Id  = $compIds[5];
        $phaseE2Id = $phaseIds[5][0];
        $pouleE2Id = $pouleIds[5][0];
        $e2Clubs   = array_map(fn($i) => $clubIds['elite_two'][$i], range(0, 15));

        for ($journee = 1; $journee <= 6; $journee++) {
            $paires = $this->getPaires($e2Clubs, $journee);
            foreach ($paires as $k => [$dom, $ext]) {
                $dateHeure = Carbon::parse('2026-01-31')->addWeeks($journee - 1)->setHour(14);
                $scoreDom  = rand(0, 3);
                $scoreExt  = rand(0, 2);
                $matchIds[] = $this->insertMatch([
                    'competition_id'           => $compE2Id,
                    'phase_id'                 => $phaseE2Id,
                    'poule_id'                 => $pouleE2Id,
                    'journee'                  => $journee,
                    'type'                     => 'regulier',
                    'club_domicile_id'         => $dom,
                    'club_exterieur_id'        => $ext,
                    'commissaire_id'           => $commissaireIds[$k % count($commissaireIds)],
                    'arbitre_principal_id'     => $arbitreIds[$k % 8],
                    'date_heure'               => $dateHeure,
                    'stade'                    => $stades[$k % count($stades)],
                    'score_domicile_terrain'   => $scoreDom,
                    'score_exterieur_terrain'  => $scoreExt,
                    'score_domicile_officiel'  => $scoreDom,
                    'score_exterieur_officiel' => $scoreExt,
                    'statut'                   => 'homologue',
                    'est_homologue'            => true,
                    'date_homologation'        => $dateHeure->copy()->addDays(2),
                ]);
            }
        }

        // Journée 7 Elite Two programmée
        foreach ($this->getPaires($e2Clubs, 7) as $k => [$dom, $ext]) {
            $matchIds[] = $this->insertMatch([
                'competition_id'    => $compE2Id,
                'phase_id'          => $phaseE2Id,
                'poule_id'          => $pouleE2Id,
                'journee'           => 7,
                'type'              => 'regulier',
                'club_domicile_id'  => $dom,
                'club_exterieur_id' => $ext,
                'date_heure'        => Carbon::now()->addWeeks(2)->setHour(14),
                'stade'             => $stades[$k % count($stades)],
                'statut'            => 'programme',
                'est_homologue'     => false,
            ]);
        }

        // ── HISTORIQUE DES CONFRONTATIONS (5 derniers matchs entre clubs) ──
        // Pour permettre à l'app mobile de consulter l'historique des rencontres
        $this->seedHistoriqueConfrontations($e1Clubs, $matchIds);

        return $matchIds;
    }

    // =========================================================================
    // Historique des confrontations
    // =========================================================================
    private function seedHistoriqueConfrontations(array $clubs, array &$matchIds): void
    {
        // Générer 5 matchs historiques entre Canon (0) et Coton (1)
        $canon = $clubs[0];
        $coton = $clubs[1];
        $scores = [
            [2, 1], [1, 1], [1, 0], [2, 0], [1, 1],
        ];
        $dates = [
            '2025-09-15', '2025-05-20', '2025-01-10', '2024-11-05', '2024-08-20'
        ];
        
        $stades = ['Stade Omnisports Ahmadou Ahidjo', 'Stade Roumdé Adjia'];
        
        foreach ($scores as $i => [$sDom, $sExt]) {
            $dom = ($i % 2 === 0) ? $canon : $coton;
            $ext = ($i % 2 === 0) ? $coton : $canon;
            $matchIds[] = $this->insertMatch([
                'competition_id'         => DB::table('competitions')->where('niveau', 'elite_one')->where('saison_id', DB::table('saisons')->where('statut', 'terminee')->first()->id ?? 1)->value('id'),
                'phase_id'               => DB::table('phases')->first()->id ?? 1,
                'poule_id'               => DB::table('poules')->first()->id ?? 1,
                'journee'                => $i + 1,
                'type'                   => 'regulier',
                'club_domicile_id'       => $dom,
                'club_exterieur_id'      => $ext,
                'date_heure'             => Carbon::parse($dates[$i])->setHour(15),
                'stade'                  => $stades[$i % 2],
                'score_domicile_terrain' => $sDom,
                'score_exterieur_terrain' => $sExt,
                'score_domicile_officiel' => $sDom,
                'score_exterieur_officiel' => $sExt,
                'statut'                 => 'homologue',
                'est_homologue'          => true,
                'date_homologation'      => Carbon::parse($dates[$i])->addDays(2),
            ]);
        }
    }

    // =========================================================================
    // Compositions
    // =========================================================================
    private function seedCompositions(array $matchIds): void
    {
        // Récupérer les matchs du jour
        $today = Carbon::now()->toDateString();
        $matches = DB::table('matchs')
            ->whereDate('date_heure', $today)
            ->orWhere('statut', 'en_cours')
            ->get();

        foreach ($matches as $match) {
            foreach ([$match->club_domicile_id, $match->club_exterieur_id] as $clubId) {
                $joueurs = DB::table('joueurs')
                    ->where('club_id', $clubId)
                    ->where('statut_validation', 'valide')
                    ->limit(16)
                    ->get();
                if ($joueurs->count() < 11) continue;

                $compoId = DB::table('compositions')->insertGetId([
                    'match_id'          => $match->id,
                    'club_id'           => $clubId,
                    'formation'         => '4-3-3',
                    'statut'            => 'confirmee',
                    'est_confirmee'     => true,
                    'date_confirmation' => now()->subHour()->format('Y-m-d H:i:s'),
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]);

                $postes = ['poste_0','poste_1','poste_2','poste_3','poste_4','poste_5','poste_6','poste_7','poste_8','poste_9','poste_10'];
                for ($i = 0; $i < 11; $i++) {
                    DB::table('composition_joueurs')->insert([
                        'composition_id' => $compoId,
                        'joueur_id'      => $joueurs[$i]->id,
                        'role'           => 'titulaire',
                        'est_capitaine'  => ($i === 0),
                        'poste_id'       => $postes[$i],
                        'poste_index'    => $i,
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ]);
                }
                for ($i = 11; $i < min(16, $joueurs->count()); $i++) {
                    DB::table('composition_joueurs')->insert([
                        'composition_id' => $compoId,
                        'joueur_id'      => $joueurs[$i]->id,
                        'role'           => 'remplacant',
                        'est_capitaine'  => false,
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ]);
                }
            }
        }
    }

    // =========================================================================
    // Matchs historiques (helper)
    // =========================================================================
    private function seedMatchsHistoriques(
        int $compId, int $phaseId, int $pouleId, array $clubs,
        array $commissaireIds, array $arbitreIds, array $stades,
        string $dateDebut, array &$matchIds
    ): void {
        $n = count($clubs);
        for ($journee = 1; $journee <= ($n - 1); $journee++) {
            $paires = $this->getPaires($clubs, $journee);
            foreach ($paires as $k => [$dom, $ext]) {
                $scoreDom = rand(0, 3);
                $scoreExt = rand(0, 2);
                $dateHeure = Carbon::parse($dateDebut)->addWeeks($journee - 1)->setHour(15);
                $matchIds[] = $this->insertMatch([
                    'competition_id'           => $compId,
                    'phase_id'                 => $phaseId,
                    'poule_id'                 => $pouleId,
                    'journee'                  => $journee,
                    'type'                     => 'regulier',
                    'club_domicile_id'         => $dom,
                    'club_exterieur_id'        => $ext,
                    'commissaire_id'           => $commissaireIds[$k % count($commissaireIds)],
                    'arbitre_principal_id'     => $arbitreIds[$k % 8],
                    'arbitre_assistant_1_id'   => $arbitreIds[8 + ($k % 8)],
                    'arbitre_assistant_2_id'   => $arbitreIds[9 + ($k % 7)],
                    'date_heure'               => $dateHeure,
                    'stade'                    => $stades[$k % count($stades)],
                    'score_domicile_terrain'   => $scoreDom,
                    'score_exterieur_terrain'  => $scoreExt,
                    'score_domicile_officiel'  => $scoreDom,
                    'score_exterieur_officiel' => $scoreExt,
                    'statut'                   => 'homologue',
                    'est_homologue'            => true,
                    'date_homologation'        => $dateHeure->copy()->addDays(2),
                ]);
            }
        }
    }

    // =========================================================================
    // Helpers
    // =========================================================================
    private function insertMatch(array $data): int
    {
        $defaults = [
            'competition_id'           => null,
            'phase_id'                 => null,
            'poule_id'                 => null,
            'journee'                  => null,
            'type'                     => 'regulier',
            'club_domicile_id'         => null,
            'club_exterieur_id'        => null,
            'commissaire_id'           => null,
            'arbitre_principal_id'     => null,
            'arbitre_assistant_1_id'   => null,
            'arbitre_assistant_2_id'   => null,
            'quatrieme_arbitre_id'     => null,
            'date_heure'               => null,
            'stade'                    => null,
            'terrain_neutre'           => false,
            'score_domicile_terrain'   => 0,
            'score_exterieur_terrain'  => 0,
            'score_domicile_officiel'  => null,
            'score_exterieur_officiel' => null,
            'score_domicile_prolongation' => null,
            'score_exterieur_prolongation' => null,
            'score_domicile_tab'       => null,
            'score_exterieur_tab'      => null,
            'est_forfait'              => false,
            'club_forfait_id'          => null,
            'statut'                   => 'programme',
            'est_homologue'            => false,
            'date_homologation'        => null,
            'motif_report'             => null,
            'date_heure_report'        => null,
            'first_half_started_at'    => null,
            'second_half_started_at'   => null,
            'created_at'               => now(),
            'updated_at'               => now(),
        ];

        $row = array_merge($defaults, $data);
        foreach (['date_heure','date_homologation','date_heure_report','first_half_started_at','second_half_started_at','created_at','updated_at'] as $f) {
            if (isset($row[$f]) && $row[$f] instanceof Carbon) {
                $row[$f] = $row[$f]->format('Y-m-d H:i:s');
            }
        }
        return DB::table('matchs')->insertGetId($row);
    }

    private function getPaires(array $clubs, int $journee): array
    {
        $n = count($clubs);
        $fixed = $clubs[0];
        $rot = array_slice($clubs, 1);
        for ($i = 1; $i < $journee; $i++) {
            array_push($rot, array_shift($rot));
        }
        $teams = array_merge([$fixed], $rot);
        $paires = [];
        for ($i = 0; $i < intdiv($n, 2); $i++) {
            $paires[] = $journee % 2 === 0
                ? [$teams[$n - 1 - $i], $teams[$i]]
                : [$teams[$i], $teams[$n - 1 - $i]];
        }
        return $paires;
    }

    // =========================================================================
    // MODULE 4 – Événements de match
    // =========================================================================
    private function seedMatchEvents(array $matchIds, array $clubIds, array $commissaireIds): void
    {
        $homologues = DB::table('matchs')
            ->whereIn('statut', ['homologue', 'termine'])
            ->orderBy('id')
            ->limit(80)
            ->get();

        $commId = $commissaireIds[0];

        foreach ($homologues as $match) {
            $joueursDom = DB::table('joueurs')
                ->where('club_id', $match->club_domicile_id)
                ->where('statut_validation', 'valide')
                ->limit(11)->pluck('id')->toArray();
            $joueursExt = DB::table('joueurs')
                ->where('club_id', $match->club_exterieur_id)
                ->where('statut_validation', 'valide')
                ->limit(11)->pluck('id')->toArray();

            if (empty($joueursDom) || empty($joueursExt)) continue;

            $ts = Carbon::parse($match->date_heure ?? now());
            $scoreDom = (int)($match->score_domicile_terrain ?? 0);
            $scoreExt = (int)($match->score_exterieur_terrain ?? 0);

            DB::table('match_events')->insert([
                'match_id' => $match->id, 'saisi_par_id' => $commId,
                'type' => 'debut_match', 'minute' => 0,
                'timestamp_event' => $ts->format('Y-m-d H:i:s'),
                'statut' => 'valide', 'created_at' => now(), 'updated_at' => now(),
            ]);

            foreach ($this->randomMinutes($scoreDom, 1, 45) as $min) {
                DB::table('match_events')->insert([
                    'match_id' => $match->id,
                    'joueur_id' => $joueursDom[array_rand($joueursDom)],
                    'club_id' => $match->club_domicile_id,
                    'saisi_par_id' => $commId, 'type' => 'but', 'minute' => $min,
                    'timestamp_event' => $ts->copy()->addMinutes($min)->format('Y-m-d H:i:s'),
                    'statut' => 'valide', 'created_at' => now(), 'updated_at' => now(),
                ]);
            }

            foreach ($this->randomMinutes($scoreExt, 46, 90) as $min) {
                DB::table('match_events')->insert([
                    'match_id' => $match->id,
                    'joueur_id' => $joueursExt[array_rand($joueursExt)],
                    'club_id' => $match->club_exterieur_id,
                    'saisi_par_id' => $commId, 'type' => 'but', 'minute' => $min,
                    'timestamp_event' => $ts->copy()->addMinutes($min)->format('Y-m-d H:i:s'),
                    'statut' => 'valide', 'created_at' => now(), 'updated_at' => now(),
                ]);
            }

            for ($c = 0; $c < rand(2, 4); $c++) {
                $isHome = rand(0, 1);
                $joueurs = $isHome ? $joueursDom : $joueursExt;
                $club = $isHome ? $match->club_domicile_id : $match->club_exterieur_id;
                $min = rand(10, 88);
                DB::table('match_events')->insert([
                    'match_id' => $match->id,
                    'joueur_id' => $joueurs[array_rand($joueurs)],
                    'club_id' => $club, 'saisi_par_id' => $commId,
                    'type' => 'carton_jaune', 'minute' => $min,
                    'timestamp_event' => $ts->copy()->addMinutes($min)->format('Y-m-d H:i:s'),
                    'statut' => 'valide', 'created_at' => now(), 'updated_at' => now(),
                ]);
            }

            DB::table('match_events')->insert([
                'match_id' => $match->id, 'saisi_par_id' => $commId,
                'type' => 'fin_match', 'minute' => 90,
                'timestamp_event' => $ts->copy()->addMinutes(95)->format('Y-m-d H:i:s'),
                'statut' => 'valide', 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }

    private function randomMinutes(int $count, int $min, int $max): array
    {
        $mins = [];
        for ($i = 0; $i < $count; $i++) $mins[] = rand($min, $max);
        sort($mins);
        return $mins;
    }

    // =========================================================================
    // MODULE 5 – Classements & Stats
    // =========================================================================
    private function seedClassements(array $pouleIds, array $clubIds, array $saisonIds): void
    {
        $pouleE1 = $pouleIds[4][0];
        $saison4 = $saisonIds[3];
        $e1Clubs = array_map(fn($i) => $clubIds['elite_one'][$i], range(0, 13));

        $classE1 = [
            [0, 20, 6, 2, 0, 18, 5, 8],
            [1, 18, 5, 3, 0, 14, 4, 8],
            [2, 16, 5, 1, 2, 15, 9, 8],
            [3, 14, 4, 2, 2, 11, 8, 8],
            [4, 13, 4, 1, 3, 10, 10, 8],
            [5, 12, 3, 3, 2, 11, 10, 8],
            [6, 11, 3, 2, 3, 9, 11, 8],
            [7, 10, 3, 1, 4, 9, 13, 8],
            [8, 9, 2, 3, 3, 8, 10, 8],
            [9, 8, 2, 2, 4, 8, 12, 8],
            [10, 7, 2, 1, 5, 7, 14, 8],
            [11, 6, 1, 3, 4, 6, 12, 8],
            [12, 4, 1, 1, 6, 5, 16, 8],
            [13, 2, 0, 2, 6, 4, 20, 8],
        ];

        foreach ($classE1 as $pos => [$idx, $pts, $v, $n, $d, $bp, $bc, $j]) {
            DB::table('classement_clubs')->insert([
                'club_id' => $e1Clubs[$idx],
                'poule_id' => $pouleE1,
                'saison_id' => $saison4,
                'points' => $pts,
                'victoires' => $v,
                'nuls' => $n,
                'defaites' => $d,
                'buts_pour' => $bp,
                'buts_contre' => $bc,
                'diff_buts' => $bp - $bc,
                'nb_matchs' => $j,
                'cartons_jaunes' => rand(5, 20),
                'cartons_rouges' => rand(0, 3),
                'position' => $pos + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Elite Two
        $pouleE2 = $pouleIds[5][0];
        $e2Clubs = array_map(fn($i) => $clubIds['elite_two'][$i], range(0, 15));
        $classE2 = [
            [0, 16, 5, 1, 0, 14, 4, 6],
            [8, 14, 4, 2, 0, 12, 5, 6],
            [1, 12, 4, 0, 2, 10, 7, 6],
            [3, 11, 3, 2, 1, 9, 7, 6],
            [2, 10, 3, 1, 2, 8, 7, 6],
            [4, 9, 3, 0, 3, 7, 8, 6],
            [9, 8, 2, 2, 2, 8, 9, 6],
            [6, 7, 2, 1, 3, 6, 8, 6],
            [5, 7, 2, 1, 3, 5, 8, 6],
            [12, 6, 2, 0, 4, 6, 11, 6],
            [10, 5, 1, 2, 3, 5, 9, 6],
            [11, 5, 1, 2, 3, 4, 9, 6],
            [7, 4, 1, 1, 4, 4, 10, 6],
            [13, 3, 1, 0, 5, 4, 13, 6],
            [14, 2, 0, 2, 4, 3, 11, 6],
            [15, 1, 0, 1, 5, 2, 14, 6],
        ];

        foreach ($classE2 as $pos => [$idx, $pts, $v, $n, $d, $bp, $bc, $j]) {
            DB::table('classement_clubs')->insert([
                'club_id' => $e2Clubs[$idx],
                'poule_id' => $pouleE2,
                'saison_id' => $saison4,
                'points' => $pts,
                'victoires' => $v,
                'nuls' => $n,
                'defaites' => $d,
                'buts_pour' => $bp,
                'buts_contre' => $bc,
                'diff_buts' => $bp - $bc,
                'nb_matchs' => $j,
                'cartons_jaunes' => rand(3, 15),
                'cartons_rouges' => rand(0, 2),
                'position' => $pos + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    // =========================================================================
    // Statistiques joueurs
    // =========================================================================
    private function seedStatJoueurs(array $compIds, array $clubIds): void
    {
        $compId = $compIds[4];
        $e1Clubs = array_map(fn($i) => $clubIds['elite_one'][$i], range(0, 13));

        $topStats = [
            [0, 9, 8, 3, 1, 0, 720, 8],
            [1, 10, 7, 2, 2, 0, 720, 8],
            [2, 11, 6, 4, 1, 0, 680, 8],
            [0, 10, 5, 5, 0, 0, 720, 8],
            [3, 9, 5, 1, 1, 0, 700, 8],
            [1, 9, 4, 3, 2, 0, 720, 8],
            [4, 11, 4, 2, 1, 0, 680, 8],
            [5, 10, 3, 4, 1, 0, 690, 8],
            [6, 9, 3, 2, 0, 0, 720, 8],
            [2, 9, 3, 3, 2, 1, 630, 8],
        ];

        foreach ($topStats as [$cIdx, $maillot, $buts, $passes, $cj, $cr, $min, $matchs]) {
            $joueur = DB::table('joueurs')
                ->where('club_id', $e1Clubs[$cIdx])
                ->where('num_maillot', $maillot)
                ->first();
            if ($joueur) {
                DB::table('stat_joueurs')->insertOrIgnore([
                    'joueur_id' => $joueur->id,
                    'competition_id' => $compId,
                    'buts' => $buts,
                    'passes_decisives' => $passes,
                    'cartons_jaunes' => $cj,
                    'cartons_rouges' => $cr,
                    'minutes_jouees' => $min,
                    'nb_matchs' => $matchs,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // =========================================================================
    // Statistiques mobiles
    // =========================================================================
    private function seedMobileStats(array $clubIds, array $saisonIds): void
    {
        $allClubs = array_merge($clubIds['elite_one'], $clubIds['elite_two']);
        $formes = ['W', 'D', 'L'];

        foreach ($allClubs as $clubId) {
            // Statistiques club par saison
            foreach ($saisonIds as $saisonId) {
                DB::table('club_statistiques_saison')->insertOrIgnore([
                    'club_id' => $clubId,
                    'saison_id' => $saisonId,
                    'forme_actuelle' => json_encode(array_map(fn() => $formes[rand(0,2)], range(1,5))),
                    'tirs_par_match' => rand(80, 160) / 10,
                    'tirs_cadres_par_match' => rand(30, 80) / 10,
                    'passes_reussies_par_match' => rand(250, 500),
                    'cartons_jaunes_total' => rand(15, 50),
                    'cartons_rouges_total' => rand(0, 5),
                    'tacles_par_match' => rand(10, 25),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Statistiques joueurs par saison
        foreach (DB::table('joueurs')->get() as $joueur) {
            foreach ($saisonIds as $saisonId) {
                $m = rand(5, 26);
                $isAttaquant = in_array($joueur->poste, ['attaquant_centre','avant_centre','ailier_droit','ailier_gauche']);
                DB::table('joueur_statistiques_saison')->insertOrIgnore([
                    'joueur_id' => $joueur->id,
                    'saison_id' => $saisonId,
                    'matchs_joues' => $m,
                    'titularisations' => rand(0, $m),
                    'minutes_jouees' => $m * rand(60, 90),
                    'buts' => $isAttaquant ? rand(0, 15) : rand(0, 3),
                    'passes_decisives' => rand(0, 10),
                    'tirs' => rand(5, 40),
                    'tirs_cadres' => rand(2, 20),
                    'tacles' => rand(5, 50),
                    'interceptions' => rand(5, 40),
                    'duels_gagnes' => rand(15, 100),
                    'cartons_jaunes' => rand(0, 6),
                    'cartons_rouges' => (rand(0, 8) === 0) ? 1 : 0,
                    'fautes_commises' => rand(5, 30),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Historique de carrière
            $clubsAnciens = ['TP Mazembe','Raja Casablanca','Al Ahly','Esperance de Tunis','Enyimba FC','Orlando Pirates','AS Vita Club'];
            foreach (['23-24', '24-25'] as $saisonCarr) {
                DB::table('historique_carriere')->insert([
                    'joueur_id' => $joueur->id,
                    'saison' => $saisonCarr,
                    'club_nom' => $clubsAnciens[rand(0, count($clubsAnciens) - 1)],
                    'matchs_joues' => rand(10, 30),
                    'buts' => in_array($joueur->poste, ['attaquant_centre','avant_centre']) ? rand(2, 18) : rand(0, 2),
                    'passes' => rand(0, 8),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // =========================================================================
    // Palmarès
    // =========================================================================
    private function seedPalmares(array $clubIds): void
    {
        $palmares = [
            'Canon Sportif de Yaoundé' => [['Champion du Cameroun','1974'],['Champion du Cameroun','1977'],['Champion du Cameroun','1979'],['Coupe du Cameroun','1978'],['Coupe du Cameroun','1985']],
            'Coton Sport de Garoua' => [['Champion du Cameroun','2002'],['Champion du Cameroun','2007'],['Champion du Cameroun','2008'],['Champion du Cameroun','2009'],['Champion du Cameroun','2011'],['Champion du Cameroun','2012'],['Champion du Cameroun','2014'],['Champion du Cameroun','2023']],
            'Tonnerre Kalara Club de Yaoundé' => [['Champion du Cameroun','1967'],['Champion du Cameroun','1970'],['Champion du Cameroun','1986'],['Coupe du Cameroun','1970'],['Coupe du Cameroun','1971']],
            'Colombe Sportive du Dja et Lobo' => [['Champion du Cameroun','2025']],
            'Victoria United FC' => [['Champion du Cameroun','2024']],
        ];

        $allClubs = array_merge($clubIds['elite_one'], $clubIds['elite_two']);
        foreach ($allClubs as $clubId) {
            $club = DB::table('clubs')->find($clubId);
            if ($club && isset($palmares[$club->nom])) {
                foreach ($palmares[$club->nom] as [$titre, $annee]) {
                    DB::table('palmares')->insert([
                        'club_id' => $clubId, 'titre' => $titre,
                        'annee' => $annee, 'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    // =========================================================================
    // MODULE 6 – Transferts
    // =========================================================================
    private function seedTransferts(array $clubIds, array $saisonIds, int $adminId): void
    {
        $e1 = array_slice($clubIds['elite_one'], 0, 14);
        $e2 = array_slice($clubIds['elite_two'], 0, 16);
        $s4 = $saisonIds[3];

        $transferts = [
            [$e1[0],  $e1[1],  5_000_000, 'valide',    Carbon::now()->subMonths(3), Carbon::now()->subMonths(2)],
            [$e1[2],  $e1[0],  8_000_000, 'valide',    Carbon::now()->subMonths(3), Carbon::now()->subMonths(2)],
            [$e1[3],  $e2[0],  1_500_000, 'valide',    Carbon::now()->subMonths(2), Carbon::now()->subMonths(1)],
            [$e1[5],  $e1[4],  3_000_000, 'valide',    Carbon::now()->subMonths(2), Carbon::now()->subMonths(1)],
            [$e2[1],  $e1[7],  2_000_000, 'valide',    Carbon::now()->subMonths(4), Carbon::now()->subMonths(3)],
            [$e1[1],  $e1[3],  4_500_000, 'en_attente', Carbon::now()->subDays(5),  null],
            [$e2[2],  $e1[2],  6_000_000, 'en_attente', Carbon::now()->subDays(3),  null],
            [$e1[0],  $e1[5], 12_000_000, 'rejete',    Carbon::now()->subMonth(),   Carbon::now()->subWeeks(3)],
        ];

        foreach ($transferts as [$cedant, $acquereur, $montant, $statut, $dateDemande, $dateValid]) {
            $joueur = DB::table('joueurs')
                ->where('club_id', $cedant)
                ->where('statut_validation', 'valide')
                ->inRandomOrder()->first();
            if (!$joueur) continue;

            DB::table('transferts')->insert([
                'joueur_id' => $joueur->id,
                'club_cedant_id' => $cedant,
                'club_acquereur_id' => $acquereur,
                'saison_id' => $s4,
                'montant' => $montant,
                'statut' => $statut,
                'valide_par_id' => in_array($statut, ['valide','rejete']) ? $adminId : null,
                'motif_rejet' => $statut === 'rejete' ? 'Montant non conforme aux règlements FECAFOOT.' : null,
                'date_demande' => $dateDemande->format('Y-m-d H:i:s'),
                'date_validation' => $dateValid ? $dateValid->format('Y-m-d H:i:s') : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    // =========================================================================
    // MODULE 7 – Articles
    // =========================================================================
    private function seedArticles(array $journalisteIds, int $adminId): void
    {
        $articles = [
            [
                'titre' => 'Canon Sportif domine le classement après 8 journées',
                'contenu' => "Le Canon Sportif de Yaoundé s'impose en tête du championnat MTN Elite One 2025-2026 avec 20 points après 8 journées. Avec 6 victoires, 2 nuls et aucune défaite, le club de la capitale affiche le bilan le plus impressionnant du championnat.",
                'categorie' => 'actualite',
                'statut' => 'publie',
                'auteur' => 0,
            ],
            [
                'titre' => 'Colombe Sportive, champion 2024-2025 : une saison historique',
                'contenu' => "Colombe Sportive du Dja et Lobo a remporté pour la première fois de son histoire le titre de Champion du Cameroun lors de la saison 2024-2025. L'équipe de Sangmélima a dominé la compétition avec 65 points.",
                'categorie' => 'club',
                'statut' => 'publie',
                'auteur' => 1,
            ],
            [
                'titre' => 'Victoria United, champion 2023-2024 : exploit historique',
                'contenu' => "Victoria United FC de Limbé est entré dans l'histoire en remportant la MTN Elite One 2023-2024, devenant le premier promu champion du Cameroun.",
                'categorie' => 'actualite',
                'statut' => 'publie',
                'auteur' => 2,
            ],
            [
                'titre' => 'Top buteurs Elite One 2025-2026 : la course est lancée',
                'contenu' => "Après 8 journées, voici le classement des buteurs : Canon (8), Coton Sport (7), Colombe (6). La lutte pour le Soulier d'Or promet d'être serrée.",
                'categorie' => 'joueur',
                'statut' => 'valide',
                'auteur' => 1,
            ],
            [
                'titre' => 'Mercato : plusieurs transferts importants validés',
                'contenu' => "La fenêtre de transferts a été marquée par plusieurs mouvements importants entre clubs d'Elite One.",
                'categorie' => 'transfert',
                'statut' => 'publie',
                'auteur' => 0,
            ],
            [
                'titre' => 'Le derby de Yaoundé : Canon vs Tonnerre, 90 ans de rivalité',
                'contenu' => "Le derby de la capitale opposant Canon et Tonnerre est l'une des plus vieilles rivalités du football africain. Leur prochaine confrontation est très attendue.",
                'categorie' => 'actualite',
                'statut' => 'soumis',
                'auteur' => 2,
            ],
            [
                'titre' => 'FECAFOOT : nouvelles règles pour la saison 2026-2027',
                'contenu' => "La Fédération Camerounaise de Football a annoncé plusieurs dispositions pour la prochaine saison.",
                'categorie' => 'officiel',
                'statut' => 'publie',
                'auteur' => 0,
            ],
        ];

        foreach ($articles as $art) {
            $statut = $art['statut'];
            $auteurId = $journalisteIds[$art['auteur'] % count($journalisteIds)];
            DB::table('articles')->insert([
                'auteur_id' => $auteurId,
                'valide_par_id' => in_array($statut, ['valide','publie']) ? $adminId : null,
                'titre' => $art['titre'],
                'contenu' => $art['contenu'],
                'categorie' => $art['categorie'],
                'statut' => $statut,
                'date_publication' => in_array($statut, ['publie']) ? Carbon::now()->subDays(rand(1, 10))->format('Y-m-d H:i:s') : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    // =========================================================================
    // MODULE 8 – Talent Scores (IA)
    // =========================================================================
    private function seedTalentScores(array $clubIds, array $saisonIds): void
    {
        $saison4 = $saisonIds[3];
        $allClubs = array_merge($clubIds['elite_one'], $clubIds['elite_two']);

        foreach ($allClubs as $clubId) {
            $joueurs = DB::table('joueurs')
                ->where('club_id', $clubId)
                ->where('statut_validation', 'valide')
                ->get();

            foreach ($joueurs as $joueur) {
                $scoreGlobal = rand(40, 95);
                $scoreOffensive = rand(30, 98);
                $scoreDefensive = rand(30, 95);
                $scoreDiscipline = rand(50, 100);

                DB::table('talent_scores')->insert([
                    'joueur_id' => $joueur->id,
                    'saison_id' => $saison4,
                    'score_global' => $scoreGlobal,
                    'score_offensive' => $scoreOffensive,
                    'score_defensive' => $scoreDefensive,
                    'score_discipline' => $scoreDiscipline,
                    'details' => json_encode([
                        'vitesse' => rand(40, 99),
                        'technique' => rand(40, 99),
                        'vision' => rand(40, 99),
                        'finition' => rand(40, 99),
                        'physique' => rand(40, 99),
                    ]),
                    'modele_version' => 'v1.0',
                    'date_calcul' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}