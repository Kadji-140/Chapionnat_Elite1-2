<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;


class Club extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom', 'ville', 'division', 'logo_url',
        'responsable_id',
        'stade', 'president', 'couleurs', 'annee_creation',
        'profile_completed',
        'site_web', 'telephone', 'presentation',
        'est_actif', 'nb_abonnes',
    ];

    protected $casts = [
        'est_actif'          => 'boolean',
        'profile_completed'  => 'boolean',
        'annee_creation'     => 'integer',
        'nb_abonnes'         => 'integer',
    ];

    // ---- Relations ----

    // ⭐ CORRIGÉ : BelongsTo (car responsable_id est dans clubs)
    public function responsable(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsable_id');
    }

    public function coachs(): HasMany
    {
        return $this->hasMany(User::class)->where('role', 'coach');
    }

    public function joueurs(): HasMany
    {
        return $this->hasMany(Joueur::class);
    }

    public function joueursValides(): HasMany
    {
        return $this->hasMany(Joueur::class)
                    ->where('statut_validation', 'valide')
                    ->where('statut', 'actif');
    }

    public function matchsDomicile(): HasMany
    {
        return $this->hasMany(Rencontre::class, 'club_domicile_id');
    }

    public function matchsExterieur(): HasMany
    {
        return $this->hasMany(Rencontre::class, 'club_exterieur_id');
    }

    public function classements(): HasMany
    {
        return $this->hasMany(ClassementClub::class);
    }

    public function transfertsDepart(): HasMany
    {
        return $this->hasMany(Transfert::class, 'club_cedant_id');
    }

    public function transfertsArrivee(): HasMany
    {
        return $this->hasMany(Transfert::class, 'club_acquereur_id');
    }

    public function penalites(): HasMany
    {
        return $this->hasMany(Penalite::class);
    }

    public function poules(): BelongsToMany
    {
        return $this->belongsToMany(Poule::class, 'poule_club')
                    ->withPivot('saison_id', 'ordre_tirage', 'date_affectation')
                    ->withTimestamps();
    }

    public function palmares(): HasMany
    {
        return $this->hasMany(Palmares::class);
    }

    public function statistiquesSaison(): HasMany
    {
        return $this->hasMany(ClubStatistiqueSaison::class);
    }

    public function favoris(): HasMany
    {
        return $this->hasMany(FavoriClub::class);
    }
}
