<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompositionJoueur extends Model
{
    use HasFactory;

    protected $fillable = [
        'composition_id', 'joueur_id', 'role',
        'est_capitaine', 'minute_entree', 'minute_sortie',
        'poste_id', 'poste_index',
    ];

    protected $casts = [
        'est_capitaine' => 'boolean',
    ];

    // ---- Relations ----

    public function composition(): BelongsTo
    {
        return $this->belongsTo(Composition::class);
    }

    public function joueur(): BelongsTo
    {
        return $this->belongsTo(Joueur::class);
    }
}
