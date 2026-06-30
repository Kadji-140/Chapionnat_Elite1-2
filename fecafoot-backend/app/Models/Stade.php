<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stade extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'ville',
        'capacite',
        'est_actif',
    ];

    protected $casts = [
        'est_actif' => 'boolean',
        'capacite' => 'integer',
    ];
}
