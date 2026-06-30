<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AffecterOfficielRequest;
use App\Http\Requests\Admin\GenererCalendrierRequest;
use App\Http\Requests\Admin\ReporterMatchRequest;
use App\Http\Requests\Admin\UpdateMatchRequest;
use App\Http\Resources\MatchResource;
use App\Models\Arbitre;
use App\Models\Poule;
use App\Models\Rencontre;
use App\Models\User;
use App\Services\CalendrierService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    public function __construct(private CalendrierService $calendrierService) {}

    // ──────────────────────────────────────────────────────────────
    // POST /api/admin/poules/{poule}/generer-calendrier
    // ──────────────────────────────────────────────────────────────
    public function genererCalendrier(GenererCalendrierRequest $request, int $pouleId): JsonResponse
    {
        $poule = Poule::with('clubs', 'phase.competition.saison')->findOrFail($pouleId);

        // Vérifier qu'il n'y a pas déjà des matchs
        $existants = Rencontre::where('poule_id', $pouleId)->count();
        if ($existants > 0) {
            return response()->json([
                'success' => false,
                'message' => "Un calendrier existe déjà pour cette poule ({$existants} match(s)). Supprimez-les d'abord.",
            ], 422);
        }

        // Date de début : depuis la requête ou depuis la date de début de la saison
        $dateDebut = $request->filled('date_debut')
            ? Carbon::parse($request->input('date_debut'))
            : Carbon::parse($poule->phase->competition->saison->date_debut ?? now());

        $heureDefaut  = $request->input('heure_defaut', '15:00');
        $jourSemaine  = (int) $request->input('jour_semaine', 6); // 6 = Samedi

        $result = $this->calendrierService->generer($poule, $dateDebut, $jourSemaine, $heureDefaut);

        return response()->json([
            'success'   => true,
            'message'   => "{$result['created']} match(s) générés sur {$result['journees']} journée(s).",
            'data'      => $result,
        ], 201);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /api/admin/competitions/{competition}/calendrier
    // ──────────────────────────────────────────────────────────────
    public function calendrier(int $competitionId): JsonResponse
    {
        $grouped = $this->calendrierService->getCalendrierParJournee($competitionId);

        $journees = $grouped->map(function ($matchs, $numJournee) {
            return [
                'journee' => $numJournee,
                'matchs'  => MatchResource::collection($matchs),
                'nb_matchs'         => $matchs->count(),
                'nb_sans_officiel'  => $matchs->filter(fn($m) => !$m->commissaire_id || !$m->arbitre_principal_id)->count(),
                'date_premiere'     => $matchs->first()?->date_heure?->format('Y-m-d'),
                'statuts'           => $matchs->pluck('statut')->unique()->values(),
            ];
        })->values();

        return response()->json([
            'success'       => true,
            'data'          => $journees,
            'meta'          => [
                'total_matchs'         => $journees->sum('nb_matchs'),
                'total_journees'       => $journees->count(),
                'total_sans_officiel'  => $journees->sum('nb_sans_officiel'),
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /api/admin/competitions/{competition}/calendrier/journee/{n}
    // ──────────────────────────────────────────────────────────────
    public function journee(int $competitionId, int $numJournee): JsonResponse
    {
        $matchs = Rencontre::with([
            'clubDomicile', 'clubExterieur',
            'commissaire', 'arbitrePrincipal', 'poule',
        ])
            ->where('competition_id', $competitionId)
            ->where('journee', $numJournee)
            ->orderBy('date_heure')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => MatchResource::collection($matchs),
            'journee' => $numJournee,
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // PUT /api/admin/matchs/{match}
    // ──────────────────────────────────────────────────────────────
    public function update(UpdateMatchRequest $request, int $matchId): JsonResponse
    {
        $match = Rencontre::findOrFail($matchId);

        if (in_array($match->statut, ['en_cours', 'termine', 'homologue'])) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de modifier un match déjà joué ou homologué.',
            ], 422);
        }

        // Vérification de conflit de stade
        if ($request->filled('stade') && $request->filled('date_heure')) {
            $dateHeure = Carbon::parse($request->input('date_heure'));
            $stade = $request->input('stade');

            $conflict = Rencontre::where('stade', $stade)
                ->where('date_heure', $dateHeure)
                ->where('id', '!=', $matchId)
                ->exists();

            if ($conflict) {
                return response()->json([
                    'success' => false,
                    'message' => "Conflit : le stade \"{$stade}\" est déjà occupé à cette date/heure.",
                ], 422);
            }
        }

        $oldDate = $match->date_heure;
        $oldStade = $match->stade;

        $match->update($request->only(['date_heure', 'stade', 'terrain_neutre']));

        $changed = false;
        $motifParts = [];
        if ($request->filled('date_heure') && Carbon::parse($request->input('date_heure'))->ne($oldDate)) {
            $changed = true;
            $motifParts[] = "nouvelle date (" . Carbon::parse($request->input('date_heure'))->format('d/m/Y à H:i') . ")";
        }
        if ($request->filled('stade') && $request->input('stade') !== $oldStade) {
            $changed = true;
            $motifParts[] = "nouveau stade (" . $request->input('stade') . ")";
        }

        if ($changed) {
            $motif = "Modification du calendrier : " . implode(', ', $motifParts);
            \App\Services\NotificationService::matchDeprogramme($match, $motif);
        }

        return response()->json([
            'success' => true,
            'message' => 'Match mis à jour.',
            'data'    => new MatchResource($match->load('clubDomicile', 'clubExterieur', 'commissaire', 'arbitrePrincipal')),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // PATCH /api/admin/matchs/{match}/reporter
    // ──────────────────────────────────────────────────────────────
    public function reporter(ReporterMatchRequest $request, int $matchId): JsonResponse
    {
        $match = Rencontre::findOrFail($matchId);

        if (in_array($match->statut, ['termine', 'homologue', 'annule'])) {
            return response()->json([
                'success' => false,
                'message' => 'Ce match ne peut pas être reporté.',
            ], 422);
        }

        $nouvelleDateHeure = Carbon::parse($request->input('date_heure_report'));

        if ($nouvelleDateHeure->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'La nouvelle date du match doit être dans le futur.',
            ], 422);
        }

        // Logique statut : si le match était prévu AUJOURD'HUI ou dans le PASSÉ → il est "reporté"
        // Sinon, c'est simplement une modification de date (reste "programme" ou autre statut d'origine)
        $matchDatePasseOuAujourdhui = $match->date_heure && ($match->date_heure->isToday() || $match->date_heure->isPast());
        $nouveauStatut = $matchDatePasseOuAujourdhui ? 'reporte' : $match->statut;

        $motif = $request->input('motif', '');

        $match->update([
            'statut'            => $nouveauStatut,
            'motif_report'      => $motif,
            'date_heure'        => $nouvelleDateHeure,
            'date_heure_report' => $nouvelleDateHeure,
        ]);

        // Notifications → commissaire, arbitres, responsables des clubs
        \App\Services\NotificationService::matchDeprogramme($match, $motif ?: 'Modification du calendrier');

        return response()->json([
            'success' => true,
            'message' => $matchDatePasseOuAujourdhui
                ? 'Match reporté avec succès. Les officiels et clubs ont été notifiés.'
                : 'Date du match modifiée avec succès. Les officiels et clubs ont été notifiés.',
            'statut'  => $nouveauStatut,
            'data'    => new MatchResource($match->fresh(['clubDomicile', 'clubExterieur'])),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // PATCH /api/admin/matchs/{match}/annuler
    // ──────────────────────────────────────────────────────────────
    public function annuler(Request $request, int $matchId): JsonResponse
    {
        $match = Rencontre::findOrFail($matchId);

        if (in_array($match->statut, ['termine', 'homologue'])) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible d\'annuler un match déjà terminé ou homologué.',
            ], 422);
        }

        $match->update([
            'statut'       => 'annule',
            'motif_report' => $request->input('motif', 'Annulé par l\'administration'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Match annulé.',
            'data'    => new MatchResource($match->fresh(['clubDomicile', 'clubExterieur'])),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // PATCH /api/admin/matchs/{match}/affecter-commissaire
    // ──────────────────────────────────────────────────────────────
    public function affecterCommissaire(AffecterOfficielRequest $request, int $matchId): JsonResponse
    {
        $match = Rencontre::with('clubDomicile', 'clubExterieur')->findOrFail($matchId);
        $commissaireId = $request->input('commissaire_id');

        // Vérifier disponibilité (pas de conflit même date ET même heure)
        if ($commissaireId) {
            $conflict = Rencontre::where('commissaire_id', $commissaireId)
                ->where('id', '!=', $matchId)
                ->where('date_heure', $match->date_heure)
                ->exists();

            if ($conflict) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce commissaire est déjà affecté à un autre match à la même date et heure.',
                ], 422);
            }
        }

        $match->update(['commissaire_id' => $commissaireId]);

        return response()->json([
            'success' => true,
            'message' => $commissaireId ? 'Commissaire affecté.' : 'Commissaire retiré.',
            'data'    => new MatchResource($match->fresh(['clubDomicile', 'clubExterieur', 'commissaire', 'arbitrePrincipal'])),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // PATCH /api/admin/matchs/{match}/affecter-arbitre
    // ──────────────────────────────────────────────────────────────
    public function affecterArbitre(AffecterOfficielRequest $request, int $matchId): JsonResponse
    {
        $match = Rencontre::findOrFail($matchId);
        $arbitreId = $request->input('arbitre_id');
        $role = $request->input('role', 'principal'); // principal, assistant_1, assistant_2, quatrieme

        $columnMap = [
            'principal'   => 'arbitre_principal_id',
            'assistant_1' => 'arbitre_assistant_1_id',
            'assistant_2' => 'arbitre_assistant_2_id',
            'quatrieme'   => 'quatrieme_arbitre_id',
        ];

        $column = $columnMap[$role] ?? 'arbitre_principal_id';

        if ($arbitreId) {
            // Un arbitre ne peut pas être affecté à un autre match à la même date et heure (peu importe le poste)
            $conflict = Rencontre::where(function ($q) use ($arbitreId) {
                $q->where('arbitre_principal_id', $arbitreId)
                  ->orWhere('arbitre_assistant_1_id', $arbitreId)
                  ->orWhere('arbitre_assistant_2_id', $arbitreId)
                  ->orWhere('quatrieme_arbitre_id', $arbitreId);
            })
            ->where('id', '!=', $matchId)
            ->where('date_heure', $match->date_heure)
            ->exists();

            if ($conflict) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet arbitre est déjà affecté à un autre match à la même date et heure.',
                ], 422);
            }
        }

        $match->update([$column => $arbitreId]);

        return response()->json([
            'success' => true,
            'message' => $arbitreId ? 'Arbitre affecté.' : 'Arbitre retiré.',
            'data'    => new MatchResource($match->fresh([
                'clubDomicile', 'clubExterieur', 'commissaire',
                'arbitrePrincipal', 'arbitreAssistant1', 'arbitreAssistant2', 'quatriemeArbitre'
            ])),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /api/admin/matchs/sans-officiel
    // ──────────────────────────────────────────────────────────────
    public function sansOfficiel(Request $request): JsonResponse
    {
        $query = Rencontre::with([
            'clubDomicile', 'clubExterieur', 'poule', 'commissaire',
            'arbitrePrincipal', 'arbitreAssistant1', 'arbitreAssistant2', 'quatriemeArbitre'
        ])
            ->whereNotIn('statut', ['annule', 'termine', 'homologue']);

        if ($request->filled('competition_id')) {
            $query->where('competition_id', $request->input('competition_id'));
        }
        if ($request->filled('date')) {
            $query->whereDate('date_heure', $request->input('date'));
        }

        $matchs = $query->orderBy('date_heure')->paginate(50); // increased limit for easier management

        return response()->json([
            'success' => true,
            'data'    => MatchResource::collection($matchs->items()),
            'meta'    => [
                'total' => $matchs->total(),
                'current_page' => $matchs->currentPage(),
                'last_page' => $matchs->lastPage(),
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /api/admin/commissaires/disponibles
    // ──────────────────────────────────────────────────────────────
    public function commissairesDisponibles(Request $request): JsonResponse
    {
        $dateHeure = $request->filled('date_heure')
            ? Carbon::parse($request->input('date_heure'))
            : null;

        $query = User::where('role', 'commissaire')
            ->where('acces_actif', true)
            ->orderBy('nom');

        if ($dateHeure) {
            // Commissaires déjà pris à la même heure exacte
            $occupes = Rencontre::whereNotNull('commissaire_id')
                ->where('date_heure', $dateHeure)
                ->pluck('commissaire_id');

            $query->whereNotIn('id', $occupes);
        }

        $commissaires = $query->get(['id', 'nom', 'prenom', 'email', 'villes']);

        return response()->json([
            'success' => true,
            'data'    => $commissaires->map(fn($u) => [
                'id'     => $u->id,
                'nom'    => $u->nom . ' ' . $u->prenom,
                'email'  => $u->email,
                'ville'  => $u->villes ?? null,
            ]),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /api/admin/arbitres/disponibles
    // ──────────────────────────────────────────────────────────────
    public function arbitresDisponibles(Request $request): JsonResponse
    {
        $dateHeure = $request->filled('date_heure')
            ? Carbon::parse($request->input('date_heure'))
            : null;

        $query = Arbitre::where('actif', true)->orderBy('nom');

        if ($dateHeure) {
            $occupes = Rencontre::whereNotNull('arbitre_principal_id')
                ->where('date_heure', $dateHeure)
                ->pluck('arbitre_principal_id');

            $query->whereNotIn('id', $occupes);
        }

        $arbitres = $query->get(['id', 'nom', 'prenom', 'num_licence', 'specification', 'region']);

        return response()->json([
            'success' => true,
            'data'    => $arbitres->map(fn($a) => [
                'id'            => $a->id,
                'nom'           => $a->nom . ' ' . $a->prenom,
                'num_licence'   => $a->num_licence,
                'specification' => $a->specification,
                'region'        => $a->region,
            ]),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /api/matchs/{match} (Publique)
    // ──────────────────────────────────────────────────────────────
    public function show(int $matchId): JsonResponse
    {
        $match = Rencontre::with([
            'clubDomicile', 'clubExterieur',
            'commissaire', 'arbitrePrincipal', 'arbitreAssistant1',
            'arbitreAssistant2', 'quatriemeArbitre', 'poule.phase.competition'
        ])->findOrFail($matchId);

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match),
        ]);
    }
}
