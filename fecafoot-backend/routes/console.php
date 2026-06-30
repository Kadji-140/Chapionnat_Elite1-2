<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Models\Rencontre;
use App\Models\User;
use App\Services\NotificationService;
use App\Mail\AlerteMatchMail;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ─────────────────────────────────────────────────────────────────────────────
// TÂCHE 1 : Rappel de match — toutes les 10 minutes
// Notifie les commissaires et arbitres pour les matchs débutant dans moins de 2h
// ─────────────────────────────────────────────────────────────────────────────
Schedule::call(function () {
    $maintenant   = now();
    $dans2heures  = now()->addHours(2);
    $dans90min    = now()->addMinutes(90);

    // Matchs entre 90 min et 2h à venir (fenêtre de rappel)
    $matchsAVenir = Rencontre::where('statut', 'programme')
        ->whereBetween('date_heure', [$dans90min, $dans2heures])
        ->with(['commissaire', 'arbitrePrincipal', 'clubDomicile', 'clubExterieur'])
        ->get();

    foreach ($matchsAVenir as $match) {
        $nomDom = $match->clubDomicile->nom ?? '?';
        $nomExt = $match->clubExterieur->nom ?? '?';
        $heure  = $match->date_heure->format('H:i');
        $titre  = "⏰ Rappel match — {$nomDom} vs {$nomExt}";
        $msg    = "Votre match {$nomDom} vs {$nomExt} débute à {$heure}. Veuillez vous préparer.";
        $lien   = '/commissaire/matchs';

        // Notifier le commissaire
        if ($match->commissaire_id) {
            NotificationService::send($match->commissaire_id, 'rappel_match', $titre, $msg, $lien, ['match_id' => $match->id]);

            try {
                if ($match->commissaire && $match->commissaire->email) {
                    Mail::to($match->commissaire->email)->send(
                        new AlerteMatchMail($titre, $msg, config('app.frontend_url', 'http://localhost:5173') . $lien)
                    );
                }
            } catch (\Exception $e) {
                Log::error("Erreur envoi mail rappel commissaire match #{$match->id}: " . $e->getMessage());
            }
        }
    }
})->everyTenMinutes()->name('rappel-match-commissaire')->withoutOverlapping();

// ─────────────────────────────────────────────────────────────────────────────
// TÂCHE 2 : Matchs non démarrés — toutes les 5 minutes
// Si un match est toujours "programme" 15 minutes après son heure de début,
// on alerte les admins (le commissaire n'a pas démarré le match)
// ─────────────────────────────────────────────────────────────────────────────
Schedule::call(function () {
    $seuilRetard = now()->subMinutes(15); // Seuil réduit à 15 minutes comme demandé

    $matchsRetard = Rencontre::where('statut', 'programme')
        ->where('date_heure', '<', $seuilRetard)
        ->with(['clubDomicile', 'clubExterieur', 'commissaire'])
        ->get();

    foreach ($matchsRetard as $match) {
        $nomDom    = $match->clubDomicile->nom ?? '?';
        $nomExt    = $match->clubExterieur->nom ?? '?';
        $heurePrev = $match->date_heure->format('d/m/Y à H:i');
        $retard    = $match->date_heure->diffInMinutes(now());

        $titre   = "🚨 Match non démarré — {$nomDom} vs {$nomExt}";
        $message = "Le match {$nomDom} vs {$nomExt} prévu le {$heurePrev} n'a toujours pas démarré ({$retard} min de retard).";
        $lien    = '/admin/matchs';

        NotificationService::sendToAdmins(
            type: 'match_non_demarre',
            titre: $titre,
            message: $message,
            lien: $lien,
            metadata: ['match_id' => $match->id]
        );

        // Envoyer e-mail aux admins
        try {
            $admins = User::where('role', 'admin')->where('acces_actif', true)->get();
            foreach ($admins as $admin) {
                Mail::to($admin->email)->send(
                    new AlerteMatchMail($titre, $message, config('app.frontend_url', 'http://localhost:5173') . $lien)
                );
            }
        } catch (\Exception $e) {
            Log::error("Erreur envoi mail alerte match non demarre match #{$match->id}: " . $e->getMessage());
        }
    }
})->everyFiveMinutes()->name('alerte-match-non-demarre')->withoutOverlapping();

// ─────────────────────────────────────────────────────────────────────────────
// TÂCHE 3 : Rappel composition manquante — toutes les 10 minutes
// Si un match débute dans moins de 2h et que la composition d'un club n'est pas confirmée
// ─────────────────────────────────────────────────────────────────────────────
Schedule::call(function () {
    $dans2heures = now()->addHours(2);
    
    $matchsImminents = Rencontre::where('statut', 'programme')
        ->whereBetween('date_heure', [now(), $dans2heures])
        ->with(['clubDomicile', 'clubExterieur', 'compositions'])
        ->get();

    foreach ($matchsImminents as $match) {
        $compoDom = $match->compositions->where('club_id', $match->club_domicile_id)->first();
        $compoExt = $match->compositions->where('club_id', $match->club_exterieur_id)->first();

        $missingClubs = [];
        if (!$compoDom || !$compoDom->est_confirmee) {
            $missingClubs[] = [
                'id'   => $match->club_domicile_id,
                'nom'  => $match->clubDomicile->nom ?? 'Domicile',
                'role' => 'domicile',
                'adversaire' => $match->clubExterieur->nom ?? 'Extérieur'
            ];
        }
        if (!$compoExt || !$compoExt->est_confirmee) {
            $missingClubs[] = [
                'id'   => $match->club_exterieur_id,
                'nom'  => $match->clubExterieur->nom ?? 'Extérieur',
                'role' => 'exterieur',
                'adversaire' => $match->clubDomicile->nom ?? 'Domicile'
            ];
        }

        foreach ($missingClubs as $clubInfo) {
            $coaches = User::where('role', 'coach')
                ->where('club_id', $clubInfo['id'])
                ->where('acces_actif', true)
                ->get();

            $heureMatch = $match->date_heure->format('H:i');
            $titre = "⚠️ Composition manquante — {$clubInfo['nom']}";
            $msg   = "Votre match face à {$clubInfo['adversaire']} débute à {$heureMatch}. Veuillez composer et valider votre effectif de match au plus vite.";
            $lien  = '/coach/composition';

            foreach ($coaches as $coach) {
                NotificationService::send(
                    $coach->id,
                    'compo_manquante',
                    $titre,
                    $msg,
                    $lien,
                    ['match_id' => $match->id]
                );

                try {
                    Mail::to($coach->email)->send(
                        new AlerteMatchMail($titre, $msg, config('app.frontend_url', 'http://localhost:5173') . $lien)
                    );
                } catch (\Exception $e) {
                    Log::error("Erreur envoi mail rappel compo coach {$coach->email}: " . $e->getMessage());
                }
            }
        }
    }
})->everyTenMinutes()->name('rappel-composition-coach')->withoutOverlapping();

// ─────────────────────────────────────────────────────────────────────────────
// TÂCHE 4 : Litiges ouverts depuis plus de 48h — toutes les 24h
// Relance les admins sur les litiges non traités
// ─────────────────────────────────────────────────────────────────────────────
Schedule::call(function () {
    $seuil48h = now()->subHours(48);

    $litigesAnciens = Rencontre::where('statut', 'litige')
        ->where('updated_at', '<', $seuil48h)
        ->with(['clubDomicile', 'clubExterieur'])
        ->get();

    foreach ($litigesAnciens as $match) {
        $nomDom  = $match->clubDomicile->nom ?? '?';
        $nomExt  = $match->clubExterieur->nom ?? '?';
        $duree   = $match->updated_at->diffForHumans();

        NotificationService::sendToAdmins(
            type: 'litige_non_resolu',
            titre: "⚖️ Litige non résolu — {$nomDom} vs {$nomExt}",
            message: "Le match {$nomDom} vs {$nomExt} est en litige depuis {$duree}. Veuillez traiter ce dossier.",
            lien: '/admin/homologation',
            metadata: ['match_id' => $match->id]
        );
    }
})->daily()->name('alerte-litiges-anciens')->withoutOverlapping();
