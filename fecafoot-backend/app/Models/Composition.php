<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Composition extends Model
{
 
    use HasFactory;

    protected $fillable = [
        'match_id', 'club_id', 'statut',
        'est_confirmee', 'formation', 'date_confirmation',
    ];

    protected $casts = [
        'est_confirmee'    => 'boolean',
        'date_confirmation' => 'datetime',
    ];

    // ---- Relations ----

    public function match(): BelongsTo
    {
        return $this->belongsTo(Rencontre::class, 'match_id');
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function joueurs(): HasMany
    {
        return $this->hasMany(CompositionJoueur::class);
    }

    public function titulaires(): HasMany
    {
        return $this->hasMany(CompositionJoueur::class)->where('role', 'titulaire');
    }

    public function remplacants(): HasMany
    {
        return $this->hasMany(CompositionJoueur::class)->where('role', 'remplacant');
    }

    public function capitaine(): HasOne
    {
        return $this->hasOne(CompositionJoueur::class)->where('est_capitaine', true);
    }
}
