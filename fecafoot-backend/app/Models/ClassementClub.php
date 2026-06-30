<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassementClub extends Model
{
    use HasFactory;

    protected $table = 'classement_clubs';

    /**
     * CORRIGÉ : ajout de 'saison_id'
     */
    protected $fillable = [
        'club_id', 'poule_id', 'saison_id',
        'points', 'victoires', 'nuls', 'defaites',
        'buts_pour', 'buts_contre', 'diff_buts', 'nb_matchs',
        'cartons_jaunes', 'cartons_rouges',
        'points_penalite', 'motif_penalite', 'position',
    ];

    // ---- Relations ----

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function poule(): BelongsTo
    {
        return $this->belongsTo(Poule::class);
    }

    public function saison(): BelongsTo
    {
        return $this->belongsTo(Saison::class);
    }

    public function pointsReels(): int
    {
        return max(0, $this->points - $this->points_penalite);
    }
}
