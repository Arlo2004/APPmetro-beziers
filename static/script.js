document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const cityInput = document.getElementById('cityInput');
    const weatherContent = document.getElementById('weatherContent');
    const errorMessage = document.getElementById('errorMessage');

    // Convertisseur de codes API Open-Meteo vers des émojis simples
    const getWeatherIcon = (code) => {
        if (code === 0) return "☀️";
        if (code >= 1 && code <= 3) return "⛅";
        if (code >= 45 && code <= 48) return "🌫️";
        if (code >= 51 && code <= 67) return "🌧️";
        if (code >= 71 && code <= 77) return "❄️";
        if (code >= 80 && code <= 82) return "🌦️";
        if (code >= 95) return "⛈️";
        return "🌥️";
    };

    // Formatage de la date en local "Jeu. 18"
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const fetchWeather = async () => {
        const city = cityInput.value.trim();
        if (!city) return;

        // Réinitialisation de l'affichage
        weatherContent.classList.add('hidden');
        errorMessage.classList.add('hidden');
        searchBtn.textContent = '...';
        searchBtn.disabled = true;

        try {
            // Appel Fetch vers notre backend Flask
            const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            // Insertion des données du jour
            document.getElementById('cityName').textContent = data.city;
            document.getElementById('currentTemp').textContent = Math.round(data.current.temperature);
            document.getElementById('humidity').textContent = `${data.current.humidity}%`;
            document.getElementById('wind').textContent = `${Math.round(data.current.wind_speed)} km/h`;
            document.getElementById('sunrise').textContent = data.today.sunrise;
            document.getElementById('sunset').textContent = data.today.sunset;

            // Insertion des prévisions
            const forecastContainer = document.getElementById('forecastContainer');
            forecastContainer.innerHTML = '';

            data.forecast.forEach(day => {
                const card = document.createElement('div');
                card.className = 'forecast-card';
                card.innerHTML = `
                    <div class="forecast-date">${formatDate(day.date)}</div>
                    <div class="forecast-icon">${getWeatherIcon(day.weather_code)}</div>
                    <div class="forecast-temps">
                        <span class="max">${Math.round(day.temp_max)}°</span>
                        <span class="min">${Math.round(day.temp_min)}°</span>
                    </div>
                `;
                forecastContainer.appendChild(card);
            });

            weatherContent.classList.remove('hidden');

        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        } finally {
            searchBtn.textContent = 'Chercher';
            searchBtn.disabled = false;
        }
    };

    // Déclenchements sur le clic bouton et la touche "Entrée"
    searchBtn.addEventListener('click', fetchWeather);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchWeather();
    });
});
