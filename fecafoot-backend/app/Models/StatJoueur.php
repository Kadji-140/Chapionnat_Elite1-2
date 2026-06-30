<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StatJoueur extends Model
{
    use HasFactory;

    protected $table = 'stat_joueurs';

    protected $fillable = [
        'joueur_id', 'competition_id',
        'buts', 'passes_decisives', 'cartons_jaunes',
        'cartons_rouges', 'minutes_jouees', 'nb_matchs',
        'tirs_au_but_marques',
    ];

    // ---- Relations ----

    public function joueur(): BelongsTo
    {
        return $this->belongsTo(Joueur::class);
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }
}
