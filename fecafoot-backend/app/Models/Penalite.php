<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Penalite extends Model
{
    use HasFactory;

    protected $fillable = [
        'club_id', 'saison_id', 'match_id', 'type',
        'points_retires', 'motif', 'appliquee_par_id',
        'date_application', 'active',
    ];

    protected $casts = [
        'date_application' => 'datetime',
        'active'           => 'boolean',
    ];

    // ---- Relations ----

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function saison(): BelongsTo
    {
        return $this->belongsTo(Saison::class);
    }

    public function match(): BelongsTo
    {
        return $this->belongsTo(Rencontre::class, 'match_id');
    }

    public function appliqueePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'appliquee_par_id');
    }
}
