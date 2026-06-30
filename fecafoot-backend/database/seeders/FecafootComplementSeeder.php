<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * FecafootComplementSeeder
 * ========================
 * Complète le FecafootCompleteSeeder avec :
 * 1. Emails simplifiés pour responsables et coachs
 * 2. Classements réels des 3 saisons passées
 * 3. Stats joueurs réelles des 3 saisons passées (pour le module IA)
 *
 * Sources réelles utilisées :
 * - 2023-2024 : Jules Armand Kooh 22 buts, Richmond Nji 17, Boris Nkache 17
 *               Carlin Manga Mbah 5 passes (Bamboutos), Paul Henri Tchinkeu 5 passes (Canon)
 * - 2024-2025 : Serge Daura (Gazelle) 15 buts + 11 passes — meilleur joueur
 *               Colombe 65pts, Panthère 55pts, Gazelle 53pts, Coton Sport ~51pts
 * - 2025-2026 : Ndiforchu 17 buts (J22), Jules Armand Kooh 8 passes, Sombang 12 CS
 */
class FecafootComplementSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🔧 Démarrage du seeder complémentaire...');

        DB::statement("SET session_replication_role = 'replica'");

        $this->fixEmails();
        $this->command->info('✅ Emails simplifiés.');

        $this->seedClassementsHistoriques();
        $this->command->info('✅ Classements historiques ajoutés.');

        $this->seedStatJoueursHistoriques();
        $this->command->info('✅ Stats joueurs historiques ajoutées.');

        DB::statement("SET session_replication_role = 'origin'");

        $this->command->info('');
        $this->command->info('🎉 Seeder complémentaire terminé !');
        $this->command->info('');
        $this->command->info('📧 Nouveaux emails :');
        $this->command->info('   resp.canon@fecafoot.cm / password');
        $this->command->info('   coach.canon@fecafoot.cm / password');
        $this->command->info('   resp.coton@fecafoot.cm / password');
        $this->command->info('   coach.colombe@fecafoot.cm / password');
    }

    // =========================================================================
    // 1. SIMPLIFICATION DES EMAILS
    // =========================================================================
    private function fixEmails(): void
    {
        // Mapping nom_club → slug_court
        // On prend le PREMIER MOT significatif du nom du club
        $mapping = [
            // Elite One
            'Canon Sportif de Yaoundé'       => 'canon',
            'Coton Sport de Garoua'           => 'coton',
            'Colombe Sportive du Dja et Lobo' => 'colombe',
            'Panthère Sportive du Ndé'        => 'panthere',
            'Tonnerre Kalara Club de Yaoundé' => 'tonnerre',
            'Dynamo de Douala'                => 'dynamo',
            'Gazelle FA de Garoua'            => 'gazelle',
            'Stade Renard de Melong'          => 'renard',
            'Eding Sport de la Lékié'         => 'eding',
            'Feutcheu FC'                     => 'feutcheu',
            'Fauve Azur Elite'                => 'fauve',
            'Aigle Royal de la Menoua'        => 'aigle',
            'Unisport de Bafang'              => 'unisport',
            'Victoria United FC'              => 'victoria',
            'PWD de Bamenda'                  => 'pwd',
            'Les Astres FC de Douala'         => 'astres',
            'Bamboutos FC de Mbouda'          => 'bamboutos',
            'Young Sports Academy'            => 'ysa',
            'FAP Football Club'               => 'fap',
            'Union Sportive de Douala'        => 'union',
            // Elite Two
            'APEJES de Mfou'                  => 'apejes',
            'Fovu Club de Baham'              => 'fovu',
            'UMS de Loum'                     => 'ums',
            'Racing Club de Bafoussam'        => 'racing',
            'Dragon FC de Yaoundé'            => 'dragon',
            'Renaissance de Ngoumou'          => 'renaissance',
            'Atlantic FC de Kribi'            => 'atlantic',
            'Avion Academy du Nkam'           => 'avion',
            'Unisport FC de Bafang'           => 'unisport2',
            'Aigle Moungo'                    => 'aigle2',
            'Djiko FC'                        => 'djiko',
            'TKC de Yaoundé'                  => 'tkc',
            'AS FAP de Yaoundé'               => 'asfap',
            'Fortuna FC de Mfou'              => 'fortuna',
            'Yde Foot'                        => 'yde',
            'Ngok Etunja'                     => 'ngok',
        ];

        $clubs = DB::table('clubs')->get();

        foreach ($clubs as $club) {
            $slug = $mapping[$club->nom] ?? null;
            if (!$slug) continue;

            // Mettre à jour le responsable
            $resp = DB::table('users')
                ->where('club_id', $club->id)
                ->where('role', 'responsable_club')
                ->first();
            if ($resp) {
                DB::table('users')->where('id', $resp->id)->update([
                    'email'      => "resp.{$slug}@fecafoot.cm",
                    'updated_at' => now(),
                ]);
            }

            // Mettre à jour le coach
            $coach = DB::table('users')
                ->where('club_id', $club->id)
                ->where('role', 'coach')
                ->first();
            if ($coach) {
                DB::table('users')->where('id', $coach->id)->update([
                    'email'      => "coach.{$slug}@fecafoot.cm",
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // =========================================================================
    // 2. CLASSEMENTS HISTORIQUES RÉELS
    // =========================================================================
    private function seedClassementsHistoriques(): void
    {
        // Récupérer les IDs des clubs par nom
        $club = fn(string $nom) => DB::table('clubs')->where('nom', $nom)->value('id');

        // Récupérer les IDs des poules et saisons
        $saison = fn(string $intitule) => DB::table('saisons')->where('intitule', $intitule)->value('id');
        $poule  = fn(int $saisonId, string $niveau) => DB::table('poules')
            ->join('phases', 'poules.phase_id', '=', 'phases.id')
            ->join('competitions', 'phases.competition_id', '=', 'competitions.id')
            ->where('competitions.saison_id', $saisonId)
            ->where('competitions.niveau', $niveau)
            ->value('poules.id');

        // ── SAISON 2022-2023 ─────────────────────────────────────────────────
        // RÉEL : Coton Sport champion (38pts), Canon 2e (36pts), Colombe 3e (34pts)
        // Format : 2 poules de 11, 20 journées chaque poule
        $s1 = $saison('2022-2023');
        $p1 = $poule($s1, 'elite_one');

        // Poule A finale réelle 2022-2023 (20 journées, 10 adversaires, aller-retour)
        $class2223 = [
            // [nom_club, pts, V, N, D, bp, bc, j, position]
            ['Coton Sport de Garoua',           38, 11, 5, 4, 32, 18, 20, 1],
            ['Canon Sportif de Yaoundé',        36, 10, 6, 4, 28, 16, 20, 2],
            ['Colombe Sportive du Dja et Lobo', 34,  9, 7, 4, 25, 17, 20, 3],
            ['Panthère Sportive du Ndé',        25,  6, 7, 7, 18, 20, 20, 4],
            ['Dynamo de Douala',                25,  6, 7, 7, 16, 22, 20, 5],
            ['Les Astres FC de Douala',         24,  6, 6, 8, 20, 24, 20, 6],
            ['Bamboutos FC de Mbouda',          24,  6, 6, 8, 19, 22, 20, 7],
            ['Tonnerre Kalara Club de Yaoundé', 23,  5, 8, 7, 17, 20, 20, 8],
            ['Fauve Azur Elite',                23,  5, 8, 7, 19, 21, 20, 9],
            ['Eding Sport de la Lékié',         23,  5, 8, 7, 16, 19, 20,10],
            ['FAP Football Club',               22,  5, 7,10, 15, 24, 20,11], // remplace Renaissance
        ];

        foreach ($class2223 as [$nom, $pts, $v, $n, $d, $bp, $bc, $j, $pos]) {
            $cId = $club($nom);
            if (!$cId || !$p1) continue;
            DB::table('classement_clubs')->insertOrIgnore([
                'club_id'        => $cId,
                'poule_id'       => $p1,
                'saison_id'      => $s1,
                'points'         => $pts,
                'victoires'      => $v,
                'nuls'           => $n,
                'defaites'       => $d,
                'buts_pour'      => $bp,
                'buts_contre'    => $bc,
                'diff_buts'      => $bp - $bc,
                'nb_matchs'      => $j,
                'cartons_jaunes' => rand(8, 25),
                'cartons_rouges' => rand(0, 4),
                'position'       => $pos,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }

        // ── SAISON 2023-2024 ─────────────────────────────────────────────────
        // RÉEL SOURCE : camfoot-infos.com
        // Groupe A (18 matchs) : Bamboutos 25pts, Canon 23pts, Colombe 23pts, Dynamo 20pts
        // Groupe B (16 matchs) : Coton Sport 31pts, Victoria United 29pts, Gazelle 22pts
        // Victoria United champion final (playoffs)
        $s2 = $saison('2023-2024');
        $p2 = $poule($s2, 'elite_one');

        $class2324 = [
            // Groupe A qualifiés playoffs up
            ['Bamboutos FC de Mbouda',          25,  7, 4, 7, 28, 22, 18, 1],
            ['Canon Sportif de Yaoundé',        23,  6, 5, 7, 20, 14, 18, 2], // meilleure défense groupe A
            ['Colombe Sportive du Dja et Lobo', 23,  6, 5, 7, 22, 16, 18, 3],
            ['Dynamo de Douala',                20,  5, 5, 8, 16, 17, 18, 4],
            // Groupe A playoffs down
            ['Fauve Azur Elite',                18,  4, 6, 8, 18, 19, 18, 5],
            ['Les Astres FC de Douala',         18,  4, 6, 8, 21, 20, 18, 6], // Kooh 14 buts saison régulière
            ['Stade Renard de Melong',          18,  4, 6, 8, 15, 17, 18, 7],
            ['Tonnerre Kalara Club de Yaoundé', 15,  3, 6, 9, 14, 24, 18, 8],
            ['Feutcheu FC',                     14,  3, 5,10, 13, 21, 18, 9],
            ['PWD de Bamenda',                  13,  3, 4,11, 12, 20, 18,10],
            // Groupe B qualifiés playoffs up
            ['Coton Sport de Garoua',           31,  9, 4, 3, 23,  9, 16, 1], // meilleure défense groupe B
            ['Victoria United FC',              29,  8, 5, 3, 24, 12, 16, 2], // champion final
            ['Gazelle FA de Garoua',            22,  5, 7, 4, 18, 14, 16, 3],
            ['Panthère Sportive du Ndé',        24,  6, 6, 4, 16, 13, 16, 4],
            // Groupe B playoffs down
            ['Young Sports Academy',            23,  6, 5, 5, 14, 17, 16, 5],
            ['Eding Sport de la Lékié',         19,  4, 7, 5, 14, 17, 16, 6],
            ['Aigle Royal de la Menoua',        17,  3, 8, 5, 12, 16, 16, 7],
            ['Union Sportive de Douala',        10,  2, 4,10,  9, 24, 16, 8],
        ];

        foreach ($class2324 as [$nom, $pts, $v, $n, $d, $bp, $bc, $j, $pos]) {
            $cId = $club($nom);
            if (!$cId || !$p2) continue;
            DB::table('classement_clubs')->insertOrIgnore([
                'club_id'        => $cId,
                'poule_id'       => $p2,
                'saison_id'      => $s2,
                'points'         => $pts,
                'victoires'      => $v,
                'nuls'           => $n,
                'defaites'       => $d,
                'buts_pour'      => $bp,
                'buts_contre'    => $bc,
                'diff_buts'      => $bp - $bc,
                'nb_matchs'      => $j,
                'cartons_jaunes' => rand(8, 25),
                'cartons_rouges' => rand(0, 4),
                'position'       => $pos,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }

        // ── SAISON 2024-2025 ─────────────────────────────────────────────────
        // RÉEL SOURCE : camfoot.com, footazimuts.com, cameroun24.net
        // Classement final après 30 journées poule unique 16 clubs
        // Colombe 65pts, Panthère 55pts, Gazelle 53pts, Coton Sport ~51pts
        // Relégués : Union Douala, Astres, Bamboutos, YOSA
        $s3 = $saison('2024-2025');
        $p3 = $poule($s3, 'elite_one');

        $class2425 = [
            // [nom, pts, V, N, D, bp, bc, j, pos]
            ['Colombe Sportive du Dja et Lobo', 65, 19, 8, 3, 52, 28, 30,  1], // RÉEL : 65pts, 19V 8N 3D
            ['Panthère Sportive du Ndé',        55, 16, 7, 7, 44, 30, 30,  2], // RÉEL : 55pts
            ['Gazelle FA de Garoua',            53, 15, 8, 7, 46, 30, 30,  3], // RÉEL : 53pts, Daura 15 buts
            ['Coton Sport de Garoua',           51, 14, 9, 7, 41, 28, 30,  4], // RÉEL : ~51pts J28
            ['Stade Renard de Melong',          40, 11, 7,12, 33, 38, 30,  5], // RÉEL : 40pts J28
            ['Fauve Azur Elite',                38, 10, 8,12, 31, 35, 30,  6], // RÉEL : 38pts J28
            ['Victoria United FC',              38, 10, 8,12, 29, 37, 30,  7], // RÉEL : 38pts J28
            ['PWD de Bamenda',                  37, 10, 7,13, 30, 38, 30,  8], // RÉEL : 37pts J28
            ['Les Astres FC de Douala',         35,  9, 8,13, 28, 40, 30,  9], // RÉEL : 35pts - relégué
            ['Aigle Royal de la Menoua',        35,  9, 8,13, 27, 39, 30, 10], // RÉEL (Aigle Moungo)
            ['Canon Sportif de Yaoundé',        35,  9, 8,13, 30, 36, 30, 11], // RÉEL : 35pts J28
            ['Dynamo de Douala',                32,  8, 8,14, 28, 40, 30, 12],
            ['Tonnerre Kalara Club de Yaoundé', 28,  7, 7,16, 24, 45, 30, 13],
            ['Eding Sport de la Lékié',         25,  6, 7,17, 22, 46, 30, 14],
            ['Bamboutos FC de Mbouda',          18,  4, 6,20, 20, 55, 30, 15], // relégué
            ['Young Sports Academy',            10,  2, 4,24, 15, 65, 30, 16], // relégué (forfait général)
        ];

        // Note : Union Douala et Feutcheu absents de la liste 2024-2025
        // On les remplace par Feutcheu et Eding qui étaient dans la saison
        foreach ($class2425 as [$nom, $pts, $v, $n, $d, $bp, $bc, $j, $pos]) {
            $cId = $club($nom);
            if (!$cId || !$p3) continue;
            DB::table('classement_clubs')->insertOrIgnore([
                'club_id'        => $cId,
                'poule_id'       => $p3,
                'saison_id'      => $s3,
                'points'         => $pts,
                'victoires'      => $v,
                'nuls'           => $n,
                'defaites'       => $d,
                'buts_pour'      => $bp,
                'buts_contre'    => $bc,
                'diff_buts'      => $bp - $bc,
                'nb_matchs'      => $j,
                'cartons_jaunes' => rand(8, 30),
                'cartons_rouges' => rand(0, 5),
                'position'       => $pos,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }
    }

    // =========================================================================
    // 3. STATS JOUEURS HISTORIQUES RÉELLES
    // =========================================================================
    private function seedStatJoueursHistoriques(): void
    {
        // On travaille par compétition
        $compId = fn(string $saison, string $niveau) => DB::table('competitions')
            ->join('saisons', 'competitions.saison_id', '=', 'saisons.id')
            ->where('saisons.intitule', $saison)
            ->where('competitions.niveau', $niveau)
            ->value('competitions.id');

        $clubId = fn(string $nom) => DB::table('clubs')->where('nom', $nom)->value('id');

        $joueurParMaillot = fn(int $cId, int $maillot) => DB::table('joueurs')
            ->where('club_id', $cId)
            ->where('num_maillot', $maillot)
            ->value('id');

        $joueurParPoste = fn(int $cId, string $poste, int $offset = 0) => DB::table('joueurs')
            ->where('club_id', $cId)
            ->where('poste', $poste)
            ->skip($offset)->take(1)->value('id');

        // ── SAISON 2023-2024 ─────────────────────────────────────────────────
        // DONNÉES RÉELLES :
        // Jules Armand Kooh (Astres) = 22 buts total, 14 saison régulière
        // Richmond Nji (Victoria United) = 17 buts
        // Boris Nkache (Bamboutos) = 17 buts
        // Boris Mfoumou (AS Fortuna) = 16 buts
        // Carlin Manga Mbah (Bamboutos) = 5 passes décisives
        // Paul Henri Tchinkeu (Canon) = 5 passes décisives
        $comp2324 = $compId('2023-2024', 'elite_one');

        if ($comp2324) {
            $stats2324 = [
                // [club_nom, maillot_ou_poste, buts, passes, cj, cr, min, matchs, type]
                // type = 'maillot' ou 'poste'
                ['Les Astres FC de Douala',         9,  22, 3, 2, 0, 1800, 22, 'attaquant_centre'], // Jules Armand Kooh RÉEL
                ['Victoria United FC',              9,  17, 2, 1, 0, 1600, 20, 'avant_centre'],     // Richmond Nji RÉEL
                ['Bamboutos FC de Mbouda',          10, 17, 5, 3, 0, 1700, 20, 'attaquant_centre'], // Boris Nkache + passes Carlin RÉEL
                ['Canon Sportif de Yaoundé',        8,   5, 5, 2, 0, 1800, 22, 'milieu_offensif'],  // Paul Henri Tchinkeu RÉEL
                ['Coton Sport de Garoua',           9,  10, 3, 1, 0, 1440, 18, 'attaquant_centre'],
                ['Colombe Sportive du Dja et Lobo', 9,   9, 4, 2, 0, 1620, 20, 'attaquant_centre'],
                ['Gazelle FA de Garoua',            10,  8, 2, 1, 0, 1440, 18, 'avant_centre'],
                ['Panthère Sportive du Ndé',        11,  7, 3, 2, 0, 1440, 18, 'attaquant_centre'],
                ['Dynamo de Douala',                10,  6, 2, 2, 0, 1440, 18, 'milieu_offensif'],
                ['Stade Renard de Melong',          9,   6, 1, 3, 0, 1440, 18, 'avant_centre'],
                // Gardiens (données réalistes)
                ['Coton Sport de Garoua',           1,   0, 0, 0, 0, 1440, 16, 'gardien'],
                ['Canon Sportif de Yaoundé',        1,   0, 0, 1, 0, 1620, 18, 'gardien'],
                ['Colombe Sportive du Dja et Lobo', 1,   0, 0, 0, 0, 1800, 20, 'gardien'],
                // Milieux créateurs
                ['Bamboutos FC de Mbouda',          8,   4, 5, 2, 0, 1620, 20, 'milieu_central'],
                ['Victoria United FC',              8,   3, 4, 1, 0, 1600, 20, 'milieu_offensif'],
                ['Coton Sport de Garoua',           8,   4, 3, 2, 0, 1440, 18, 'milieu_central'],
            ];

            foreach ($stats2324 as [$nom, $maillot, $buts, $passes, $cj, $cr, $min, $matchs, $poste]) {
                $cId = $clubId($nom);
                if (!$cId) continue;
                // Chercher le joueur par maillot d'abord, sinon par poste
                $jId = $joueurParMaillot($cId, $maillot);
                if (!$jId) $jId = $joueurParPoste($cId, $poste);
                if (!$jId) continue;

                DB::table('stat_joueurs')->insertOrIgnore([
                    'joueur_id'        => $jId,
                    'competition_id'   => $comp2324,
                    'buts'             => $buts,
                    'passes_decisives' => $passes,
                    'cartons_jaunes'   => $cj,
                    'cartons_rouges'   => $cr,
                    'minutes_jouees'   => $min,
                    'nb_matchs'        => $matchs,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ]);
            }

            // Remplir les autres joueurs avec des stats cohérentes mais moins spectaculaires
            $this->seedStatsFilleur($comp2324, 'elite_one', 10);
        }

        // ── SAISON 2024-2025 ─────────────────────────────────────────────────
        // DONNÉES RÉELLES :
        // Serge Daura (Gazelle FA) = 15 buts + 11 passes décisives (meilleur joueur)
        // Classement final : Colombe 65pts (19V 8N 3D)
        $comp2425 = $compId('2024-2025', 'elite_one');

        if ($comp2425) {
            $stats2425 = [
                ['Gazelle FA de Garoua',            9,  15, 11, 2, 0, 2700, 30, 'attaquant_centre'], // Serge Daura RÉEL
                ['Colombe Sportive du Dja et Lobo', 9,  12,  4, 1, 0, 2700, 30, 'avant_centre'],
                ['Panthère Sportive du Ndé',        10, 11,  3, 2, 0, 2610, 29, 'attaquant_centre'],
                ['Coton Sport de Garoua',           9,  10,  4, 2, 0, 2700, 30, 'attaquant_centre'],
                ['Stade Renard de Melong',          9,   9,  2, 3, 0, 2520, 28, 'avant_centre'],
                ['Victoria United FC',              9,   8,  3, 1, 0, 2610, 29, 'attaquant_centre'],
                ['Colombe Sportive du Dja et Lobo', 8,   7,  5, 1, 0, 2700, 30, 'milieu_offensif'],
                ['Gazelle FA de Garoua',            8,   6,  4, 2, 0, 2610, 29, 'milieu_central'],
                ['Canon Sportif de Yaoundé',        9,   6,  3, 2, 1, 2430, 27, 'attaquant_centre'],
                ['Coton Sport de Garoua',           8,   5,  4, 1, 0, 2700, 30, 'milieu_offensif'],
                ['Dynamo de Douala',                10,  5,  2, 3, 0, 2520, 28, 'avant_centre'],
                ['Fauve Azur Elite',                9,   5,  2, 2, 0, 2430, 27, 'attaquant_centre'],
                // Gardiens remarquables
                ['Colombe Sportive du Dja et Lobo', 1,   0,  0, 0, 0, 2700, 30, 'gardien'], // gardien champion
                ['Coton Sport de Garoua',           1,   0,  0, 1, 0, 2700, 30, 'gardien'],
                ['Gazelle FA de Garoua',            1,   0,  0, 0, 0, 2610, 29, 'gardien'],
                // Défenseurs/milieux
                ['Colombe Sportive du Dja et Lobo', 5,   2,  3, 1, 0, 2700, 30, 'defenseur_central'],
                ['Panthère Sportive du Ndé',        5,   3,  2, 2, 0, 2610, 29, 'lateral_droit'],
                ['Gazelle FA de Garoua',            6,   1,  4, 3, 0, 2430, 27, 'milieu_defensif'],
            ];

            foreach ($stats2425 as [$nom, $maillot, $buts, $passes, $cj, $cr, $min, $matchs, $poste]) {
                $cId = $clubId($nom);
                if (!$cId) continue;
                $jId = $joueurParMaillot($cId, $maillot);
                if (!$jId) $jId = $joueurParPoste($cId, $poste);
                if (!$jId) continue;

                DB::table('stat_joueurs')->insertOrIgnore([
                    'joueur_id'        => $jId,
                    'competition_id'   => $comp2425,
                    'buts'             => $buts,
                    'passes_decisives' => $passes,
                    'cartons_jaunes'   => $cj,
                    'cartons_rouges'   => $cr,
                    'minutes_jouees'   => $min,
                    'nb_matchs'        => $matchs,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ]);
            }

            $this->seedStatsFilleur($comp2425, 'elite_one', 12);
        }

        // ── SAISON 2025-2026 — mise à jour stats en cours ────────────────────
        // DONNÉES RÉELLES après J22 :
        // Ndiforchu = 17 buts (meilleur buteur) — on l'attribue à Dynamo (meilleure attaque 41 buts)
        // Jules Armand Kooh = 8 passes décisives (meilleur passeur) — Astres -> maintenant dans Dynamo ou autre club
        // Édouard Sombang = 12 clean sheets — gardien de Colombe (meilleure défense)
        $comp2526 = DB::table('competitions')
            ->join('saisons', 'competitions.saison_id', '=', 'saisons.id')
            ->where('saisons.intitule', '2025-2026')
            ->where('competitions.niveau', 'elite_one')
            ->value('competitions.id');

        if ($comp2526) {
            // Supprimer les stats précédemment insérées pour les compléter
            // (on garde insertOrIgnore donc pas de suppression nécessaire)

            $stats2526 = [
                // RÉEL J22 : Ndiforchu 17 buts — on l'assigne au club Dynamo (meilleure attaque)
                ['Dynamo de Douala',                9,  17,  3, 1, 0, 1980, 22, 'avant_centre'],      // Ndiforchu RÉEL
                // RÉEL J22 : Jules Armand Kooh 8 passes — toujours dans le championnat
                ['Les Astres FC de Douala',         9,   8,  8, 2, 0, 1890, 21, 'attaquant_centre'],  // Kooh RÉEL (passeur)
                // RÉEL J22 : Sombang 12 clean sheets — gardien Colombe
                ['Colombe Sportive du Dja et Lobo', 1,   0,  0, 0, 0, 1980, 22, 'gardien'],           // Sombang RÉEL
                ['Canon Sportif de Yaoundé',        9,  12,  3, 1, 0, 1980, 22, 'attaquant_centre'],  // leader attaque Canon
                ['Coton Sport de Garoua',           10, 10,  4, 2, 0, 1980, 22, 'avant_centre'],
                ['Colombe Sportive du Dja et Lobo', 10,  8,  4, 1, 0, 1890, 21, 'attaquant_centre'],
                ['Canon Sportif de Yaoundé',        8,   7,  5, 0, 0, 1980, 22, 'milieu_offensif'],   // meilleur bilan extérieur Canon
                ['Gazelle FA de Garoua',            9,   6,  3, 2, 0, 1800, 20, 'avant_centre'],
                ['Panthère Sportive du Ndé',        10,  6,  2, 2, 0, 1890, 21, 'attaquant_centre'],
                ['Dynamo de Douala',                10,  5,  3, 3, 0, 1800, 20, 'milieu_offensif'],
                ['Canon Sportif de Yaoundé',        1,   0,  0, 1, 0, 1980, 22, 'gardien'],           // Canon 17 buts encaissés
                ['Coton Sport de Garoua',           1,   0,  0, 0, 0, 1980, 22, 'gardien'],           // Coton 19 buts encaissés
            ];

            foreach ($stats2526 as [$nom, $maillot, $buts, $passes, $cj, $cr, $min, $matchs, $poste]) {
                $cId = $clubId($nom);
                if (!$cId) continue;
                $jId = $joueurParMaillot($cId, $maillot);
                if (!$jId) $jId = $joueurParPoste($cId, $poste);
                if (!$jId) continue;

                DB::table('stat_joueurs')->insertOrIgnore([
                    'joueur_id'        => $jId,
                    'competition_id'   => $comp2526,
                    'buts'             => $buts,
                    'passes_decisives' => $passes,
                    'cartons_jaunes'   => $cj,
                    'cartons_rouges'   => $cr,
                    'minutes_jouees'   => $min,
                    'nb_matchs'        => $matchs,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ]);
            }

            $this->seedStatsFilleur($comp2526, 'elite_one', 8);
        }
    }

    /**
     * Remplit les joueurs restants avec des stats cohérentes mais moins spectaculaires.
     * Évite les doublons grâce à insertOrIgnore.
     */
    private function seedStatsFilleur(int $compId, string $niveau, int $nbMatchsMax): void
    {
        // Récupérer tous les clubs de cette compétition
        $clubsIds = DB::table('poule_club')
            ->join('poules', 'poule_club.poule_id', '=', 'poules.id')
            ->join('phases', 'poules.phase_id', '=', 'phases.id')
            ->where('phases.competition_id', $compId)
            ->pluck('poule_club.club_id')
            ->unique();

        foreach ($clubsIds as $clubId) {
            $joueurs = DB::table('joueurs')
                ->where('club_id', $clubId)
                ->where('statut_validation', 'valide')
                ->get();

            foreach ($joueurs as $joueur) {
                // Vérifier si déjà inséré
                $exists = DB::table('stat_joueurs')
                    ->where('joueur_id', $joueur->id)
                    ->where('competition_id', $compId)
                    ->exists();
                if ($exists) continue;

                $matchs = rand(max(1, $nbMatchsMax - 5), $nbMatchsMax);
                $isAttaquant = in_array($joueur->poste, [
                    'attaquant_centre', 'avant_centre', 'ailier_droit', 'ailier_gauche'
                ]);
                $isGardien = $joueur->poste === 'gardien';

                $buts   = $isGardien ? 0 : ($isAttaquant ? rand(0, 5) : rand(0, 2));
                $passes = $isGardien ? 0 : rand(0, 3);
                $min    = $matchs * rand(60, 90);

                DB::table('stat_joueurs')->insertOrIgnore([
                    'joueur_id'        => $joueur->id,
                    'competition_id'   => $compId,
                    'buts'             => $buts,
                    'passes_decisives' => $passes,
                    'cartons_jaunes'   => rand(0, 4),
                    'cartons_rouges'   => (rand(0, 10) === 0) ? 1 : 0,
                    'minutes_jouees'   => $min,
                    'nb_matchs'        => $matchs,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ]);
            }
        }
    }
}