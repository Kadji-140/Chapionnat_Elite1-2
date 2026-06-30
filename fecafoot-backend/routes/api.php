<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Controllers Auth
use App\Http\Controllers\Auth\AuthController;

// Controllers Notifications
use App\Http\Controllers\NotificationController;

// Controllers Admin
use App\Http\Controllers\Admin\ClubController        as AdminClubController;
use App\Http\Controllers\Admin\UserController        as AdminUserController;
use App\Http\Controllers\Admin\ArbitreController     as AdminArbitreController;
use App\Http\Controllers\Admin\JoueurController      as AdminJoueurController;
use App\Http\Controllers\Admin\SaisonController      as AdminSaisonController;
use App\Http\Controllers\Admin\CompetitionController as AdminCompetitionController;
use App\Http\Controllers\Admin\PhaseController       as AdminPhaseController;
use App\Http\Controllers\Admin\PouleController       as AdminPouleController;
use App\Http\Controllers\Admin\MatchController       as AdminMatchController;
use App\Http\Controllers\Admin\StadeController       as AdminStadeController;
use App\Http\Controllers\Admin\AuditLogController     as AdminAuditLogController;

// Controllers Coach
use App\Http\Controllers\Coach\CoachCompositionController;
use App\Http\Controllers\Responsable\ClubController    as ResponsableClubController;
use App\Http\Controllers\Responsable\CoachController   as ResponsableCoachController;
use App\Http\Controllers\Responsable\JoueurController  as ResponsableJoueurController;

// ---------------------------------------------------------------
// ROUTES PUBLIQUES (pas de token requis)
// ---------------------------------------------------------------
Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/login',           [AuthController::class, 'login'])->name('login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('forgot-password');
    Route::post('/reset-password',  [AuthController::class, 'resetPassword'])->name('reset-password');
});
Route::get('/matchs/{match}', [AdminMatchController::class, 'show'])->name('matchs.show');

// ── MODULE 5 : Classement & Statistiques (Public) ──────────────────
Route::get('/poules/{id}/classement',            [\App\Http\Controllers\ClassementController::class, 'classementPoule'])->name('classement.poule');
Route::get('/competitions/{id}/classement',     [\App\Http\Controllers\ClassementController::class, 'classementCompetition'])->name('classement.competition');
Route::get('/saisons/{id}/classement',          [\App\Http\Controllers\ClassementController::class, 'classementSaison'])->name('classement.saison');
Route::get('/classements/historique/{club_id}',  [\App\Http\Controllers\ClassementController::class, 'historiqueClub'])->name('classement.historique-club');
Route::get('/competitions/{id}/stats/buteurs',   [\App\Http\Controllers\StatistiquesController::class, 'topButeurs'])->name('stats.buteurs');
Route::get('/competitions/{id}/stats/passeurs',  [\App\Http\Controllers\StatistiquesController::class, 'topPasseurs'])->name('stats.passeurs');
Route::get('/competitions/{id}/stats/discipline', [\App\Http\Controllers\StatistiquesController::class, 'disciplineClubs'])->name('stats.discipline');
Route::get('/joueurs/{id}/stats',                [\App\Http\Controllers\StatistiquesController::class, 'statsJoueur'])->name('joueurs.stats-public');

// ── MODULE 7 : Articles & Actualités (Public) ──────────────────
Route::get('/articles',                          [\App\Http\Controllers\Public\ArticleController::class, 'index'])->name('articles.index');
Route::get('/articles/{id}',                     [\App\Http\Controllers\Public\ArticleController::class, 'show'])->name('articles.show');

// ── MOBILE API (Favoris, Stats, etc.) ──────────────────
Route::prefix('mobile')->name('mobile.')->group(function () {
    Route::post('/favoris/club',             [\App\Http\Controllers\Mobile\FavoriController::class, 'toggleClub'])->name('favoris.club');
    Route::post('/favoris/joueur',           [\App\Http\Controllers\Mobile\FavoriController::class, 'toggleJoueur'])->name('favoris.joueur');
    Route::get('/clubs/{id}/details',        [\App\Http\Controllers\Mobile\StatistiquesController::class, 'clubDetails'])->name('clubs.details');
    Route::get('/joueurs/{id}/details',      [\App\Http\Controllers\Mobile\StatistiquesController::class, 'joueurDetails'])->name('joueurs.details');
    Route::get('/competitions/{id}/details', [\App\Http\Controllers\Mobile\StatistiquesController::class, 'competitionDetails'])->name('competitions.details');
});

// ---------------------------------------------------------------
// ROUTES PROTÉGÉES (token Sanctum requis pour toutes)
// ---------------------------------------------------------------
Route::middleware(['auth:sanctum'])->group(function () {

    // ── Auth ───────────────────────────────────────────────────
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('/logout',          [AuthController::class, 'logout'])->name('logout');
        Route::get('/me',               [AuthController::class, 'me'])->name('me');
        Route::put('/lang',             [AuthController::class, 'updateLang'])->name('update-lang');
        Route::post('/refresh',         [AuthController::class, 'refresh'])->name('refresh');
        // Accessible même si premiere_connexion = true (pour changer le mot de passe initial)
        Route::post('/change-password', [AuthController::class, 'changePassword'])->name('change-password');
    });

    // ── Notifications (tous les rôles) ────────────────────────
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/',              [NotificationController::class, 'index'])->name('index');
        Route::patch('/{id}/lire',   [NotificationController::class, 'markAsRead'])->name('read');
        Route::patch('/lire-tout',   [NotificationController::class, 'markAllRead'])->name('read-all');
        Route::delete('/{id}',       [NotificationController::class, 'destroy'])->name('destroy');
    });

    // ── MODULE IA ──────────────────────────────────────────────
    Route::prefix('ia')->name('ia.')->group(function () {
        Route::get('/predict/{matchId}', [\App\Http\Controllers\PredictionController::class, 'predict'])->name('predict');
        Route::get('/talent/{joueurId}', [\App\Http\Controllers\PredictionController::class, 'getTalentScore'])->name('talent');
        Route::post('/recalculer-talents', [\App\Http\Controllers\PredictionController::class, 'recalculerTalents'])->name('recalculer-talents');
    });

    // ── Routes nécessitant le profil complété ─────────────────
    Route::middleware(['premiere_connexion'])->group(function () {

        // ┌─────────────────────────────────────────────────────┐
        // │              ADMIN FECAFOOT                         │
        // └─────────────────────────────────────────────────────┘
        Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {

            // ── Gestion des clubs ──────────────────────────────
            Route::get('/clubs',                              [AdminClubController::class, 'index'])->name('clubs.index');
            Route::post('/clubs',                             [AdminClubController::class, 'store'])->name('clubs.store');
            Route::get('/clubs/{club}',                       [AdminClubController::class, 'show'])->name('clubs.show');
            Route::post('/clubs/{club}',                      [AdminClubController::class, 'update'])->name('clubs.update'); // POST car multipart/form-data
            Route::delete('/clubs/{club}',                    [AdminClubController::class, 'destroy'])->name('clubs.destroy');
            Route::patch('/clubs/{club}/toggle',              [AdminClubController::class, 'toggle'])->name('clubs.toggle');
            Route::post('/clubs/{club}/reset-password-responsable', [AdminClubController::class, 'resetPasswordResponsable'])->name('clubs.reset-password-responsable');

            // ── Gestion des utilisateurs ───────────────────────
            Route::get('/users',                    [AdminUserController::class, 'index'])->name('users.index');
            Route::post('/users',                   [AdminUserController::class, 'store'])->name('users.store');
            Route::get('/users/{user}',             [AdminUserController::class, 'show'])->name('users.show');
            Route::put('/users/{user}',             [AdminUserController::class, 'update'])->name('users.update');
            Route::patch('/users/{user}/toggle',    [AdminUserController::class, 'toggle'])->name('users.toggle');
            Route::post('/users/{user}/reset-password', [AdminUserController::class, 'resetPassword'])->name('users.reset-password');

            // ── Gestion des arbitres ───────────────────────────
            Route::get('/arbitres/disponibles',     [AdminMatchController::class, 'arbitresDisponibles'])->name('arbitres.disponibles');
            Route::get('/arbitres',                 [AdminArbitreController::class, 'index'])->name('arbitres.index');
            Route::post('/arbitres',                [AdminArbitreController::class, 'store'])->name('arbitres.store');
            Route::get('/arbitres/{arbitre}',       [AdminArbitreController::class, 'show'])->name('arbitres.show');
            Route::put('/arbitres/{arbitre}',       [AdminArbitreController::class, 'update'])->name('arbitres.update');
            Route::delete('/arbitres/{arbitre}',    [AdminArbitreController::class, 'destroy'])->name('arbitres.destroy');
            Route::patch('/arbitres/{arbitre}/toggle', [AdminArbitreController::class, 'toggle'])->name('arbitres.toggle');

            // ── Validation des licences joueurs ────────────────
            // IMPORTANT : La route spécifique /en-attente DOIT être avant /{id}
            Route::get('/joueurs/en-attente',            [AdminJoueurController::class, 'enAttente'])->name('joueurs.en-attente');
            Route::get('/joueurs',                        [AdminJoueurController::class, 'index'])->name('joueurs.index');
            Route::patch('/joueurs/{joueur}/valider',    [AdminJoueurController::class, 'valider'])->name('joueurs.valider');
            Route::patch('/joueurs/{joueur}/rejeter',    [AdminJoueurController::class, 'rejeter'])->name('joueurs.rejeter');

            // ── Dashboard stats ────────────────────────────────
            Route::get('/stats', function () {
                $saisonEnCours = \App\Models\Saison::where('statut', 'en_cours')->first();

                // Répartition des utilisateurs par rôle
                $repartitionUsers = \App\Models\User::whereIn('role', ['commissaire', 'journaliste', 'responsable_club', 'coach'])
                    ->selectRaw('role, count(*) as total')
                    ->groupBy('role')
                    ->pluck('total', 'role')
                    ->toArray();

                // Matchs des 7 derniers jours (par date)
                $activite7Jours = \App\Models\Rencontre::where('date_heure', '>=', now()->subDays(6)->startOfDay())
                    ->whereIn('statut', ['termine', 'homologue'])
                    ->selectRaw('DATE(date_heure) as jour, count(*) as nb_matchs')
                    ->groupBy('jour')
                    ->orderBy('jour')
                    ->get()
                    ->map(fn($r) => ['jour' => $r->jour, 'nb_matchs' => $r->nb_matchs])
                    ->toArray();

                // 5 derniers matchs terminés
                $matchsRecents = \App\Models\Rencontre::whereIn('statut', ['termine', 'homologue'])
                    ->with(['clubDomicile:id,nom', 'clubExterieur:id,nom'])
                    ->orderByDesc('date_heure')
                    ->limit(5)
                    ->get()
                    ->map(fn($m) => [
                        'id'             => $m->id,
                        'club_domicile'  => $m->clubDomicile?->nom ?? '—',
                        'club_exterieur' => $m->clubExterieur?->nom ?? '—',
                        'score_dom'      => $m->score_domicile_officiel ?? $m->score_domicile_terrain ?? 0,
                        'score_ext'      => $m->score_exterieur_officiel ?? $m->score_exterieur_terrain ?? 0,
                        'date'           => $m->date_heure,
                        'statut'         => $m->statut,
                    ]);

                return response()->json([
                    'success' => true,
                    'data'    => [
                        'nb_clubs'                   => \App\Models\Club::where('est_actif', true)->count(),
                        'nb_clubs_total'             => \App\Models\Club::count(),
                        'nb_joueurs_attente'         => \App\Models\Joueur::where('statut_validation', 'en_attente')->where('est_soumis', true)->count(),
                        'nb_joueurs_valides'         => \App\Models\Joueur::where('statut_validation', 'valide')->count(),
                        'nb_arbitres'                => \App\Models\Arbitre::where('actif', true)->count(),
                        'nb_users'                   => \App\Models\User::whereIn('role', ['commissaire', 'journaliste', 'responsable_club', 'coach'])->count(),
                        'nb_saisons'                 => \App\Models\Saison::count(),
                        'saison_en_cours'            => $saisonEnCours?->intitule,
                        'saison_en_cours_id'         => $saisonEnCours?->id,
                        'nb_matchs_joues'            => \App\Models\Rencontre::whereIn('statut', ['termine', 'homologue'])->count(),
                        'nb_matchs_a_venir'          => \App\Models\Rencontre::where('statut', 'programme')->count(),
                        'nb_contestations_ouvertes'  => \App\Models\Contestation::where('statut', 'en_attente')->count(),
                        'nb_transferts_en_attente'   => \App\Models\Transfert::where('statut', 'en_attente')->count(),
                        'repartition_users'          => $repartitionUsers,
                        'activite_7_jours'           => $activite7Jours,
                        'matchs_recents'             => $matchsRecents,
                    ],
                ]);
            })->name('stats');

            // ── Mise à jour profil admin ───────────────────────
            Route::patch('/profile', function (\Illuminate\Http\Request $request) {
                $user = $request->user();
                $validated = $request->validate([
                    'nom'    => 'sometimes|string|max:100',
                    'prenom' => 'sometimes|string|max:100',
                    'email'  => 'sometimes|email|unique:users,email,' . $user->id,
                    'password' => 'sometimes|string|min:8|confirmed',
                ]);
                if (isset($validated['password'])) {
                    $validated['password'] = bcrypt($validated['password']);
                }
                $user->update($validated);
                return response()->json(['success' => true, 'data' => $user->fresh()]);
            })->name('profile.update');

            // ── MODULE 2 : Gestion des saisons ────────────────
            Route::get('/saisons',                          [AdminSaisonController::class, 'index'])->name('saisons.index');
            Route::post('/saisons',                         [AdminSaisonController::class, 'store'])->name('saisons.store');
            Route::get('/saisons/{saison}',                 [AdminSaisonController::class, 'show'])->name('saisons.show');
            Route::put('/saisons/{saison}',                 [AdminSaisonController::class, 'update'])->name('saisons.update');
            Route::delete('/saisons/{saison}',              [AdminSaisonController::class, 'destroy'])->name('saisons.destroy');
            Route::patch('/saisons/{saison}/activer',       [AdminSaisonController::class, 'activer'])->name('saisons.activer');
            Route::patch('/saisons/{saison}/cloturer',      [AdminSaisonController::class, 'cloturer'])->name('saisons.cloturer');
            Route::post('/saisons/{saison}/cloner',         [AdminSaisonController::class, 'cloner'])->name('saisons.cloner');

            // ── MODULE 2 : Gestion des compétitions ───────────
            Route::get('/saisons/{saison}/competitions',              [AdminCompetitionController::class, 'index'])->name('competitions.index');
            Route::post('/saisons/{saison}/competitions',             [AdminCompetitionController::class, 'store'])->name('competitions.store');
            Route::post('/saisons/{saison}/competitions/initialiser', [AdminCompetitionController::class, 'initialiser'])->name('competitions.initialiser');
            Route::get('/competitions/{competition}',                  [AdminCompetitionController::class, 'show'])->name('competitions.show');
            Route::put('/competitions/{competition}',                  [AdminCompetitionController::class, 'update'])->name('competitions.update');
            Route::get('/competitions/{competition}/regles',           [AdminCompetitionController::class, 'getRegles'])->name('competitions.regles.get');
            Route::put('/competitions/{competition}/regles',           [AdminCompetitionController::class, 'updateRegles'])->name('competitions.regles.update');

            // ── MODULE 2 : Gestion des phases ─────────────────
            Route::get('/competitions/{competition}/phases',           [AdminPhaseController::class, 'index'])->name('phases.index');
            Route::post('/competitions/{competition}/phases/generer',  [AdminPhaseController::class, 'generer'])->name('phases.generer');
            Route::patch('/phases/{phase}/basculer',                   [AdminPhaseController::class, 'basculer'])->name('phases.basculer');

            // ── MODULE 2 : Gestion des poules ─────────────────
            Route::get('/phases/{phase}/poules',                       [AdminPouleController::class, 'index'])->name('poules.index');
            Route::post('/phases/{phase}/poules',                      [AdminPouleController::class, 'store'])->name('poules.store');
            Route::post('/poules/{poule}/affecter-clubs',              [AdminPouleController::class, 'affecterClubs'])->name('poules.affecter-clubs');
            Route::post('/poules/{poule}/tirage-aleatoire',            [AdminPouleController::class, 'tirageAleatoire'])->name('poules.tirage-aleatoire');

            // ══ MODULE 3 : Calendrier & Matchs ══════════════
            Route::post('/poules/{poule}/generer-calendrier',           [AdminMatchController::class, 'genererCalendrier'])->name('matchs.generer-calendrier');
            Route::get('/competitions/{competition}/calendrier',         [AdminMatchController::class, 'calendrier'])->name('matchs.calendrier');
            Route::get('/competitions/{competition}/calendrier/journee/{n}', [AdminMatchController::class, 'journee'])->name('matchs.journee');

            // IMPORTANT : routes spécifiques avant /{match}
            Route::get('/matchs/sans-officiel',                          [AdminMatchController::class, 'sansOfficiel'])->name('matchs.sans-officiel');
            Route::get('/commissaires/disponibles',                      [AdminMatchController::class, 'commissairesDisponibles'])->name('commissaires.disponibles');

            Route::put('/matchs/{match}',                                [AdminMatchController::class, 'update'])->name('matchs.update');
            Route::patch('/matchs/{match}/reporter',                     [AdminMatchController::class, 'reporter'])->name('matchs.reporter');
            Route::patch('/matchs/{match}/annuler',                      [AdminMatchController::class, 'annuler'])->name('matchs.annuler');
            Route::patch('/matchs/{match}/affecter-commissaire',         [AdminMatchController::class, 'affecterCommissaire'])->name('matchs.affecter-commissaire');
            Route::patch('/matchs/{match}/affecter-arbitre',             [AdminMatchController::class, 'affecterArbitre'])->name('matchs.affecter-arbitre');

            // ── MODULE 4 : Homologation & Contestations ────────
            Route::get('/matchs/a-homologuer',                           [\App\Http\Controllers\Admin\HomologationController::class, 'matchsAHomologuer'])->name('matchs.a-homologuer');
            Route::patch('/matchs/{id}/homologuer',                      [\App\Http\Controllers\Admin\HomologationController::class, 'homologuer'])->name('matchs.homologuer');
            Route::patch('/matchs/{id}/litige',                          [\App\Http\Controllers\Admin\HomologationController::class, 'litige'])->name('matchs.litige');
            Route::patch('/matchs/{id}/lever-litige',                    [\App\Http\Controllers\Admin\HomologationController::class, 'leverLitige'])->name('matchs.lever-litige');
            Route::post('/matchs/{id}/tapis-vert',                        [\App\Http\Controllers\Admin\HomologationController::class, 'tapisVert'])->name('matchs.tapis-vert');
            Route::get('/contestations',                                 [\App\Http\Controllers\Admin\HomologationController::class, 'contestations'])->name('contestations.index');
            Route::patch('/contestations/{id}/accepter',                 [\App\Http\Controllers\Admin\HomologationController::class, 'accepterContestation'])->name('contestations.accepter');
            Route::patch('/contestations/{id}/rejeter',                  [\App\Http\Controllers\Admin\HomologationController::class, 'rejeterContestation'])->name('contestations.rejeter');
            Route::post('/clubs/{id}/penalite',                          [\App\Http\Controllers\Admin\HomologationController::class, 'appliquerPenalite'])->name('clubs.penalite.appliquer');
            Route::get('/clubs/{id}/penalites',                          [\App\Http\Controllers\Admin\HomologationController::class, 'listePenalites'])->name('clubs.penalites.index');

            // ── Gestion des stades ──────────────────────────────
            Route::get('/stades',                                        [AdminStadeController::class, 'index'])->name('stades.index');
            Route::post('/stades',                                       [AdminStadeController::class, 'store'])->name('stades.store');
            Route::get('/stades/{stade}',                                [AdminStadeController::class, 'show'])->name('stades.show');
            Route::put('/stades/{stade}',                                [AdminStadeController::class, 'update'])->name('stades.update');
            Route::delete('/stades/{stade}',                             [AdminStadeController::class, 'destroy'])->name('stades.destroy');
            Route::patch('/stades/{stade}/toggle',                       [AdminStadeController::class, 'toggle'])->name('stades.toggle');

            // ── MODULE 5 : Classements, Stats & Playoffs ───────
            Route::post('/classements/{poule_id}/recalculer', [\App\Http\Controllers\ClassementController::class, 'recalculerPoule'])->name('classements.recalculer');
            Route::post('/poules/{poule_id}/gel',             [\App\Http\Controllers\ClassementController::class, 'toggleGelPoule'])->name('poules.gel');
            Route::post('/stats/recalculer',                  [\App\Http\Controllers\StatistiquesController::class, 'recalculerStats'])->name('stats.recalculer');
            Route::get('/competitions/{id}/playoffs',         [\App\Http\Controllers\Admin\PlayoffController::class, 'statutPlayoffs'])->name('competitions.playoffs');
            Route::get('/competitions/{id}/playoffs/qualifies', [\App\Http\Controllers\Admin\PlayoffController::class, 'clubsQualifies'])->name('competitions.playoffs.qualifies');
            Route::post('/competitions/{id}/playoffs/generer', [\App\Http\Controllers\Admin\PlayoffController::class, 'genererPlayoffs'])->name('competitions.playoffs.generer');
            Route::get('/saisons/{id}/promotions-relegations', [\App\Http\Controllers\Admin\PlayoffController::class, 'promotionsRelegations'])->name('saisons.promotions-relegations');

            // ── MODULE 6 : Transferts & Mercato (Admin) ──────
            Route::get('/transferts',                          [\App\Http\Controllers\Admin\TransfertController::class, 'index'])->name('transferts.index');
            Route::patch('/transferts/{id}/valider',           [\App\Http\Controllers\Admin\TransfertController::class, 'valider'])->name('transferts.valider');
            Route::patch('/transferts/{id}/rejeter',           [\App\Http\Controllers\Admin\TransfertController::class, 'rejeter'])->name('transferts.rejeter');

            // ── MODULE 7 : Articles & Actualités (Admin) ─────
            Route::get('/articles',                            [\App\Http\Controllers\Admin\ArticleController::class, 'index'])->name('articles.index');
            Route::patch('/articles/{id}/valider',             [\App\Http\Controllers\Admin\ArticleController::class, 'valider'])->name('articles.valider');
            Route::patch('/articles/{id}/rejeter',             [\App\Http\Controllers\Admin\ArticleController::class, 'rejeter'])->name('articles.rejeter');
            Route::delete('/articles/{id}',                    [\App\Http\Controllers\Admin\ArticleController::class, 'destroy'])->name('articles.destroy');

            // ── Audit logs ─────────────────────────────────────
            Route::get('/audit-logs',                          [AdminAuditLogController::class, 'index'])->name('audit-logs.index');
        });

        // ┌─────────────────────────────────────────────────────┐
        // │           RESPONSABLE DE CLUB                       │
        // └─────────────────────────────────────────────────────┘
        Route::middleware(['role:responsable_club'])->prefix('responsable')->name('responsable.')->group(function () {

            // ── Mon club ───────────────────────────────────────
            Route::get('/mon-club',                          [ResponsableClubController::class, 'show'])->name('mon-club.show');
            Route::get('/dashboard-stats',                   [ResponsableClubController::class, 'dashboardStats'])->name('dashboard-stats');
            Route::post('/mon-club',                         [ResponsableClubController::class, 'update'])->name('mon-club.update'); // POST pour multipart
            Route::post('/mon-club/completer-profil',        [ResponsableClubController::class, 'completerProfil'])->name('mon-club.completer-profil');
            Route::post('/mon-club/signaler-erreur',         [ResponsableClubController::class, 'signalerErreur'])->name('mon-club.signaler-erreur'); 
            
            // ── Coachs ─────────────────────────────────────────
            Route::get('/coachs',                            [ResponsableCoachController::class, 'index'])->name('coachs.index');
            Route::post('/coachs',                           [ResponsableCoachController::class, 'store'])->name('coachs.store');
            Route::patch('/coachs/{id}/toggle',              [ResponsableCoachController::class, 'toggle'])->name('coachs.toggle');
            Route::delete('/coachs/{id}',                    [ResponsableCoachController::class, 'destroy'])->name('coachs.destroy');

            // ── Joueurs / Effectif ─────────────────────────────
            // IMPORTANT : /soumettre avant /{id}
            Route::post('/joueurs/soumettre',                [ResponsableJoueurController::class, 'soumettre'])->name('joueurs.soumettre');
            Route::get('/joueurs',                           [ResponsableJoueurController::class, 'index'])->name('joueurs.index');
            Route::post('/joueurs',                          [ResponsableJoueurController::class, 'store'])->name('joueurs.store');
            Route::match(['PUT', 'POST'], '/joueurs/{joueur}', [ResponsableJoueurController::class, 'update'])->name('joueurs.update');
            Route::delete('/joueurs/{joueur}',               [ResponsableJoueurController::class, 'destroy'])->name('joueurs.destroy');

            // ── MODULE 6 : Transferts & Mercato (Responsable) ─
            Route::get('/transferts',                        [\App\Http\Controllers\Responsable\TransfertController::class, 'index'])->name('transferts.index');
            Route::post('/transferts',                       [\App\Http\Controllers\Responsable\TransfertController::class, 'store'])->name('transferts.store');
        });


        // ┌─────────────────────────────────────────────────────┐
        // │                   COACH                             │
        // └─────────────────────────────────────────────────────┘
        Route::middleware(['role:coach'])->prefix('coach')->name('coach.')->group(function () {
            Route::get('/matchs-a-venir',                           [CoachCompositionController::class, 'matchsAVenir'])->name('matchs-a-venir');
            Route::get('/compositions/precedente',                  [CoachCompositionController::class, 'compositionPrecedente'])->name('composition.precedente');
            Route::get('/matchs/{match}/composition',               [CoachCompositionController::class, 'show'])->name('composition.show');
            Route::post('/matchs/{match}/composition',              [CoachCompositionController::class, 'store'])->name('composition.store');
            Route::patch('/matchs/{match}/composition/confirmer',   [CoachCompositionController::class, 'confirmer'])->name('composition.confirmer');
            Route::patch('/matchs/{id}/demarrer',                   [\App\Http\Controllers\Commissaire\MatchController::class, 'demarrer'])->name('matchs.demarrer');
            Route::get('/joueurs',                                  [ResponsableJoueurController::class, 'index'])->name('joueurs.index');


            // MODULE 4 — Contestations
            Route::get('/matchs/{id}/events',                       [\App\Http\Controllers\Coach\ContestationController::class, 'matchEvents'])->name('matchs.events');
            Route::post('/matchs/{id}/contestations',               [\App\Http\Controllers\Coach\ContestationController::class, 'store'])->name('matchs.contester');
            Route::get('/contestations',                            [\App\Http\Controllers\Coach\ContestationController::class, 'index'])->name('contestations.index');

            // MODULE 5 — Statistiques
            Route::get('/joueurs/stats',                            [\App\Http\Controllers\StatistiquesController::class, 'statsCoachEffectif'])->name('joueurs.stats');
        });

        // ┌─────────────────────────────────────────────────────┐
        // │               COMMISSAIRE                           │
        // └─────────────────────────────────────────────────────┘
        Route::middleware(['role:commissaire'])->prefix('commissaire')->name('commissaire.')->group(function () {
            // Module 4 — Événements live, feuilles de match
            Route::get('/matchs',                  [\App\Http\Controllers\Commissaire\MatchController::class, 'index'])->name('matchs.index');
            Route::get('/matchs/{id}',             [\App\Http\Controllers\Commissaire\MatchController::class, 'show'])->name('matchs.show');
            Route::patch('/matchs/{id}/demarrer',  [\App\Http\Controllers\Commissaire\MatchController::class, 'demarrer'])->name('matchs.demarrer');
            Route::post('/matchs/{id}/events',     [\App\Http\Controllers\Commissaire\MatchController::class, 'storeEvent'])->name('matchs.store-event');
            Route::put('/events/{id}',             [\App\Http\Controllers\Commissaire\MatchController::class, 'updateEvent'])->name('events.update');
            Route::delete('/events/{id}',          [\App\Http\Controllers\Commissaire\MatchController::class, 'deleteEvent'])->name('events.delete');
            Route::patch('/matchs/{id}/mi-temps',  [\App\Http\Controllers\Commissaire\MatchController::class, 'miTemps'])->name('matchs.mi-temps');
            Route::patch('/matchs/{id}/reprise',   [\App\Http\Controllers\Commissaire\MatchController::class, 'reprise'])->name('matchs.reprise');
            Route::patch('/matchs/{id}/cloturer',  [\App\Http\Controllers\Commissaire\MatchController::class, 'cloturer'])->name('matchs.cloturer');
            Route::post('/matchs/{id}/rapport',    [\App\Http\Controllers\Commissaire\MatchController::class, 'rapport'])->name('matchs.rapport');
            Route::patch('/matchs/{id}/contestations/{contestationId}/traiter', [\App\Http\Controllers\Commissaire\MatchController::class, 'traiterContestation'])->name('matchs.contestations.traiter');
            
            // Nouveaux endpoints pour temps additionnel, prolongations et tirs au but
            Route::post('/matchs/{id}/temps-additionnel', [\App\Http\Controllers\Commissaire\MatchController::class, 'ajouterTempsAdditionnel'])->name('matchs.temps-additionnel');
            Route::post('/matchs/{id}/prolongations', [\App\Http\Controllers\Commissaire\MatchController::class, 'activerProlongation'])->name('matchs.prolongations');
            Route::post('/matchs/{id}/prolongations/mi-temps', [\App\Http\Controllers\Commissaire\MatchController::class, 'prolongationMiTemps'])->name('matchs.prolongations.mi-temps');
            Route::post('/matchs/{id}/prolongations/reprise', [\App\Http\Controllers\Commissaire\MatchController::class, 'prolongationReprise'])->name('matchs.prolongations.reprise');
            Route::post('/matchs/{id}/tirs-au-but', [\App\Http\Controllers\Commissaire\MatchController::class, 'activerTirsAuBut'])->name('matchs.tirs-au-but');
        });

        // ┌─────────────────────────────────────────────────────┐
        // │               JOURNALISTE                           │
        // └─────────────────────────────────────────────────────┘
        Route::middleware(['role:journaliste'])->prefix('journaliste')->name('journaliste.')->group(function () {
            // ── MODULE 7 : Articles & Actualités (Journaliste) ──
            Route::get('/articles',                          [\App\Http\Controllers\Journaliste\ArticleController::class, 'index'])->name('articles.index');
            Route::post('/articles',                         [\App\Http\Controllers\Journaliste\ArticleController::class, 'store'])->name('articles.store');
            Route::get('/articles/{id}',                     [\App\Http\Controllers\Journaliste\ArticleController::class, 'show'])->name('articles.show');
            Route::post('/articles/{id}',                    [\App\Http\Controllers\Journaliste\ArticleController::class, 'update'])->name('articles.update');
            Route::patch('/articles/{id}/soumettre',         [\App\Http\Controllers\Journaliste\ArticleController::class, 'soumettre'])->name('articles.soumettre');
            Route::delete('/articles/{id}',                  [\App\Http\Controllers\Journaliste\ArticleController::class, 'destroy'])->name('articles.destroy');
        });

        // ┌─────────────────────────────────────────────────────┐
        // │       ROUTES MIXTES (plusieurs rôles)               │
        // └─────────────────────────────────────────────────────┘
        // ┌─────────────────────────────────────────────────────┐
        // │       ROUTES MIXTES (plusieurs rôles)               │
        // └─────────────────────────────────────────────────────┘
        Route::middleware(['role:admin,responsable_club,coach,commissaire,journaliste'])->group(function () {
            // Classements publics, calendriers, etc. — Modules suivants
            Route::get('/matchs/{match}/compositions/{club}', [CoachCompositionController::class, 'getCompositionForClub'])->name('matchs.compositions.club');

            // Lecteur seule partagée pour tous les rôles
            Route::get('/shared/clubs',                                  [\App\Http\Controllers\Admin\ClubController::class, 'index'])->name('shared.clubs.index');
            Route::get('/shared/saisons',                                [\App\Http\Controllers\Admin\SaisonController::class, 'index'])->name('shared.saisons.index');
            Route::get('/shared/saisons/{saison}',                        [\App\Http\Controllers\Admin\SaisonController::class, 'show'])->name('shared.saisons.show');
            Route::get('/shared/saisons/{saison}/competitions',           [\App\Http\Controllers\Admin\CompetitionController::class, 'index'])->name('shared.competitions.index');
            Route::get('/shared/competitions/{competition}',               [\App\Http\Controllers\Admin\CompetitionController::class, 'show'])->name('shared.competitions.show');
            Route::get('/shared/competitions/{competition}/phases',        [\App\Http\Controllers\Admin\PhaseController::class, 'index'])->name('shared.phases.index');
            Route::get('/shared/phases/{phase}/poules',                    [\App\Http\Controllers\Admin\PouleController::class, 'index'])->name('shared.poules.index');
        });

    }); // fin middleware premiere_connexion
}); // fin middleware auth:sanctum









// ── ROUTES PUBLIQUES MOBILE (Sans authentification) ──────────────
Route::get('/public/clubs', function () {
    // Note pour Patrick : Retrait temporaire du filtre "where('est_actif', true)" pour tests
    $clubs = \App\Models\Club::orderBy('nom')
        ->get(['id', 'nom', 'ville', 'division', 'logo_url', 'stade', 'president']);
    return response()->json(['success' => true, 'data' => $clubs]);
})->name('public.clubs');

Route::get('/public/joueurs', function () {
    $saisonActuelle = \App\Models\Saison::where('statut', 'en_cours')->first() 
        ?? \App\Models\Saison::orderBy('id', 'desc')->first();
    $saisonId = $saisonActuelle ? $saisonActuelle->id : null;

    $query = \App\Models\Joueur::with('club:id,nom')
        ->select('joueurs.id', 'joueurs.nom', 'joueurs.prenom', 'joueurs.poste', 'joueurs.num_maillot', 'joueurs.photo_url', 'joueurs.club_id', 'joueurs.nationalite', 'joueurs.nb_abonnes', 'joueurs.valeur_marchande');

    $subqueries = [
        'stats_sum_buts' => 'buts',
        'stats_sum_passes_decisives' => 'passes_decisives',
        'stats_sum_cartons_jaunes' => 'cartons_jaunes',
        'stats_sum_cartons_rouges' => 'cartons_rouges',
        'stats_sum_nb_matchs' => 'nb_matchs',
        'stats_sum_minutes_jouees' => 'minutes_jouees',
    ];

    $addSelects = [];
    foreach ($subqueries as $alias => $column) {
        $sub = \App\Models\StatJoueur::selectRaw("coalesce(sum($column), 0)")
            ->whereColumn('joueur_id', 'joueurs.id');
        $addSelects[$alias] = $sub;
    }

    $joueurs = $query->addSelect($addSelects)
        ->orderBy('joueurs.nom')
        ->get();

    return response()->json([
        'success' => true,
        'data'    => $joueurs->map(fn($j) => [
            'id'              => $j->id,
            'nom'             => $j->nom,
            'prenom'          => $j->prenom,
            'nom_complet'     => trim($j->nom . ' ' . $j->prenom),
            'poste'           => $j->poste,
            'num_maillot'     => $j->num_maillot,
            'photo_url'       => $j->photo_url,
            'nationalite'     => $j->nationalite,
            'nb_abonnes'      => $j->nb_abonnes ?? 0,
            'valeur_marchande'=> $j->valeur_marchande ?? 0,
            'club'            => $j->club ? ['id' => $j->club->id, 'nom' => $j->club->nom] : null,
            // Nouvelles statistiques réelles de la saison en cours
            'buts'            => $j->stats_sum_buts ?? 0,
            'passes'          => $j->stats_sum_passes_decisives ?? 0,
            'cartonsJaunes'   => $j->stats_sum_cartons_jaunes ?? 0,
            'cartonsRouges'   => $j->stats_sum_cartons_rouges ?? 0,
            'matchsJoues'     => $j->stats_sum_nb_matchs ?? 0,
            'minutes'         => $j->stats_sum_minutes_jouees ?? 0,
        ]),
    ]);
})->name('public.joueurs');

Route::get('/public/matchs', function () {
    // Récupérer la saison en cours
    $saisonActuelle = \App\Models\Saison::where('statut', 'en_cours')->first() 
        ?? \App\Models\Saison::orderBy('id', 'desc')->first();
    $saisonId = $saisonActuelle ? $saisonActuelle->id : null;

    $query = \App\Models\Rencontre::with([
        'clubDomicile:id,nom,logo_url', 'clubExterieur:id,nom,logo_url', 'poule:id,nom', 'prediction'
    ]);

    if ($saisonId) {
        $query->whereHas('competition', function($q) use ($saisonId) {
            $q->where('saison_id', $saisonId);
        });
    }

    $matchs = $query->orderByDesc('date_heure')->limit(100)->get();

    return response()->json(['success' => true, 'data' => $matchs->map(fn($m) => [
        'id' => $m->id, 'clubDomId' => $m->club_domicile_id, 'clubExtId' => $m->club_exterieur_id,
        'clubDom' => $m->clubDomicile ? ['id' => $m->clubDomicile->id, 'nom' => $m->clubDomicile->nom, 'logo_url' => $m->clubDomicile->logo_url] : null,
        'clubExt' => $m->clubExterieur ? ['id' => $m->clubExterieur->id, 'nom' => $m->clubExterieur->nom, 'logo_url' => $m->clubExterieur->logo_url] : null,
        'scoreDom' => $m->score_domicile_officiel ?? $m->score_domicile_terrain ?? null,
        'scoreExt' => $m->score_exterieur_officiel ?? $m->score_exterieur_terrain ?? null,
        'statut' => $m->statut, 'dateHeure' => $m->date_heure,
        'journee' => $m->journee, 'poule' => $m->poule ? $m->poule->nom : null, 'evenements' => [],
        'prediction' => $m->prediction ? [
            'victoireDom' => round($m->prediction->proba_victoire_dom * 100, 1),
            'nul' => round($m->prediction->proba_nul * 100, 1),
            'victoireExt' => round($m->prediction->proba_victoire_ext * 100, 1),
        ] : null,
    ])]);
})->name('public.matchs');

Route::get('/public/ia/predict/{matchId}', [\App\Http\Controllers\PredictionController::class, 'predict'])->name('public.ia.predict');
Route::get('/public/ia/talent/{joueurId}', [\App\Http\Controllers\PredictionController::class, 'getTalentScore'])->name('public.ia.talent');
Route::get('/public/joueurs/{id}/details', [\App\Http\Controllers\Mobile\StatistiquesController::class, 'joueurDetails'])->name('public.joueurs.details');


Route::get('/public/classements', function () {
    // Récupérer la saison en cours
    $saisonActuelle = \App\Models\Saison::where('statut', 'en_cours')->first() 
        ?? \App\Models\Saison::orderBy('id', 'desc')->first();
    $saisonId = $saisonActuelle ? $saisonActuelle->id : null;

    $query = \App\Models\ClassementClub::with(['club', 'poule.phase.competition']);
    
    if ($saisonId) {
        $query->where('saison_id', $saisonId);
    }

    $classements = $query->orderBy('position')->get();

    return response()->json([
        'success' => true,
        'data'    => $classements->map(fn($c) => [
            'id'              => $c->id,
            'club_id'         => $c->club_id,
            'poule_id'        => $c->poule_id,
            'poule_nom'       => $c->poule ? $c->poule->nom : null,
            'competition_nom' => $c->poule && $c->poule->phase && $c->poule->phase->competition ? $c->poule->phase->competition->nom : null,
            'club_nom'        => $c->club ? $c->club->nom : 'Inconnu',
            'club'            => $c->club ? [
                'id'       => $c->club->id,
                'nom'      => $c->club->nom,
                'logo_url' => $c->club->logo_url,
                'division' => $c->club->division,
                'ville'    => $c->club->ville,
            ] : null,
            'position'        => $c->position,
            'points'          => $c->points,
            'victoires'       => $c->victoires,
            'nuls'            => $c->nuls,
            'defaites'        => $c->defaites,
            'nb_matchs'       => $c->nb_matchs,
            'buts_pour'       => $c->buts_pour,
            'buts_contre'     => $c->buts_contre,
            'diff_buts'       => $c->diff_buts,
        ]),
    ]);
})->name('public.classements');