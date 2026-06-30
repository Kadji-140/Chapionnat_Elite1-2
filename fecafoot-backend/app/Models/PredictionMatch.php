<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PredictionMatch extends Model
{
    use HasFactory;

    protected $table = 'prediction_matchs';

    protected $fillable = [
        'match_id', 'proba_victoire_dom', 'proba_nul',
        'proba_victoire_ext', 'phase_competition',
        'terrain_neutre', 'modele_version', 'date_calcul',
    ];

    protected $casts = [
        'terrain_neutre' => 'boolean',
        'date_calcul'    => 'datetime',
    ];

    // ---- Relations ----

    public function match(): BelongsTo
    {
        return $this->belongsTo(Rencontre::class, 'match_id');
    }
}
