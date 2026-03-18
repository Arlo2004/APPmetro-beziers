# Météo Hérault ☀️

Une application web simple et moderne affichant la météo exclusivement pour les villes du département de l'Hérault (34). 

## 🌟 Fonctionnalités
- **Filtre départemental :** N'autorise que les villes appartenant au 34 (Montpellier, Sète, Béziers...) grâce à une liste interne.
- **Données réelles :** Utilise l'API géante gratuite d'Open-Meteo sans aucune clé nécessaire.
- **Détails météo :** Température actuelle, vent, humidité, lever & coucher du soleil.
- **Prévisions :** Historique sur 3 jours glissants.
- **Ui / Ux :** Interface stylisée en Glassmorphism pour laisser respirer l'image d'arrière plan.

## 🏗 Structure du projet
```text
/
├── app.py                # Backend Flask (Routing API météo)
├── requirements.txt      # Dépendances Python
├── templates/
│    └── index.html       # Interface principale
├── static/
│    ├── style.css        # Styles CSS modernes
│    └── script.js        # Logique Fetch Frontend
└── README.md
