<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class ReglesCompetition extends Model
{
    use HasFactory;

    protected $table = 'regles_competition';

    // ⭐ CORRIGÉ : aligné avec les migrations
    protected $fillable = [
        'competition_id',
        'nb_clubs', 'format', 'nb_poules',
        'nb_matchs_par_club',
        'a_playoffs', 'nb_clubs_playoffs_up', 'nb_clubs_playoffs_down',
        'points_reportes_playoffs',
        'a_barrage', 'nb_clubs_barrage',
        'nb_promus_directs', 'nb_relegues_directs',
        'criteres_egalite',
        'points_victoire', 'points_nul', 'points_defaite',
        'score_forfait_vainqueur', 'score_forfait_perdant',
        'points_penalite_forfait',
    ];

    protected $casts = [
        'a_playoffs'               => 'boolean',
        'a_barrage'                => 'boolean',
        'points_reportes_playoffs' => 'boolean',
        'criteres_egalite'         => 'array',
    ];

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }
}

