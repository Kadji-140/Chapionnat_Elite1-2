<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends BaseResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $url = config('app.frontend_url') . '/reinitialiser-mot-de-passe'
            . '?token=' . $this->token
            . '&email=' . urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('Réinitialisation de votre mot de passe — FECAFOOT Elite')
            ->greeting('Bonjour ' . $notifiable->prenom . ' !')
            ->line('Vous recevez cet email car une demande de réinitialisation de mot de passe a été effectuée.')
            ->action('Réinitialiser mon mot de passe', $url)
            ->line('Ce lien expire dans **60 minutes**.')
            ->line('Si vous n\'avez pas fait cette demande, ignorez cet email.')
            ->salutation('L\'équipe FECAFOOT Elite');
    }
}