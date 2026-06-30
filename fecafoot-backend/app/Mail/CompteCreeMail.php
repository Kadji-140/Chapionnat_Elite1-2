<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Mailable envoyé lors de la création d'un nouveau compte utilisateur.
 * Contient les identifiants de connexion temporaires.
 */
class CompteCreeMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param string $nom         Nom de l'utilisateur
     * @param string $prenom      Prénom de l'utilisateur
     * @param string $email       Email de connexion
     * @param string $motDePasse  Mot de passe temporaire (en clair, avant hachage)
     * @param string $role        Rôle de l'utilisateur (pour affichage)
     * @param string|null $clubNom Nom du club si responsable_club ou coach
     */
    public function __construct(
        public readonly string $nom,
        public readonly string $prenom,
        public readonly string $email,
        public readonly string $motDePasse,
        public readonly string $role,
        public readonly ?string $clubNom = null,
    ) {}

    /**
     * Sujet de l'email.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🇨🇲 FECAFOOT — Votre compte a été créé',
        );
    }

    /**
     * Contenu de l'email (vue Blade).
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.compte_cree',
            with: [
                'nom'        => $this->nom,
                'prenom'     => $this->prenom,
                'email'      => $this->email,
                'motDePasse' => $this->motDePasse,
                'roleLabel'  => $this->getRoleLabel(),
                'clubNom'    => $this->clubNom,
                'loginUrl'   => config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')) . '/login',
            ],
        );
    }

    /**
     * Traduit le rôle technique en libellé lisible.
     */
    private function getRoleLabel(): string
    {
        return match($this->role) {
            'responsable_club' => 'Responsable de Club',
            'coach'            => 'Coach',
            'commissaire'      => 'Commissaire de Match',
            'journaliste'      => 'Journaliste Accrédité',
            'admin'            => 'Administrateur',
            default            => ucfirst($this->role),
        };
    }
}
