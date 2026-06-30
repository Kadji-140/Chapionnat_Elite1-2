<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Consultation publique des articles d'actualités.
 * Préfixe : /api/public/articles ou simplement /api/articles
 */
class ArticleController extends Controller
{
    /**
     * GET /api/articles
     * Liste les articles validés et publiés avec filtre par catégorie optionnel.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Article::with(['auteur'])
            ->where('statut', 'publie')
            ->orderBy('est_a_la_une', 'desc')
            ->orderBy('date_publication', 'desc');

        if ($request->has('categorie') && $request->categorie !== '') {
            $query->where('categorie', $request->categorie);
        }

        $articles = $query->get();

        return response()->json([
            'success' => true,
            'data'    => $articles,
        ]);
    }

    /**
     * GET /api/articles/{id}
     * Affiche le détail d'un article publié.
     */
    public function show($id): JsonResponse
    {
        $article = Article::with(['auteur'])
            ->where('statut', 'publie')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $article,
        ]);
    }
}
