import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

def train():
    print("--- Entrainement du modele d'IA de prediction des matchs FECAFOOT ---")
    
    # 1. Chargement des données
    csv_path = os.path.join("data", "export_matchs.csv")
    if not os.path.exists(csv_path):
        print(f"Erreur : Le fichier {csv_path} est introuvable. Veuillez d'abord exporter les données.")
        return
        
    df = pd.read_csv(csv_path)
    print(f"Matchs charges : {len(df)}")
    
    # 2. Définition des features et de la target
    feature_cols = [
        'victoires_dom_5', 'nuls_dom_5', 'defaites_dom_5',
        'victoires_ext_5', 'nuls_ext_5', 'defaites_ext_5',
        'buts_marques_dom_moy', 'buts_encaisses_dom_moy',
        'buts_marques_ext_moy', 'buts_encaisses_ext_moy',
        'h2h_dom_wins', 'h2h_nuls', 'h2h_ext_wins'
    ]
    
    X = df[feature_cols]
    y = df['resultat']
    
    # 3. Séparation Train/Test (80% / 20%)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"Donnees d'entrainement : {len(X_train)} matchs")
    print(f"Donnees de test : {len(X_test)} matchs")
    
    # 4. Entraînement du modèle RandomForest
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        min_samples_split=5,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # 5. Évaluation du modèle
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print("\n=== RESULTATS DE L'EVALUATION ===")
    print(f"Precision (Accuracy) : {accuracy * 100:.2f}%")
    print("\nRapport de classification :")
    print(classification_report(y_test, y_pred, target_names=['Victoire Exterieur', 'Match Nul', 'Victoire Domicile']))
    
    # Importance des features
    print("\nImportance des caracteristiques :")
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    for f in range(X.shape[1]):
        print(f"{f + 1}. {feature_cols[indices[f]]} : {importances[indices[f]] * 100:.2f}%")
        
    # 6. Sauvegarde des modèles
    models_dir = "models"
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        
    model_path = os.path.join(models_dir, "model_prediction.pkl")
    features_path = os.path.join(models_dir, "features.pkl")
    
    joblib.dump(model, model_path)
    joblib.dump(feature_cols, features_path)
    
    print(f"\nModele sauvegarde dans : {model_path}")
    print(f"Features sauvegardees dans : {features_path}")

if __name__ == "__main__":
    train()
