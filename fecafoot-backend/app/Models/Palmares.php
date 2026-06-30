<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Palmares extends Model
{
    use HasFactory;

    protected $table = 'palmares';

    protected $fillable = [
        'club_id', 'titre', 'annee'
    ];

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }
}
