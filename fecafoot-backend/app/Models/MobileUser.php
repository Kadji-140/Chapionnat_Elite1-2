<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MobileUser extends Model
{
    use HasFactory;

    protected $table = 'mobile_users';

    protected $fillable = [
        'id_anonyme', 'pseudo', 'clubs_favoris', 'date_premiere_visite',
    ];

    protected $casts = [
        'clubs_favoris'        => 'array',
        'date_premiere_visite' => 'datetime',
    ];

    // ---- Relations ----

    public function commentaires(): HasMany
    {
        return $this->hasMany(Commentaire::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function favorisClubs(): HasMany
    {
        return $this->hasMany(FavoriClub::class);
    }

    public function favorisJoueurs(): HasMany
    {
        return $this->hasMany(FavoriJoueur::class);
    }
}
