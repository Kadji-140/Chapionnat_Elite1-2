<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use App\Http\Requests\Coach\SauvegarderCompositionRequest;
use App\Http\Resources\CompositionResource;
use App\Http\Resources\MatchResource;
use App\Models\Composition;
use App\Models\CompositionJoueur;
use App\Models\Rencontre;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CoachCompositionController extends Controller
{
    // ──────────────────────────────────────────────────────────────
    // GET /api/coach/matchs-a-venir
    // ──────────────────────────────────────────────────────────────
    public function matchsAVenir(): JsonResponse
    {
        $user = Auth::user();
        $club = $user->club; // relation sur User

        if (!$club) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun club associé à ce coach.',
            ], 422);
        }

        $query = Rencontre::with([
            'clubDomicile', 'clubExterieur',
            'phase.competition', 'poule',
        ])
            ->where(function ($q) use ($club) {
                $q->where('club_domicile_id', $club->id)
                  ->orWhere('club_exterieur_id', $club->id);
            });

        if (request()->has('statut')) {
            $statut = request()->input('statut');
            if (str_contains($statut, ',')) {
                $query->whereIn('statut', explode(',', $statut));
            } else {
                $query->where('statut', $statut);
            }
        } else {
            $query->whereIn('statut', ['programme', 'reporte'])
                  ->where('date_heure', '>=', now());
        }


        $matchs = $query->orderBy('date_heure')
            ->take(20)
            ->get();

        // Attacher le statut de composition à chaque match
        $matchsAvecCompo = $matchs->map(function ($match) use ($club) {
            $compo = Composition::where('match_id', $match->id)
                ->where('club_id', $club->id)
                ->first();

            $data = (new MatchResource($match))->toArray(request());
            $data['composition_statut'] = $compo?->statut ?? 'non_saisie';
            $data['composition_confirmee'] = $compo?->est_confirmee ?? false;
            $data['est_domicile'] = $match->club_domicile_id === $club->id;
            return $data;
        });

        return response()->json([
            'success' => true,
            'data'    => $matchsAvecCompo,
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /api/coach/matchs/{match}/composition
    // ──────────────────────────────────────────────────────────────
    public function show(int $matchId): JsonResponse
    {
        $user = Auth::user();
        $club = $user->club;

        $match = Rencontre::findOrFail($matchId);

        // Vérifier que le coach appartient à un des clubs du match
        if (!$club || !in_array($club->id, [$match->club_domicile_id, $match->club_exterieur_id])) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé.',
            ], 403);
        }

        $composition = Composition::with(['joueurs.joueur'])
            ->where('match_id', $matchId)
            ->where('club_id', $club->id)
            ->first();

        return response()->json([
            'success' => true,
            'data'    => $composition ? new CompositionResource($composition) : null,
            'match'   => new MatchResource($match->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // POST /api/coach/matchs/{match}/composition (brouillon)
    // ──────────────────────────────────────────────────────────────
    public function store(SauvegarderCompositionRequest $request, int $matchId): JsonResponse
    {
        $user = Auth::user();
        $club = $user->club;

        $match = Rencontre::findOrFail($matchId);

        if (!$club || !in_array($club->id, [$match->club_domicile_id, $match->club_exterieur_id])) {
            return response()->json(['success' => false, 'message' => 'Non autorisé.'], 403);
        }

        // Vérifier si le match a déjà commencé ou est terminé (verrouillage uniquement au coup d'envoi)
        if (!in_array($match->statut, ['programme', 'reporte'])) {
            return response()->json([
                'success' => false,
                'message' => 'La composition ne peut plus être modifiée car le match a déjà commencé ou s\'est terminé.',
            ], 422);
        }

        $confirmer = $request->boolean('confirmer', false);

        // Si confirmation demandée directement, faire les validations
        if ($confirmer) {
            $joueursInput = $request->input('joueurs', []);
            $titulaires = array_filter($joueursInput, fn($j) => ($j['role'] ?? 'titulaire') === 'titulaire');
            $capitaine  = array_filter($joueursInput, fn($j) => !empty($j['est_capitaine']));

            if (count($titulaires) !== 11) {
                return response()->json([
                    'success' => false,
                    'message' => 'La composition doit contenir exactement 11 titulaires pour être confirmée.',
                ], 422);
            }

            if (count($capitaine) === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Veuillez désigner un capitaine pour confirmer la composition.',
                ], 422);
            }
        }

        // Récupérer composition existante
        $existante = Composition::where('match_id', $matchId)->where('club_id', $club->id)->first();

        DB::transaction(function () use ($request, $matchId, $club, &$composition, $existante, $confirmer) {
            // Créer ou mettre à jour la composition
            $composition = $existante ?? new Composition();
            $composition->match_id = $matchId;
            $composition->club_id  = $club->id;
            $composition->formation = $request->input('formation');
            $composition->statut   = $confirmer ? 'confirmee' : 'brouillon';
            $composition->est_confirmee = $confirmer;
            $composition->date_confirmation = $confirmer ? now() : null;
            $composition->save();

            // Supprimer les anciens joueurs
            $composition->joueurs()->delete();

            // Insérer les nouveaux joueurs
            foreach ($request->input('joueurs', []) as $j) {
                CompositionJoueur::create([
                    'composition_id' => $composition->id,
                    'joueur_id'      => $j['joueur_id'],
                    'role'           => $j['role'] ?? 'titulaire', // titulaire | remplacant
                    'est_capitaine'  => $j['est_capitaine'] ?? false,
                    'minute_entree'  => $j['minute_entree'] ?? null,
                    'minute_sortie'  => $j['minute_sortie'] ?? null,
                    'poste_id'       => $j['poste_id'] ?? null,
                    'poste_index'    => $j['poste_index'] ?? null,
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => $confirmer ? 'Composition confirmée et transmise ! 🔒' : 'Composition sauvegardée (brouillon).',
            'data'    => new CompositionResource($composition->load('joueurs.joueur')),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // PATCH /api/coach/matchs/{match}/composition/confirmer
    // ──────────────────────────────────────────────────────────────
    public function confirmer(int $matchId): JsonResponse
    {
        $user = Auth::user();
        $club = $user->club;

        $match = Rencontre::findOrFail($matchId);

        if (!$club || !in_array($club->id, [$match->club_domicile_id, $match->club_exterieur_id])) {
            return response()->json(['success' => false, 'message' => 'Non autorisé.'], 403);
        }

        // Vérifier si le match a déjà commencé
        if (!in_array($match->statut, ['programme', 'reporte'])) {
            return response()->json([
                'success' => false,
                'message' => 'La composition ne peut plus être modifiée car le match a déjà commencé ou s\'est terminé.',
            ], 422);
        }

        $composition = Composition::with('joueurs')
            ->where('match_id', $matchId)
            ->where('club_id', $club->id)
            ->first();

        if (!$composition) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune composition à confirmer. Sauvegardez d\'abord un brouillon.',
            ], 422);
        }

        // Vérifier qu'il y a exactement 11 titulaires et un capitaine
        $titulaires = $composition->joueurs->where('role', 'titulaire');
        $capitaine  = $composition->joueurs->where('est_capitaine', true);

        if ($titulaires->count() !== 11) {
            return response()->json([
                'success' => false,
                'message' => "La composition doit contenir exactement 11 titulaires (actuellement: {$titulaires->count()}).",
            ], 422);
        }

        if ($capitaine->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Veuillez désigner un capitaine.',
            ], 422);
        }

        $composition->update([
            'statut'            => 'confirmee',
            'est_confirmee'     => true,
            'date_confirmation' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Composition confirmée et verrouillée. 🔒',
            'data'    => new CompositionResource($composition->fresh('joueurs.joueur')),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /api/coach/compositions/precedente
    // ──────────────────────────────────────────────────────────────
    public function compositionPrecedente(): JsonResponse
    {
        $user = Auth::user();
        $club = $user->club;

        if (!$club) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun club associé à ce coach.',
            ], 422);
        }

        // Trouver la dernière composition enregistrée pour ce club (excluant le match actuel s'il est spécifié)
        $matchIdActuel = request()->query('exclure_match_id');
        
        $query = Composition::with(['joueurs.joueur'])
            ->where('club_id', $club->id);

        if ($matchIdActuel) {
            $query->where('match_id', '!=', $matchIdActuel);
        }

        $composition = $query->orderBy('updated_at', 'desc')->first();

        return response()->json([
            'success' => true,
            'data'    => $composition ? new CompositionResource($composition) : null,
        ]);
    }

    public function getCompositionForClub(int $matchId, int $clubId): JsonResponse
    {
        $composition = Composition::with(['joueurs.joueur'])
            ->where('match_id', $matchId)
            ->where('club_id', $clubId)
            ->first();

        return response()->json([
            'success' => true,
            'data'    => $composition ? new CompositionResource($composition) : null,
        ]);
    }
}
