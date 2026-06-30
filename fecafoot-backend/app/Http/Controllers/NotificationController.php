<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Gestion des notifications in-app.
 * Préfixe : /api/notifications
 */
class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     * Retourne les notifications de l'utilisateur connecté (non-lues en premier).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('lu', 'asc')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(fn ($n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'titre'      => $n->titre,
                'message'    => $n->message,
                'lu'         => (bool) $n->lu,
                'lien'       => $n->lien,
                'metadata'   => $n->metadata,
                'created_at' => $n->created_at?->diffForHumans(),
                'created_at_iso' => $n->created_at?->toISOString(),
            ]);

        $nbNonLues = Notification::where('user_id', $user->id)->where('lu', false)->count();

        return response()->json([
            'success'     => true,
            'data'        => $notifications,
            'nb_non_lues' => $nbNonLues,
        ]);
    }

    /**
     * PATCH /api/notifications/{id}/lire
     * Marque une notification comme lue.
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $notif = Notification::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $notif->update(['lu' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * PATCH /api/notifications/lire-tout
     * Marque toutes les notifications de l'utilisateur comme lues.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('lu', false)
            ->update(['lu' => true]);

        return response()->json(['success' => true, 'message' => 'Toutes les notifications ont été lues.']);
    }

    /**
     * DELETE /api/notifications/{id}
     * Supprime une notification.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->delete();

        return response()->json(['success' => true]);
    }
}
