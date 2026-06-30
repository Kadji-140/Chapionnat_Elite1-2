<?php

namespace App\Http\Controllers\Commissaire;

use App\Http\Controllers\Controller;
use App\Http\Requests\Commissaire\StoreMatchEventRequest;
use App\Http\Requests\Commissaire\CloturerMatchRequest;
use App\Http\Resources\MatchResource;
use App\Http\Resources\MatchEventResource;
use App\Models\Rencontre;
use App\Models\MatchEvent;
use App\Models\FeuilleDeMatch;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class MatchController extends Controller
{
    /**
     * Liste des matchs assignés au commissaire connecté.
     */
    public function index(Request $request)
    {
        $matchs = Rencontre::where('commissaire_id', $request->user()->id)
            ->with(['clubDomicile', 'clubExterieur', 'commissaire', 'arbitrePrincipal'])
            ->orderBy('date_heure', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => MatchResource::collection($matchs),
        ]);
    }

    /**
     * Détail d'un match.
     */
    public function show(Request $request, int $id)
    {
        $match = Rencontre::with([
                'clubDomicile', 'clubExterieur', 'commissaire',
                'arbitrePrincipal', 'arbitreAssistant1', 'arbitreAssistant2', 'quatriemeArbitre',
                'events.joueur', 'events.joueurRemplacant', 'events.club', 'events.contestation',
                'compositions.joueurs.joueur', 'compositions.club'
            ])
            ->findOrFail($id);

        $user = $request->user();
        $isAuthorized = false;
        if ($user->role === 'commissaire' && $match->commissaire_id === $user->id) {
            $isAuthorized = true;
        } elseif ($user->role === 'coach' && ($match->club_domicile_id === $user->club_id || $match->club_exterieur_id === $user->club_id)) {
            $isAuthorized = true;
        }

        if (!$isAuthorized) {
            return response()->json(['message' => 'Non autorisé. Seuls le commissaire ou les coachs concernés peuvent voir ces détails.'], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match),
        ]);
    }


    /**
     * Démarrer le match.
     * Règles :
     *  1. Statut = 'programme'
     *  2. Compositions des deux clubs confirmées
     *  3. Arbitre principal assigné
     *  4. Stade renseigné
     *  5. Date/heure : entre 2h avant et 30 min après le coup d'envoi prévu
     */
    public function demarrer(Request $request, int $id)
    {
        $match = Rencontre::with(['clubDomicile', 'clubExterieur', 'compositions'])
            ->findOrFail($id);

        $user = $request->user();
        $isAuthorized = false;
        if ($user->role === 'commissaire' && $match->commissaire_id === $user->id) {
            $isAuthorized = true;
        } elseif ($user->role === 'coach' && ($match->club_domicile_id === $user->club_id || $match->club_exterieur_id === $user->club_id)) {
            $isAuthorized = true;
        }

        if (!$isAuthorized) {
            return response()->json(['message' => 'Non autorisé. Seuls le commissaire du match ou les coachs participants peuvent démarrer la rencontre.'], 403);
        }


        // 1. Statut
        if ($match->statut !== 'programme') {
            return response()->json(['message' => 'Le match ne peut pas être démarré car son statut actuel est : ' . $match->statut], 400);
        }

        // 2. Stade renseigné
        if (empty($match->stade)) {
            return response()->json(['message' => 'Impossible de démarrer le match : le stade / lieu de la rencontre n\'est pas renseigné.'], 400);
        }

        // 3. Arbitre principal assigné
        if (!$match->arbitre_principal_id) {
            return response()->json(['message' => 'Impossible de démarrer le match : aucun arbitre principal n\'est assigné à cette rencontre.'], 400);
        }

        // 4. Compositions confirmées
        $compoDom = $match->compositions->where('club_id', $match->club_domicile_id)->first();
        $compoExt = $match->compositions->where('club_id', $match->club_exterieur_id)->first();

        if (!$compoDom || !$compoDom->est_confirmee) {
            return response()->json([
                'message' => 'Impossible de démarrer le match : la composition de l\'équipe à domicile (' . ($match->clubDomicile->nom ?? 'Domicile') . ') n\'est pas encore confirmée par son coach.'
            ], 400);
        }
        if (!$compoExt || !$compoExt->est_confirmee) {
            return response()->json([
                'message' => 'Impossible de démarrer le match : la composition de l\'équipe à l\'extérieur (' . ($match->clubExterieur->nom ?? 'Extérieur') . ') n\'est pas encore confirmée par son coach.'
            ], 400);
        }

        // 5. Fenêtre temporelle : au plus tôt 2h avant le coup d'envoi
        if ($match->date_heure) {
            $heureMatch = $match->date_heure;
            $ouvertureFenetre  = $heureMatch->copy()->subHours(2);    // On peut démarrer au plus tôt 2h avant
            $fermetureFenetre  = $heureMatch->copy()->addMinutes(30); // Seuil de retard de 30 min

            if (now()->lt($ouvertureFenetre)) {
                return response()->json([
                    'message' => 'Impossible de démarrer le match : il est trop tôt. Le match est prévu le ' . $heureMatch->format('d/m/Y à H:i') . '. Vous pouvez démarrer à partir de ' . $ouvertureFenetre->format('H:i') . '.'
                ], 400);
            }

            if (now()->gt($fermetureFenetre)) {
                // Envoyer une notification d'alerte de retard aux admins (ne bloque pas le démarrage)
                try {
                    $nomDom = $match->clubDomicile->nom ?? '?';
                    $nomExt = $match->clubExterieur->nom ?? '?';
                    $delai = now()->diffInMinutes($heureMatch);
                    \App\Services\NotificationService::sendToAdmins(
                        type: 'match_demarre_retard',
                        titre: "🚨 Démarrage tardif — {$nomDom} vs {$nomExt}",
                        message: "Le match {$nomDom} vs {$nomExt} a démarré avec un retard important de {$delai} minutes par rapport à l'heure prévue ({$heureMatch->format('H:i')}).",
                        lien: '/admin/matchs',
                        metadata: ['match_id' => $match->id, 'retard_minutes' => $delai]
                    );

                    // Envoyer un e-mail aux administrateurs
                    $admins = \App\Models\User::where('role', 'admin')->where('acces_actif', true)->get();
                    foreach ($admins as $admin) {
                        \Illuminate\Support\Facades\Mail::to($admin->email)->send(
                            new \App\Mail\AlerteMatchMail(
                                titre: "Démarrage tardif — {$nomDom} vs {$nomExt}",
                                messageContenu: "Le match {$nomDom} vs {$nomExt} a été démarré par le commissaire avec {$delai} minutes de retard par rapport à l'heure prévue.",
                                lien: config('app.frontend_url') . '/admin/matchs'
                            )
                        );
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Erreur envoi alerte retard démarrage match #{$match->id}: " . $e->getMessage());
                }
            }
        }

        $match->statut = 'en_cours';
        $match->periode = '1ere_mi_temps';
        $match->first_half_started_at = now();
        $match->save();

        // Enregistrer l'événement de début
        MatchEvent::create([
            'match_id'        => $match->id,
            'type'            => 'incident',
            'minute'          => 0,
            'description'     => "Coup d'envoi du match.",
            'statut'          => 'valide',
            'saisi_par_id'    => $request->user()->id,
            'timestamp_event' => now(),
        ]);

        // Notification aux admins
        NotificationService::matchDemarre($match);

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Ajouter un événement.
     * Règles métier :
     *  - Buts : le buteur doit être titulaire ou déjà entré en remplacement
     *  - Carton jaune × 2 = expulsion automatique
     *  - Joueur expulsé : ne peut plus faire l'objet d'un événement
     *  - Remplacement : max 5, joueur sortant non encore remplacé, joueur entrant non encore sur le terrain
     *  - Prolongations/TAB : uniquement si la phase est de type playoff/barrage
     */
    /**
     * Ajouter un événement.
     */
    public function storeEvent(StoreMatchEventRequest $request, int $id)
    {
        $match = Rencontre::where('commissaire_id', $request->user()->id)
            ->with(['compositions.joueurs', 'events', 'phase'])
            ->findOrFail($id);

        if (!in_array($match->statut, ['en_cours', 'mi_temps'])) {
            return response()->json(['message' => 'Impossible de saisir des événements pour un match non actif.'], 400);
        }

        $validated = $request->validated();
        $type      = $validated['type'];
        $minute    = $validated['minute'];
        $joueurId  = $validated['joueur_id'] ?? null;
        $joueurRemplacantId = $validated['joueur_remplacant_id'] ?? null;
        $clubId    = $validated['club_id'] ?? null;

        // Validation des règles métier communes
        $validationResult = $this->validerReglesEvenement($match, $type, $minute, $joueurId, $joueurRemplacantId, $clubId);
        if ($validationResult !== null) {
            return $validationResult;
        }

        // ---- Créer l'événement ----
        $validated['match_id']        = $match->id;
        $validated['saisi_par_id']    = $request->user()->id;
        $validated['statut']          = 'valide';
        $validated['timestamp_event'] = now();

        $event = MatchEvent::create($validated);

        // ---- Carton jaune × 2 = Expulsion automatique ----
        if ($type === 'carton_jaune' && $joueurId && $clubId) {
            $nbJaunes = MatchEvent::where('match_id', $match->id)
                ->where('statut', 'valide')
                ->where('joueur_id', $joueurId)
                ->whereIn('type', ['carton_jaune'])
                ->count();

            if ($nbJaunes >= 2) {
                // Enregistrer automatiquement un carton jaune-rouge (double avertissement)
                MatchEvent::create([
                    'match_id'        => $match->id,
                    'type'            => 'carton_jaune_rouge',
                    'minute'          => $minute,
                    'club_id'         => $clubId,
                    'joueur_id'       => $joueurId,
                    'description'     => 'Expulsion automatique — 2ème carton jaune.',
                    'statut'          => 'valide',
                    'saisi_par_id'    => $request->user()->id,
                    'timestamp_event' => now(),
                ]);
            }
        }

        // Recalculer le score du match
        $this->recalculerScoreRencontre($match);

        // Notifier les coachs des deux clubs en temps réel
        try {
            $coaches = \App\Models\User::whereIn('club_id', [$match->club_domicile_id, $match->club_exterieur_id])
                ->where('role', 'coach')
                ->where('acces_actif', true)
                ->get();
            foreach ($coaches as $coach) {
                \App\Services\NotificationService::send(
                    userId: $coach->id,
                    type: 'evenement_enregistre',
                    titre: "📢 Événement de match enregistré",
                    message: "Un événement '{$event->type}' a été saisi à la minute {$event->minute}.",
                    lien: "/coach/contestations?match_id={$match->id}",
                    metadata: ['match_id' => $match->id, 'event_id' => $event->id]
                );
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Erreur lors de la notification des coachs : " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data'    => new MatchEventResource($event->load('joueur', 'joueurRemplacant', 'club')),
        ]);
    }

    /**
     * Modifier un événement.
     */
    public function updateEvent(StoreMatchEventRequest $request, int $id)
    {
        $event = MatchEvent::findOrFail($id);
        $match = Rencontre::where('commissaire_id', $request->user()->id)
            ->with(['compositions.joueurs', 'events', 'phase'])
            ->findOrFail($event->match_id);

        if (in_array($match->statut, ['homologue', 'litige'])) {
            return response()->json(['message' => 'Impossible de modifier un match homologué ou en litige.'], 400);
        }

        $validated = $request->validated();
        $type      = $validated['type'];
        $minute    = $validated['minute'];
        $joueurId  = $validated['joueur_id'] ?? null;
        $joueurRemplacantId = $validated['joueur_remplacant_id'] ?? null;
        $clubId    = $validated['club_id'] ?? null;

        // Validation des règles métier communes (en excluant l'événement actuel)
        $validationResult = $this->validerReglesEvenement($match, $type, $minute, $joueurId, $joueurRemplacantId, $clubId, $event->id);
        if ($validationResult !== null) {
            return $validationResult;
        }

        $event->update($validated);

        // Si c'est un carton jaune modifié, recalculer l'expulsion automatique n'est pas trivial car c'est un événement à part.
        // Mais nous pouvons laisser l'update simple de base tout en recalculant le score.
        $this->recalculerScoreRencontre($match);

        return response()->json([
            'success' => true,
            'data'    => new MatchEventResource($event->load('joueur', 'joueurRemplacant', 'club')),
        ]);
    }

    /**
     * Valide les règles de gestion d'une rencontre de football pour un événement.
     * Retourne une Response JSON d'erreur si invalide, null sinon.
     */
    private function validerReglesEvenement(
        Rencontre $match,
        string $type,
        int $minute,
        ?int $joueurId,
        ?int $joueurRemplacantId,
        ?int $clubId,
        ?int $eventExcluId = null
    ) {
        $eventsQuery = $match->events()->where('statut', 'valide');
        if ($eventExcluId) {
            $eventsQuery->where('id', '!=', $eventExcluId);
        }
        $eventsExistants = $eventsQuery->get();

        // Joueurs expulsés (carton rouge direct ou cumul 2 jaunes)
        $expulsesIds = $this->getJoueursExpulses($eventsExistants);

        // Joueurs déjà remplacés (sortis)
        $dejaSortisIds = $eventsExistants
            ->where('type', 'remplacement')
            ->pluck('joueur_id')
            ->filter()
            ->toArray();

        // Joueurs entrés en remplacement (dans le match)
        $joueursEntresIds = $eventsExistants
            ->where('type', 'remplacement')
            ->pluck('joueur_remplacant_id')
            ->filter()
            ->toArray();

        // Nombre de remplacements par club
        $nbRemplacementsDom = $eventsExistants
            ->where('type', 'remplacement')
            ->where('club_id', $match->club_domicile_id)
            ->count();
        $nbRemplacementsExt = $eventsExistants
            ->where('type', 'remplacement')
            ->where('club_id', $match->club_exterieur_id)
            ->count();

        // ---- Règle : joueur expulsé ne peut plus être impliqué ----
        if ($joueurId && in_array($joueurId, $expulsesIds)) {
            return response()->json(['message' => 'Ce joueur a déjà été expulsé et ne peut plus être impliqué dans un événement.'], 400);
        }

        // ---- Règle : joueur remplaçant à faire entrer ne doit pas être expulsé ----
        if ($joueurRemplacantId && in_array($joueurRemplacantId, $expulsesIds)) {
            return response()->json(['message' => 'Ce remplaçant a été expulsé et ne peut pas entrer en jeu.'], 400);
        }

        // ---- Règle : Buts — buteur doit être en jeu (titulaire ou entré en remplacement) ----
        if (in_array($type, ['but', 'penalty_marque', 'but_csc']) && $joueurId && $clubId) {
            $composition = $match->compositions->where('club_id', $clubId)->first();
            if ($composition) {
                $titulaireIds = $composition->joueurs
                    ->where('role', 'titulaire')
                    ->pluck('joueur_id')
                    ->toArray();

                $joueurEstSurTerrain = in_array($joueurId, $titulaireIds) || in_array($joueurId, $joueursEntresIds);
                $joueurEstSorti      = in_array($joueurId, $dejaSortisIds);

                if (!$joueurEstSurTerrain || $joueurEstSorti) {
                    return response()->json(['message' => 'Ce joueur n\'est pas sur le terrain (il n\'est ni titulaire ni entré en remplacement, ou il est déjà sorti).'], 400);
                }
            }
        }

        // ---- Règle : Remplacements (max 5 par club) ----
        if ($type === 'remplacement') {
            $nbRemplacements = ($clubId === $match->club_domicile_id) ? $nbRemplacementsDom : $nbRemplacementsExt;
            if ($nbRemplacements >= 5) {
                return response()->json(['message' => 'Impossible : ce club a déjà effectué 5 remplacements (limite réglementaire).'], 400);
            }

            // Joueur sortant : doit être sur le terrain et pas expulsé
            if ($joueurId) {
                if (in_array($joueurId, $dejaSortisIds)) {
                    return response()->json(['message' => 'Ce joueur est déjà sorti du match et ne peut pas être remplacé à nouveau.'], 400);
                }
                $composition = $match->compositions->where('club_id', $clubId)->first();
                if ($composition) {
                    $titulaireIds = $composition->joueurs->where('role', 'titulaire')->pluck('joueur_id')->toArray();
                    if (!in_array($joueurId, $titulaireIds) && !in_array($joueurId, $joueursEntresIds)) {
                        return response()->json(['message' => 'Le joueur sortant ne fait pas partie des joueurs actuellement sur le terrain.'], 400);
                    }
                }
            }

            // Joueur entrant : ne doit pas être déjà entré en jeu
            if ($joueurRemplacantId) {
                if (in_array($joueurRemplacantId, $joueursEntresIds)) {
                    return response()->json(['message' => 'Ce remplaçant est déjà entré en jeu au cours de cette rencontre.'], 400);
                }
                // Le joueur entrant ne doit pas être un titulaire (encore sur le terrain)
                $composition = $match->compositions->where('club_id', $clubId)->first();
                if ($composition) {
                    $titulaireIds = $composition->joueurs->where('role', 'titulaire')->pluck('joueur_id')->toArray();
                    if (in_array($joueurRemplacantId, $titulaireIds) && !in_array($joueurRemplacantId, $dejaSortisIds)) {
                        return response()->json(['message' => 'Ce joueur est déjà titulaire en jeu ; il ne peut pas entrer en remplacement.'], 400);
                    }
                }
            }
        }

        // ---- Règle : Prolongations/TAB uniquement en phases éliminatoires ----
        if ($minute > 90 && $match->phase) {
            $phaseType = strtolower($match->phase->type ?? '');
            if (!in_array($phaseType, ['playoff', 'barrage', 'elimination', 'finale', 'demi_finale', 'quart_finale'])) {
                return response()->json(['message' => 'Les prolongations et tirs au but ne sont autorisés qu\'en phases à élimination directe (playoffs, barrages).'], 400);
            }
        }

        return null;
    }

    /**
     * Supprimer un événement.
     */
    public function deleteEvent(Request $request, int $id)
    {
        $event = MatchEvent::findOrFail($id);
        $match = Rencontre::findOrFail($event->match_id);

        if ($match->commissaire_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if (in_array($match->statut, ['homologue', 'litige'])) {
            return response()->json(['message' => 'Impossible de modifier un match homologué ou en litige.'], 400);
        }

        $event->delete();
        $this->recalculerScoreRencontre($match);

        return response()->json([
            'success' => true,
            'message' => 'Événement supprimé avec succès.',
        ]);
    }

    /**
     * Passer à la mi-temps.
     * Règle : uniquement entre la 40e et la 50e minute (≈ 45' +/- 5').
     */
    public function miTemps(Request $request, int $id)
    {
        $match = Rencontre::where('commissaire_id', $request->user()->id)->findOrFail($id);

        if ($match->statut !== 'en_cours') {
            return response()->json(['message' => 'Le match n\'est pas en cours.'], 400);
        }

        $minute = (int) $request->input('minute', 45);
        if ($minute < 40 || $minute > 50) {
            return response()->json([
                'message' => 'La mi-temps ne peut être déclarée qu\'entre la 40e et la 50e minute de jeu (actuelle : ' . $minute . '\').'
            ], 400);
        }

        $match->statut = 'mi_temps';
        $match->periode = 'mi_temps';
        $match->save();

        MatchEvent::create([
            'match_id'        => $match->id,
            'type'            => 'incident',
            'minute'          => $minute,
            'description'     => 'Fin de la première période (Mi-temps).',
            'statut'          => 'valide',
            'saisi_par_id'    => $request->user()->id,
            'timestamp_event' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Reprise de la rencontre.
     */
    public function reprise(Request $request, int $id)
    {
        $match = Rencontre::where('commissaire_id', $request->user()->id)->findOrFail($id);

        if ($match->statut !== 'mi_temps') {
            return response()->json(['message' => 'Le match n\'est pas à la mi-temps.'], 400);
        }

        $match->statut = 'en_cours';
        $match->periode = '2e_mi_temps';
        $match->second_half_started_at = now();
        $match->save();

        MatchEvent::create([
            'match_id'        => $match->id,
            'type'            => 'incident',
            'minute'          => 45,
            'description'     => 'Début de la seconde période.',
            'statut'          => 'valide',
            'saisi_par_id'    => $request->user()->id,
            'timestamp_event' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Ajouter du temps additionnel.
     */
    public function ajouterTempsAdditionnel(Request $request, int $id)
    {
        $match = Rencontre::where('commissaire_id', $request->user()->id)->findOrFail($id);

        $request->validate([
            'minutes' => 'required|integer|min:1|max:15',
        ]);

        $minutes = (int) $request->input('minutes');
        $periode = $match->periode;

        $minuteGlobale = 45;
        if ($periode === '1ere_mi_temps') {
            $match->temps_additionnel_1er = $minutes;
            $minuteGlobale = 45;
        } elseif ($periode === '2e_mi_temps') {
            $match->temps_additionnel_2e = $minutes;
            $minuteGlobale = 90;
        } elseif ($periode === 'prolongation_1') {
            $match->temps_additionnel_prolongation_1 = $minutes;
            $minuteGlobale = 90 + $match->duree_prolongation;
        } elseif ($periode === 'prolongation_2') {
            $match->temps_additionnel_prolongation_2 = $minutes;
            $minuteGlobale = 90 + 2 * $match->duree_prolongation;
        } else {
            return response()->json(['message' => 'Impossible d\'ajouter du temps additionnel pour cette période.'], 400);
        }

        $match->save();

        MatchEvent::create([
            'match_id'        => $match->id,
            'type'            => 'temps_additionnel',
            'minute'          => $minuteGlobale,
            'minute_additionnelle' => $minutes,
            'description'     => "Temps additionnel annoncé : +{$minutes} minutes.",
            'statut'          => 'valide',
            'saisi_par_id'    => $request->user()->id,
            'timestamp_event' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Activer les prolongations.
     */
    public function activerProlongation(Request $request, int $id)
    {
        $match = Rencontre::where('commissaire_id', $request->user()->id)->findOrFail($id);

        $request->validate([
            'duree_prolongation' => 'nullable|integer|min:5|max:30',
        ]);

        if ($match->statut !== 'en_cours' && $match->statut !== 'termine') {
            return response()->json(['message' => 'Le match doit être en cours ou terminé pour activer les prolongations.'], 400);
        }

        $duree = (int) $request->input('duree_prolongation', 15);

        $match->statut = 'en_cours';
        $match->periode = 'prolongation_1';
        $match->duree_prolongation = $duree;
        $match->prolongation_started_at = now();
        $match->save();

        MatchEvent::create([
            'match_id'        => $match->id,
            'type'            => 'debut_prolongation',
            'minute'          => 90,
            'description'     => "Début de la première période des prolongations ({$duree} minutes).",
            'statut'          => 'valide',
            'saisi_par_id'    => $request->user()->id,
            'timestamp_event' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Mi-temps des prolongations.
     */
    public function prolongationMiTemps(Request $request, int $id)
    {
        $match = Rencontre::where('commissaire_id', $request->user()->id)->findOrFail($id);

        if ($match->periode !== 'prolongation_1') {
            return response()->json(['message' => 'Le match n\'est pas dans la première période des prolongations.'], 400);
        }

        $match->periode = 'prolongation_mi_temps';
        $match->save();

        MatchEvent::create([
            'match_id'        => $match->id,
            'type'            => 'incident',
            'minute'          => 90 + $match->duree_prolongation,
            'description'     => 'Fin de la première période des prolongations (Mi-temps).',
            'statut'          => 'valide',
            'saisi_par_id'    => $request->user()->id,
            'timestamp_event' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Reprise de la seconde période des prolongations.
     */
    public function prolongationReprise(Request $request, int $id)
    {
        $match = Rencontre::where('commissaire_id', $request->user()->id)->findOrFail($id);

        if ($match->periode !== 'prolongation_mi_temps') {
            return response()->json(['message' => 'Le match n\'est pas à la mi-temps des prolongations.'], 400);
        }

        $match->periode = 'prolongation_2';
        $match->second_half_prolongation_started_at = now();
        $match->save();

        MatchEvent::create([
            'match_id'        => $match->id,
            'type'            => 'incident',
            'minute'          => 90 + $match->duree_prolongation,
            'description'     => 'Début de la seconde période des prolongations.',
            'statut'          => 'valide',
            'saisi_par_id'    => $request->user()->id,
            'timestamp_event' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Activer la séance de tirs au but.
     */
    public function activerTirsAuBut(Request $request, int $id)
    {
        $match = Rencontre::where('commissaire_id', $request->user()->id)->findOrFail($id);

        $match->statut = 'en_cours';
        $match->periode = 'tirs_au_but';
        $match->save();

        MatchEvent::create([
            'match_id'        => $match->id,
            'type'            => 'incident',
            'minute'          => 90 + 2 * $match->duree_prolongation,
            'description'     => 'Début de la séance de tirs au but.',
            'statut'          => 'valide',
            'saisi_par_id'    => $request->user()->id,
            'timestamp_event' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Clôturer le match (coup de sifflet final).
     * Règles :
     *  1. Statut 'en_cours' uniquement
     *  2. Minute minimum 85'
     *  3. Match non en litige
     */
    public function cloturer(CloturerMatchRequest $request, int $id)
    {
        $match = Rencontre::where('commissaire_id', $request->user()->id)
            ->with(['events', 'compositions.joueurs', 'clubDomicile', 'clubExterieur'])
            ->findOrFail($id);

        if ($match->statut === 'litige') {
            return response()->json(['message' => 'Impossible de clôturer : ce match est actuellement en litige.'] , 400);
        }

        if ($match->statut !== 'en_cours') {
            return response()->json(['message' => 'Le match doit être en cours pour être clôturé.'], 400);
        }

        // Vérifier s'il reste des contestations en attente (non traitées)
        $contestationsEnAttente = \App\Models\Contestation::whereHas('matchEvent', function ($q) use ($match) {
            $q->where('match_id', $match->id);
        })->where('statut', 'en_attente')->count();

        if ($contestationsEnAttente > 0) {
            return response()->json([
                'message' => 'Impossible de clôturer la rencontre : vous devez d\'abord traiter toutes les contestations des coachs (' . $contestationsEnAttente . ' en attente).'
            ], 400);
        }

        // Vérification du nombre de titulaires dans chaque composition (min 11)
        $compoDom = $match->compositions->where('club_id', $match->club_domicile_id)->first();
        $compoExt = $match->compositions->where('club_id', $match->club_exterieur_id)->first();

        $nbTitulairesDom = $compoDom ? $compoDom->joueurs->where('role', 'titulaire')->count() : 0;
        $nbTitulairesExt = $compoExt ? $compoExt->joueurs->where('role', 'titulaire')->count() : 0;

        if ($nbTitulairesDom < 11) {
            return response()->json([
                'message' => 'Impossible de clôturer le match : l\'équipe à domicile (' . ($match->clubDomicile->nom ?? 'Domicile') . ') doit avoir au moins 11 titulaires.'
            ], 400);
        }

        if ($nbTitulairesExt < 11) {
            return response()->json([
                'message' => 'Impossible de clôturer le match : l\'équipe à l\'extérieur (' . ($match->clubExterieur->nom ?? 'Extérieur') . ') doit avoir au moins 11 titulaires.'
            ], 400);
        }

        // Vérification de la durée minimale (85 minutes)
        $minute = (int) $request->input('minute', 90);
        if ($minute < 85) {
            return response()->json([
                'message' => 'Impossible de clôturer le match : la durée minimale de 85 minutes n\'est pas atteinte (minute actuelle : ' . $minute . '\').'
            ], 400);
        }

        $match->statut = 'termine';
        $match->save();

        MatchEvent::create([
            'match_id'        => $match->id,
            'type'            => 'incident',
            'minute'          => $minute,
            'description'     => 'Fin de la rencontre (Coup de sifflet final).',
            'statut'          => 'valide',
            'saisi_par_id'    => $request->user()->id,
            'timestamp_event' => now(),
        ]);

        $this->recalculerScoreRencontre($match);

        FeuilleDeMatch::updateOrCreate(
            ['match_id' => $match->id],
            [
                'statut'           => 'soumise',
                'score_final_dom'  => $match->score_domicile_terrain,
                'score_final_ext'  => $match->score_exterieur_terrain,
                'incidents_rapport' => $request->incidents,
                'date_generation'  => now(),
            ]
        );

        // Notification aux admins
        NotificationService::matchCloture($match);

        return response()->json([
            'success' => true,
            'data'    => new MatchResource($match->load('clubDomicile', 'clubExterieur')),
        ]);
    }

    /**
     * Soumettre le rapport final avec signature.
     */
    public function rapport(Request $request, int $id)
    {
        $match = Rencontre::where('commissaire_id', $request->user()->id)
            ->with(['clubDomicile', 'clubExterieur', 'commissaire'])
            ->findOrFail($id);

        if ($match->statut !== 'termine') {
            return response()->json(['message' => 'Le match doit être terminé pour soumettre le rapport.'], 400);
        }

        $pdfContent  = "========================================================\n";
        $pdfContent .= "FECAFOOT ELITE - RAPPORT DE MATCH OFFICIEL\n";
        $pdfContent .= "========================================================\n";
        $pdfContent .= "Match ID : " . $match->id . "\n";
        $pdfContent .= "Rencontre : " . $match->clubDomicile->nom . " VS " . $match->clubExterieur->nom . "\n";
        $pdfContent .= "Score Terrain : " . $match->score_domicile_terrain . " - " . $match->score_exterieur_terrain . "\n";
        $pdfContent .= "Stade : " . $match->stade . "\n";
        $pdfContent .= "Date & Heure : " . $match->date_heure->toDateTimeString() . "\n";
        $pdfContent .= "Commissaire : " . $match->commissaire->name . "\n";
        $pdfContent .= "Date de Clôture : " . now()->toDateTimeString() . "\n";
        $pdfContent .= "--------------------------------------------------------\n";
        $pdfContent .= "Rapport d'incidents :\n";
        $pdfContent .= ($request->incidents ?? 'Aucun incident signalé.') . "\n";
        $pdfContent .= "========================================================\n";
        $pdfContent .= "Rapport signé électroniquement par le Commissaire.\n";

        $pdfPath = 'rapports/rapport_match_' . $match->id . '.txt';
        Storage::disk('public')->put($pdfPath, $pdfContent);

        FeuilleDeMatch::updateOrCreate(
            ['match_id' => $match->id],
            [
                'statut'            => 'soumise',
                'score_final_dom'   => $match->score_domicile_terrain,
                'score_final_ext'   => $match->score_exterieur_terrain,
                'incidents_rapport' => $request->incidents,
                'chemin_pdf'        => 'storage/' . $pdfPath,
                'date_generation'   => now(),
            ]
        );

        // Notifier les admins
        \App\Services\NotificationService::rapportSoumis($match);

        return response()->json([
            'success'    => true,
            'message'    => 'Rapport final soumis et feuille de match générée.',
            'chemin_pdf' => 'storage/' . $pdfPath,
        ]);

    }

    /**
     * Recalcule et met à jour le score de la rencontre basé sur les buts valides.
     */
    private function recalculerScoreRencontre(Rencontre $match)
    {
        $events = $match->events()->where('statut', 'valide')->get();

        $scoreDom = 0;
        $scoreExt = 0;
        $tabDom = 0;
        $tabExt = 0;

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
            } elseif ($event->type === 'tab') {
                if ($event->description === 'reussi') {
                    if ($event->club_id === $match->club_domicile_id) {
                        $tabDom++;
                    } elseif ($event->club_id === $match->club_exterieur_id) {
                        $tabExt++;
                    }
                }
            }
        }

        $match->score_domicile_terrain = $scoreDom;
        $match->score_exterieur_terrain = $scoreExt;
        $match->score_domicile_tab = $tabDom;
        $match->score_exterieur_tab = $tabExt;
        $match->save();
    }

    /**
     * Retourne la liste des IDs de joueurs expulsés dans le match.
     */
    private function getJoueursExpulses($events): array
    {
        $expulses = [];

        // Cartons rouges directs ou doubles jaunes
        foreach ($events->whereIn('type', ['carton_rouge', 'carton_jaune_rouge']) as $event) {
            if ($event->joueur_id) {
                $expulses[] = $event->joueur_id;
            }
        }

        // Cumul de 2 cartons jaunes
        $jaunesParJoueur = $events
            ->where('type', 'carton_jaune')
            ->groupBy('joueur_id');

        foreach ($jaunesParJoueur as $joueurId => $jaunesEvents) {
            if ($jaunesEvents->count() >= 2 && $joueurId) {
                $expulses[] = (int) $joueurId;
            }
        }

        return array_unique($expulses);
    }

    /**
     * Traiter (accepter ou rejeter) une contestation de match.
     */
    public function traiterContestation(\Illuminate\Http\Request $request, int $matchId, int $contestationId)
    {
        $match = Rencontre::where('commissaire_id', $request->user()->id)->findOrFail($matchId);
        
        if (!in_array($match->statut, ['en_cours', 'mi_temps', 'termine'])) {
            return response()->json(['message' => 'Impossible de traiter une contestation pour un match dans cet état.'], 400);
        }

        $contestation = \App\Models\Contestation::whereHas('matchEvent', function ($q) use ($match) {
            $q->where('match_id', $match->id);
        })->findOrFail($contestationId);

        if ($contestation->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette contestation a déjà été traitée.'], 400);
        }

        $request->validate([
            'action' => 'required|in:accepter,rejeter',
            'decision' => 'nullable|string|max:1000',
        ]);

        $action = $request->input('action');
        $decision = $request->input('decision') ?? ($action === 'accepter' ? 'Acceptée par le commissaire.' : 'Rejetée par le commissaire.');

        $result = \DB::transaction(function () use ($contestation, $action, $decision, $request, $match) {
            if ($action === 'accepter') {
                $contestation->statut = 'acceptee';
                
                // Invalider l'événement de match lié
                $event = $contestation->matchEvent;
                $event->statut = 'annule';
                $event->save();

                // Recalculer le score du match
                $this->recalculerScoreRencontre($match);
            } else {
                $contestation->statut = 'rejetee';
            }

            $contestation->decision = $decision;
            $contestation->traitee_par_id = $request->user()->id;
            $contestation->date_decision = now();
            $contestation->save();

            // Notifier le coach en temps réel
            try {
                \App\Services\NotificationService::contestationTraitee($contestation);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Erreur lors de la notification du coach pour la contestation #{$contestation->id} : " . $e->getMessage());
            }

            // Notifier le coach
            try {
                \App\Services\NotificationService::contestationTraitee($contestation);
            } catch (\Exception $e) {
                // Ignorer les erreurs d'envoi de notification
            }

            return $contestation;
        });

        return response()->json([
            'success' => true,
            'message' => 'La contestation a été traitée avec succès.',
            'data'    => $result->load('matchEvent', 'coach.club'),
        ]);
    }
}
