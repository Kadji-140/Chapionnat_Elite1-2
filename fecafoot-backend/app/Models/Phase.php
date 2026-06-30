<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Phase extends Model
{ 
   use HasFactory;

    protected $fillable = [
        'competition_id',
        'nom', 'type', 'ordre',
        'date_debut', 'date_fin', 'statut', 'est_terminee',
    ];

    protected $casts = [
        'date_debut'     => 'date',
        'date_fin'       => 'date',
        'est_terminee'   => 'boolean',
    ];

    // ---- Relations ----

    // ⭐ CORRIGÉ : relation BelongsTo vers Competition
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function poules(): HasMany
    {
        return $this->hasMany(Poule::class);
    }

    public function matchs(): HasMany
    {
        return $this->hasMany(Rencontre::class);
    }

    // ---- Helpers ----

    public function isReguliere(): bool   { return $this->type === 'reguliere'; }
    public function isPlayoffUp(): bool   { return $this->type === 'playoff_up'; }
    public function isPlayoffDown(): bool { return $this->type === 'playoff_down'; }
    public function isBarrage(): bool     { return $this->type === 'barrage'; }
}