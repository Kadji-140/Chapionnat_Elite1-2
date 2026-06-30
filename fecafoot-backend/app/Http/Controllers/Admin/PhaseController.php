<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PhaseResource;
use App\Models\Competition;
use App\Models\Phase;
use Illuminate\Http\JsonResponse;

class PhaseController extends Controller
{
    /**
     * GET /api/admin/competitions/{competition}/phases
     */
    public function index(int $competitionId): JsonResponse
    {
        $competition = Competition::findOrFail($competitionId);
        $phases = $competition->phases()->with('poules.clubs')->get();

        return response()->json([
            'success' => true,
            'data'    => PhaseResource::collection($phases),
        ]);
    }

    /**
     * POST /api/admin/competitions/{competition}/phases/generer
     * Génère automatiquement les phases selon les règles de la compétition.
     */
public function generer(int $competitionId): JsonResponse
{
    $competition = Competition::with('regles', 'phases')->findOrFail($competitionId);

    if ($competition->phases->isNotEmpty()) {
        return response()->json([
            'success' => false,
            'message' => 'Des phases existent déjà pour cette compétition. Supprimez-les d\'abord.',
        ], 422);
    }

    $regles = $competition->regles;
    if (!$regles) {
        return response()->json([
            'success' => false,
            'message' => 'Les règles de la compétition doivent être configurées avant de générer les phases.',
        ], 422);
    }

    $phases = [];
    $ordre = 1;

    // Phase régulière
    $phaseReg = Phase::create([
        'competition_id' => $competition->id,
        'nom'            => 'Phase Régulière',
        'type'           => 'reguliere',
        'ordre'          => $ordre++,
        'statut'         => 'planifiee',
        'est_terminee'   => false,
    ]);

    for ($i = 1; $i <= $regles->nb_poules; $i++) {
        $nomPoule = $regles->nb_poules === 1
            ? 'Poule Unique'
            : 'Poule ' . chr(64 + $i);
        $clubsParPoule = $regles->nb_poules > 0
            ? (int) floor($regles->nb_clubs / $regles->nb_poules)
            : $regles->nb_clubs;

        $phaseReg->poules()->create([
            'nom'        => $nomPoule,
            'nb_equipes' => $clubsParPoule,
        ]);
    }
    $phases[] = $phaseReg;

    // Playoffs UP
    if ($regles->a_playoffs && $regles->nb_clubs_playoffs_up > 0) {
        $phaseUp = Phase::create([
            'competition_id' => $competition->id,
            'nom'            => 'Playoffs Montée',
            'type'           => 'playoff_up',
            'ordre'          => $ordre++,
            'statut'         => 'planifiee',
            'est_terminee'   => false,
        ]);
        $phaseUp->poules()->create([
            'nom'        => 'Playoffs UP',
            'nb_equipes' => $regles->nb_clubs_playoffs_up,
        ]);
        $phases[] = $phaseUp;
    }

    // Playoffs DOWN
    if ($regles->a_playoffs && $regles->nb_clubs_playoffs_down > 0) {
        $phaseDown = Phase::create([
            'competition_id' => $competition->id,
            'nom'            => 'Playoffs Maintien',
            'type'           => 'playoff_down',
            'ordre'          => $ordre++,
            'statut'         => 'planifiee',
            'est_terminee'   => false,
        ]);
        $phaseDown->poules()->create([
            'nom'        => 'Playoffs DOWN',
            'nb_equipes' => $regles->nb_clubs_playoffs_down,
        ]);
        $phases[] = $phaseDown;
    }

    // Barrage
    if ($regles->a_barrage && $regles->nb_clubs_barrage > 0) {
        $phaseBarrage = Phase::create([
            'competition_id' => $competition->id,
            'nom'            => 'Barrage',
            'type'           => 'barrage',
            'ordre'          => $ordre++,
            'statut'         => 'planifiee',
            'est_terminee'   => false,
        ]);
        $phaseBarrage->poules()->create([
            'nom'        => 'Barrage',
            'nb_equipes' => $regles->nb_clubs_barrage,
        ]);
        $phases[] = $phaseBarrage;
    }

    // ⭐ CORRIGÉ : Charger les poules avant d'envoyer la réponse
    foreach ($phases as $phase) {
        $phase->load('poules');
    }

    // Activer la première phase
    $phases[0]->update(['statut' => 'en_cours']);

    return response()->json([
        'success' => true,
        'message' => count($phases) . ' phase(s) générée(s) avec succès.',
        'data'    => PhaseResource::collection($phases),
    ], 201);
}

    /**
     * PATCH /api/admin/phases/{phase}/basculer
     * Passe à la phase suivante (gèle la phase actuelle).
     */
    public function basculer(int $phaseId): JsonResponse
    {
        $phase = Phase::with('competition.phases')->findOrFail($phaseId);

        if ($phase->statut !== 'en_cours') {
            return response()->json([
                'success' => false,
                'message' => 'Seule la phase en cours peut être basculée.',
            ], 422);
        }

        // Vérifier que tous les matchs de cette phase sont terminés et validés (homologués ou annulés)
        $nonValides = \App\Models\Rencontre::where('phase_id', $phaseId)
            ->where('est_homologue', false)
            ->where('statut', '!=', 'annule')
            ->count();

        if ($nonValides > 0) {
            return response()->json([
                'success' => false,
                'message' => "Impossible de basculer : il reste {$nonValides} match(s) non validé(s) (homologation ou tapis vert requis) dans cette phase.",
            ], 422);
        }

        // Geler la phase actuelle
        $phase->update([
            'statut'       => 'terminee',
            'est_terminee' => true,
        ]);

        // Trouver la phase suivante
        $phaseSuivante = $phase->competition->phases
            ->where('ordre', '>', $phase->ordre)
            ->sortBy('ordre')
            ->first();

        if (!$phaseSuivante) {
            return response()->json([
                'success' => true,
                'message' => 'Phase terminée. C\'est la dernière phase de la compétition.',
                'data'    => new PhaseResource($phase),
            ]);
        }

        $phaseSuivante->update(['statut' => 'en_cours']);

        return response()->json([
            'success' => true,
            'message' => "Basculement réussi vers \"{$phaseSuivante->nom}\".",
            'data'    => new PhaseResource($phaseSuivante),
        ]);
    }
}
