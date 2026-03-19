const estaciones = [
    "BEDARIEUX", "BEZIERS-COURTADE", "BEZIERS-VIAS", "CAMBON-ET-SALVERGUES", 
    "CASTANET LE HAUT_SAPC", "LA VACQUERIE_SAPC", "LE CAYLAR_SAPC", "LES PLANS", 
    "LODEVE", "LUNAS", "MARSEILLAN-INRAE", "MARSILLARGUES", "MONTARNAUD", 
    "MONTPELLIER-AEROPORT", "MOULES-ET-BAUCELS", "MURVIEL LES BEZIERS", 
    "PEZENAS-TOURBES", "PRADES LE LEZ", "ROUJAN-INRAE", "SETE", "SIRAN", 
    "SOUMONT", "ST ANDRE DE SANGONIS", "ST JEAN DE MINERVOIS", "ST MARTIN DE LONDRES", 
    "ST MAURICE-NAVACELLE", "VAILHAN", "VILLENEUVE-LES-MAG-INRAE"
];

const coordinates = {
    "BEDARIEUX": {lat: 43.639833, lon: 3.146},
    "BEZIERS-COURTADE": {lat: 43.334333, lon: 3.155},
    "BEZIERS-VIAS": {lat: 43.322, lon: 3.352667},
    "CAMBON-ET-SALVERGUES": {lat: 43.622333, lon: 2.865333},
    "CASTANET LE HAUT_SAPC": {lat: 43.6675, lon: 2.976167},
    "LA VACQUERIE_SAPC": {lat: 43.792, lon: 3.457833},
    "LE CAYLAR_SAPC": {lat: 43.867167, lon: 3.3085},
    "LES PLANS": {lat: 43.786, lon: 3.246167},
    "LODEVE": {lat: 43.730333, lon: 3.303167},
    "LUNAS": {lat: 43.695833, lon: 3.170667},
    "MARSEILLAN-INRAE": {lat: 43.328333, lon: 3.565333},
    "MARSILLARGUES": {lat: 43.633833, lon: 4.168},
    "MONTARNAUD": {lat: 43.635833, lon: 3.688167},
    "MONTPELLIER-AEROPORT": {lat: 43.576167, lon: 3.964667},
    "MOULES-ET-BAUCELS": {lat: 43.948, lon: 3.752},
    "MURVIEL LES BEZIERS": {lat: 43.476, lon: 3.146},
    "PEZENAS-TOURBES": {lat: 43.437667, lon: 3.400333},
    "PRADES LE LEZ": {lat: 43.718333, lon: 3.866667},
    "ROUJAN-INRAE": {lat: 43.491667, lon: 3.321333},
    "SETE": {lat: 43.397333, lon: 3.692167},
    "SIRAN": {lat: 43.3265, lon: 2.675167},
    "SOUMONT": {lat: 43.707, lon: 3.3475},
    "ST ANDRE DE SANGONIS": {lat: 43.664167, lon: 3.507833},
    "ST JEAN DE MINERVOIS": {lat: 43.385667, lon: 2.857667},
    "ST MARTIN DE LONDRES": {lat: 43.7795, lon: 3.729333},
    "ST MAURICE-NAVACELLE": {lat: 43.841333, lon: 3.522333},
    "VAILHAN": {lat: 43.546833, lon: 3.299333},
    "VILLENEUVE-LES-MAG-INRAE": {lat: 43.538167, lon: 3.853833}
};

const selectCity = document.getElementById('select-city');

// Populate select options properly
estaciones.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    selectCity.appendChild(option);
});

async function fetchWeather(lat, lon) {
    // Open-Meteo allows querying current weather and daily/hourly forecasts natively without API Key
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&daily=weathercode,temperature_2m_max,sunrise,sunset&timezone=auto`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error('Erreur de récupération des données');
        }
        let data = await res.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}

function getWeatherIconPath(code) {
    if (code === 0) return "images/sol.png";
    if (code === 1 || code === 2) return "images/clouds.png";
    if (code === 3 || code === 45 || code === 48) return "images/nubes.png";
    if (code >= 51 && code <= 67) return "images/lluvia.png";
    if (code >= 71 && code <= 86) return "images/snowy.png";
    if (code >= 95) return "images/rayos.png";
    return "images/nubes.png";
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

async function addDataCurrent(data, selectedCity) {
    document.getElementById('name-city').textContent = selectedCity;
    
    let now = new Date();
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    document.getElementById('date-city').textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} | FR`;

    document.getElementById('temp-city').textContent = `${Math.round(data.current_weather.temperature)}°`;
    document.getElementById('img-city').src = getWeatherIconPath(data.current_weather.weathercode);
    
    // Convert sunrise and sunset
    document.getElementById('sunrise').textContent = formatTime(data.daily.sunrise[0]) + " am";
    document.getElementById('sunset').textContent = formatTime(data.daily.sunset[0]) + " pm";
    
    // Hourly relative humidity indexing
    // The Open-Meteo current_weather doesn't give humidity, we must use hourly.
    // For a rough match, we just use the first hour of humidity from the hourly arrays provided.
    // A more precise approach finds the index of current hour.
    const currentHourISO = data.current_weather.time; 
    let humidityIndex = data.hourly.time.indexOf(currentHourISO);
    if(humidityIndex === -1) humidityIndex = 0; // fallback
    
    document.getElementById('humidity').textContent = `${data.hourly.relativehumidity_2m[humidityIndex]}%`;
    document.getElementById('wind').textContent = `${Math.round(data.current_weather.windspeed)} km/h`;
}

async function addDataForecast(data) {
    const maxTemps = document.querySelectorAll('.max-temp');
    const dayElements = document.querySelectorAll(".day");
    const icons = document.querySelectorAll('.icon-day');

    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    
    // For day 1, 2, 3 in index (which correspond to tomorrow, day after tomorrow, etc.)
    for (let i = 1; i <= 3; i++) {
        let forecastDate = new Date(data.daily.time[i]);
        dayElements[i-1].textContent = dayNames[forecastDate.getDay()];
        icons[i-1].src = getWeatherIconPath(data.daily.weathercode[i]);
        maxTemps[i-1].textContent = `+${Math.round(data.daily.temperature_2m_max[i])}°`;
    }
}

async function showWeather() {
    const selected = selectCity.value;
    const {lat, lon} = coordinates[selected];
    
    if(!lat || !lon) return;

    let data = await fetchWeather(lat, lon);
    if(data) {
        addDataCurrent(data, selected);
        addDataForecast(data);
    }
}

// Initial load
window.onload = () => {
    selectCity.value = estaciones[0];
    showWeather();
};
