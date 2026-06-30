<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ExporterDonneesIA extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exporter:donnees-ia';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Exporte les données historiques des matchs avec feature engineering pour le module IA';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('📊 Début de l\'extraction et du calcul des données pour l\'IA...');

        // Récupérer tous les matchs terminés ou homologués
        $matchs = DB::table('matchs')
            ->whereIn('statut', ['termine', 'homologue'])
            ->whereNotNull('date_heure')
            ->orderBy('date_heure', 'asc')
            ->get();

        if ($matchs->isEmpty()) {
            $this->error('❌ Aucun match terminé ou homologué trouvé en base.');
            return 1;
        }

        $this->info("🔍 {$matchs->count()} matchs trouvés. Calcul des caractéristiques (features)...");

        $bar = $this->output->createProgressBar($matchs->count());
        $bar->start();

        $rows = [];
        // En-têtes CSV
        $headers = [
            'match_id',
            'victoires_dom_5',
            'nuls_dom_5',
            'defaites_dom_5',
            'victoires_ext_5',
            'nuls_ext_5',
            'defaites_ext_5',
            'buts_marques_dom_moy',
            'buts_encaisses_dom_moy',
            'buts_marques_ext_moy',
            'buts_encaisses_ext_moy',
            'h2h_dom_wins',
            'h2h_nuls',
            'h2h_ext_wins',
            'resultat'
        ];

        foreach ($matchs as $match) {
            $matchDate = $match->date_heure;
            $homeId = $match->club_domicile_id;
            $awayId = $match->club_exterieur_id;
            $competitionId = $match->competition_id;

            // 1. Forme récente domicile (5 derniers matchs avant cette date)
            $formDom = $this->getFormRecent($homeId, $matchDate);
            // 2. Forme récente extérieur (5 derniers matchs avant cette date)
            $formExt = $this->getFormRecent($awayId, $matchDate);

            // 3. Moyennes de buts domicile dans la saison courante (avant ce match)
            $moyDom = $this->getMoyenneButsSaison($homeId, $competitionId, $matchDate);
            // 4. Moyennes de buts extérieur dans la saison courante (avant ce match)
            $moyExt = $this->getMoyenneButsSaison($awayId, $competitionId, $matchDate);

            // 5. Confrontations directes historiques (H2H avant ce match)
            $h2h = $this->getConfrontationsDirectes($homeId, $awayId, $matchDate);

            // 6. Résultat (cible de prédiction)
            // 2 = Domicile gagne, 1 = Nul, 0 = Extérieur gagne
            $scoreDom = $match->score_domicile_officiel ?? $match->score_domicile_terrain;
            $scoreExt = $match->score_exterieur_officiel ?? $match->score_exterieur_terrain;

            if ($scoreDom > $scoreExt) {
                $resultat = 2;
            } elseif ($scoreDom < $scoreExt) {
                $resultat = 0;
            } else {
                $resultat = 1;
            }

            $rows[] = [
                $match->id,
                $formDom['victoires'],
                $formDom['nuls'],
                $formDom['defaites'],
                $formExt['victoires'],
                $formExt['nuls'],
                $formExt['defaites'],
                round($moyDom['marques'], 2),
                round($moyDom['encaisses'], 2),
                round($moyExt['marques'], 2),
                round($moyExt['encaisses'], 2),
                $h2h['win_dom'],
                $h2h['nuls'],
                $h2h['win_ext'],
                $resultat
            ];

            $bar->advance();
        }

        $bar->finish();
        $this->info('');

        // Définir le chemin d'exportation vers module_ia/data/export_matchs.csv
        $exportPath = base_path('../module_ia/data');
        if (!File::exists($exportPath)) {
            File::makeDirectory($exportPath, 0755, true);
        }

        $filePath = $exportPath . '/export_matchs.csv';
        $file = fopen($filePath, 'w');
        fputcsv($file, $headers);
        foreach ($rows as $row) {
            fputcsv($file, $row);
        }
        fclose($file);

        $this->info("✅ Exportation réussie ! Le fichier CSV a été enregistré dans : {$filePath}");
        $this->info("   Nombre total de lignes : " . count($rows));

        return 0;
    }

    /**
     * Calcule la forme récente d'une équipe (victoires, nuls, défaites sur les 5 derniers matchs).
     */
    private function getFormRecent(int $teamId, string $date)
    {
        $matchs = DB::table('matchs')
            ->where(function ($query) use ($teamId) {
                $query->where('club_domicile_id', $teamId)
                      ->orWhere('club_exterieur_id', $teamId);
            })
            ->whereIn('statut', ['termine', 'homologue'])
            ->where('date_heure', '<', $date)
            ->orderBy('date_heure', 'desc')
            ->limit(5)
            ->get();

        $victoires = 0;
        $nuls = 0;
        $defaites = 0;

        foreach ($matchs as $m) {
            $scoreDom = $m->score_domicile_officiel ?? $m->score_domicile_terrain;
            $scoreExt = $m->score_exterieur_officiel ?? $m->score_exterieur_terrain;

            if ($m->club_domicile_id == $teamId) {
                if ($scoreDom > $scoreExt) $victoires++;
                elseif ($scoreDom < $scoreExt) $defaites++;
                else $nuls++;
            } else {
                if ($scoreExt > $scoreDom) $victoires++;
                elseif ($scoreExt < $scoreDom) $defaites++;
                else $nuls++;
            }
        }

        return [
            'victoires' => $victoires,
            'nuls' => $nuls,
            'defaites' => $defaites
        ];
    }

    /**
     * Calcule les moyennes de buts marqués et encaissés dans la compétition et la saison courante avant le match.
     */
    private function getMoyenneButsSaison(int $teamId, int $competitionId, string $date)
    {
        $matchs = DB::table('matchs')
            ->where('competition_id', $competitionId)
            ->where(function ($query) use ($teamId) {
                $query->where('club_domicile_id', $teamId)
                      ->orWhere('club_exterieur_id', $teamId);
            })
            ->whereIn('statut', ['termine', 'homologue'])
            ->where('date_heure', '<', $date)
            ->get();

        if ($matchs->isEmpty()) {
            // Moyenne par défaut si aucun match préalable dans la saison (moyenne neutre théorique)
            return [
                'marques' => 1.2,
                'encaisses' => 1.2
            ];
        }

        $totalMarques = 0;
        $totalEncaisses = 0;

        foreach ($matchs as $m) {
            $scoreDom = $m->score_domicile_officiel ?? $m->score_domicile_terrain;
            $scoreExt = $m->score_exterieur_officiel ?? $m->score_exterieur_terrain;

            if ($m->club_domicile_id == $teamId) {
                $totalMarques += $scoreDom;
                $totalEncaisses += $scoreExt;
            } else {
                $totalMarques += $scoreExt;
                $totalEncaisses += $scoreDom;
            }
        }

        $count = $matchs->count();
        return [
            'marques' => $totalMarques / $count,
            'encaisses' => $totalEncaisses / $count
        ];
    }

    /**
     * Calcule le bilan des confrontations directes historiques (H2H) avant la date du match.
     */
    private function getConfrontationsDirectes(int $homeId, int $awayId, string $date)
    {
        $matchs = DB::table('matchs')
            ->where(function ($query) use ($homeId, $awayId) {
                $query->where(function ($q) use ($homeId, $awayId) {
                    $q->where('club_domicile_id', $homeId)->where('club_exterieur_id', $awayId);
                })->orWhere(function ($q) use ($homeId, $awayId) {
                    $q->where('club_domicile_id', $awayId)->where('club_exterieur_id', $homeId);
                });
            })
            ->whereIn('statut', ['termine', 'homologue'])
            ->where('date_heure', '<', $date)
            ->get();

        $winDom = 0;
        $winExt = 0;
        $nuls = 0;

        foreach ($matchs as $m) {
            $scoreDom = $m->score_domicile_officiel ?? $m->score_domicile_terrain;
            $scoreExt = $m->score_exterieur_officiel ?? $m->score_exterieur_terrain;

            // Déterminer le vainqueur du match historique
            if ($scoreDom > $scoreExt) {
                $winnerId = $m->club_domicile_id;
            } elseif ($scoreDom < $scoreExt) {
                $winnerId = $m->club_exterieur_id;
            } else {
                $winnerId = null;
            }

            if ($winnerId === $homeId) {
                $winDom++;
            } elseif ($winnerId === $awayId) {
                $winExt++;
            } else {
                $nuls++;
            }
        }

        return [
            'win_dom' => $winDom,
            'nuls' => $nuls,
            'win_ext' => $winExt
        ];
    }
}
