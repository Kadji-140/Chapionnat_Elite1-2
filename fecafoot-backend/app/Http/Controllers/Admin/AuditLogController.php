<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * GET /api/admin/audit-logs
     * Liste paginée des logs d'audit avec filtres.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user:id,nom,prenom,email,role');

        // Filtre par action
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        // Filtre par entite_concernee
        if ($request->filled('entite_concernee')) {
            $query->where('entite_concernee', $request->entite_concernee);
        }

        // Filtre par utilisateur
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Recherche par IP, action, entite_concernee, ou nom/prenom/email de l'utilisateur
        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('ip_address', 'like', $search)
                  ->orWhere('user_agent', 'like', $search)
                  ->orWhere('action', 'like', $search)
                  ->orWhere('entite_concernee', 'like', $search)
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('nom', 'like', $search)
                        ->orWhere('prenom', 'like', $search)
                        ->orWhere('email', 'like', $search);
                  });
            });
        }

        $query->orderBy('timestamp', 'desc');
        $logs = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => $logs->items(),
            'meta'    => [
                'total'        => $logs->total(),
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'per_page'     => $logs->perPage(),
            ],
        ]);
    }
}
