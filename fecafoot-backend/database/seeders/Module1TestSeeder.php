<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class Module1TestSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 Démarrage du seeder FECAFOOT complet...');

        DB::statement("SET session_replication_role = 'replica'");

        $this->truncateTables();

        $this->command->info('✅ Tables vidées.');

        // MODULE 0 – Auth & utilisateurs
        $adminId = $this->seedAdmins();
        $this->command->info('✅ Admins créés.');

        // MODULE 1 – Clubs & utilisateurs
        [$clubIds, $responsableIds, $coachIds] = $this->seedClubsAndUsers();
        $this->command->info('✅ Clubs, responsables et coachs créés.');

        // Commissaires & journalistes
        [$commissaireIds, $journalisteIds] = $this->seedOtherUsers();
        $this->command->info('✅ Commissaires et journalistes créés.');

        // Arbitres
        $arbitreIds = $this->seedArbitres();
        $this->command->info('✅ Arbitres créés.');

        DB::statement("SET session_replication_role = 'origin'");

        $this->command->info('');
        $this->command->info('🎉 Seeder FECAFOOT complet terminé avec succès !');
        $this->command->info('');
        $this->command->info('📧 COMPTES DE CONNEXION (Mot de passe : password)');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('   👑 Admin        : admin@fecafoot.cm');
        $this->command->info('   👑 Admin 2      : admin2@fecafoot.cm');
        $this->command->info('   🫡 Commissaire  : commissaire1@fecafoot.cm');
        $this->command->info('   📝 Journaliste  : journaliste1@fecafoot.cm');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('   🏆 ELITE ONE (16 clubs)');
        $this->command->info('   ──────────────────────────────────────────────────────');
        $this->command->info('   resp.canon@fecafoot.cm      → coach.canon@fecafoot.cm');
        $this->command->info('   resp.feutcheu@fecafoot.cm   → coach.feutcheu@fecafoot.cm');
        $this->command->info('   resp.coton-sport@fecafoot.cm → coach.coton-sport@fecafoot.cm');
        $this->command->info('   resp.union-douala@fecafoot.cm → coach.union-douala@fecafoot.cm');
        $this->command->info('   ... et 12 autres clubs');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('   ⚡ ELITE TWO (16 clubs)');
        $this->command->info('   ──────────────────────────────────────────────────────');
        $this->command->info('   resp.new-stars@fecafoot.cm  → coach.new-stars@fecafoot.cm');
        $this->command->info('   resp.fortuna@fecafoot.cm    → coach.fortuna@fecafoot.cm');
        $this->command->info('   ... et 14 autres clubs');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('   📊 STATISTIQUES :');
        $this->command->info('   ├─ Clubs Elite One  : 16');
        $this->command->info('   ├─ Clubs Elite Two  : 16');
        $this->command->info('   ├─ Joueurs         : ' . (16 + 16) * 20 . ' (20 par club)');
        $this->command->info('   ├─ Coachs          : 32 (1 par club)');
        $this->command->info('   ├─ Arbitres        : 20');
        $this->command->info('   ├─ Commissaires    : 5');
        $this->command->info('   └─ Journalistes    : 3');
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
            'saisons', 'arbitres', 'users', 'clubs',
        ];
        foreach ($tables as $table) {
            try {
                DB::statement("TRUNCATE TABLE \"{$table}\" RESTART IDENTITY CASCADE");
            } catch (\Exception $e) {
                // Ignorer
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
        // ── Elite One clubs (16 clubs) ──────────────────────────────────────
        $eliteOneClubs = [
            ['Canon Sportif de Yaoundé',        'Yaoundé',      'Stade Omnisports Ahmadou Ahidjo', 'Narcisse Mouelle Kombi',   'Vert et Rouge',   1930, 'canon'],
            ['Feutcheu FC',                      'Bafoussam',    'Stade Municipal de Bafoussam',    'Fokunang Willy',           'Bleu et Blanc',   1935, 'feutcheu'],
            ['Coton Sport de Garoua',            'Garoua',       'Stade Roumdé Adjia',              'Hajiya Ramatu Bako',       'Jaune et Noir',   1986, 'coton-sport'],
            ['Union Sportive de Douala',         'Douala',       'Stade de la Réunification',       'Albert Nganang',           'Rouge et Blanc',  1934, 'union-douala'],
            ['Panthère du Ndé',                  'Bangangté',    'Stade Municipal de Bangangté',    'Richard Feudjio',          'Jaune et Vert',   1972, 'panthere'],
            ['Racing Club de Bafoussam',         'Bafoussam',    'Stade Municipal de Bafoussam',    'Martin Kamto',             'Bleu et Blanc',   1958, 'racing'],
            ['Eding Sport FC',                   'Edéa',         'Stade Municipal d\'Edéa',         'Jean Paul Mfou',           'Orange et Blanc', 2002, 'eding'],
            ['PWD Bamenda',                      'Bamenda',      'Stade Municipal de Bamenda',      'Forka Lehnjo Henry',       'Vert et Blanc',   1959, 'pwd'],
            ['Astres de Douala',                 'Douala',       'Stade de la Réunification',       'Stéphane Bitchong',        'Jaune et Bleu',   1969, 'astres'],
            ['Stade Renard de Melong',           'Melong',       'Stade Municipal de Melong',       'Hervé Noupeu',             'Vert et Blanc',   1990, 'renard'],
            ['FAP Football Club',                'Yaoundé',      'Stade Omnisports Ahmadou Ahidjo', 'Richard Bilong',           'Bleu et Blanc',   2005, 'fap'],
            ['Avion Academy de Bamenda',         'Bamenda',      'Stade Municipal de Bamenda',      'Charles Atangana',         'Orange et Noir',  2010, 'avion'],
            ['APEJES de Mfou',                   'Mfou',         'Stade de Mfou',                   'Paul Mfou',                'Vert et Noir',    2003, 'apejes'],
            ['Yong Sports Academy',              'Bamenda',      'Stade Municipal de Bamenda',      'Ndangsa Fondzenyuy',       'Rouge et Noir',   2012, 'yong'],
            ['Ngaoundéré FC',                    'Ngaoundéré',   'Stade Municipal de Ngaoundéré',   'Moussa Hayatou',           'Bleu et Vert',    1995, 'ngaoundere'],
            ['Tonnerre Yaoundé',                 'Yaoundé',      'Stade Omnisports Ahmadou Ahidjo', 'Christian Tagne',          'Jaune et Noir',   1934, 'tonnerre'],
        ];

        // ── Elite Two clubs (16 clubs) ──────────────────────────────────────
        $eliteTwoClubs = [
            ['New Stars de Douala',              'Douala',       'Stade de la Réunification',       'Simon Meka',               'Bleu et Jaune',   2001, 'new-stars'],
            ['AS Fortuna de Mfou',               'Mfou',         'Stade de Mfou',                   'Eric Zé',                  'Rouge et Jaune',  1998, 'fortuna'],
            ['Unisport FC de Bafang',            'Bafang',       'Stade Municipal de Bafang',       'Cyrille Kagmeni',          'Vert et Blanc',   1995, 'unisport'],
            ['Dynamo de Douala',                 'Douala',       'Stade de la Réunification',       'Jules Minka',              'Rouge et Bleu',   1980, 'dynamo'],
            ['Sable FC Batié',                   'Batié',        'Stade Municipal de Batié',        'André Djoumessi',          'Sable et Noir',   2005, 'sable'],
            ['Impulsion FC Yaoundé',             'Yaoundé',      'Stade Municipal de Yaoundé',      'Bertrand Ndi',             'Vert et Blanc',   2008, 'impulsion'],
            ['AS Bamboutos',                     'Mbouda',       'Stade Municipal de Mbouda',       'Marcel Yemdji',            'Bleu et Jaune',   1970, 'bamboutos'],
            ['Mfou FC',                          'Mfou',         'Stade de Mfou',                   'Claude Tsimi',             'Bleu et Blanc',   2009, 'mfou'],
            ['Espérance FC de Guider',           'Guider',       'Stade Municipal de Guider',       'Hamadou Garba',            'Vert et Blanc',   2000, 'esperance'],
            ['Renaissance de Ngoumou',           'Ngoumou',      'Stade Municipal de Ngoumou',      'Pascal Onana',             'Rouge et Blanc',  2003, 'renaissance'],
            ['Leopard Club de Douala',           'Douala',       'Stade de la Réunification',       'Sylvain Nkam',             'Jaune et Noir',   1978, 'leopard'],
            ['Aigle Royal de Menoua',            'Dschang',      'Stade Municipal de Dschang',      'Thomas Defo',              'Rouge et Blanc',  1996, 'aigle'],
            ['FC Baham Yensem',                  'Baham',        'Stade Municipal de Baham',        'Blaise Kaptue',            'Bleu et Rouge',   2001, 'baham'],
            ['Romo FC',                          'Yaoundé',      'Stade Municipal de Yaoundé',      'Jean Mba',                 'Blanc et Noir',   2007, 'romo'],
            ['Victoria United',                  'Limbé',        'Stade de Limbé',                  'Peter Mbah',               'Bleu et Blanc',   2004, 'victoria'],
            ['Diamant FC de Yaoundé',            'Yaoundé',      'Stade Municipal de Yaoundé',      'Henri Awono',              'Or et Noir',      2010, 'diamant'],
        ];

        $clubIds = ['elite_one' => [], 'elite_two' => []];
        $responsableIds = [];
        $coachIds = [];

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
                'profile_completed' => true,
                'est_actif'         => true,
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);

            $clubIds['elite_one'][] = $clubId;

            // Responsable
            $respEmail = "resp.{$slug}@fecafoot.cm";
            $respId = DB::table('users')->insertGetId([
                'nom'                => strtoupper(explode(' ', $nom)[0]),
                'prenom'             => 'Responsable',
                'email'              => $respEmail,
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
            $coachEmail = "coach.{$slug}@fecafoot.cm";
            $coachId = DB::table('users')->insertGetId([
                'nom'                => strtoupper(explode(' ', $nom)[0]),
                'prenom'             => 'Coach',
                'email'              => $coachEmail,
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

            // Joueurs (20 par club)
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
                'profile_completed' => true,
                'est_actif'         => true,
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);

            $clubIds['elite_two'][] = $clubId;

            // Responsable
            $respEmail = "resp.{$slug}@fecafoot.cm";
            $respId = DB::table('users')->insertGetId([
                'nom'                => strtoupper(explode(' ', $nom)[0]),
                'prenom'             => 'Responsable',
                'email'              => $respEmail,
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
            $coachEmail = "coach.{$slug}@fecafoot.cm";
            $coachId = DB::table('users')->insertGetId([
                'nom'                => strtoupper(explode(' ', $nom)[0]),
                'prenom'             => 'Coach',
                'email'              => $coachEmail,
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

            // Joueurs (20 par club)
            $this->seedJoueurs($clubId, 'elite_two', $idx + 100);
        }

        return [$clubIds, $responsableIds, $coachIds];
    }

    // =========================================================================
    // Joueurs
    // =========================================================================
    private function seedJoueurs(int $clubId, string $division, int $seed): void
    {
        $noms = ['ABEGA', 'ATEBA', 'BILONG', 'BOYOMO', 'ETOUNDI', 'FOMEKONG', 'GNING',
                 'HAMIDOU', 'KAMTO', 'LOGA', 'MBARGA', 'MBIA', 'NKANA', 'NNANGA',
                 'ONANA', 'OWONO', 'PASCAL', 'SIYAM', 'TCHAMBA', 'TOKO'];
        $prenoms = ['Alain', 'Boris', 'Christian', 'David', 'Elvis', 'Franck', 'Georges',
                    'Henri', 'Ibrahim', 'Jean', 'Kevin', 'Laurent', 'Marc', 'Nicolas',
                    'Olivier', 'Patrick', 'Quentin', 'Raoul', 'Sébastien', 'Thomas'];
        $postes = [
            'gardien', 'gardien', 'defenseur_central', 'defenseur_central',
            'lateral_droit', 'lateral_gauche', 'milieu_defensif', 'milieu_defensif',
            'milieu_central', 'milieu_central', 'milieu_offensif', 'ailier_droit',
            'ailier_gauche', 'attaquant_centre', 'avant_centre', 'defenseur_central',
            'lateral_droit', 'milieu_central', 'ailier_droit', 'attaquant_centre'
        ];
        $nationalites = ['Camerounais', 'Camerounais', 'Camerounais', 'Camerounais',
                         'Ivoirien', 'Sénégalais', 'Congolais', 'Ghanéen'];

        for ($j = 0; $j < 20; $j++) {
            $nom    = $noms[($seed + $j) % count($noms)];
            $prenom = $prenoms[($seed + $j * 3) % count($prenoms)];
            $poste  = $postes[$j];
            $nat    = $nationalites[($seed + $j) % count($nationalites)];
            $annee  = rand(1992, 2005);
            $mois   = rand(1, 12);
            $jour   = rand(1, 28);

            $licencePrefix = strtoupper($division === 'elite_one' ? 'E1' : 'E2');
            $numLicence = "{$licencePrefix}-{$clubId}-" . str_pad($j + 1, 3, '0', STR_PAD_LEFT);

            DB::table('joueurs')->insert([
                'club_id'           => $clubId,
                'nom'               => $nom . ($j > 0 ? " {$j}" : ''),
                'prenom'            => $prenom,
                'date_naissance'    => "{$annee}-" . str_pad($mois, 2, '0', STR_PAD_LEFT) . "-" . str_pad($jour, 2, '0', STR_PAD_LEFT),
                'nationalite'       => $nat,
                'num_licence'       => $numLicence,
                'poste'             => $poste,
                'num_maillot'       => $j + 1,
                'taille_cm'         => rand(170, 195),
                'poids_kg'          => rand(65, 90),
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
        $commissaireData = [
            ['ESSOMBA', 'Robert',    'commissaire1@fecafoot.cm'],
            ['FOUDA',   'Maurice',   'commissaire2@fecafoot.cm'],
            ['BELLO',   'Adamou',    'commissaire3@fecafoot.cm'],
            ['KENGNE',  'Théophile', 'commissaire4@fecafoot.cm'],
            ['NSEKE',   'Guy',       'commissaire5@fecafoot.cm'],
        ];

        $journalisteData = [
            ['NTOUMBA', 'Claude',   'journaliste1@fecafoot.cm'],
            ['ABENA',   'Marie',    'journaliste2@fecafoot.cm'],
            ['SOBZE',   'Patrick',  'journaliste3@fecafoot.cm'],
        ];

        $commissaireIds = [];
        foreach ($commissaireData as [$nom, $prenom, $email]) {
            $commissaireIds[] = DB::table('users')->insertGetId([
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

        $journalisteIds = [];
        foreach ($journalisteData as [$nom, $prenom, $email]) {
            $journalisteIds[] = DB::table('users')->insertGetId([
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

        return [$commissaireIds, $journalisteIds];
    }

    // =========================================================================
    // Arbitres
    // =========================================================================
    private function seedArbitres(): array
    {
        $arbitres = [
            // Centraux
            ['ZAMBO',   'Martin',    'ARB-C-001', 'central',   'Centre',    'Yaoundé'],
            ['MFOU',    'Jean',      'ARB-C-002', 'central',   'Littoral',  'Douala'],
            ['GUIWA',   'Théodore',  'ARB-C-003', 'central',   'Ouest',     'Bafoussam'],
            ['ATEBA',   'Cédric',    'ARB-C-004', 'central',   'Nord',      'Garoua'],
            ['SIMO',    'Alexis',    'ARB-C-005', 'central',   'Centre',    'Yaoundé'],
            ['TCHOUATE','René',      'ARB-C-006', 'central',   'Littoral',  'Douala'],
            ['NKOA',    'Herbert',   'ARB-C-007', 'central',   'Sud-Ouest', 'Buea'],
            ['DJOUM',   'Francis',   'ARB-C-008', 'central',   'Adamaoua',  'Ngaoundéré'],
            // Assistants
            ['BIYA',    'Pierre',    'ARB-A-001', 'assistant', 'Centre',    'Yaoundé'],
            ['NLEND',   'Léa',       'ARB-A-002', 'assistant', 'Littoral',  'Douala'],
            ['FOUDA',   'Sylvestre', 'ARB-A-003', 'assistant', 'Ouest',     'Bafoussam'],
            ['MVENG',   'Sébastien', 'ARB-A-004', 'assistant', 'Nord',      'Garoua'],
            ['EKOA',    'Martine',   'ARB-A-005', 'assistant', 'Centre',    'Yaoundé'],
            ['NDOUM',   'Paul',      'ARB-A-006', 'assistant', 'Littoral',  'Douala'],
            ['TABI',    'Clément',   'ARB-A-007', 'assistant', 'Ouest',     'Bafoussam'],
            ['BELE',    'Antoine',   'ARB-A-008', 'assistant', 'Sud',       'Ebolowa'],
            // Quatrièmes
            ['MANGA',   'Dieudonné', 'ARB-Q-001', 'quatrieme', 'Centre',    'Yaoundé'],
            ['KOUM',    'Bertrand',  'ARB-Q-002', 'quatrieme', 'Littoral',  'Douala'],
            ['NDZIE',   'Roméo',     'ARB-Q-003', 'quatrieme', 'Ouest',     'Bafoussam'],
            ['MANG',    'Arnaud',    'ARB-Q-004', 'quatrieme', 'Est',       'Bertoua'],
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
    // Helper
    // =========================================================================
    private function makeSlug(string $nom): string
    {
        return strtolower(preg_replace('/[^a-z0-9]+/i', '-', $nom));
    }
}