<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transfert extends Model
{
    use HasFactory;

    protected $fillable = [
        'joueur_id', 'club_cedant_id', 'club_acquereur_id',
        'saison_id', 'montant', 'statut', 'motif_rejet',
        'valide_par_id', 'date_demande', 'date_validation',
    ];

    protected $casts = [
        'montant'          => 'decimal:2',
        'date_demande'     => 'datetime',
        'date_validation'  => 'datetime',
    ];

    // ---- Relations ----

    public function joueur(): BelongsTo
    {
        return $this->belongsTo(Joueur::class);
    }

    public function clubCedant(): BelongsTo
    {
        return $this->belongsTo(Club::class, 'club_cedant_id');
    }

    public function clubAcquereur(): BelongsTo
    {
        return $this->belongsTo(Club::class, 'club_acquereur_id');
    }

    public function saison(): BelongsTo
    {
        return $this->belongsTo(Saison::class);
    }

    public function validePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'valide_par_id');
    }
}
