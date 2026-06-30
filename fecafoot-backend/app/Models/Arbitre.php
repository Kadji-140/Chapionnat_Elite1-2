<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;


class Arbitre extends Model
{
    use HasFactory;

    // ⭐ CORRIGÉ : ajout de 'villes', 'disponible'
    protected $fillable = [
        'nom', 'prenom', 'num_licence',
        'specification', 'region', 'villes', 'disponible', 'actif',
    ];

    protected $casts = [
        'actif'      => 'boolean',
        'disponible' => 'boolean',
    ];

    public function matchs(): HasMany
    {
        return $this->hasMany(Rencontre::class, 'arbitre_principal_id');
    }
}
