<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JoueurStatistiqueSaison extends Model
{
    use HasFactory;

    protected $table = 'joueur_statistiques_saison';

    protected $fillable = [
        'joueur_id', 'saison_id', 'matchs_joues', 'titularisations', 'minutes_jouees',
        'buts', 'passes_decisives', 'tirs', 'tirs_cadres', 'tacles', 'interceptions',
        'duels_gagnes', 'cartons_jaunes', 'cartons_rouges', 'fautes_commises'
    ];

    public function joueur(): BelongsTo
    {
        return $this->belongsTo(Joueur::class);
    }

    public function saison(): BelongsTo
    {
        return $this->belongsTo(Saison::class);
    }
}
