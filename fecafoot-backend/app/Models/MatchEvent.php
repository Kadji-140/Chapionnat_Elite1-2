<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MatchEvent extends Model
{
    use HasFactory;

    protected $table = 'match_events';

    /**
     * CORRIGÉ : ajout de 'club_id' pour les statistiques
     */
    protected $fillable = [
        'match_id', 'joueur_id', 'joueur_remplacant_id',
        'saisi_par_id', 'club_id',
        'type', 'minute', 'minute_additionnelle',
        'timestamp_event', 'description', 'statut',
    ];

    protected $casts = [
        'timestamp_event' => 'datetime',
    ];

    // ---- Relations ----

    public function match(): BelongsTo
    {
        return $this->belongsTo(Rencontre::class, 'match_id');
    }

    public function joueur(): BelongsTo
    {
        return $this->belongsTo(Joueur::class);
    }

    public function joueurRemplacant(): BelongsTo
    {
        return $this->belongsTo(Joueur::class, 'joueur_remplacant_id');
    }

    public function saisiPar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'saisi_par_id');
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function contestation(): HasOne
    {
        return $this->hasOne(Contestation::class);
    }

    // ---- Helpers ----

    public function estUnBut(): bool
    {
        return in_array($this->type, ['but', 'but_csc', 'penalty_marque']);
    }

    public function estUnCarton(): bool
    {
        return in_array($this->type, ['carton_jaune', 'carton_rouge', 'carton_jaune_rouge']);
    }

    public function minuteAffichee(): string
    {
        if ($this->minute_additionnelle) {
            return $this->minute . '+' . $this->minute_additionnelle;
        }
        return (string) $this->minute;
    }
}
