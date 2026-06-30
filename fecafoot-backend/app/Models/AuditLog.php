<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $table = 'audit_logs';

    /**
     * CORRIGÉ : 'donnees_avant' et 'donnees_apres' (au lieu de 'anciennes_valeurs', 'nouvelles_valeurs')
     */
    protected $fillable = [
        'user_id', 'action', 'entite_concernee', 'entite_id',
        'anciennes_valeurs', 'nouvelles_valeurs', 'ip_address', 'user_agent', 'timestamp',
    ];

    protected $casts = [
        'anciennes_valeurs' => 'array',
        'nouvelles_valeurs' => 'array',
        'timestamp'     => 'datetime',
    ];

    // ---- Relations ----

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
