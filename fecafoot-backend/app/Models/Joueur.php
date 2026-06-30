<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Joueur extends Model
{

    use HasFactory, SoftDeletes;

    // ⭐ CORRIGÉ : ajout de 'taille_cm', 'poids_kg', 'est_soumis', 'photo_url'
    protected $fillable = [
        'club_id', 'nom', 'prenom', 'date_naissance',
        'nationalite', 'num_licence', 'poste',
        'num_maillot', 'photo_url', 'taille_cm', 'poids_kg',
        'statut', 'statut_validation', 'est_soumis', 'motif_rejet',
        'nb_abonnes', 'valeur_marchande',
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'est_soumis'     => 'boolean',
        'taille_cm'      => 'integer',
        'poids_kg'       => 'integer',
        'nb_abonnes'     => 'integer',
    ];

    // ---- Relations ----

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function compositions(): HasMany
    {
        return $this->hasMany(CompositionJoueur::class);
    }

    public function matchEvents(): HasMany
    {
        return $this->hasMany(MatchEvent::class);
    }

    public function stats(): HasMany
    {
        return $this->hasMany(StatJoueur::class);
    }

    public function talentScores(): HasMany
    {
        return $this->hasMany(TalentScore::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function transferts(): HasMany
    {
        return $this->hasMany(Transfert::class);
    }

    // ---- Accessors ----

    public function getNomCompletAttribute(): string
    {
        return "{$this->prenom} {$this->nom}";
    }

    public function getAgeAttribute(): int
    {
        return $this->date_naissance->age;
    }

    // ---- Helpers ----

    public function isValide(): bool
    {
        return $this->statut_validation === 'valide';
    }

    public function isSoumis(): bool
    {
        return $this->est_soumis === true;
    }

    public function statistiquesSaison(): HasMany
    {
        return $this->hasMany(JoueurStatistiqueSaison::class);
    }

    public function historiqueCarriere(): HasMany
    {
        return $this->hasMany(HistoriqueCarriere::class);
    }

    public function favoris(): HasMany
    {
        return $this->hasMany(FavoriJoueur::class);
    }
}
