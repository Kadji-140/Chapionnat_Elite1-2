<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use App\Http\Requests\Coach\StoreContestationRequest;
use App\Http\Resources\ContestationResource;
use App\Http\Resources\MatchEventResource;
use App\Models\Rencontre;
use App\Models\MatchEvent;
use App\Models\Contestation;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ContestationController extends Controller
{
    /**
     * Lister tous les événements d'un match pour le coach.
     */
    public function matchEvents(Request $request, int $matchId)
    {
        $match = Rencontre::findOrFail($matchId);

        // Vérifier que le coach appartient à l'un des deux clubs
        if ($request->user()->club_id !== $match->club_domicile_id && $request->user()->club_id !== $match->club_exterieur_id) {
            return response()->json(['message' => 'Non autorisé. Vous ne pouvez voir que les événements de votre propre club.'], 403);
        }

        $events = MatchEvent::where('match_id', $matchId)
            ->with(['joueur', 'joueurRemplacant', 'club', 'contestation'])
            ->orderBy('minute')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => MatchEventResource::collection($events),
        ]);
    }

    /**
     * Soumettre une contestation.
     */
    public function store(StoreContestationRequest $request, int $matchId)
    {
        $match = Rencontre::findOrFail($matchId);

        // Vérifier que le coach appartient à l'un des deux clubs
        if ($request->user()->club_id !== $match->club_domicile_id && $request->user()->club_id !== $match->club_exterieur_id) {
            return response()->json(['message' => 'Non autorisé. Vous ne pouvez contester que les événements de votre propre club.'], 403);
        }

        // Autoriser la contestation pour les matchs en cours, à la mi-temps ou terminés
        if (!in_array($match->statut, ['en_cours', 'mi_temps', 'termine'])) {
            return response()->json(['message' => 'Vous ne pouvez contester des événements que pour un match en cours ou terminé.'], 400);
        }

        // Bloquer si le match est déjà homologué
        if ($match->est_homologue || $match->statut === 'homologue') {
            return response()->json(['message' => 'Impossible de contester un événement : ce match a déjà été officiellement homologué.'], 400);
        }

        // Règle des 30 minutes : uniquement applicable si le match est terminé
        if ($match->statut === 'termine') {
            $finMatchTime = $match->updated_at;
            if ($finMatchTime->diffInMinutes(now()) > 30) {
                return response()->json(['message' => 'Le délai de contestation de 30 minutes après la fin du match est dépassé.'], 400);
            }
        }


        $validated = $request->validated();

        // Vérifier que l'événement appartient bien au match
        $event = MatchEvent::where('id', $validated['match_event_id'])->where('match_id', $match->id)->firstOrFail();

        // Vérifier si l'événement a déjà été contesté
        $existeDeja = Contestation::where('match_event_id', $event->id)->exists();
        if ($existeDeja) {
            return response()->json(['message' => 'Cet événement de match a déjà fait l\'objet d\'une contestation.'], 400);
        }

        $contestation = Contestation::create([
            'match_event_id' => $event->id,
            'coach_id' => $request->user()->id,
            'motif' => $validated['motif'],
            'statut' => 'en_attente',
            'date_contestation' => now(),
        ]);

        // Envoyer la notification in-app aux administrateurs
        NotificationService::contestationSoumise($contestation);

        return response()->json([
            'success' => true,
            'data'    => new ContestationResource($contestation->load('matchEvent', 'coach.club')),
        ]);
    }

    /**
     * Consulter l'historique des contestations du coach connecté.
     */
    public function index(Request $request)
    {
        $contestations = Contestation::where('coach_id', $request->user()->id)
            ->with(['matchEvent.match.clubDomicile', 'matchEvent.match.clubExterieur', 'coach.club', 'matchEvent.joueur'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => ContestationResource::collection($contestations),
        ]);
    }
}
