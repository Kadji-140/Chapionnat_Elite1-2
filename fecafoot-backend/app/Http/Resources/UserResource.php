<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'nom'               => $this->nom,
            'prenom'            => $this->prenom,
            'email'             => $this->email,
            'role'              => $this->role,
            'acces_actif'       => $this->acces_actif,
            'premiere_connexion' => $this->premiere_connexion,
            'lang'              => $this->lang,
 
            // Infos du club si l'utilisateur y est rattaché
            'club' => $this->when($this->club_id && $this->club, function () {
                return [
                    'id'      => $this->club->id,
                    'nom'     => $this->club->nom,
                    'logo_url' => $this->club->logo_url,
                    'division' => $this->club->division,
                ];
            }),
 
            // Permissions calculées selon le rôle
            'permissions' => $this->getPermissions(),
        ];
    }
 
    /**
     * Retourne les permissions de l'utilisateur selon son rôle.
     * Le frontend React utilise ça pour afficher/masquer les menus.
     */
    private function getPermissions(): array
    {
        return match($this->role) {
            'admin' => [
                'gerer_clubs'         => true,
                'gerer_saisons'       => true,
                'gerer_matchs'        => true,
                'gerer_transferts'    => true,
                'valider_joueurs'     => true,
                'gerer_utilisateurs'  => true,
                'voir_audit_logs'     => true,
                'valider_articles'    => true,
                'appliquer_penalites' => true,
            ],
            'responsable_club' => [
                'gerer_effectif'      => true,
                'gerer_coach'         => true,
                'voir_classement'     => true,
                'initier_transfert'   => true,
            ],
            'coach' => [
                'saisir_composition'  => true,
                'contester_evenement' => true,
                'voir_scouting'       => true,
                'voir_stats_joueurs'  => true,
            ],
            'commissaire' => [
                'saisir_evenements'   => true,
                'gerer_match_live'    => true,
                'soumettre_rapport'   => true,
            ],
            'journaliste' => [
                'rediger_articles'    => true,
                'voir_stats'          => true,
            ],
            default => [],
        };
    }
}
