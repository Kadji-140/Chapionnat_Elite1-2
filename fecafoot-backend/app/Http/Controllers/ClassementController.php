<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClassementResource;
use App\Models\ClassementClub;
use App\Models\Poule;
use App\Models\Competition;
use App\Models\Rencontre;
use App\Models\Penalite;
use App\Services\ClassementService;
use Illuminate\Http\Request;

class ClassementController extends Controller
{
    protected ClassementService $classementService;

    public function __construct(ClassementService $classementService)
    {
        $this->classementService = $classementService;
    }

    /**
     * Classement d'une poule spécifique.
     */
    public function classementPoule(Request $request, int $pouleId)
    {
        $classements = ClassementClub::where('poule_id', $pouleId)
            ->with('club')
            ->orderBy('position')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => ClassementResource::collection($classements),
        ]);
    }

    /**
     * Classement global consolidé d'une compétition (regroupe toutes les poules).
     */
    public function classementCompetition(Request $request, int $competitionId)
    {
        $classements = ClassementClub::whereHas('poule.phase', function ($q) use ($competitionId) {
                $q->where('competition_id', $competitionId);
            })
            ->with(['club', 'poule'])
            ->orderBy('poule_id')
            ->orderBy('position')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => ClassementResource::collection($classements),
        ]);
    }

    /**
     * Classement consolidé de toute la saison.
     */
    public function classementSaison(Request $request, int $saisonId)
    {
        $classements = ClassementClub::where('saison_id', $saisonId)
            ->with(['club', 'poule.phase.competition'])
            ->orderBy('position')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => ClassementResource::collection($classements),
        ]);
    }

    /**
     * Historique des positions d'un club par journée.
     */
    public function historiqueClub(Request $request, int $clubId)
    {
        // 1. Trouver dans quelle poule/saison joue le club actuellement
        $classementActuel = ClassementClub::where('club_id', $clubId)
            ->with(['poule', 'saison'])
            ->first();

        if (!$classementActuel) {
            return response()->json(['success' => false, 'message' => 'Aucune donnée de classement trouvée pour ce club.'], 404);
        }

        $pouleId = $classementActuel->poule_id;
        $saisonId = $classementActuel->saison_id;

        // 2. Récupérer tous les matchs homologués de cette poule
        $matchs = Rencontre::where('poule_id', $pouleId)
            ->where('statut', 'homologue')
            ->orderBy('journee')
            ->get();

        $maxJournee = $matchs->max('journee') ?? 0;
        $historique = [];

        // Pour chaque journée, on calcule le classement intermédiaire
        for ($j = 1; $j <= $maxJournee; $j++) {
            $matchsIntermediaires = $matchs->where('journee', '<=', $j);
            
            // Calculer les stats de chaque club pour cette journée
            $statsClubs = [];
            $poule = Poule::with('clubs')->find($pouleId);
            if ($poule) {
                $clubs = $poule->clubs;
                foreach ($clubs as $club) {
                    $statsClubs[] = $this->calculerStatsClubIntermediaire($club->id, $pouleId, $saisonId, $matchsIntermediaires);
                }
            }

            // Trier les clubs pour attribuer les positions
            usort($statsClubs, function($a, $b) {
                $ptsA = max(0, $a['points'] - $a['points_penalite']);
                $ptsB = max(0, $b['points'] - $b['points_penalite']);
                if ($ptsA !== $ptsB) return $ptsB <=> $ptsA;
                if ($a['diff_buts'] !== $b['diff_buts']) return $b['diff_buts'] <=> $a['diff_buts'];
                if ($a['buts_pour'] !== $b['buts_pour']) return $b['buts_pour'] <=> $a['buts_pour'];
                return $a['club_id'] <=> $b['club_id'];
            });

            // Trouver la position de notre club
            $position = 0;
            foreach ($statsClubs as $idx => $s) {
                if ($s['club_id'] === $clubId) {
                    $position = $idx + 1;
                    break;
                }
            }

            if ($position > 0) {
                $historique[] = [
                    'journee'  => $j,
                    'position' => $position,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'club_id'    => $clubId,
                'club_nom'   => $classementActuel->club->nom ?? '',
                'historique' => $historique,
                'meilleur'   => count($historique) > 0 ? min(array_column($historique, 'position')) : null,
                'pire'       => count($historique) > 0 ? max(array_column($historique, 'position')) : null,
                'en_tete'    => count($historique) > 0 ? count(array_filter($historique, fn($h) => $h['position'] === 1)) : 0,
            ],
        ]);
    }

    /**
     * Forcer le recalcul du classement d'une poule (admin).
     */
    public function recalculerPoule(Request $request, int $pouleId)
    {
        try {
            $this->classementService->recalculerPoule($pouleId);
            return response()->json([
                'success' => true,
                'message' => 'Le classement de la poule a été recalculé avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du recalcul : ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Geler/Dégeler le classement d'une poule (admin).
     */
    public function toggleGelPoule(Request $request, int $pouleId)
    {
        $poule = Poule::findOrFail($pouleId);
        $poule->classement_gele = !$poule->classement_gele;
        $poule->save();

        $statut = $poule->classement_gele ? 'gelé' : 'dégelé';

        return response()->json([
            'success' => true,
            'message' => "Le classement de la poule a été {$statut} avec succès.",
            'gele'    => $poule->classement_gele,
        ]);
    }

    /**
     * Méthode d'aide pour calculer les statistiques intermédiaires d'un club.
     */
    private function calculerStatsClubIntermediaire(int $clubId, int $pouleId, int $saisonId, $matchs): array
    {
        $matchsClub = $matchs->filter(fn($m) => $m->club_domicile_id === $clubId || $m->club_exterieur_id === $clubId);
        
        $nbMatchs = 0;
        $victoires = 0;
        $nuls = 0;
        $defaites = 0;
        $butsPour = 0;
        $butsContre = 0;

        foreach ($matchsClub as $match) {
            $nbMatchs++;
            $estDom = ($match->club_domicile_id === $clubId);
            $scoreDom = $match->score_domicile_officiel ?? $match->score_domicile_terrain ?? 0;
            $scoreExt = $match->score_exterieur_officiel ?? $match->score_exterieur_terrain ?? 0;

            $bp = $estDom ? $scoreDom : $scoreExt;
            $bc = $estDom ? $scoreExt : $scoreDom;

            $butsPour += $bp;
            $butsContre += $bc;

            if ($bp > $bc) {
                $victoires++;
            } elseif ($bp === $bc) {
                $nuls++;
            } else {
                $defaites++;
            }
        }

        $points = ($victoires * 3) + $nuls;

        // Pénalités de points
        $pointsPenalite = Penalite::where('club_id', $clubId)
            ->where('saison_id', $saisonId)
            ->where('active', true)
            ->sum('points_retires');

        return [
            'club_id'         => $clubId,
            'points'          => $points,
            'points_penalite' => $pointsPenalite,
            'diff_buts'       => $butsPour - $butsContre,
            'buts_pour'       => $butsPour,
        ];
    }
}
