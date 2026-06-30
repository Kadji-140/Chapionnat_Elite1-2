<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Force loading database
use App\Models\Saison;
use App\Models\Competition;
use App\Models\ReglesCompetition;

echo "=== SAISONS ===\n";
foreach (Saison::all() as $s) {
    echo "ID: {$s->id} | Nom: {$s->nom} | Statut: {$s->statut} | Debut: {$s->date_debut} | Fin: {$s->date_fin}\n";
}
echo "\n";

echo "=== COMPETITIONS ===\n";
foreach (Competition::all() as $c) {
    $regles = ReglesCompetition::where('competition_id', $c->id)->first();
    $nbClubs = $regles ? $regles->nb_clubs : 'Aucune règle';
    $nbJournees = $regles ? $regles->nb_matchs_par_club : 'Aucune règle';
    echo "ID: {$c->id} | SaisonID: {$c->saison_id} | Nom: {$c->nom} | Niveau: {$c->niveau} | Statut: {$c->statut} | ClubsRegles: {$nbClubs} | JourneesRegles: {$nbJournees}\n";
}
echo "\n";
