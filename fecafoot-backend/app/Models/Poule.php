<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Poule extends Model
{
   
    use HasFactory;

    protected $fillable = [
        'phase_id', 'nom', 'nb_equipes',
    ];

    // ---- Relations ----

    public function phase(): BelongsTo
    {
        return $this->belongsTo(Phase::class);
    }

    public function clubs(): BelongsToMany
    {
        return $this->belongsToMany(Club::class, 'poule_club')
                    ->withPivot('saison_id', 'ordre_tirage', 'date_affectation')
                    ->withTimestamps();
    }

    public function matchs(): HasMany
    {
        return $this->hasMany(Rencontre::class);
    }

    public function classements(): HasMany
    {
        return $this->hasMany(ClassementClub::class);
    }
}
