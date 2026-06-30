<?php

namespace App\Http\Controllers\Journaliste;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

/**
 * Gestion des articles par le journaliste.
 * Préfixe : /api/journaliste/articles
 */
class ArticleController extends Controller
{
    /**
     * GET /api/journaliste/articles
     * Liste les articles écrits par le journaliste connecté.
     */
    public function index(Request $request): JsonResponse
    {
        $articles = Article::where('auteur_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $articles,
        ]);
    }

    /**
     * POST /api/journaliste/articles
     * Crée un nouvel article (brouillon ou soumis).
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'titre'            => 'required|string|min:3|max:255',
            'contenu'          => 'required|string|min:10',
            'categorie'        => 'required|in:actualite,match,club,joueur,transfert,officiel',
            'image_principale' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'statut'           => 'nullable|in:brouillon,soumis',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $imagePath = null;
        if ($request->hasFile('image_principale')) {
            $imagePath = $request->file('image_principale')->store('articles', 'public');
        }

        $statut = $request->input('statut', 'brouillon');

        $article = Article::create([
            'auteur_id'        => $request->user()->id,
            'titre'            => $request->titre,
            'contenu'          => $request->contenu,
            'categorie'        => $request->categorie,
            'image_principale' => $imagePath,
            'statut'           => $statut,
        ]);

        if ($statut === 'soumis') {
            \App\Services\NotificationService::sendToAdmins(
                'article',
                '📰 Article soumis pour modération',
                "Le journaliste {$request->user()->prenom} {$request->user()->nom} a soumis l'article '{$article->titre}' pour modération.",
                '/admin/articles'
            );
        }

        return response()->json([
            'success' => true,
            'message' => $statut === 'soumis'
                ? 'L\'article a été créé et soumis pour modération.'
                : 'L\'article a été enregistré comme brouillon.',
            'data'    => $article,
        ], 201);
    }

    /**
     * GET /api/journaliste/articles/{id}
     * Affiche un article rédigé par le journaliste connecté.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $article = Article::where('auteur_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $article,
        ]);
    }

    /**
     * POST /api/journaliste/articles/{id} (Méthode POST car envoi de fichier/multipart en Laravel)
     * Met à jour un article existant.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $article = Article::where('auteur_id', $request->user()->id)
            ->findOrFail($id);

        // Bloquer l'édition si l'article est déjà validé ou publié
        if (in_array($article->statut, ['valide', 'publie'])) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de modifier un article déjà validé ou publié.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'titre'            => 'required|string|min:3|max:255',
            'contenu'          => 'required|string|min:10',
            'categorie'        => 'required|in:actualite,match,club,joueur,transfert,officiel',
            'image_principale' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'statut'           => 'nullable|in:brouillon,soumis',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = [
            'titre'     => $request->titre,
            'contenu'   => $request->contenu,
            'categorie' => $request->categorie,
        ];

        // Gérer le changement facultatif d'image
        if ($request->hasFile('image_principale')) {
            // Supprimer l'ancienne image si existante
            if ($article->image_principale) {
                Storage::disk('public')->delete($article->image_principale);
            }
            $data['image_principale'] = $request->file('image_principale')->store('articles', 'public');
        }

        // Si l'article était rejeté, sa modification le remet en brouillon ou soumis
        $statutDemandé = $request->input('statut');
        if ($statutDemandé) {
            $data['statut'] = $statutDemandé;
        } elseif ($article->statut === 'rejete') {
            $data['statut'] = 'brouillon';
        }

        $oldStatut = $article->statut;
        $article->update($data);

        if ($article->statut === 'soumis' && $oldStatut !== 'soumis') {
            \App\Services\NotificationService::sendToAdmins(
                'article',
                '📰 Article soumis pour modération',
                "Le journaliste {$request->user()->prenom} {$request->user()->nom} a soumis l'article '{$article->titre}' pour modération.",
                '/admin/articles'
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'L\'article a été mis à jour avec succès.',
            'data'    => $article,
        ]);
    }

    /**
     * PATCH /api/journaliste/articles/{id}/soumettre
     * Soumet un brouillon ou un article rejeté pour modération.
     */
    public function soumettre(Request $request, $id): JsonResponse
    {
        $article = Article::where('auteur_id', $request->user()->id)
            ->findOrFail($id);

        if (!in_array($article->statut, ['brouillon', 'rejete'])) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les brouillons ou les articles rejetés peuvent être soumis pour modération.',
            ], 422);
        }

        $article->update([
            'statut' => 'soumis',
        ]);

        \App\Services\NotificationService::sendToAdmins(
            'article',
            '📰 Article soumis pour modération',
            "Le journaliste {$request->user()->prenom} {$request->user()->nom} a soumis l'article '{$article->titre}' pour modération.",
            '/admin/articles'
        );

        return response()->json([
            'success' => true,
            'message' => 'L\'article a été soumis pour modération avec succès.',
            'data'    => $article,
        ]);
    }

    /**
     * DELETE /api/journaliste/articles/{id}
     * Supprime un article (Soft Delete).
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $article = Article::where('auteur_id', $request->user()->id)
            ->findOrFail($id);

        // Optionnel : restreindre la suppression si publié
        if ($article->statut === 'publie') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer un article déjà publié en ligne.',
            ], 403);
        }

        $article->delete();

        return response()->json([
            'success' => true,
            'message' => 'L\'article a été supprimé.',
        ]);
    }
}
