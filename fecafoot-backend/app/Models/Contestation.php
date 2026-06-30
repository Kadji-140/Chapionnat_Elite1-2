<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contestation extends Model
{
    use HasFactory;

    protected $fillable = [
        'match_event_id', 'coach_id', 'motif',
        'statut', 'decision', 'traitee_par_id',
        'date_contestation', 'date_decision',
    ];

    protected $casts = [
        'date_contestation' => 'datetime',
        'date_decision'     => 'datetime',
    ];

    // ---- Relations ----

    public function matchEvent(): BelongsTo
    {
        return $this->belongsTo(MatchEvent::class);
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function traiteePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'traitee_par_id');
    }
}
