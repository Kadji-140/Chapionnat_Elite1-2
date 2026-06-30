<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Mailable envoyé lors d'une réinitialisation manuelle du mot de passe par l'admin.
 */
class ReinitialisationMotDePasseMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param string $nom        Nom de l'utilisateur
     * @param string $prenom     Prénom de l'utilisateur
     * @param string $email      Email de connexion
     * @param string $motDePasse Nouveau mot de passe temporaire (en clair)
     */
    public function __construct(
        public readonly string $nom,
        public readonly string $prenom,
        public readonly string $email,
        public readonly string $motDePasse,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🔒 FECAFOOT — Réinitialisation de votre mot de passe',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reinitialisation_mdp',
            with: [
                'nom'        => $this->nom,
                'prenom'     => $this->prenom,
                'email'      => $this->email,
                'motDePasse' => $this->motDePasse,
                'loginUrl'   => config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')) . '/login',
            ],
        );
    }
}
