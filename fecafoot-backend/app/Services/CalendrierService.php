<?php

namespace App\Services;

use App\Models\Club;
use App\Models\Poule;
use App\Models\Rencontre;
use App\Models\Stade;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Service de génération du calendrier round-robin (Algorithme de Berger)
 *
 * Principe : Pour N équipes (N pair), on fixe la 1ère équipe et on fait
 * tourner les N-1 autres dans le sens horaire. On obtient N-1 journées.
 * On double ensuite pour le retour (domicile/extérieur inversés).
 */
class CalendrierService
{
    /**
     * Génère le calendrier complet (aller + retour) pour une poule.
     * Insère les matchs en base et retourne le nombre de matchs créés.
     *
     * @param Poule  $poule       La poule concernée
     * @param Carbon $dateDebut   Date de début de la 1ère journée
     * @param int    $jourSemaine Jour de la semaine préféré (6=Samedi, 0=Dimanche)
     * @param string $heureDefaut Heure par défaut des matchs ("15:00")
     * @return array{created: int, journees: int, conflicts: string[]}
     */
    public function generer(
        Poule $poule,
        Carbon $dateDebut,
        int $jourSemaine = 6,
        string $heureDefaut = '15:00'
    ): array {
        $poule->load('clubs', 'phase.competition');

        $clubs = $poule->clubs->pluck('id')->toArray();
        $nbClubs = count($clubs);

        if ($nbClubs < 2) {
            return ['created' => 0, 'journees' => 0, 'conflicts' => ['La poule doit contenir au moins 2 clubs.']];
        }

        // Si nombre impair, on ajoute un "BYE" (null = exempt)
        $hasBye = false;
        if ($nbClubs % 2 !== 0) {
            $clubs[] = null; // BYE
            $nbClubs++;
            $hasBye = true;
        }

        // Berger : fixer le 1er club, tourner les N-1 autres
        $journeesAller = $this->berger($clubs);
        $journeesRetour = $this->inverserAller($journeesAller);
        $toutesJournees = array_merge($journeesAller, $journeesRetour);

        $competition = $poule->phase->competition;
        $phase = $poule->phase;

        $conflicts = [];
        $created = 0;
        $journeeNum = 1;

        // Première journée : chercher le prochain samedi/dimanche depuis dateDebut
        $currentDate = $this->prochainJourSemaine($dateDebut, $jourSemaine);

        foreach ($toutesJournees as $matchsDeLaJournee) {
            $dateJournee = $currentDate->copy();

            foreach ($matchsDeLaJournee as $match) {
                [$domId, $extId] = $match;

                // Skip les matchs avec BYE
                if ($domId === null || $extId === null) {
                    continue;
                }

                // Construire la date/heure
                [$heure, $minute] = explode(':', $heureDefaut);
                $dateHeure = $dateJournee->copy()->setHour((int)$heure)->setMinute((int)$minute)->setSecond(0);

                // Stade par défaut = stade du club domicile
                $clubDom = Club::find($domId);
                $stade = $clubDom?->stade;

                // Vérifier les conflits de stade (même stade, même date/heure)
                $conflict = null;
                if ($stade) {
                    $conflictExists = Rencontre::where('stade', $stade)
                        ->where('date_heure', $dateHeure)
                        ->exists();

                    if ($conflictExists) {
                        // Conflit détecté ! Tentative de relocalisation dans la même ville
                        $ville = $clubDom?->ville;
                        $stadeTrouve = false;

                        if ($ville) {
                            // Chercher un stade actif dans la même ville qui n'est pas celui d'origine
                            $stadesAlternatifs = Stade::where('ville', $ville)
                                ->where('est_actif', true)
                                ->where('nom', '!=', $stade)
                                ->get();

                            foreach ($stadesAlternatifs as $stadeAlt) {
                                $altConflict = Rencontre::where('stade', $stadeAlt->nom)
                                    ->where('date_heure', $dateHeure)
                                    ->exists();

                                if (!$altConflict) {
                                    // Stade alternatif disponible trouvé !
                                    $conflict = "Conflit sur le stade \"{$stade}\" J{$journeeNum} résolu : Match déplacé automatiquement à \"{$stadeAlt->nom}\" ({$ville}).";
                                    $stade = $stadeAlt->nom;
                                    $stadeTrouve = true;
                                    break;
                                }
                            }
                        }

                        if (!$stadeTrouve) {
                            // Aucun stade alternatif trouvé dans la même ville !
                            // On décale de 3 heures (solution de secours) et on notifie l'administrateur
                            $ancienneHeure = $dateHeure->format('H:i');
                            $dateHeure->addHours(3);
                            $nouvelleHeure = $dateHeure->format('H:i');
                            $clubExt = Club::find($extId);
                            $nomDom = $clubDom?->nom ?? 'Club Domicile';
                            $nomExt = $clubExt?->nom ?? 'Club Extérieur';

                            $conflict = "⚠️ Conflit critique J{$journeeNum} (Stade \"{$stade}\" occupé) : Aucun autre stade disponible à {$ville}. Horaire décalé de {$ancienneHeure} à {$nouvelleHeure}.";

                            // Envoi d'une alerte système par notification in-app aux administrateurs
                            NotificationService::sendToAdmins(
                                type: 'alerte',
                                titre: "⚠️ Conflit de Stade critique — J{$journeeNum}",
                                message: "Aucun stade alternatif disponible à {$ville} pour le match {$nomDom} vs {$nomExt} prévu le " . $dateHeure->format('d/m/Y') . " à {$ancienneHeure}. Le match a été décalé à {$nouvelleHeure}.",
                                lien: "/admin/calendrier",
                                metadata: [
                                    'journee' => $journeeNum,
                                    'stade' => $stade,
                                    'ville' => $ville,
                                    'club_domicile_id' => $domId,
                                    'club_exterieur_id' => $extId,
                                ]
                            );
                        }
                    }
                }

                Rencontre::create([
                    'competition_id'     => $competition->id,
                    'phase_id'           => $phase->id,
                    'poule_id'           => $poule->id,
                    'journee'            => $journeeNum,
                    'type'               => 'regulier',
                    'club_domicile_id'   => $domId,
                    'club_exterieur_id'  => $extId,
                    'date_heure'         => $dateHeure,
                    'stade'              => $stade,
                    'terrain_neutre'     => false,
                    'statut'             => 'programme',
                ]);

                $created++;

                if ($conflict) {
                    $conflicts[] = $conflict;
                }
            }

            // Prochaine journée : +7 jours (si samedi ou dimanche uniquement) sinon +3 jours
            if (in_array($jourSemaine, [6, 0])) {
                $currentDate = $currentDate->addDays(7);
            } else {
                $currentDate = $this->prochainJourSemaine($currentDate->addDays(3), $jourSemaine);
            }

            $journeeNum++;
        }

        return [
            'created'  => $created,
            'journees' => count($toutesJournees),
            'conflicts' => $conflicts,
            'has_bye'  => $hasBye,
        ];
    }

    /**
     * Génère les journées aller avec l'algorithme de Berger.
     * Retourne un tableau de journées, chaque journée contenant des paires [dom, ext].
     */
    private function berger(array $clubs): array
    {
        $n = count($clubs);
        $fixed = $clubs[0];
        $rotating = array_slice($clubs, 1); // N-1 clubs qui tournent
        $journees = [];

        for ($j = 0; $j < $n - 1; $j++) {
            $matchs = [];

            // Match entre le club fixe et le 1er tournant
            if ($j % 2 === 0) {
                $matchs[] = [$fixed, $rotating[0]];
            } else {
                $matchs[] = [$rotating[0], $fixed];
            }

            // Paires restantes : (1, N-2), (2, N-3), ...
            $halfN = ($n - 2) / 2;
            for ($i = 0; $i < $halfN; $i++) {
                $a = $rotating[$i + 1];
                $b = $rotating[$n - 2 - $i];

                if ($j % 2 === 0) {
                    $matchs[] = [$a, $b];
                } else {
                    $matchs[] = [$b, $a];
                }
            }

            $journees[] = $matchs;

            // Rotation : déplacer le dernier élément en position 1
            $last = array_pop($rotating);
            array_unshift($rotating, $last);
        }

        return $journees;
    }

    /**
     * Crée les journées retour en inversant dom/ext.
     */
    private function inverserAller(array $journeesAller): array
    {
        $retour = [];
        foreach ($journeesAller as $journee) {
            $matchsRetour = [];
            foreach ($journee as [$dom, $ext]) {
                $matchsRetour[] = [$ext, $dom];
            }
            $retour[] = $matchsRetour;
        }
        return $retour;
    }

    /**
     * Trouve le prochain jour de semaine donné à partir d'une date.
     */
    private function prochainJourSemaine(Carbon $depuis, int $jourCible): Carbon
{
    // S'assurer que jourCible est valide (0-6)
    $jourCible = max(0, min(6, $jourCible));
    $date = $depuis->copy();
    $date->next($this->getDayName($jourCible));
    return $date;
}

private function getDayName(int $day): string
{
    return match($day) {
        0 => 'Sunday', 1 => 'Monday', 2 => 'Tuesday',
        3 => 'Wednesday', 4 => 'Thursday', 5 => 'Friday',
        6 => 'Saturday', default => 'Saturday',
    };
}

    /**
     * Retourne le calendrier d'une compétition groupé par journée.
     *
     * @param int $competitionId
     * @return Collection
     */
    public function getCalendrierParJournee(int $competitionId): Collection
    {
        return Rencontre::with([
            'clubDomicile', 'clubExterieur',
            'commissaire', 'arbitrePrincipal',
            'poule',
        ])
            ->where('competition_id', $competitionId)
            ->orderBy('journee')
            ->orderBy('date_heure')
            ->get()
            ->groupBy('journee');
    }
}
