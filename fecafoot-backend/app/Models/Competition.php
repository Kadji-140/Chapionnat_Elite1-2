<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Competition extends Model
{
use HasFactory;

    protected $fillable = [
        'saison_id', 'niveau', 'nom', 'statut'
    ];

    // ---- Relations ----

    // ⭐ CORRIGÉ : Relation BelongsTo vers la saison (simple et propre)
    public function saison(): BelongsTo
    {
        return $this->belongsTo(Saison::class);
    }

    public function regles(): HasOne
    {
        return $this->hasOne(ReglesCompetition::class);
    }

    public function phases(): HasMany
    {
        return $this->hasMany(Phase::class)->orderBy('ordre');
    }

    public function phaseReguliere(): HasOne
    {
        return $this->hasOne(Phase::class)->where('type', 'reguliere');
    }

    public function matchs(): HasMany
    {
        return $this->hasMany(Rencontre::class);
    }

    public function statJoueurs(): HasMany
    {
        return $this->hasMany(StatJoueur::class);
    }

    // ---- Helpers ----

    public function isEliteOne(): bool
    {
        return $this->niveau === 'elite_one';
    }

    public function isEliteTwo(): bool
    {
        return $this->niveau === 'elite_two';
    }
}

