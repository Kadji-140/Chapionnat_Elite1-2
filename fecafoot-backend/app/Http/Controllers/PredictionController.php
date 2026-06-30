<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\IAService;
use App\Models\PredictionMatch;
use App\Models\TalentScore;
use App\Models\Saison;
use App\Models\Rencontre;
use App\Models\Joueur;
use Illuminate\Support\Facades\Artisan;

class PredictionController extends Controller
{
    protected $iaService;

    public function __construct(IAService $iaService)
    {
        $this->iaService = $iaService;
    }

    public function predict(int $matchId)
    {
        $match = Rencontre::find($matchId);
        if (!$match) {
            return response()->json([
                'success' => false,
                'message' => 'Match non trouvé'
            ], 404);
        }

        // Si le match a déjà une prédiction en base, on la retourne.
        // Sinon on appelle le service pour la calculer.
        $prediction = PredictionMatch::where('match_id', $matchId)->first();

        if ($prediction) {
            // Reconstruire la réponse sous le même format que Flask pour la cohérence
            $proba_dom = $prediction->proba_victoire_dom * 100;
            $proba_nul = $prediction->proba_nul * 100;
            $proba_ext = $prediction->proba_victoire_ext * 100;

            $max_prob = max($proba_dom, $proba_nul, $proba_ext);
            if ($max_prob == $proba_dom) {
                $prediction_str = "domicile";
            } elseif ($max_prob == $proba_ext) {
                $prediction_str = "exterieur";
            } else {
                $prediction_str = "nul";
            }

            if ($max_prob >= 60.0) {
                $confiance = "elevee";
            } elseif ($max_prob >= 45.0) {
                $confiance = "moyenne";
            } else {
                $confiance = "faible";
            }

            $data = [
                'victoire_domicile' => round($proba_dom, 1),
                'nul' => round($proba_nul, 1),
                'victoire_exterieur' => round($proba_ext, 1),
                'prediction' => $prediction_str,
                'confiance' => $confiance,
                'date_calcul' => $prediction->date_calcul,
                'modele_version' => $prediction->modele_version
            ];
        } else {
            $data = $this->iaService->predictMatch($matchId);
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    public function getTalentScore(int $joueurId)
    {
        $joueur = Joueur::find($joueurId);
        if (!$joueur) {
            return response()->json([
                'success' => false,
                'message' => 'Joueur non trouvé'
            ], 404);
        }

        $saison = Saison::where('statut', 'en_cours')->first() 
            ?? Saison::orderBy('id', 'desc')->first();

        if (!$saison) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune saison trouvée'
            ], 400);
        }

        $talentScore = TalentScore::where('joueur_id', $joueurId)
            ->where('saison_id', $saison->id)
            ->first();

        if (!$talentScore) {
            // Si pas calculé, on calcule à la volée
            $data = $this->iaService->computePlayerTalentScore($joueurId, $saison->id);
            if (!$data) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de calculer le score de talent (le joueur n\'a peut-être pas de statistiques)'
                ], 400);
            }
        } else {
            $details = is_string($talentScore->details) 
                ? json_decode($talentScore->details, true) 
                : $talentScore->details;

            $data = [
                'talent_score' => $talentScore->score_global,
                'niveau' => $this->deriveNiveau($talentScore->score_global),
                'recommande_recrutement' => $talentScore->score_global >= 75.0,
                'details' => $details,
                'date_calcul' => $talentScore->date_calcul,
                'modele_version' => $talentScore->modele_version
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    public function recalculerTalents(Request $request)
    {
        try {
            Artisan::call('ia:calculer-talents');
            $output = Artisan::output();
            
            return response()->json([
                'success' => true,
                'message' => 'Recalcul des scores de talent effectué avec succès.',
                'output' => $output
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du recalcul des talents : ' . $e->getMessage()
            ], 500);
        }
    }

    private function deriveNiveau($score)
    {
        if ($score >= 80.0) return "Excellent";
        if ($score >= 65.0) return "Tres Bon";
        if ($score >= 50.0) return "Bon";
        return "Moyen";
    }
}
