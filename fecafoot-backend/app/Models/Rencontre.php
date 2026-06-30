<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class Rencontre extends Model
{
     use HasFactory;

    protected $table = 'matchs';

    protected $fillable = [
        'competition_id', 'phase_id', 'poule_id', 'journee', 'type',
        'club_domicile_id', 'club_exterieur_id',
        'commissaire_id', 'arbitre_principal_id',
        'arbitre_assistant_1_id', 'arbitre_assistant_2_id', 'quatrieme_arbitre_id',
        'date_heure', 'stade', 'terrain_neutre',
        'score_domicile_terrain', 'score_exterieur_terrain',
        'score_domicile_officiel', 'score_exterieur_officiel',
        'score_domicile_prolongation', 'score_exterieur_prolongation',
        'score_domicile_tab', 'score_exterieur_tab',
        'est_forfait', 'club_forfait_id',
        'statut', 'est_homologue', 'date_homologation',
        'motif_report', 'date_heure_report',
        'first_half_started_at', 'second_half_started_at',
        'periode', 'temps_additionnel_1er', 'temps_additionnel_2e',
        'temps_additionnel_prolongation_1', 'temps_additionnel_prolongation_2',
        'duree_prolongation', 'prolongation_started_at', 'second_half_prolongation_started_at',
    ];

    protected $casts = [
        'date_heure'            => 'datetime',
        'date_heure_report'     => 'datetime',
        'date_homologation'     => 'datetime',
        'terrain_neutre'        => 'boolean',
        'est_forfait'           => 'boolean',
        'est_homologue'         => 'boolean',
        'first_half_started_at' => 'datetime',
        'second_half_started_at'=> 'datetime',
        'prolongation_started_at' => 'datetime',
        'second_half_prolongation_started_at' => 'datetime',
    ];

    // ---- Relations ----

    // ⭐ CORRIGÉ : relation directe vers Competition
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function phase(): BelongsTo
    {
        return $this->belongsTo(Phase::class);
    }

    public function poule(): BelongsTo
    {
        return $this->belongsTo(Poule::class);
    }

    public function clubDomicile(): BelongsTo
    {
        return $this->belongsTo(Club::class, 'club_domicile_id');
    }

    public function clubExterieur(): BelongsTo
    {
        return $this->belongsTo(Club::class, 'club_exterieur_id');
    }

    public function commissaire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'commissaire_id');
    }

    public function arbitrePrincipal(): BelongsTo
    {
        return $this->belongsTo(Arbitre::class, 'arbitre_principal_id');
    }

    public function arbitreAssistant1(): BelongsTo
    {
        return $this->belongsTo(Arbitre::class, 'arbitre_assistant_1_id');
    }

    public function arbitreAssistant2(): BelongsTo
    {
        return $this->belongsTo(Arbitre::class, 'arbitre_assistant_2_id');
    }

    public function quatriemeArbitre(): BelongsTo
    {
        return $this->belongsTo(Arbitre::class, 'quatrieme_arbitre_id');
    }

    public function clubForfait(): BelongsTo
    {
        return $this->belongsTo(Club::class, 'club_forfait_id');
    }

    public function compositions(): HasMany
    {
        return $this->hasMany(Composition::class, 'match_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(MatchEvent::class, 'match_id')->orderBy('minute');
    }

    public function feuille(): HasOne
    {
        return $this->hasOne(FeuilleDeMatch::class, 'match_id');
    }

    public function prediction(): HasOne
    {
        return $this->hasOne(PredictionMatch::class, 'match_id');
    }

    public function commentaires(): HasMany
    {
        return $this->hasMany(Commentaire::class, 'match_id');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class, 'match_id');
    }

    public function penalites(): HasMany
    {
        return $this->hasMany(Penalite::class, 'match_id');
    }

    // ---- Helpers ----

    public function estProgramme(): bool  { return $this->statut === 'programme'; }
    public function estEnCours(): bool   { return $this->statut === 'en_cours'; }
    public function estTermine(): bool   { return $this->statut === 'termine'; }
    public function estHomologue(): bool { return $this->statut === 'homologue'; }
    public function getElapsedSecondsAttribute(): int
    {
        // Try auto-terminating if applicable
        $this->checkAutoTermination();

        if ($this->statut === 'programme') {
            return 0;
        }
        if ($this->statut === 'mi_temps' || $this->periode === 'mi_temps') {
            return 45 * 60;
        }
        if ($this->periode === 'prolongation_mi_temps') {
            return (90 + $this->duree_prolongation) * 60;
        }
        if ($this->periode === 'tirs_au_but') {
            return (90 + 2 * $this->duree_prolongation) * 60;
        }
        if (in_array($this->statut, ['termine', 'homologue', 'litige'])) {
            if ($this->second_half_prolongation_started_at || $this->prolongation_started_at) {
                return (90 + 2 * $this->duree_prolongation) * 60;
            }
            return 90 * 60;
        }

        // statut === 'en_cours'
        if ($this->periode === 'prolongation_2' && $this->second_half_prolongation_started_at) {
            $diff = now()->timestamp - $this->second_half_prolongation_started_at->timestamp;
            $elapsed = (90 + $this->duree_prolongation) * 60 + max(0, $diff);
            $maxSecs = (90 + 2 * $this->duree_prolongation + $this->temps_additionnel_prolongation_2) * 60;
            return min($maxSecs, $elapsed);
        }

        if ($this->periode === 'prolongation_1' && $this->prolongation_started_at) {
            $diff = now()->timestamp - $this->prolongation_started_at->timestamp;
            $elapsed = 90 * 60 + max(0, $diff);
            $maxSecs = (90 + $this->duree_prolongation + $this->temps_additionnel_prolongation_1) * 60;
            return min($maxSecs, $elapsed);
        }

        if ($this->second_half_started_at) {
            $diff = now()->timestamp - $this->second_half_started_at->timestamp;
            $elapsed = 45 * 60 + max(0, $diff);
            $maxSecs = (90 + $this->temps_additionnel_2e) * 60;
            return min($maxSecs, $elapsed);
        }

        if ($this->first_half_started_at) {
            $diff = now()->timestamp - $this->first_half_started_at->timestamp;
            $elapsed = max(0, $diff);
            $maxSecs = (45 + $this->temps_additionnel_1er) * 60;
            return min($maxSecs, $elapsed);
        }

        return 0;
    }

    public function checkAutoTermination()
    {
        // Guard to avoid recursion or unnecessary queries
        if ($this->statut !== 'en_cours' || !$this->second_half_started_at) {
            return;
        }

        // If it is in extra time or penalty shootout, do not auto-terminate at 90
        if (in_array($this->periode, ['prolongation_1', 'prolongation_mi_temps', 'prolongation_2', 'tirs_au_but'])) {
            return;
        }

        $now = now()->timestamp;
        $elapsedSinceSecondHalf = $now - $this->second_half_started_at->timestamp;

        $maxMins = 45 + $this->temps_additionnel_2e + 2; // 2 minutes grace period after stoppage time

        // Has 90 mins + stoppage time + grace passed?
        if ($elapsedSinceSecondHalf < $maxMins * 60) {
            return;
        }

        // Check if there are events in the last 2 minutes (120 seconds)
        $lastEvent = \DB::table('match_events')
            ->where('match_id', $this->id)
            ->where('statut', 'valide')
            ->orderBy('created_at', 'desc')
            ->first();

        $shouldTerminate = false;
        if ($lastEvent) {
            $lastEventTime = strtotime($lastEvent->created_at);
            if ($now - $lastEventTime >= 120) {
                $shouldTerminate = true;
            }
        } else {
            // No events, check if 2nd half has been running for 47 minutes (45 mins + 2 mins)
            if ($elapsedSinceSecondHalf >= ($maxMins * 60)) {
                $shouldTerminate = true;
            }
        }

        if ($shouldTerminate) {
            // Terminate the match directly in the database to prevent event listener loops
            \DB::table('matchs')
                ->where('id', $this->id)
                ->update(['statut' => 'termine']);

            $this->statut = 'termine';

            // Create automatic termination event
            \App\Models\MatchEvent::create([
                'match_id'        => $this->id,
                'type'            => 'incident',
                'minute'          => 90 + $this->temps_additionnel_2e,
                'description'     => 'Fin du match automatique (aucun événement récent après la fin du temps réglementaire).',
                'statut'          => 'valide',
                'timestamp_event' => now(),
            ]);

            // Create FeuilleDeMatch
            \App\Models\FeuilleDeMatch::updateOrCreate(
                ['match_id' => $this->id],
                [
                    'statut'            => 'soumise',
                    'score_final_dom'   => $this->score_domicile_terrain,
                    'score_final_ext'   => $this->score_exterieur_terrain,
                    'incidents_rapport' => 'Match clôturé automatiquement par le système (temps réglementaire écoulé sans événement récent).',
                    'date_generation'   => now(),
                ]
            );

            // Notify admins
            try {
                \App\Services\NotificationService::matchCloture($this);
            } catch (\Exception $e) {
                // Ignore notification errors
            }
        }
    }

    public function getEstManqueAttribute(): bool
    {
        return $this->statut === 'programme' && $this->date_heure && $this->date_heure->addMinutes(30)->isPast();
    }

    public function getScoreOfficielDomAttribute(): int
    {
        return $this->score_domicile_officiel ?? $this->score_domicile_terrain;
    }

    public function getScoreOfficielExtAttribute(): int
    {
        return $this->score_exterieur_officiel ?? $this->score_exterieur_terrain;
    }

}
