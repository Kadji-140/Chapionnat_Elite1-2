import os
import joblib
from flask import Flask, request, jsonify

app = Flask(__name__)

# Charge le modèle et les features au démarrage
model_path = os.path.join("models", "model_prediction.pkl")
features_path = os.path.join("models", "features.pkl")

model = None
features = None

if os.path.exists(model_path) and os.path.exists(features_path):
    try:
        model = joblib.load(model_path)
        features = joblib.load(features_path)
        print("Modele et features charges avec succes.")
    except Exception as e:
        print(f"Erreur lors du chargement du modele : {e}")
else:
    print("Attention : Les fichiers du modele n'existent pas. Veuillez entrainer le modele d'abord.")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})

@app.route('/predict/match', methods=['POST'])
def predict_match():
    global model, features
    
    # Recharger si pas chargé
    if model is None or features is None:
        if os.path.exists(model_path) and os.path.exists(features_path):
            model = joblib.load(model_path)
            features = joblib.load(features_path)
        else:
            return jsonify({"error": "Le modele n'est pas entraine."}), 500

    data = request.get_json(silent=True) or {}
    
    # Extraire les features dans le bon ordre
    try:
        input_data = []
        for col in features:
            if col not in data:
                return jsonify({"error": f"Champ manquant : {col}"}), 400
            input_data.append(float(data[col]))
            
        # Prédiction des probabilités
        # classes_ : [0, 1, 2] -> 0: Extérieur gagne, 1: Nul, 2: Domicile gagne
        prob = model.predict_proba([input_data])[0]
        
        # Mapper les probabilités aux classes correspondantes
        # classes_ peut être dans un ordre différent, on sécurise
        prob_dict = {int(c): float(p) for c, p in zip(model.classes_, prob)}
        
        proba_ext = prob_dict.get(0, 0.0) * 100
        proba_nul = prob_dict.get(1, 0.0) * 100
        proba_dom = prob_dict.get(2, 0.0) * 100
        
        # Déterminer la prediction et confiance
        max_prob = max(proba_dom, proba_nul, proba_ext)
        if max_prob == proba_dom:
            prediction = "domicile"
        elif max_prob == proba_ext:
            prediction = "exterieur"
        else:
            prediction = "nul"
            
        if max_prob >= 60.0:
            confiance = "elevee"
        elif max_prob >= 45.0:
            confiance = "moyenne"
        else:
            confiance = "faible"
            
        return jsonify({
            "victoire_domicile": round(proba_dom, 1),
            "nul": round(proba_nul, 1),
            "victoire_exterieur": round(proba_ext, 1),
            "prediction": prediction,
            "confiance": confiance
        })
        
    except Exception as e:
        return jsonify({"error": f"Erreur lors de la prediction : {str(e)}"}), 500

@app.route('/talent-score', methods=['POST'])
def talent_score():
    data = request.get_json(silent=True) or {}
    
    poste = data.get('poste', '').lower()
    buts = float(data.get('buts', 0))
    passes = float(data.get('passes_decisives', 0))
    minutes = float(data.get('minutes_jouees', 0))
    matchs = float(data.get('nb_matchs', 0))
    jaunes = float(data.get('cartons_jaunes', 0))
    rouges = float(data.get('cartons_rouges', 0))
    
    if matchs <= 0:
        return jsonify({
            "talent_score": 0.0,
            "niveau": "Inconnu",
            "recommande_recrutement": False,
            "details": {
                "score_offensive": 0.0,
                "score_defensive": 0.0,
                "score_discipline": 0.0
            }
        })
        
    # 1. Calcul de la régularité
    score_regularite = min(100.0, (minutes / (matchs * 90.0)) * 100.0)
    
    # 2. Calcul de la discipline
    score_discipline = max(0.0, 100.0 - (jaunes * 10.0) - (rouges * 35.0))
    
    # 3. Calcul par poste
    is_attaquant = any(p in poste for p in ['attaquant', 'avant', 'ailier', 'buteur'])
    is_milieu = 'milieu' in poste
    is_defenseur = any(p in poste for p in ['defenseur', 'lateral', 'arriere', 'stop'])
    is_gardien = 'gardien' in poste
    
    if is_attaquant:
        # Attaquants : très dépendant des buts et passes
        ratio_buts = buts / matchs
        ratio_passes = passes / matchs
        score_offensive = min(100.0, (ratio_buts / 0.6) * 70.0 + (ratio_passes / 0.3) * 30.0)
        # Petite contribution défensive fictive basée sur l'activité
        score_defensive = min(100.0, 30.0 + score_regularite * 0.1)
        
        talent = (score_offensive * 0.65) + (score_defensive * 0.15) + (score_discipline * 0.20)
        
    elif is_milieu:
        # Milieux : équilibré entre passes et buts
        ratio_buts = buts / matchs
        ratio_passes = passes / matchs
        score_offensive = min(100.0, (ratio_buts / 0.3) * 40.0 + (ratio_passes / 0.4) * 60.0)
        score_defensive = min(100.0, 50.0 + score_regularite * 0.2)
        
        talent = (score_offensive * 0.40) + (score_defensive * 0.40) + (score_discipline * 0.20)
        
    elif is_defenseur:
        # Défenseurs : dépendant de la discipline et régularité
        ratio_passes = passes / matchs
        score_offensive = min(100.0, 20.0 + (ratio_passes / 0.2) * 30.0)
        score_defensive = min(100.0, 60.0 + score_discipline * 0.4)
        
        talent = (score_offensive * 0.15) + (score_defensive * 0.65) + (score_discipline * 0.20)
        
    else: # Gardien ou par défaut
        score_offensive = 10.0
        score_defensive = min(100.0, 70.0 + score_regularite * 0.2)
        
        talent = (score_offensive * 0.05) + (score_defensive * 0.75) + (score_discipline * 0.20)
        
    # Ajustement selon le nombre de matchs joués pour lisser les petits échantillons
    if matchs < 3:
        talent = talent * 0.7
        
    talent = round(max(0.0, min(100.0, talent)), 1)
    score_offensive = round(score_offensive, 1)
    score_defensive = round(score_defensive, 1)
    score_discipline = round(score_discipline, 1)
    
    if talent >= 80.0:
        niveau = "Excellent"
    elif talent >= 65.0:
        niveau = "Tres Bon"
    elif talent >= 50.0:
        niveau = "Bon"
    else:
        niveau = "Moyen"
        
    return jsonify({
        "talent_score": talent,
        "niveau": niveau,
        "recommande_recrutement": bool(talent >= 75.0),
        "details": {
            "score_offensive": score_offensive,
            "score_defensive": score_defensive,
            "score_discipline": score_discipline,
            "score_regularite": round(score_regularite, 1)
        }
    })

if __name__ == '__main__':
    # Écoute sur le port 5000 comme configuré dans le plan
    app.run(host='0.0.0.0', port=5000, debug=True)
