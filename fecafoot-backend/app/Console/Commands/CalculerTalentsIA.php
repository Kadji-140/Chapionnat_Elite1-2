<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Joueur;
use App\Models\Saison;
use App\Services\IAService;

class CalculerTalentsIA extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ia:calculer-talents';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calcule les scores de talent de tous les joueurs actifs avec le module IA';

    /**
     * Execute the console command.
     */
    public function handle(IAService $iaService)
    {
        $this->info('🧠 Début du calcul des scores de talent pour les joueurs...');

        $saison = Saison::where('statut', 'en_cours')->first() 
            ?? Saison::orderBy('id', 'desc')->first();

        if (!$saison) {
            $this->error('❌ Aucune saison active trouvée.');
            return 1;
        }

        $this->info("📅 Saison ciblée : {$saison->intitule} (ID: {$saison->id})");

        // Récupérer les joueurs validés
        $joueurs = Joueur::where('statut_validation', 'valide')->get();

        if ($joueurs->isEmpty()) {
            $this->error('❌ Aucun joueur validé trouvé.');
            return 1;
        }

        $this->info("🔍 {$joueurs->count()} joueurs trouvés. Envoi au service d'IA...");

        $bar = $this->output->createProgressBar($joueurs->count());
        $bar->start();

        $successCount = 0;
        foreach ($joueurs as $joueur) {
            $result = $iaService->computePlayerTalentScore($joueur->id, $saison->id);
            if ($result) {
                $successCount++;
            }
            $bar->advance();
        }

        $bar->finish();
        $this->info('');
        $this->info("✅ Calcul terminé ! {$successCount}/{$joueurs->count()} joueurs calculés avec succès.");

        return 0;
    }
}
