const API_KEY = 'a6d26d2ba6f995374dc55aaff0b14534';
const CURRENT_WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

const cityInput = document.getElementById('miasto');
const weatherButton = document.getElementById('pogoda');
const currentWeatherDiv = document.getElementById('current-weather');
const forecastDiv = document.getElementById('forecast');

weatherButton.addEventListener('click', () => {
    const city = cityInput.value.trim();
    
    if (city === '') {
        showError('Proszę wprowadzić nazwę miasta!', 'current');
        forecastDiv.innerHTML = '';
        return;
    }
    
    currentWeatherDiv.innerHTML = '<div class="loading">Ładowanie pogody bieżącej...</div>';
    forecastDiv.innerHTML = '<div class="loading">Ładowanie prognozy...</div>';
    
    getCurrentWeather(city);
    
    getForecast(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        weatherButton.click();
    }
});

function getCurrentWeather(city) {
    const xhr = new XMLHttpRequest();
    const encodedCity = encodeURIComponent(city);
    const url = `${CURRENT_WEATHER_URL}?q=${encodedCity}&appid=${API_KEY}&units=metric&lang=pl`;
    
    xhr.open('GET', url, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            console.log('Current Weather Data:', data);
            displayCurrentWeather(data);
        } else {
            let details = null;
            try {
                details = JSON.parse(xhr.responseText);
            } catch (_) {
                // ignore
            }
            console.error('Error:', details ?? xhr.responseText);

            const message = xhr.status === 404
                ? 'Nie znaleziono miasta. Spróbuj ponownie.'
                : 'Błąd podczas pobierania pogody bieżącej.';
            showError(message, 'current');
        }
    };
    
    xhr.onerror = function() {
        console.error('Request failed');
        showError('Błąd połączenia. Sprawdź połączenie internetowe.', 'current');
    };
    
    xhr.send();
}

function getForecast(city) {
    const encodedCity = encodeURIComponent(city);
    const url = `${FORECAST_URL}?q=${encodedCity}&appid=${API_KEY}&units=metric&lang=pl`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Nie znaleziono miasta. Spróbuj ponownie.');
                }
                throw new Error('Błąd podczas pobierania prognozy.');
            }
            return response.json();
        })
        .then(data => {
            console.log('Forecast Data:', data);
            displayForecast(data);
        })
        .catch(error => {
            console.error('Error:', error);
            showError(error?.message || 'Błąd podczas pobierania prognozy.', 'forecast');
        });
}

function displayCurrentWeather(data) {
    const { name, main, weather, wind, clouds } = data;
    const iconCode = weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    
    const html = `
        <div class="current-weather-content">
            <img src="${iconUrl}" alt="${weather[0].description}" class="weather-icon">
            <div class="weather-main">
                <h2>${name}</h2>
                <div class="temperature">${Math.round(main.temp)}°C</div>
                <div class="weather-description">${weather[0].description}</div>
            </div>
        </div>
        <div class="weather-details">
            <div class="weather-detail">
                <strong>Odczuwalna</strong>
                ${Math.round(main.feels_like)}°C
            </div>
            <div class="weather-detail">
                <strong>Wilgotność</strong>
                ${main.humidity}%
            </div>
            <div class="weather-detail">
                <strong>Ciśnienie</strong>
                ${main.pressure} hPa
            </div>
            <div class="weather-detail">
                <strong>Wiatr</strong>
                ${Math.round(wind.speed * 3.6)} km/h
            </div>
            <div class="weather-detail">
                <strong>Zachmurzenie</strong>
                ${clouds.all}%
            </div>
        </div>
    `;
    
    currentWeatherDiv.innerHTML = html;
}

function displayForecast(data) {
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    
    let html = '<h3>Prognoza 5-dniowa</h3><div class="forecast-container">';
    
    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });
        const iconCode = forecast.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        
        html += `
            <div class="forecast-item">
                <div class="forecast-date">${dayName}</div>
                <img src="${iconUrl}" alt="${forecast.weather[0].description}" class="forecast-icon">
                <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
                <div class="forecast-description">${forecast.weather[0].description}</div>
                <div style="font-size: 0.9em; margin-top: 10px;">
                    💧 ${forecast.main.humidity}% | 💨 ${Math.round(forecast.wind.speed * 3.6)} km/h
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    forecastDiv.innerHTML = html;
}

function showError(message, scope = 'both') {
    const html = `<div class="error">${message}</div>`;
    if (scope === 'current' || scope === 'both') {
        currentWeatherDiv.innerHTML = html;
    }
    if (scope === 'forecast' || scope === 'both') {
        forecastDiv.innerHTML = html;
    }
}
