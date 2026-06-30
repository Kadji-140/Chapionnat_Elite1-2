<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeuilleDeMatch extends Model
{
    use HasFactory;

    protected $table = 'feuilles_de_match';

    protected $fillable = [
        'match_id', 'statut', 'score_final_dom', 'score_final_ext',
        'incidents_rapport', 'chemin_pdf', 'date_generation', 'validee_par_id',
    ];

    protected $casts = [
        'date_generation' => 'datetime',
    ];

    // ---- Relations ----

    public function match(): BelongsTo
    {
        return $this->belongsTo(Rencontre::class, 'match_id');
    }

    public function valideePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validee_par_id');
    }
}
