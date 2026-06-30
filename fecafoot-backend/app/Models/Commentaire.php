<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Commentaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'match_id', 'mobile_user_id',
        'texte', 'pseudo_auteur', 'est_modere',
    ];

    protected $casts = [
        'est_modere' => 'boolean',
    ];

    // ---- Relations ----

    public function match(): BelongsTo
    {
        return $this->belongsTo(Rencontre::class, 'match_id');
    }

    public function mobileUser(): BelongsTo
    {
        return $this->belongsTo(MobileUser::class);
    }
}
