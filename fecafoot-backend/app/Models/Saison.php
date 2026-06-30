<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


use Illuminate\Database\Eloquent\Model;

class Saison extends Model
{
use HasFactory;

    protected $fillable = [
        'intitule', 'date_debut', 'date_fin', 'statut', 'clonee_depuis_id'
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin'   => 'date',
    ];

    // ---- Relations ----

    // ⭐ CORRIGÉ : Une saison contient plusieurs compétitions (Elite1, Elite2)
    public function competitions(): HasMany
    {
        return $this->hasMany(Competition::class);
    }

    // ⭐ Raccourcis pratiques
    public function eliteOne(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Competition::class)->where('niveau', 'elite_one');
    }

    public function eliteTwo(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Competition::class)->where('niveau', 'elite_two');
    }

    public function cloneeDepuis(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Saison::class, 'clonee_depuis_id');
    }

    public function transferts(): HasMany
    {
        return $this->hasMany(Transfert::class);
    }

    public function talentScores(): HasMany
    {
        return $this->hasMany(TalentScore::class);
    }

    // ---- Helpers ----

    public function isEnCours(): bool
    {
        return $this->statut === 'en_cours';
    }

    public function isTerminee(): bool
    {
        return $this->statut === 'terminee';
    }

}
