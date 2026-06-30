<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Modération des articles par l'administrateur.
 * Préfixe : /api/admin/articles
 */
class ArticleController extends Controller
{
    /**
     * GET /api/admin/articles
     * Liste tous les articles avec filtre de statut optionnel.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Article::with(['auteur', 'validePar'])
            ->orderBy('created_at', 'desc');

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        $articles = $query->get();

        return response()->json([
            'success' => true,
            'data'    => $articles,
        ]);
    }

    /**
     * PATCH /api/admin/articles/{id}/valider
     * Valide et publie un article.
     */
    public function valider(Request $request, $id): JsonResponse
    {
        $article = Article::findOrFail($id);

        if ($article->statut !== 'soumis') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les articles soumis pour modération peuvent être validés.',
            ], 422);
        }

        $estALaUne = (bool) $request->input('est_a_la_une', false);

        if ($estALaUne) {
            Article::where('est_a_la_une', true)->update(['est_a_la_une' => false]);
        }

        $article->update([
            'statut'           => 'publie', // Passe à publié pour affichage public direct
            'valide_par_id'    => $request->user()->id,
            'date_publication' => now(),
            'motif_rejet'      => null, // Reset motif si réapprouvé plus tard
            'est_a_la_une'     => $estALaUne,
        ]);

        \App\Services\NotificationService::send(
            $article->auteur_id,
            'article',
            '✅ Article validé et publié',
            "Votre article '{$article->titre}' a été validé et publié par l'administration.",
            '/journaliste/articles'
        );

        return response()->json([
            'success' => true,
            'message' => 'L\'article a été validé et publié avec succès.',
            'data'    => $article->load(['auteur', 'validePar']),
        ]);
    }

    /**
     * PATCH /api/admin/articles/{id}/rejeter
     * Rejette un article soumis.
     */
    public function rejeter(Request $request, $id): JsonResponse
    {
        $article = Article::findOrFail($id);

        if ($article->statut !== 'soumis') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les articles soumis pour modération peuvent être rejetés.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'motif_rejet' => 'required|string|min:5|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $article->update([
            'statut'        => 'rejete',
            'motif_rejet'   => $request->motif_rejet,
            'valide_par_id' => $request->user()->id,
        ]);

        \App\Services\NotificationService::send(
            $article->auteur_id,
            'article',
            "❌ Article rejeté — {$article->titre}",
            "Votre article a été rejeté par l'administration. Motif : {$request->motif_rejet}",
            '/journaliste/articles'
        );

        return response()->json([
            'success' => true,
            'message' => 'L\'article a été rejeté.',
            'data'    => $article->load(['auteur', 'validePar']),
        ]);
    }

    /**
     * DELETE /api/admin/articles/{id}
     * Suppression administrative d'un article.
     */
    public function destroy($id): JsonResponse
    {
        $article = Article::findOrFail($id);
        $article->delete();

        return response()->json([
            'success' => true,
            'message' => 'L\'article a été supprimé administrativement.',
        ]);
    }
}
