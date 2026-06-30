<?php

namespace Database\Seeders;

use App\Models\Club;
use App\Models\Competition;
use App\Models\Phase;
use App\Models\Poule;
use App\Models\Saison;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class Module2TestSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🏆 Module 2 — Seeding saisons & compétitions...');

        // ──────────────────────────────────────────────────────────
        // 1. Saison terminée 2024-2025
        // ──────────────────────────────────────────────────────────
        $saisonPasse = Saison::firstOrCreate(
            ['intitule' => '2024-2025'],
            [
                'date_debut' => Carbon::parse('2024-09-01'),
                'date_fin'   => Carbon::parse('2025-07-31'),
                'statut'     => 'terminee',
            ]
        );
        $this->command->line("   ✓ Saison créée : {$saisonPasse->intitule} (terminée)");

        // ──────────────────────────────────────────────────────────
        // 2. Saison planifiée 2025-2026
        // ──────────────────────────────────────────────────────────
        $saisonCourante = Saison::firstOrCreate(
            ['intitule' => '2025-2026'],
            [
                'date_debut' => Carbon::parse('2025-09-01'),
                'date_fin'   => Carbon::parse('2026-07-31'),
                'statut'     => 'planifiee',
            ]
        );
        $this->command->line("   ✓ Saison créée : {$saisonCourante->intitule} (planifiée)");

        // ──────────────────────────────────────────────────────────
        // 3. Compétitions Elite One + Elite Two (saison courante)
        // ──────────────────────────────────────────────────────────
        $eliteOne = Competition::firstOrCreate(
            ['saison_id' => $saisonCourante->id, 'niveau' => 'elite_one'],
            [
                'nom'    => 'MTN Elite One 2025-2026',
                'statut' => 'planifiee',
            ]
        );

        $eliteTwo = Competition::firstOrCreate(
            ['saison_id' => $saisonCourante->id, 'niveau' => 'elite_two'],
            [
                'nom'    => 'Elite Two 2025-2026',
                'statut' => 'planifiee',
            ]
        );

        $this->command->line("   ✓ Compétitions créées : Elite One & Elite Two");

        // ──────────────────────────────────────────────────────────
        // 4. Règles Elite One (12 clubs, 1 poule)
        // ──────────────────────────────────────────────────────────
        $eliteOne->regles()->updateOrCreate(
            ['competition_id' => $eliteOne->id],
            [
                'nb_clubs'                 => 12,
                'format'                   => 'poule_unique',
                'nb_poules'                => 1,
                'nb_matchs_par_club'       => 22,
                'a_playoffs'               => true,
                'nb_clubs_playoffs_up'     => 4,
                'nb_clubs_playoffs_down'   => 4,
                'points_reportes_playoffs' => false,
                'a_barrage'                => true,
                'nb_clubs_barrage'         => 2,
                'nb_promus_directs'        => 0,
                'nb_relegues_directs'      => 2,
                'criteres_egalite'         => ['points', 'diff_buts', 'buts_pour', 'confrontation_directe'],
                'points_victoire'          => 3,
                'points_nul'               => 1,
                'points_defaite'           => 0,
                'score_forfait_vainqueur'  => 3,
                'score_forfait_perdant'    => 0,
                'points_penalite_forfait'  => 0,
            ]
        );

        // ──────────────────────────────────────────────────────────
        // 5. Règles Elite Two (16 clubs, 2 poules)
        // ──────────────────────────────────────────────────────────
        $eliteTwo->regles()->updateOrCreate(
            ['competition_id' => $eliteTwo->id],
            [
                'nb_clubs'                 => 16,
                'format'                   => 'poules_multiples',
                'nb_poules'                => 2,
                'nb_matchs_par_club'       => 14,
                'a_playoffs'               => true,
                'nb_clubs_playoffs_up'     => 4,
                'nb_clubs_playoffs_down'   => 4,
                'points_reportes_playoffs' => false,
                'a_barrage'                => true,
                'nb_clubs_barrage'         => 2,
                'nb_promus_directs'        => 2,
                'nb_relegues_directs'      => 2,
                'criteres_egalite'         => ['points', 'diff_buts', 'buts_pour', 'confrontation_directe'],
                'points_victoire'          => 3,
                'points_nul'               => 1,
                'points_defaite'           => 0,
                'score_forfait_vainqueur'  => 3,
                'score_forfait_perdant'    => 0,
                'points_penalite_forfait'  => 0,
            ]
        );

        $this->command->line("   ✓ Règles configurées pour les deux compétitions");

        // ──────────────────────────────────────────────────────────
        // 6. Phases Elite One
        // ──────────────────────────────────────────────────────────
        if ($eliteOne->phases()->count() === 0) {
            $phaseReg1 = Phase::create([
                'competition_id' => $eliteOne->id,
                'nom'            => 'Phase Régulière',
                'type'           => 'reguliere',
                'ordre'          => 1,
                'statut'         => 'planifiee',  // ⭐ corrigé
                'est_terminee'   => false,
            ]);

            $poule1 = Poule::create([
                'phase_id'   => $phaseReg1->id,
                'nom'        => 'Poule Unique',
                'nb_equipes' => 12,
            ]);

            Phase::create([
                'competition_id' => $eliteOne->id,
                'nom'            => 'Playoffs Montée',
                'type'           => 'playoff_up',
                'ordre'          => 2,
                'statut'         => 'planifiee',  // ⭐ corrigé (était 'en_attente')
                'est_terminee'   => false,
            ]);

            Phase::create([
                'competition_id' => $eliteOne->id,
                'nom'            => 'Playoffs Maintien',
                'type'           => 'playoff_down',
                'ordre'          => 3,
                'statut'         => 'planifiee',  // ⭐ corrigé (était 'en_attente')
                'est_terminee'   => false,
            ]);

            // Affecter les 12 premiers clubs Elite One à la poule
            $clubsE1 = Club::where('division', 'elite_one')->where('est_actif', true)->take(12)->get();
            foreach ($clubsE1 as $index => $club) {
                $poule1->clubs()->syncWithoutDetaching([
                    $club->id => [
                        'saison_id'        => $saisonCourante->id,
                        'ordre_tirage'     => $index + 1,
                        'date_affectation' => now()->toDateString(),
                    ]
                ]);
            }

            $this->command->line("   ✓ Phases Elite One générées + {$clubsE1->count()} clubs affectés");
        }

        // ──────────────────────────────────────────────────────────
        // 7. Phases Elite Two
        // ──────────────────────────────────────────────────────────
        if ($eliteTwo->phases()->count() === 0) {
            $phaseReg2 = Phase::create([
                'competition_id' => $eliteTwo->id,
                'nom'            => 'Phase Régulière',
                'type'           => 'reguliere',
                'ordre'          => 1,
                'statut'         => 'planifiee',  // ⭐ corrigé (était 'en_cours')
                'est_terminee'   => false,
            ]);

            $pouleA = Poule::create([
                'phase_id'   => $phaseReg2->id,
                'nom'        => 'Poule A',
                'nb_equipes' => 8,
            ]);
            $pouleB = Poule::create([
                'phase_id'   => $phaseReg2->id,
                'nom'        => 'Poule B',
                'nb_equipes' => 8,
            ]);

            Phase::create([
                'competition_id' => $eliteTwo->id,
                'nom'            => 'Playoffs Montée',
                'type'           => 'playoff_up',
                'ordre'          => 2,
                'statut'         => 'planifiee',  // ⭐ corrigé (était 'en_attente')
                'est_terminee'   => false,
            ]);

            // Répartir les clubs Elite Two dans les 2 poules
            $clubsE2 = Club::where('division', 'elite_two')->where('est_actif', true)->take(16)->get();
            $half = $clubsE2->chunk(8);

            foreach ($half->get(0, collect()) as $idx => $club) {
                $pouleA->clubs()->syncWithoutDetaching([
                    $club->id => [
                        'saison_id'        => $saisonCourante->id,
                        'ordre_tirage'     => $idx + 1,
                        'date_affectation' => now()->toDateString(),
                    ]
                ]);
            }
            foreach ($half->get(1, collect()) as $idx => $club) {
                $pouleB->clubs()->syncWithoutDetaching([
                    $club->id => [
                        'saison_id'        => $saisonCourante->id,
                        'ordre_tirage'     => $idx + 1,
                        'date_affectation' => now()->toDateString(),
                    ]
                ]);
            }

            $this->command->line("   ✓ Phases Elite Two générées + {$clubsE2->count()} clubs répartis (Poule A & B)");
        }

        $this->command->info('✅ Module 2 seeding terminé !');
    }
}