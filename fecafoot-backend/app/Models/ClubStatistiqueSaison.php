<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClubStatistiqueSaison extends Model
{
    use HasFactory;

    protected $table = 'club_statistiques_saison';

    protected $fillable = [
        'club_id', 'saison_id', 'forme_actuelle', 'tirs_par_match',
        'tirs_cadres_par_match', 'passes_reussies_par_match',
        'cartons_jaunes_total', 'cartons_rouges_total', 'tacles_par_match'
    ];

    protected $casts = [
        'forme_actuelle' => 'array',
    ];

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function saison(): BelongsTo
    {
        return $this->belongsTo(Saison::class);
    }
}
