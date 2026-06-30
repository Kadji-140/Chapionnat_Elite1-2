<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubStatistiqueSaison;
use App\Models\Competition;
use App\Models\FavoriClub;
use App\Models\FavoriJoueur;
use App\Models\HistoriqueCarriere;
use App\Models\Joueur;
use App\Models\JoueurStatistiqueSaison;
use App\Models\MatchEvent;
use App\Models\MobileUser;
use App\Models\Rencontre;
use App\Models\Saison;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatistiquesController extends Controller
{
    /**
     * GET /api/mobile/clubs/{id}/details
     */
    public function clubDetails(Request $request, int $id): JsonResponse
    {
        $club = Club::findOrFail($id);
        $idAnonyme = $request->query('id_anonyme');

        // Check if favorite
        $isFavorite = false;
        if ($idAnonyme) {
            $mobileUser = MobileUser::where('id_anonyme', $idAnonyme)->first();
            if ($mobileUser) {
                $isFavorite = FavoriClub::where('mobile_user_id', $mobileUser->id)
                    ->where('club_id', $id)
                    ->exists();
            }
        }

        // Current season
        $saison = Saison::where('statut', 'en_cours')->orderBy('date_debut', 'desc')->first() ?? Saison::orderBy('date_debut', 'desc')->first();

        // Club stats for current season
        $statsSaison = null;
        if ($saison) {
            $statsSaison = ClubStatistiqueSaison::where('club_id', $id)
                ->where('saison_id', $saison->id)
                ->first();
        }

        // Dynamically compute form (les 5 derniers résultats)
        $matchsRecents = Rencontre::where(function ($q) use ($id) {
                $q->where('club_domicile_id', $id)
                  ->orWhere('club_exterieur_id', $id);
            })
            ->whereIn('statut', ['termine', 'homologue'])
            ->orderByDesc('date_heure')
            ->limit(5)
            ->get();

        $forme = [];
        // Loop through matches and determine outcome
        foreach ($matchsRecents as $match) {
            $scoreDom = $match->score_domicile_terrain;
            $scoreExt = $match->score_exterieur_terrain;

            if ($scoreDom === $scoreExt) {
                $forme[] = 'N';
            } elseif ($match->club_domicile_id === $id) {
                $forme[] = ($scoreDom > $scoreExt) ? 'V' : 'D';
            } else {
                $forme[] = ($scoreExt > $scoreDom) ? 'V' : 'D';
            }
        }
        // Oldest to newest
        $forme = array_reverse($forme);

        // Palmarès
        $palmares = $club->palmares()->orderByDesc('annee')->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'id'             => $club->id,
                'nom'            => $club->nom,
                'ville'          => $club->ville,
                'division'       => $club->division,
                'logo_url'       => $club->logo_url,
                'stade'          => $club->stade,
                'president'      => $club->president,
                'couleurs'       => $club->couleurs,
                'annee_creation' => $club->annee_creation,
                'site_web'       => $club->site_web,
                'telephone'      => $club->telephone,
                'presentation'   => $club->presentation,
                'nb_abonnes'     => $club->nb_abonnes,
                'is_favorite'    => $isFavorite,
                'forme_actuelle' => !empty($forme) ? $forme : ["N", "N", "N", "N", "N"],
                'statistiques'   => $statsSaison ? [
                    'tirs_par_match'            => $statsSaison->tirs_par_match,
                    'tirs_cadres_par_match'     => $statsSaison->tirs_cadres_par_match,
                    'passes_reussies_par_match' => $statsSaison->passes_reussies_par_match,
                    'cartons_jaunes_total'      => $statsSaison->cartons_jaunes_total,
                    'cartons_rouges_total'      => $statsSaison->cartons_rouges_total,
                    'tacles_par_match'          => $statsSaison->tacles_par_match,
                ] : [
                    'tirs_par_match'            => 0,
                    'tirs_cadres_par_match'     => 0,
                    'passes_reussies_par_match' => 0,
                    'cartons_jaunes_total'      => 0,
                    'cartons_rouges_total'      => 0,
                    'tacles_par_match'          => 0,
                ],
                'palmares' => $palmares->map(fn($p) => [
                    'titre' => $p->titre,
                    'annee' => $p->annee,
                ]),
            ],
        ]);
    }

    /**
     * GET /api/mobile/joueurs/{id}/details
     */
    public function joueurDetails(Request $request, int $id): JsonResponse
    {
        $joueur = Joueur::with('club')->findOrFail($id);
        $idAnonyme = $request->query('id_anonyme');

        // Check favorite
        $isFavorite = false;
        if ($idAnonyme) {
            $mobileUser = MobileUser::where('id_anonyme', $idAnonyme)->first();
            if ($mobileUser) {
                $isFavorite = FavoriJoueur::where('mobile_user_id', $mobileUser->id)
                    ->where('joueur_id', $id)
                    ->exists();
            }
        }

        // Current season
        $saison = Saison::where('statut', 'en_cours')->first() ?? Saison::orderByDesc('id')->first();

        // Player stats
        $statsSaison = null;
        if ($saison) {
            $statsSaison = JoueurStatistiqueSaison::where('joueur_id', $id)
                ->where('saison_id', $saison->id)
                ->first();
        }

        // Career history
        $historique = HistoriqueCarriere::where('joueur_id', $id)->orderByDesc('saison')->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'id'                => $joueur->id,
                'nom'               => $joueur->nom,
                'prenom'            => $joueur->prenom,
                'nom_complet'       => $joueur->nom_complet,
                'date_naissance'    => $joueur->date_naissance ? $joueur->date_naissance->toDateString() : null,
                'age'               => $joueur->date_naissance ? $joueur->age : null,
                'nationalite'       => $joueur->nationalite,
                'num_licence'       => $joueur->num_licence,
                'poste'             => $joueur->poste,
                'num_maillot'       => $joueur->num_maillot,
                'photo_url'         => $joueur->photo_url,
                'taille_cm'         => $joueur->taille_cm,
                'poids_kg'          => $joueur->poids_kg,
                'valeur_marchande'  => $joueur->valeur_marchande,
                'nb_abonnes'        => $joueur->nb_abonnes,
                'is_favorite'       => $isFavorite,
                'club'              => $joueur->club ? [
                    'id'  => $joueur->club->id,
                    'nom' => $joueur->club->nom,
                ] : null,
                'statistiques' => $statsSaison ? [
                    'matchs_joues'     => $statsSaison->matchs_joues,
                    'titularisations'  => $statsSaison->titularisations,
                    'minutes_jouees'   => $statsSaison->minutes_jouees,
                    'buts'             => $statsSaison->buts,
                    'passes_decisives' => $statsSaison->passes_decisives,
                    'tirs'             => $statsSaison->tirs,
                    'tirs_cadres'      => $statsSaison->tirs_cadres,
                    'tacles'           => $statsSaison->tacles,
                    'interceptions'    => $statsSaison->interceptions,
                    'duels_gagnes'     => $statsSaison->duels_gagnes,
                    'cartons_jaunes'   => $statsSaison->cartons_jaunes,
                    'cartons_rouges'   => $statsSaison->cartons_rouges,
                    'fautes_commises'  => $statsSaison->fautes_commises,
                ] : [
                    'matchs_joues'     => 0,
                    'titularisations'  => 0,
                    'minutes_jouees'   => 0,
                    'buts'             => 0,
                    'passes_decisives' => 0,
                    'tirs'             => 0,
                    'tirs_cadres'      => 0,
                    'tacles'           => 0,
                    'interceptions'    => 0,
                    'duels_gagnes'     => 0,
                    'cartons_jaunes'   => 0,
                    'cartons_rouges'   => 0,
                    'fautes_commises'  => 0,
                ],
                'historique_carriere' => $historique->map(fn($h) => [
                    'saison'       => $h->saison,
                    'club_nom'     => $h->club_nom,
                    'matchs_joues' => $h->matchs_joues,
                    'buts'         => $h->buts,
                    'passes'       => $h->passes,
                ]),
            ],
        ]);
    }

    /**
     * GET /api/mobile/competitions/{id}/details
     */
    public function competitionDetails($id): JsonResponse
    {
        // Résolution de l'id si non numérique (l1, l2, elite_one, etc.)
        if (!is_numeric($id)) {
            $saison = Saison::where('statut', 'en_cours')->orderBy('date_debut', 'desc')->first() ?? Saison::orderBy('date_debut', 'desc')->first();
            $saisonId = $saison ? $saison->id : null;
            
            $niveau = 'elite_one';
            if (in_array(strtolower($id), ['l2', 'elite_two', 'elite 2', 'mtn elite two'])) {
                $niveau = 'elite_two';
            }
            
            $competition = Competition::where('saison_id', $saisonId)
                ->where('niveau', $niveau)
                ->first();
                
            if (!$competition) {
                $competition = Competition::where('niveau', $niveau)->orderBy('id', 'desc')->first();
            }
            
            if ($competition) {
                $id = $competition->id;
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Compétition introuvable pour ce niveau.'
                ], 404);
            }
        } else {
            $competition = Competition::with('saison')->find($id);
            if (!$competition) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compétition introuvable.'
                ], 404);
            }
        }

        $saison = $competition->saison;

        // 1. Progression de la saison
        $progression = 0;
        if ($saison && $saison->date_debut && $saison->date_fin) {
            $debut = Carbon::parse($saison->date_debut);
            $fin   = Carbon::parse($saison->date_fin);
            $now   = now();

            if ($now->lt($debut)) {
                $progression = 0;
            } elseif ($now->gt($fin)) {
                $progression = 100;
            } else {
                $totalDays   = $debut->diffInDays($fin);
                $elapsedDays = $debut->diffInDays($now);
                $progression = $totalDays > 0 ? (int) round(($elapsedDays / $totalDays) * 100) : 0;
            }
        }

        // 2. Buts et cartes par match
        $matchsJoues = Rencontre::where('competition_id', $id)
            ->whereIn('statut', ['termine', 'homologue'])
            ->get();

        $nbMatchs = $matchsJoues->count();
        $butsTotal = 0;

        foreach ($matchsJoues as $m) {
            $butsTotal += ($m->score_domicile_terrain + $m->score_exterieur_terrain);
        }

        $butsMoyens = $nbMatchs > 0 ? round($butsTotal / $nbMatchs, 1) : 0;

        // Nombre de cartons (jaunes/rouges)
        $jaunesCount = MatchEvent::whereHas('match', function ($query) use ($id) {
            $query->where('competition_id', $id);
        })->where('type', 'carton_jaune')->where('statut', 'valide')->count();

        $rougesCount = MatchEvent::whereHas('match', function ($query) use ($id) {
            $query->where('competition_id', $id);
        })->where('type', 'carton_rouge')->where('statut', 'valide')->count();

        $jaunesMoyens = $nbMatchs > 0 ? round($jaunesCount / $nbMatchs, 1) : 0;
        $rougesMoyens = $nbMatchs > 0 ? round($rougesCount / $nbMatchs, 1) : 0;

        // 3. Ratios Victoires Dom/Nul/Ext
        $victoiresDom = 0;
        $nuls = 0;
        $victoiresExt = 0;

        foreach ($matchsJoues as $m) {
            $sd = $m->score_domicile_terrain;
            $se = $m->score_exterieur_terrain;

            if ($sd > $se) {
                $victoiresDom++;
            } elseif ($sd < $se) {
                $victoiresExt++;
            } else {
                $nuls++;
            }
        }

        $ratioDom = $nbMatchs > 0 ? (int) round(($victoiresDom / $nbMatchs) * 100) : 0;
        $ratioNul = $nbMatchs > 0 ? (int) round(($nuls / $nbMatchs) * 100) : 0;
        $ratioExt = $nbMatchs > 0 ? (int) round(($victoiresExt / $nbMatchs) * 100) : 0;

        // 4. Nombre de clubs et de journées configurés
        $regles = \App\Models\ReglesCompetition::where('competition_id', $id)->first();
        $nbClubs = $regles ? $regles->nb_clubs : 0;
        if ($nbClubs <= 0) {
            $clubsDom = Rencontre::where('competition_id', $id)->pluck('club_domicile_id');
            $clubsExt = Rencontre::where('competition_id', $id)->pluck('club_exterieur_id');
            $nbClubs = $clubsDom->merge($clubsExt)->unique()->count();
        }

        $nbJournees = Rencontre::where('competition_id', $id)->distinct('journee')->count('journee');
        if ($nbJournees <= 0) {
            $nbJournees = $regles ? ($regles->nb_matchs_par_club ?: ($nbClubs > 0 ? ($nbClubs - 1) * 2 : 0)) : 0;
        }

        // 5. Meilleur buteur
        $buteur = MatchEvent::select('joueur_id', DB::raw('count(*) as total_buts'))
            ->whereHas('match', function ($query) use ($id) {
                $query->where('competition_id', $id);
            })
            ->whereIn('type', ['but', 'penalty_marque'])
            ->whereNotNull('joueur_id')
            ->where('statut', 'valide')
            ->groupBy('joueur_id')
            ->orderByDesc('total_buts')
            ->with('joueur.club')
            ->first();

        $meilleurButeur = null;
        if ($buteur && $buteur->joueur) {
            $meilleurButeur = [
                'joueur_id'   => $buteur->joueur->id,
                'nom_complet' => $buteur->joueur->nom_complet,
                'club'        => $buteur->joueur->club->nom ?? '',
                'buts'        => $buteur->total_buts,
            ];
        }

        // Date de début et de fin sous forme lisible
        $dateDebutStr = $saison ? Carbon::parse($saison->date_debut)->translatedFormat('M Y') : 'Oct 2025';
        $dateFinStr = $saison ? Carbon::parse($saison->date_fin)->translatedFormat('M Y') : 'Mai 2026';

        return response()->json([
            'success' => true,
            'data'    => [
                'id'                  => $competition->id,
                'nom'                 => $competition->nom,
                'statut'              => $competition->statut,
                'progression_saison'  => $progression,
                'buts_moyens'         => $butsMoyens,
                'cartons_jaunes_moyens' => $jaunesMoyens,
                'cartons_rouges_moyens' => $rougesMoyens,
                'meilleur_buteur'     => $meilleurButeur,
                'ratios'              => [
                    'domicile_pct'  => $ratioDom,
                    'nul_pct'       => $ratioNul,
                    'exterieur_pct' => $ratioExt,
                ],
                'matchs_joues_count'  => $nbMatchs,
                'nb_clubs'            => $nbClubs,
                'nb_journees'         => $nbJournees,
                'date_debut_fin'      => ucfirst($dateDebutStr) . ' - ' . ucfirst($dateFinStr),
            ],
        ]);
    }
}
