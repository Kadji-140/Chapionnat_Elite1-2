<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FavoriJoueur extends Model
{
    use HasFactory;

    protected $table = 'favoris_joueurs';

    protected $fillable = [
        'mobile_user_id', 'joueur_id'
    ];

    public function mobileUser(): BelongsTo
    {
        return $this->belongsTo(MobileUser::class);
    }

    public function joueur(): BelongsTo
    {
        return $this->belongsTo(Joueur::class);
    }
}
