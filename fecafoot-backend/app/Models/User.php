<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Database\Factories\UserFactory;
use App\Notifications\ResetPasswordNotification;
 

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    // ⭐ CORRIGÉ : 'mot_de_passe' → 'password' (convention Laravel)
    // Laravel utilise 'password' par défaut pour l'authentification
    protected $fillable = [
        'nom', 'prenom', 'email', 'lang', 'password',  // ⭐ Renommé, lang ajouté
        'role', 'club_id', 'peut_creer_admin', 'acces_actif',
        'villes', 'date_derniere_activite',  // ⭐ NOUVEAUX champs
        'premiere_connexion', 'email_verified_at'
    ];

    // ⭐ Suppression de 'jwt_match', 'match_assigne_id' (stockage JWT non sécurisé)

    protected $hidden = [
        'password',  // ⭐ Renommé
        'remember_token'
    ];

    protected $casts = [
        'peut_creer_admin'        => 'boolean',
        'acces_actif'             => 'boolean',
        'premiere_connexion'      => 'boolean',
        'email_verified_at'       => 'datetime',
        'date_derniere_activite'  => 'datetime',
    ];

    public function sendPasswordResetNotification($token): void
{
    $this->notify(new ResetPasswordNotification($token));
}

    // ---- Relations ----

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    // ⭐ CORRIGÉ : Utilise 'commissaire_id' au lieu de 'match_assigne_id'
    public function matchsSupervises(): HasMany
    {
        return $this->hasMany(Rencontre::class, 'commissaire_id');
    }

    public function contestations(): HasMany
    {
        return $this->hasMany(Contestation::class, 'coach_id');
    }

    public function contestationsTraitees(): HasMany
    {
        return $this->hasMany(Contestation::class, 'traitee_par_id');
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class, 'auteur_id');
    }

    public function articlesValides(): HasMany
    {
        return $this->hasMany(Article::class, 'valide_par_id');
    }

    public function penalitesAppliquees(): HasMany
    {
        return $this->hasMany(Penalite::class, 'appliquee_par_id');
    }

    public function transfertsValides(): HasMany
    {
        return $this->hasMany(Transfert::class, 'valide_par_id');
    }

    public function feuillesValidees(): HasMany
    {
        return $this->hasMany(FeuilleDeMatch::class, 'validee_par_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    // ---- Helpers de rôle ----

    public function isAdmin(): bool             { return $this->role === 'admin'; }
    public function isResponsableClub(): bool   { return $this->role === 'responsable_club'; }
    public function isCoach(): bool             { return $this->role === 'coach'; }
    public function isCommissaire(): bool       { return $this->role === 'commissaire'; }
    public function isJournaliste(): bool       { return $this->role === 'journaliste'; }

}
