<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TapisVertRequest;
use App\Http\Requests\Admin\PenaliteRequest;
use App\Http\Resources\MatchResource;
use App\Http\Resources\ContestationResource;
use App\Models\Rencontre;
use App\Models\MatchEvent;
use App\Models\Contestation;
use App\Models\Club;
use App\Models\Penalite;
use App\Models\Poule;
use App\Services\ClassementService;
use App\Services\StatistiqueService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class HomologationController extends Controller
{
    protected ClassementService $classementService;
    protected StatistiqueService $statistiqueService;

    public function __construct(ClassementService $classementService, StatistiqueService $statistiqueService)
    {
        $this->classementService = $classementService;
        $this->statistiqueService = $statistiqueService;
    }

    /**
     * Liste des matchs à homologuer (statut termine ou litige).
     */
    public function matchsAHomologuer(Request $request)
    {
        $matchs = Rencontre::whereIn('statut', ['termine', 'litige'])
            ->with(['clubDomicile', 'clubExterieur', 'events.joueur', 'events.club', 'feuille'])
            ->orderBy('date_heure', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => MatchResource::collection($matchs),
        ]);
    }

    /**
     * Homologuer un match.
     */
    public function homologuer(Request $request, int $id)
    {
        $match = Rencontre::with('feuille')->findOrFail($id);

        // 1. Statut valide (bloquer si litige ou autre que termine)
        if ($match->statut === 'litige') {
            return response()->json(['message' => 'Impossible d\'homologuer le match : ce match est actuellement en litige. Résolvez d\'abord le litige.'], 400);
        }

        if ($match->statut !== 'termine') {
            return response()->json(['message' => 'Seuls les matchs terminés peuvent être homologués.'], 400);
        }

        // 2. Vérifier que la feuille de match a été soumise par le commissaire
        $feuille = $match->feuille;
        if (!$feuille || $feuille->statut !== 'soumise') {
            return response()->json(['message' => 'Impossible d\'homologuer le match : le commissaire n\'a pas encore soumis le rapport final de la rencontre.'], 400);
        }

        // 3. Vérifier qu'il n'y a pas de contestations en attente
        $contestationsEnAttente = \App\Models\Contestation::whereHas('matchEvent', function ($q) use ($match) {
            $q->where('match_id', $match->id);
        })->where('statut', 'soumise')->count();

        if ($contestationsEnAttente > 0) {
            return response()->json([
                'message' => 'Impossible d\'homologuer : ' . $contestationsEnAttente . ' contestation(s) sont encore en attente de traitement sur ce match.'
            ], 400);
        }

        $result = \DB::transaction(function () use ($match) {
            // Valider officiellement les scores terrain
            $match->score_domicile_officiel = $match->score_domicile_terrain;
            $match->score_exterieur_officiel = $match->score_exterieur_terrain;
            $match->statut = 'homologue';
            $match->est_homologue = true;
            $match->date_homologation = now();
            $match->save();

            // Recalculer le classement de la poule
            if ($match->poule_id) {
                $this->classementService->recalculerPoule($match->poule_id);

                // Recalculer les statistiques de la compétition
                $poule = Poule::with('phase')->find($match->poule_id);
                if ($poule && $poule->phase) {
                    $this->statistiqueService->recalculerCompetition($poule->phase->competition_id);
                }
            }

            // Notifier les responsables de clubs
            NotificationService::matchHomologue($match);

            return $match;
        });

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($result->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Mettre un match en litige.
     */
    public function litige(Request $request, int $id)
    {
        $match = Rencontre::findOrFail($id);

        if ($match->statut !== 'termine') {
            return response()->json(['message' => 'Seul un match terminé peut être mis en litige.'], 400);
        }

        $match->statut = 'litige';
        $match->save();

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Lever le litige d'un match (le repasser en termine).
     */
    public function leverLitige(Request $request, int $id)
    {
        $match = Rencontre::findOrFail($id);

        if ($match->statut !== 'litige') {
            return response()->json(['message' => 'Ce match n\'est pas en litige.'], 400);
        }

        $match->statut = 'termine';
        $match->save();

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Appliquer un tapis vert (forfait 3-0).
     */
    public function tapisVert(TapisVertRequest $request, int $id)
    {
        $match = Rencontre::findOrFail($id);

        if ($match->statut === 'homologue') {
            return response()->json(['message' => 'Impossible de modifier un match déjà homologué.'], 400);
        }

        if ($match->statut === 'litige') {
            return response()->json(['message' => 'Impossible d\'appliquer un tapis vert : ce match est actuellement en litige. Résolvez d\'abord le litige.'], 400);
        }

        $validated = $request->validated();
        $winnerId = $validated['club_vainqueur_id'];

        if ($winnerId !== $match->club_domicile_id && $winnerId !== $match->club_exterieur_id) {
            return response()->json(['message' => 'Le club vainqueur doit être l\'un des deux clubs du match.'], 400);
        }

        $loserId = ($winnerId === $match->club_domicile_id) ? $match->club_exterieur_id : $match->club_domicile_id;

        $result = \DB::transaction(function () use ($match, $winnerId, $loserId) {
            $match->est_forfait = true;
            $match->club_forfait_id = $loserId;
            
            // Score officiel forcé à 3-0
            $match->score_domicile_officiel = ($winnerId === $match->club_domicile_id) ? 3 : 0;
            $match->score_exterieur_officiel = ($winnerId === $match->club_exterieur_id) ? 3 : 0;
            
            $match->statut = 'homologue';
            $match->est_homologue = true;
            $match->date_homologation = now();
            $match->save();

            // Recalculer le classement de la poule
            if ($match->poule_id) {
                $this->classementService->recalculerPoule($match->poule_id);

                // Recalculer les statistiques de la compétition
                $poule = Poule::with('phase')->find($match->poule_id);
                if ($poule && $poule->phase) {
                    $this->statistiqueService->recalculerCompetition($poule->phase->competition_id);
                }
            }

            // Notifier les responsables
            NotificationService::matchHomologue($match);

            return $match;
        });

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($result->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Liste de toutes les contestations.
     */
    public function contestations(Request $request)
    {
        $contestations = Contestation::with([
            'matchEvent.match.clubDomicile', 
            'matchEvent.match.clubExterieur', 
            'coach.club', 
            'matchEvent.joueur'
        ])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data'    => ContestationResource::collection($contestations),
        ]);
    }

    /**
     * Accepter une contestation et corriger/annuler l'événement du match.
     */
    public function accepterContestation(Request $request, int $id)
    {
        $contestation = Contestation::findOrFail($id);

        if ($contestation->statut !== 'soumise') {
            return response()->json(['message' => 'Cette contestation a déjà été traitée.'], 400);
        }

        $decision = $request->input('decision', 'Contestation acceptée par l\'administrateur.');

        $result = \DB::transaction(function () use ($contestation, $decision, $request) {
            $contestation->statut = 'acceptee';
            $contestation->decision = $decision;
            $contestation->traitee_par_id = $request->user()->id;
            $contestation->date_decision = now();
            $contestation->save();

            // Invalider l'événement de match lié
            $event = $contestation->matchEvent;
            $event->statut = 'annule';
            $event->save();

            // Recalculer le score terrain du match
            $match = $event->match;
            $this->recalculerScoreRencontre($match);

            // Notifier le coach
            NotificationService::contestationTraitee($contestation);

            return $contestation;
        });

        return response()->json([
            'success' => true,
            'data'    => new ContestationResource($result->load('matchEvent', 'coach.club')),
        ]);
    }

    /**
     * Rejeter une contestation.
     */
    public function rejeterContestation(Request $request, int $id)
    {
        $contestation = Contestation::findOrFail($id);

        if ($contestation->statut !== 'soumise') {
            return response()->json(['message' => 'Cette contestation a déjà été traitée.'], 400);
        }

        $decision = $request->input('decision', 'Contestation rejetée par l\'administrateur.');

        $result = \DB::transaction(function () use ($contestation, $decision, $request) {
            $contestation->statut = 'rejete';
            $contestation->decision = $decision;
            $contestation->traitee_par_id = $request->user()->id;
            $contestation->date_decision = now();
            $contestation->save();

            // Notifier le coach
            NotificationService::contestationTraitee($contestation);

            return $contestation;
        });

        return response()->json([
            'success' => true,
            'data'    => new ContestationResource($result->load('matchEvent', 'coach.club')),
        ]);
    }

    /**
     * Appliquer une pénalité de points à un club.
     */
    public function appliquerPenalite(PenaliteRequest $request, int $clubId)
    {
        $club = Club::findOrFail($clubId);
        $validated = $request->validated();

        // 1. Vérifier que le club est actif
        if (!$club->est_actif) {
            return response()->json(['message' => 'Impossible d\'appliquer une pénalité : ce club n\'est pas actif.'], 400);
        }

        // 2. Vérifier que la saison est en cours
        $saison = \App\Models\Saison::findOrFail($validated['saison_id']);
        if (!$saison->isEnCours()) {
            return response()->json(['message' => 'Impossible d\'appliquer une pénalité : la saison sélectionnée n\'est pas en cours.'], 400);
        }

        // 3. Vérifier qu'il n'existe pas déjà une pénalité pour ce même type et motif sur cette saison
        $doublePenaliteExiste = Penalite::where('club_id', $club->id)
            ->where('saison_id', $validated['saison_id'])
            ->where('type', $validated['type'])
            ->where('motif', $validated['motif'])
            ->where('active', true)
            ->exists();
        if ($doublePenaliteExiste) {
            return response()->json(['message' => 'Une pénalité identique (même type, même motif) a déjà été appliquée à ce club pour cette saison.'], 400);
        }

        // Vérifier qu'il n'existe pas déjà une pénalité pour ce même type sur ce match (anti-doublon)
        if (!empty($validated['match_id'])) {
            $doublonExiste = Penalite::where('club_id', $club->id)
                ->where('match_id', $validated['match_id'])
                ->where('type', $validated['type'])
                ->where('active', true)
                ->exists();
            if ($doublonExiste) {
                return response()->json(['message' => 'Une pénalité de type "' . $validated['type'] . '" existe déjà pour ce club sur ce match.'], 400);
            }
        }

        // 4. Protection facultative : si le club est 1er de sa poule, bloquer sauf dérogation forcée
        if (!$request->boolean('force', false)) {
            $estPremier = \App\Models\ClassementClub::whereHas('poule', function ($q) use ($validated) {
                $q->whereHas('competitions', function ($qq) use ($validated) {
                    $qq->where('saison_id', $validated['saison_id']);
                });
            })
            ->where('club_id', $club->id)
            ->where('position', 1)
            ->exists();

            if ($estPremier) {
                return response()->json([
                    'message' => 'Ce club est actuellement leader de sa poule. Ajoutez le paramètre "force: true" pour confirmer la pénalité malgré sa position.'
                ], 422);
            }
        }

        $penalite = \DB::transaction(function () use ($club, $validated, $request) {
            $penalite = Penalite::create([
                'club_id' => $club->id,
                'saison_id' => $validated['saison_id'],
                'match_id' => $validated['match_id'] ?? null,
                'type' => $validated['type'],
                'points_retires' => $validated['points_retires'],
                'motif' => $validated['motif'],
                'appliquee_par_id' => $request->user()->id,
                'date_application' => now(),
                'active' => true,
            ]);

            // Recalculer le classement de toutes les poules de cette saison qui contiennent ce club
            $clubId = $club->id;
            $poules = Poule::whereHas('clubs', function ($q) use ($clubId) {
                $q->where('clubs.id', $clubId);
            })->get();

            foreach ($poules as $poule) {
                $this->classementService->recalculerPoule($poule->id);
            }

            // Notifier le responsable du club
            NotificationService::penaliteAppliquee($penalite);

            return $penalite;
        });

        return response()->json([
            'message' => 'Pénalité de points appliquée avec succès et classements recalculés.',
            'penalite' => $penalite
        ]);
    }

    /**
     * Lister les pénalités d'un club.
     */
    public function listePenalites(Request $request, int $clubId)
    {
        $club = Club::findOrFail($clubId);
        $penalites = Penalite::where('club_id', $club->id)
            ->with(['saison', 'match.clubDomicile', 'match.clubExterieur'])
            ->orderBy('date_application', 'desc')
            ->get();

        return response()->json($penalites);
    }

    /**
     * Recalcule et met à jour le score terrain de la rencontre.
     */
    private function recalculerScoreRencontre(Rencontre $match)
    {
        $events = $match->events()->where('statut', 'valide')->get();

        $scoreDom = 0;
        $scoreExt = 0;

        foreach ($events as $event) {
            if ($event->type === 'but' || $event->type === 'penalty_marque') {
                if ($event->club_id === $match->club_domicile_id) {
                    $scoreDom++;
                } elseif ($event->club_id === $match->club_exterieur_id) {
                    $scoreExt++;
                }
            } elseif ($event->type === 'but_csc') {
                if ($event->club_id === $match->club_domicile_id) {
                    $scoreExt++;
                } elseif ($event->club_id === $match->club_exterieur_id) {
                    $scoreDom++;
                }
            }
        }

        $match->score_domicile_terrain = $scoreDom;
        $match->score_exterieur_terrain = $scoreExt;
        $match->save();
    }
}
