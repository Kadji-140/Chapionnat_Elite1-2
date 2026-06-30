<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueCarriere extends Model
{
    use HasFactory;

    protected $table = 'historique_carriere';

    protected $fillable = [
        'joueur_id', 'saison', 'club_nom', 'matchs_joues', 'buts', 'passes'
    ];

    public function joueur(): BelongsTo
    {
        return $this->belongsTo(Joueur::class);
    }
}
