<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\Competition;
use App\Models\Phase;
use App\Models\Poule;
use App\Models\Rencontre;
use App\Models\Saison;
use App\Models\ReglesCompetition;
use App\Models\ClassementClub;
use App\Models\Penalite;
use App\Models\MatchEvent;
use App\Services\ClassementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassementServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ClassementService $classementService;
    protected Saison $saison;
    protected Competition $competition;
    protected Phase $phase;
    protected Poule $poule;
    protected Club $clubA;
    protected Club $clubB;
    protected Club $clubC;
    protected \App\Models\User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->classementService = new ClassementService();

        // Create admin user for penalty attribution
        $this->adminUser = \App\Models\User::create([
            'nom' => 'Admin',
            'prenom' => 'Fecafoot',
            'email' => 'admin@fecafoot.org',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // 1. Saison
        $this->saison = Saison::create([
            'intitule' => 'Saison 2026',
            'date_debut' => '2026-01-01',
            'date_fin' => '2026-12-31',
            'statut' => 'en_cours',
        ]);

        // 2. Compétition
        $this->competition = Competition::create([
            'saison_id' => $this->saison->id,
            'niveau' => 'elite_one',
            'nom' => 'Elite One 2026',
            'statut' => 'en_cours',
        ]);

        // 3. Règles
        ReglesCompetition::create([
            'competition_id' => $this->competition->id,
            'nb_clubs' => 8,
            'format' => 'poules_multiples',
            'nb_poules' => 2,
            'nb_matchs_par_club' => 14,
            'a_playoffs' => true,
            'nb_clubs_playoffs_up' => 2,
            'nb_clubs_playoffs_down' => 2,
            'points_reportes_playoffs' => false,
            'a_barrage' => false,
            'nb_promus_directs' => 2,
            'nb_relegues_directs' => 2,
            'points_victoire' => 3,
            'points_nul' => 1,
            'points_defaite' => 0,
            'criteres_egalite' => ['points', 'diff_buts', 'buts_pour', 'confrontation_directe', 'fair_play', 'tirage_au_sort'],
        ]);

        // 4. Phase
        $this->phase = Phase::create([
            'competition_id' => $this->competition->id,
            'nom' => 'Phase Régulière',
            'type' => 'reguliere',
            'ordre' => 1,
            'statut' => 'en_cours',
        ]);

        // 5. Poule
        $this->poule = Poule::create([
            'phase_id' => $this->phase->id,
            'nom' => 'Poule A',
            'nb_equipes' => 4,
        ]);

        // 6. Clubs
        $this->clubA = Club::create(['nom' => 'Coton Sport', 'ville' => 'Garoua', 'code' => 'COT', 'est_actif' => true, 'division' => 'elite_one']);
        $this->clubB = Club::create(['nom' => 'Canon Yaoundé', 'ville' => 'Yaoundé', 'code' => 'CAN', 'est_actif' => true, 'division' => 'elite_one']);
        $this->clubC = Club::create(['nom' => 'Union Douala', 'ville' => 'Douala', 'code' => 'UNI', 'est_actif' => true, 'division' => 'elite_one']);

        // Attacher à la poule
        $this->poule->clubs()->attach($this->clubA->id, ['saison_id' => $this->saison->id]);
        $this->poule->clubs()->attach($this->clubB->id, ['saison_id' => $this->saison->id]);
        $this->poule->clubs()->attach($this->clubC->id, ['saison_id' => $this->saison->id]);
    }

    /**
     * Teste le calcul de base des points et de la différence de buts.
     */
    public function test_recalcul_points_et_difference_buts()
    {
        // Match 1 : A - B (2 - 1)
        Rencontre::create([
            'competition_id' => $this->competition->id,
            'phase_id' => $this->phase->id,
            'poule_id' => $this->poule->id,
            'journee' => 1,
            'club_domicile_id' => $this->clubA->id,
            'club_exterieur_id' => $this->clubB->id,
            'score_domicile_terrain' => 2,
            'score_exterieur_terrain' => 1,
            'statut' => 'homologue',
        ]);

        // Match 2 : B - C (3 - 0)
        Rencontre::create([
            'competition_id' => $this->competition->id,
            'phase_id' => $this->phase->id,
            'poule_id' => $this->poule->id,
            'journee' => 1,
            'club_domicile_id' => $this->clubB->id,
            'club_exterieur_id' => $this->clubC->id,
            'score_domicile_terrain' => 3,
            'score_exterieur_terrain' => 0,
            'statut' => 'homologue',
        ]);

        // Match 3 : C - A (1 - 1)
        Rencontre::create([
            'competition_id' => $this->competition->id,
            'phase_id' => $this->phase->id,
            'poule_id' => $this->poule->id,
            'journee' => 2,
            'club_domicile_id' => $this->clubC->id,
            'club_exterieur_id' => $this->clubA->id,
            'score_domicile_terrain' => 1,
            'score_exterieur_terrain' => 1,
            'statut' => 'homologue',
        ]);

        $this->classementService->recalculerPoule($this->poule->id);

        // Vérifier le classement de Club A (1 G, 1 N -> 4 pts, BP=3, BC=2, diff=+1)
        $classA = ClassementClub::where('club_id', $this->clubA->id)->first();
        $this->assertEquals(4, $classA->points);
        $this->assertEquals(1, $classA->victoires);
        $this->assertEquals(1, $classA->nuls);
        $this->assertEquals(0, $classA->defaites);
        $this->assertEquals(3, $classA->buts_pour);
        $this->assertEquals(2, $classA->buts_contre);
        $this->assertEquals(1, $classA->diff_buts);
        $this->assertEquals(1, $classA->position); // Leader

        // Vérifier le classement de Club B (1 G, 1 P -> 3 pts, BP=4, BC=2, diff=+2)
        $classB = ClassementClub::where('club_id', $this->clubB->id)->first();
        $this->assertEquals(3, $classB->points);
        $this->assertEquals(2, $classB->position);

        // Vérifier le classement de Club C (1 N, 1 P -> 1 pt, BP=1, BC=4, diff=-3)
        $classC = ClassementClub::where('club_id', $this->clubC->id)->first();
        $this->assertEquals(1, $classC->points);
        $this->assertEquals(3, $classC->position);
    }

    /**
     * Teste qu'une pénalité de points modifie le total net et l'ordre des positions.
     */
    public function test_penalite_de_points_recule_le_club()
    {
        // Match 1 : A - B (2 - 1)
        Rencontre::create([
            'competition_id' => $this->competition->id,
            'phase_id' => $this->phase->id,
            'poule_id' => $this->poule->id,
            'journee' => 1,
            'club_domicile_id' => $this->clubA->id,
            'club_exterieur_id' => $this->clubB->id,
            'score_domicile_terrain' => 2,
            'score_exterieur_terrain' => 1,
            'statut' => 'homologue',
        ]);

        // Match 2 : B - C (3 - 0)
        Rencontre::create([
            'competition_id' => $this->competition->id,
            'phase_id' => $this->phase->id,
            'poule_id' => $this->poule->id,
            'journee' => 1,
            'club_domicile_id' => $this->clubB->id,
            'club_exterieur_id' => $this->clubC->id,
            'score_domicile_terrain' => 3,
            'score_exterieur_terrain' => 0,
            'statut' => 'homologue',
        ]);

        // Appliquer 2 points de pénalité à Club A
        Penalite::create([
            'club_id' => $this->clubA->id,
            'saison_id' => $this->saison->id,
            'points_retires' => 2,
            'motif' => 'Retard de paiement administratifs',
            'active' => true,
            'type' => 'retrait_points',
            'appliquee_par_id' => $this->adminUser->id,
            'date_application' => now(),
        ]);

        $this->classementService->recalculerPoule($this->poule->id);

        // Club A : 3 points bruts - 2 points de pénalité = 1 point net
        // Club B : 3 points nets (sans pénalité) -> passe premier
        $classA = ClassementClub::where('club_id', $this->clubA->id)->first();
        $classB = ClassementClub::where('club_id', $this->clubB->id)->first();

        $this->assertEquals(3, $classA->points);
        $this->assertEquals(2, $classA->points_penalite);
        $this->assertEquals(2, $classA->position); // Reclassé deuxième

        $this->assertEquals(3, $classB->points);
        $this->assertEquals(0, $classB->points_penalite);
        $this->assertEquals(1, $classB->position); // Devenu premier
    }

    /**
     * Teste le critère de confrontation directe (mini-championnat) en cas d'égalité.
     */
    public function test_confrontation_directe_en_cas_degalite_points_et_diff()
    {
        // Situation : Club A bat Club B (1-0), Club B bat Club A (0-0 - non, let's make it symmetric)
        // A bat B : 1-0 à domicile
        Rencontre::create([
            'competition_id' => $this->competition->id,
            'phase_id' => $this->phase->id,
            'poule_id' => $this->poule->id,
            'journee' => 1,
            'club_domicile_id' => $this->clubA->id,
            'club_exterieur_id' => $this->clubB->id,
            'score_domicile_terrain' => 1,
            'score_exterieur_terrain' => 0,
            'statut' => 'homologue',
        ]);

        // B bat C : 1-0 à domicile
        Rencontre::create([
            'competition_id' => $this->competition->id,
            'phase_id' => $this->phase->id,
            'poule_id' => $this->poule->id,
            'journee' => 2,
            'club_domicile_id' => $this->clubB->id,
            'club_exterieur_id' => $this->clubC->id,
            'score_domicile_terrain' => 1,
            'score_exterieur_terrain' => 0,
            'statut' => 'homologue',
        ]);

        // C bat A : 1-0 à domicile
        Rencontre::create([
            'competition_id' => $this->competition->id,
            'phase_id' => $this->phase->id,
            'poule_id' => $this->poule->id,
            'journee' => 3,
            'club_domicile_id' => $this->clubC->id,
            'club_exterieur_id' => $this->clubA->id,
            'score_domicile_terrain' => 1,
            'score_exterieur_terrain' => 0,
            'statut' => 'homologue',
        ]);

        $this->classementService->recalculerPoule($this->poule->id);

        // Tous les clubs ont 3 points, BP=1, BC=1, Diff=0.
        // La confrontation directe entre deux clubs est appliquée de façon récursive dans comparerClubs.
        // Par exemple pour A et B, le match direct (1-0 pour A) classe A devant B.
        $classA = ClassementClub::where('club_id', $this->clubA->id)->first();
        $classB = ClassementClub::where('club_id', $this->clubB->id)->first();
        $classC = ClassementClub::where('club_id', $this->clubC->id)->first();

        // A bat B -> A doit être classé devant B
        $this->assertTrue($classA->position < $classB->position);
    }
}
