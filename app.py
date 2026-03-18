import re
import requests
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# La liste EXACTE des 28 stations/villes autorisées
AUTHORIZED_CITIES = [
    "BEDARIEUX", "BEZIERS-COURTADE", "BEZIERS-VIAS", "CAMBON-ET-SALVERGUES",
    "CASTANET LE HAUT_SAPC", "LA VACQUERIE_SAPC", "LE CAYLAR_SAPC", "LES PLANS",
    "LODEVE", "LUNAS", "MARSEILLAN-INRAE", "MARSILLARGUES", "MONTARNAUD",
    "MONTPELLIER-AEROPORT", "MOULES-ET-BAUCELS", "MURVIEL LES BEZIERS",
    "PEZENAS-TOURBES", "PRADES LE LEZ", "ROUJAN-INRAE", "SETE", "SIRAN",
    "SOUMONT", "ST ANDRE DE SANGONIS", "ST JEAN DE MINERVOIS",
    "ST MARTIN DE LONDRES", "ST MAURICE-NAVACELLE", "VAILHAN",
    "VILLENEUVE-LES-MAG-INRAE"
]

def normalize_text(text):
    """
    Fonction de normalisation (BONUS) :
    - Mise en majuscules (uppercase)
    - Suppression des espaces aux extrémités (trim)
    - Suppression pure et simple des espaces, tirets et underscores à l'intérieur
      Cela permet une correspondance parfaite (ex: 'montpellier aeroport' devient 'MONTPELLIERAEROPORT' 
      et matchera avec 'MONTPELLIER-AEROPORT' devenu lui aussi 'MONTPELLIERAEROPORT').
    """
    if not text:
        return ""
    
    # 1. Uppercase & Trim
    t = text.strip().upper()
    
    # 2. Suppression regex de tous les espaces, tirets et underscores
    t = re.sub(r'[\s\-_]', '', t)
    
    return t

# Création d'un dictionnaire backend pour lier la saisie normalisée au nom exact de la constante
# Ex: { "MONTPELLIERAEROPORT": "MONTPELLIER-AEROPORT", ... }
VALIDATION_MAP = {normalize_text(city): city for city in AUTHORIZED_CITIES}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/weather')
def get_weather():
    city_input = request.args.get('city', '')
    
    if not city_input.strip():
        return jsonify({"error": "Veuillez entrer un nom de ville."}), 400
        
    normalized_input = normalize_text(city_input)
    
    # === 1. Validation Stricte ===
    if normalized_input not in VALIDATION_MAP:
        return jsonify({
            "error": "Ville non autorisée. La saisie n'appartient pas à la liste stricte des 28 stations de l'Hérault."
        }), 403

    # On récupère le nom tel qu'écrit EXACTEMENT dans la liste officielle
    exact_city = VALIDATION_MAP[normalized_input]

    # === 2. Geocoding ===
    # Nettoyage subtil du nom UNIQUEMENT pour l'API Geocoding d'Open-Meteo
    # (Si l'on cherche "MARSEILLAN-INRAE", Open-Metéo échoue, mais il trouve "MARSEILLAN")
    search_query = exact_city
    for suffix in ["_SAPC", "-INRAE", "-AEROPORT", "-COURTADE", "-VIAS", "-TOURBES"]:
        search_query = search_query.replace(suffix, "")
        
    if "VILLENEUVE-LES-MAG" in exact_city:
        search_query = "VILLENEUVE-LES-MAGUELONE"
        
    search_query = search_query.strip()

    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={search_query}&count=1&language=fr&format=json"
    geo_resp = requests.get(geo_url)
    geo_data = geo_resp.json()
    
    if "results" not in geo_data:
        return jsonify({"error": f"Coordonnées de cartographie introuvables pour : {exact_city}."}), 404
        
    lat = geo_data["results"][0]["latitude"]
    lon = geo_data["results"][0]["longitude"]
    
    # === 3. Obtenir la météo réelle ===
    weather_url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
        f"&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code"
        f"&timezone=Europe/Paris"
        f"&forecast_days=4"
    )
    
    weather_resp = requests.get(weather_url)
    weather_data = weather_resp.json()
    
    try:
        current = weather_data["current"]
        daily = weather_data["daily"]
        
        # On renvoie la data formatée au frontend
        result = {
            "city": exact_city, # Le rendu affichera le nom exact de la liste (ex: "MONTPELLIER-AEROPORT")
            "current": {
                "temperature": current["temperature_2m"],
                "humidity": current["relative_humidity_2m"],
                "wind_speed": current["wind_speed_10m"],
            },
            "today": {
                "sunrise": daily["sunrise"][0][-5:], 
                "sunset": daily["sunset"][0][-5:]
            },
            "forecast": []
        }
        
        # Les 3 jours suivants
        for i in range(1, 4):
            result["forecast"].append({
                "date": daily["time"][i],
                "temp_max": daily["temperature_2m_max"][i],
                "temp_min": daily["temperature_2m_min"][i],
                "weather_code": daily["weather_code"][i]
            })
            
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": "Erreur lors du traitement des données météo."}), 500

if __name__ == '__main__':
    app.run(debug=True)
