<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
     public function boot(): void
     {
         $models = [
             \App\Models\Club::class => 'Club',
             \App\Models\Saison::class => 'Saison',
             \App\Models\Competition::class => 'Competition',
             \App\Models\Phase::class => 'Phase',
             \App\Models\Poule::class => 'Poule',
             \App\Models\Arbitre::class => 'Arbitre',
             \App\Models\Joueur::class => 'Joueur',
             \App\Models\Rencontre::class => 'Rencontre',
             \App\Models\Composition::class => 'Composition',
             \App\Models\Contestation::class => 'Contestation',
             \App\Models\Penalite::class => 'Penalite',
             \App\Models\Transfert::class => 'Transfert',
             \App\Models\Article::class => 'Article',
             \App\Models\User::class => 'User',
             \App\Models\FeuilleDeMatch::class => 'FeuilleDeMatch',
         ];

 
         foreach ($models as $modelClass => $name) {
             try {
                 $modelClass::created(function ($model) use ($name) {
                     self::logAudit('create', $name, $model->id, null, $model->toArray());
                 });
 
                 $modelClass::updated(function ($model) use ($name) {
                     $dirty = $model->getDirty();
                     // Skip if only timestamps or nothing changed
                     $filteredDirty = array_filter($dirty, fn($k) => !in_array($k, ['updated_at', 'created_at']), ARRAY_FILTER_USE_KEY);
                     if (empty($filteredDirty)) return;
 
                     $before = [];
                     $after = [];
                     foreach ($filteredDirty as $key => $value) {
                         $before[$key] = $model->getOriginal($key);
                         $after[$key] = $value;
                     }
                     self::logAudit('update', $name, $model->id, $before, $after);
                 });
 
                 $modelClass::deleted(function ($model) use ($name) {
                     self::logAudit('delete', $name, $model->id, $model->toArray(), null);
                 });
             } catch (\Exception $e) {
                 Log::warning("Failed to register audit observer for {$name}: " . $e->getMessage());
             }
         }
 
         // Listen to login/logout events
         try {
             Event::listen(Login::class, function ($event) {
                 $user = $event->user;
                 if ($user) {
                     \App\Models\AuditLog::create([
                         'user_id' => $user->id,
                         'action' => 'login',
                         'entite_concernee' => 'User',
                         'entite_id' => $user->id,
                         'anciennes_valeurs' => null,
                         'nouvelles_valeurs' => ['email' => $user->email, 'role' => $user->role],
                         'ip_address' => request()->ip(),
                         'user_agent' => request()->userAgent(),
                         'timestamp' => now(),
                     ]);
                 }
             });
 
             Event::listen(Logout::class, function ($event) {
                 $user = $event->user;
                 if ($user) {
                     \App\Models\AuditLog::create([
                         'user_id' => $user->id,
                         'action' => 'logout',
                         'entite_concernee' => 'User',
                         'entite_id' => $user->id,
                         'anciennes_valeurs' => null,
                         'nouvelles_valeurs' => ['email' => $user->email, 'role' => $user->role],
                         'ip_address' => request()->ip(),
                         'user_agent' => request()->userAgent(),
                         'timestamp' => now(),
                     ]);
                 }
             });
         } catch (\Exception $e) {
             Log::warning("Failed to register Auth audit observers: " . $e->getMessage());
         }
     }
 
     /**
      * Write an audit log entry.
      */
     private static function logAudit(string $action, string $entity, ?int $entityId, ?array $before, ?array $after): void
     {
         $userId = Auth::id();
         if (!$userId) {
             return; // Skip if no user context (console, seeds, public requests)
         }
 
         try {
             \App\Models\AuditLog::create([
                 'user_id'           => $userId,
                 'action'            => $action,
                 'entite_concernee'  => $entity,
                 'entite_id'         => $entityId,
                 'anciennes_valeurs' => $before,
                 'nouvelles_valeurs' => $after,
                 'ip_address'        => request()->ip(),
                 'user_agent'        => request()->userAgent(),
                 'timestamp'         => now(),
             ]);
         } catch (\Exception $e) {
             Log::warning("Failed to record audit log: " . $e->getMessage());
         }
     }
}
