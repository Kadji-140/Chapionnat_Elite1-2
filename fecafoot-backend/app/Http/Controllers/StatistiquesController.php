<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\StatJoueurResource;
use App\Models\StatJoueur;
use App\Models\Joueur;
use App\Models\Club;
use App\Models\Competition;
use App\Services\StatistiqueService;
use Illuminate\Http\Request;

class StatistiquesController extends Controller
{
    protected StatistiqueService $statistiqueService;

    public function __construct(StatistiqueService $statistiqueService)
    {
        $this->statistiqueService = $statistiqueService;
    }

    /**
     * Top 10 buteurs de la compétition.
     */
    public function topButeurs(Request $request, int $competitionId)
    {
        $query = StatJoueur::where('competition_id', $competitionId)
            ->where('buts', '>', 0)
            ->with(['joueur.club']);

        // Filtre optionnel par poste
        if ($request->has('poste')) {
            $query->whereHas('joueur', function($q) use ($request) {
                $q->where('poste', $request->query('poste'));
            });
        }

        // Filtre optionnel par club
        if ($request->has('club_id')) {
            $query->whereHas('joueur', function($q) use ($request) {
                $q->where('club_id', $request->query('club_id'));
            });
        }

        $stats = $query->orderBy('buts', 'desc')
            ->orderBy('nb_matchs', 'asc') // Moins de matchs joués pour départager
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => StatJoueurResource::collection($stats),
        ]);
    }

    /**
     * Top 10 passeurs décisifs.
     */
    public function topPasseurs(Request $request, int $competitionId)
    {
        $query = StatJoueur::where('competition_id', $competitionId)
            ->where('passes_decisives', '>', 0)
            ->with(['joueur.club']);

        // Filtre optionnel par poste
        if ($request->has('poste')) {
            $query->whereHas('joueur', function($q) use ($request) {
                $q->where('poste', $request->query('poste'));
            });
        }

        // Filtre optionnel par club
        if ($request->has('club_id')) {
            $query->whereHas('joueur', function($q) use ($request) {
                $q->where('club_id', $request->query('club_id'));
            });
        }

        $stats = $query->orderBy('passes_decisives', 'desc')
            ->orderBy('nb_matchs', 'asc')
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => StatJoueurResource::collection($stats),
        ]);
    }

    /**
     * Classement fair-play (discipline) des clubs pour une compétition.
     * Somme pondérée : Jaune = 1, Rouge = 3. Le club avec le moins de points est premier.
     */
    public function disciplineClubs(Request $request, int $competitionId)
    {
        $statsClubs = \App\Models\ClassementClub::whereHas('poule.phase', function($q) use ($competitionId) {
                $q->where('competition_id', $competitionId);
            })
            ->with('club')
            ->get()
            ->groupBy('club_id');

        $resultat = [];

        foreach ($statsClubs as $clubId => $lines) {
            $club = $lines->first()->club;
            $jaunes = $lines->sum('cartons_jaunes');
            $rouges = $lines->sum('cartons_rouges');
            
            // Calculer les points de pénalité fair-play
            $pointsFairPlay = ($jaunes * 1) + ($rouges * 3);

            $resultat[] = [
                'club_id'         => $clubId,
                'club_nom'        => $club->nom ?? 'Inconnu',
                'club_logo'       => $club->logo_url ?? null,
                'cartons_jaunes'  => $jaunes,
                'cartons_rouges'  => $rouges,
                'points_fairplay' => $pointsFairPlay,
            ];
        }

        // Trier par points fair-play croissants (le plus propre en premier)
        usort($resultat, fn($a, $b) => $a['points_fairplay'] <=> $b['points_fairplay']);

        return response()->json([
            'success' => true,
            'data'    => $resultat,
        ]);
    }

    /**
     * Statistiques complètes d'un joueur.
     */
    public function statsJoueur(Request $request, int $joueurId)
    {
        $joueur = Joueur::with('club')->findOrFail($joueurId);
        $stats = StatJoueur::where('joueur_id', $joueurId)
            ->with('competition')
            ->get();

        return response()->json([
            'success' => true,
            'joueur'  => [
                'id'       => $joueur->id,
                'nom'      => $joueur->nom,
                'prenom'   => $joueur->prenom,
                'poste'    => $joueur->poste,
                'numero'   => $joueur->numero_maillot ?? $joueur->num_maillot ?? null,
                'photo'    => $joueur->photo_url ?? null,
                'club_nom' => $joueur->club->nom ?? 'Sans club',
                'club_logo'=> $joueur->club->logo_url ?? null,
            ],
            'stats'   => StatJoueurResource::collection($stats),
        ]);
    }

    /**
     * Statistiques des joueurs du club pour le coach connecté.
     */
    public function statsCoachEffectif(Request $request)
    {
        $coach = $request->user();
        if (!$coach->club_id) {
            return response()->json(['success' => false, 'message' => 'Ce coach n\'est rattaché à aucun club.'], 400);
        }

        $stats = StatJoueur::whereHas('joueur', function($q) use ($coach) {
                $q->where('club_id', $coach->club_id);
            })
            ->with(['joueur'])
            ->get();

        return response()->json([
            'success' => true,
            'data'    => StatJoueurResource::collection($stats),
        ]);
    }

    /**
     * Forcer le recalcul global des statistiques d'une compétition (admin).
     */
    public function recalculerStats(Request $request)
    {
        $request->validate([
            'competition_id' => 'required|integer|exists:competitions,id',
        ]);

        try {
            $this->statistiqueService->recalculerCompetition($request->input('competition_id'));
            return response()->json([
                'success' => true,
                'message' => 'Les statistiques de la compétition ont été recalculées avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du recalcul : ' . $e->getMessage(),
            ], 400);
        }
    }
}
