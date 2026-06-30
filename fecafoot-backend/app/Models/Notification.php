<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'match_id', 'match_event_id', 'type',
        'titre', 'message', 'lue', 'lu', 'envoyee_le',
        'lien', 'metadata',
    ];

    protected $casts = [
        'lue'        => 'boolean',
        'lu'         => 'boolean',
        'metadata'   => 'array',
        'envoyee_le' => 'datetime',
    ];

    // ---- Relations ----

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function match(): BelongsTo
    {
        return $this->belongsTo(Rencontre::class, 'match_id');
    }

    public function matchEvent(): BelongsTo
    {
        return $this->belongsTo(MatchEvent::class);
    }
}
