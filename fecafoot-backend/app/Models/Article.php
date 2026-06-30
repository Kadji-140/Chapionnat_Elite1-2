<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Article extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'auteur_id', 'valide_par_id', 'titre', 'contenu',
        'image_principale', 'categorie', 'statut',
        'motif_rejet', 'date_publication', 'est_a_la_une',
    ];

    protected $casts = [
        'date_publication' => 'datetime',
        'est_a_la_une'     => 'boolean',
    ];

    // ---- Relations ----

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }

    public function validePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'valide_par_id');
    }
}
