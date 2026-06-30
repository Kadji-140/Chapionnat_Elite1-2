<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

/**
 * Service pour créer des notifications in-app.
 * Utilisation : NotificationService::send($userId, 'type', 'Titre', 'Message', '/lien')
 */
class NotificationService
{
    /**
     * Envoie une notification à un utilisateur.
     */
    public static function send(
        int    $userId,
        string $type,
        string $titre,
        string $message,
        ?string $lien     = null,
        ?array  $metadata = null
    ): Notification {
        return Notification::create([
            'user_id'    => $userId,
            'type'       => $type,
            'titre'      => $titre,
            'message'    => $message,
            'lue'        => false,
            'lu'         => false,
            'lien'       => $lien,
            'metadata'   => $metadata,
            'envoyee_le' => now(),
        ]);
    }

    /**
     * Envoie une notification à tous les admins.
     */
    public static function sendToAdmins(
        string $type,
        string $titre,
        string $message,
        ?string $lien     = null,
        ?array  $metadata = null
    ): void {
        $admins = User::where('role', 'admin')->where('acces_actif', true)->get();
        foreach ($admins as $admin) {
            self::send($admin->id, $type, $titre, $message, $lien, $metadata);
        }
    }

    /**
     * Notification : effectif soumis → admins
     */
    public static function effectifSoumis(int $clubId, string $nomClub, int $nbJoueurs): void
    {
        self::sendToAdmins(
            type:    'effectif_soumis',
            titre:   "🏟️ Effectif soumis — {$nomClub}",
            message: "{$nomClub} a soumis son effectif de {$nbJoueurs} joueur(s) à validation.",
            lien:    '/admin/joueurs/validation',
            metadata: ['club_id' => $clubId, 'nb_joueurs' => $nbJoueurs],
        );
    }

    /**
     * Notification : joueur validé → responsable du club
     */
    public static function joueurValide(int $responsableId, string $nomJoueur, string $nomClub): void
    {
        self::send(
            userId:  $responsableId,
            type:    'joueur_valide',
            titre:   "✅ Joueur validé",
            message: "La licence de {$nomJoueur} a été approuvée par l'administration FECAFOOT.",
            lien:    '/responsable/effectif',
        );
    }

    /**
     * Notification : joueur rejeté → responsable du club
     */
    public static function joueurRejete(int $responsableId, string $nomJoueur, string $motif): void
    {
        self::send(
            userId:  $responsableId,
            type:    'joueur_rejete',
            titre:   "❌ Licence rejetée — {$nomJoueur}",
            message: "La licence de {$nomJoueur} a été rejetée. Motif : {$motif}",
            lien:    '/responsable/effectif',
        );
    }

    /**
     * Notification : compte créé → nouvel utilisateur
     */
    public static function compteCreé(int $userId, string $role): void
    {
        self::send(
            userId:  $userId,
            type:    'compte_cree',
            titre:   "🎉 Bienvenue sur FECAFOOT Platform",
            message: "Votre compte a été créé. Connectez-vous et changez votre mot de passe.",
            lien:    '/changer-mot-de-passe',
        );
    }

    /**
     * Notification : contestation soumise → admins
     */
    public static function contestationSoumise(\App\Models\Contestation $contestation): void
    {
        $contestation->load('matchEvent.match.clubDomicile', 'matchEvent.match.clubExterieur', 'coach.club');
        $match = $contestation->matchEvent->match;
        $event = $contestation->matchEvent;
        $nomDom = $match->clubDomicile->nom;
        $nomExt = $match->clubExterieur->nom;
        $nomCoachClub = $contestation->coach->club->nom ?? 'son club';

        self::sendToAdmins(
            type: 'contestation_soumise',
            titre: "⚖️ Contestation déposée — {$nomDom} vs {$nomExt}",
            message: "Le coach de {$nomCoachClub} conteste l'événement '{$event->type}' à la minute {$event->minute}.",
            lien: '/admin/contestations',
            metadata: ['contestation_id' => $contestation->id]
        );

        if ($match->commissaire_id) {
            self::send(
                userId: $match->commissaire_id,
                type: 'contestation_soumise',
                titre: "⚖️ Contestation déposée — {$nomDom} vs {$nomExt}",
                message: "Le coach de {$nomCoachClub} conteste l'événement '{$event->type}' à la minute {$event->minute}.",
                lien: "/commissaire/live/{$match->id}",
                metadata: ['contestation_id' => $contestation->id]
            );
        }
    }

    /**
     * Notification : contestation traitée → coach
     */
    public static function contestationTraitee(\App\Models\Contestation $contestation): void
    {
        $contestation->load('matchEvent.match.clubDomicile', 'matchEvent.match.clubExterieur');
        $match = $contestation->matchEvent->match;
        $nomDom = $match->clubDomicile->nom;
        $nomExt = $match->clubExterieur->nom;
        $statutLabel = $contestation->statut === 'acceptee' ? 'acceptée' : 'rejetée';

        self::send(
            userId: $contestation->coach_id,
            type: 'contestation_traitee',
            titre: "⚖️ Contestation {$statutLabel}",
            message: "Votre contestation pour le match {$nomDom} vs {$nomExt} a été {$statutLabel}. Décision : {$contestation->decision}",
            lien: '/coach/contestations',
            metadata: ['contestation_id' => $contestation->id]
        );
    }

    /**
     * Notification : match homologué → responsables de club
     */
    public static function matchHomologue(\App\Models\Rencontre $match): void
    {
        $match->load('clubDomicile', 'clubExterieur');
        $nomDom = $match->clubDomicile->nom;
        $nomExt = $match->clubExterieur->nom;
        $score = ($match->score_domicile_officiel ?? $match->score_domicile_terrain) . ' - ' . ($match->score_exterieur_officiel ?? $match->score_exterieur_terrain);

        $responsables = User::where('role', 'responsable_club')
            ->whereIn('club_id', [$match->club_domicile_id, $match->club_exterieur_id])
            ->where('acces_actif', true)
            ->get();

        foreach ($responsables as $resp) {
            self::send(
                userId: $resp->id,
                type: 'match_homologue',
                titre: "🏆 Match Homologué",
                message: "Le match {$nomDom} vs {$nomExt} a été homologué officiellement par la FECAFOOT (Score officiel : {$score}).",
                lien: '/responsable/dashboard',
                metadata: ['match_id' => $match->id]
            );
        }
    }

    /**
     * Notification : pénalité appliquée → responsable de club
     */
    public static function penaliteAppliquee(\App\Models\Penalite $penalite): void
    {
        $penalite->load('club');
        $nomClub = $penalite->club->nom;

        $responsables = User::where('role', 'responsable_club')
            ->where('club_id', $penalite->club_id)
            ->where('acces_actif', true)
            ->get();

        foreach ($responsables as $resp) {
            self::send(
                userId: $resp->id,
                type: 'penalite_appliquee',
                titre: "\u26a0\ufe0f Pénalité administrative appliquée",
                message: "Votre club {$nomClub} a reçu une pénalité : '{$penalite->type}' avec retrait de {$penalite->points_retires} point(s). Motif : {$penalite->motif}.",
                lien: '/responsable/dashboard',
                metadata: ['penalite_id' => $penalite->id]
            );
        }
    }

    /**
     * Notification : match démarré → admins + responsables de clubs
     */
    public static function matchDemarre(\App\Models\Rencontre $match): void
    {
        $match->load('clubDomicile', 'clubExterieur');
        $nomDom = $match->clubDomicile->nom;
        $nomExt = $match->clubExterieur->nom;

        // Notifier les admins
        self::sendToAdmins(
            type: 'match_demarre',
            titre: "⚽ Match en cours — {$nomDom} vs {$nomExt}",
            message: "La rencontre {$nomDom} vs {$nomExt} (Match #{$match->id}) vient de débuter.",
            lien: '/admin/matchs',
            metadata: ['match_id' => $match->id]
        );

        // Notifier les responsables des deux clubs
        $responsables = User::where('role', 'responsable_club')
            ->whereIn('club_id', [$match->club_domicile_id, $match->club_exterieur_id])
            ->where('acces_actif', true)
            ->get();
        foreach ($responsables as $resp) {
            self::send($resp->id, 'match_demarre', "⚽ Match démarré — {$nomDom} vs {$nomExt}", "Votre match face à " . ($resp->club_id === $match->club_domicile_id ? $nomExt : $nomDom) . " a commencé.", '/responsable/dashboard', ['match_id' => $match->id]);
        }
    }

    /**
     * Notification : match clôturé → admins + responsables de clubs
     */
    public static function matchCloture(\App\Models\Rencontre $match): void
    {
        $match->load('clubDomicile', 'clubExterieur');
        $nomDom  = $match->clubDomicile->nom;
        $nomExt  = $match->clubExterieur->nom;
        $score   = $match->score_domicile_terrain . ' - ' . $match->score_exterieur_terrain;

        // Notifier les admins
        self::sendToAdmins(
            type: 'match_cloture',
            titre: "✅ Match terminé — {$nomDom} vs {$nomExt}",
            message: "La rencontre {$nomDom} vs {$nomExt} est terminée (Score terrain : {$score}). En attente du rapport du commissaire.",
            lien: '/admin/homologation',
            metadata: ['match_id' => $match->id]
        );

        // Notifier les responsables des deux clubs
        $responsables = User::where('role', 'responsable_club')
            ->whereIn('club_id', [$match->club_domicile_id, $match->club_exterieur_id])
            ->where('acces_actif', true)
            ->get();
        foreach ($responsables as $resp) {
            self::send($resp->id, 'match_cloture', "✅ Match terminé — {$nomDom} vs {$nomExt}", "La rencontre face à " . ($resp->club_id === $match->club_domicile_id ? $nomExt : $nomDom) . " est terminée. Score terrain : {$score}.", '/responsable/dashboard', ['match_id' => $match->id]);
        }
    }

    /**
     * Notification : rapport de match soumis → admins
     */
    public static function rapportSoumis(\App\Models\Rencontre $match): void
    {
        $match->load('clubDomicile', 'clubExterieur', 'commissaire');
        $nomDom  = $match->clubDomicile->nom;
        $nomExt  = $match->clubExterieur->nom;
        $nomComm = $match->commissaire->name ?? 'Le commissaire';

        self::sendToAdmins(
            type: 'rapport_soumis',
            titre: "📄 Rapport de match soumis — {$nomDom} vs {$nomExt}",
            message: "Le commissaire {$nomComm} a soumis le rapport officiel pour le match {$nomDom} vs {$nomExt}.",
            lien: '/admin/homologation',
            metadata: ['match_id' => $match->id]
        );
    }


    /**
     * Notification : match programmé / rappel → commissaire + arbitres
     */
    public static function matchProgramme(\App\Models\Rencontre $match): void
    {
        $match->load('clubDomicile', 'clubExterieur');
        $nomDom = $match->clubDomicile->nom;
        $nomExt = $match->clubExterieur->nom;
        $heure  = $match->date_heure ? $match->date_heure->format('d/m/Y à H:i') : '';

        $titre   = "📅 Match programmé — {$nomDom} vs {$nomExt}";
        $message = "Vous êtes désigné officiel pour la rencontre {$nomDom} vs {$nomExt} prévue le {$heure}.";

        // Commissaire
        if ($match->commissaire_id) {
            self::send($match->commissaire_id, 'match_programme', $titre, $message, '/commissaire/matchs', ['match_id' => $match->id]);
        }

        // Arbitres
        $arbitresIds = array_filter([
            $match->arbitre_principal_id,
            $match->arbitre_assistant1_id,
            $match->arbitre_assistant2_id,
            $match->quatrieme_arbitre_id
        ]);

        foreach ($arbitresIds as $arbId) {
            self::send($arbId, 'match_programme', $titre, $message, '/arbitre/matchs', ['match_id' => $match->id]);
        }
    }

    /**
     * Notification : match déprogrammé / annulé → commissaire, arbitres, clubs
     */
    public static function matchDeprogramme(\App\Models\Rencontre $match, string $motif): void
    {
        $match->load('clubDomicile', 'clubExterieur');
        $nomDom = $match->clubDomicile->nom;
        $nomExt = $match->clubExterieur->nom;

        $titre   = "⚠️ Match déprogrammé — {$nomDom} vs {$nomExt}";
        $message = "La rencontre {$nomDom} vs {$nomExt} a été annulée / reportée. Motif : {$motif}";

        // Notifier le commissaire
        if ($match->commissaire_id) {
            self::send($match->commissaire_id, 'match_deprogramme', $titre, $message, '/commissaire/matchs', ['match_id' => $match->id]);
        }

        // Notifier les arbitres
        $arbitresIds = array_filter([
            $match->arbitre_principal_id,
            $match->arbitre_assistant1_id,
            $match->arbitre_assistant2_id,
            $match->quatrieme_arbitre_id
        ]);
        foreach ($arbitresIds as $arbId) {
            self::send($arbId, 'match_deprogramme', $titre, $message, '/arbitre/matchs', ['match_id' => $match->id]);
        }

        // Notifier les responsables des deux clubs
        $responsables = User::where('role', 'responsable_club')
            ->whereIn('club_id', [$match->club_domicile_id, $match->club_exterieur_id])
            ->where('acces_actif', true)
            ->get();
        foreach ($responsables as $resp) {
            self::send($resp->id, 'match_deprogramme', $titre, $message, '/responsable/dashboard', ['match_id' => $match->id]);
        }
    }
}
