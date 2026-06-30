<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TalentScore extends Model
{
    use HasFactory;

    protected $table = 'talent_scores';

    protected $fillable = [
        'joueur_id', 'saison_id',
        'score_global', 'score_offensive', 'score_defensive',
        'score_discipline', 'details', 'modele_version', 'date_calcul',
    ];

    protected $casts = [
        'details'     => 'array',
        'date_calcul' => 'datetime',
    ];

    // ---- Relations ----

    public function joueur(): BelongsTo
    {
        return $this->belongsTo(Joueur::class);
    }

    public function saison(): BelongsTo
    {
        return $this->belongsTo(Saison::class);
    }
}
