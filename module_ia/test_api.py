import urllib.request
import json

BASE_URL = "http://127.0.0.1:5000"

def send_post(endpoint, data):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Error {e.code} on {endpoint}: {e.read().decode()}")
        return None
    except Exception as e:
        print(f"Connection error on {endpoint}: {e}")
        return None

def send_get(endpoint):
    url = f"{BASE_URL}{endpoint}"
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Connection error on {endpoint}: {e}")
        return None

def test_health():
    print("\n--- Testing GET /health ---")
    res = send_get("/health")
    print(json.dumps(res, indent=2))

def test_talent_score():
    print("\n--- Testing POST /talent-score (Attacker case) ---")
    attacker_data = {
        "poste": "attaquant",
        "buts": 12,
        "passes_decisives": 4,
        "minutes_jouees": 1800,
        "nb_matchs": 20,
        "cartons_jaunes": 2,
        "cartons_rouges": 0
    }
    res = send_post("/talent-score", attacker_data)
    print(json.dumps(res, indent=2))

    print("\n--- Testing POST /talent-score (Defender case) ---")
    defender_data = {
        "poste": "defenseur",
        "buts": 1,
        "passes_decisives": 1,
        "minutes_jouees": 1900,
        "nb_matchs": 22,
        "cartons_jaunes": 5,
        "cartons_rouges": 1
    }
    res = send_post("/talent-score", defender_data)
    print(json.dumps(res, indent=2))

def test_predict_match():
    print("\n--- Testing POST /predict/match ---")
    match_data = {
        "victoires_dom_5": 3,
        "nuls_dom_5": 1,
        "defaites_dom_5": 1,
        "victoires_ext_5": 2,
        "nuls_ext_5": 2,
        "defaites_ext_5": 1,
        "buts_marques_dom_moy": 1.8,
        "buts_encaisses_dom_moy": 0.8,
        "buts_marques_ext_moy": 1.2,
        "buts_encaisses_ext_moy": 1.0,
        "h2h_dom_wins": 2,
        "h2h_nuls": 1,
        "h2h_ext_wins": 0
    }
    res = send_post("/predict/match", match_data)
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    test_health()
    test_talent_score()
    test_predict_match()
