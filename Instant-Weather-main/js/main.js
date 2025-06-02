// JavaScript Optimisé - Taille réduite avec bouton nouvelle recherche corrigé
const CONFIG = {
  API_URLS: {
    COMMUNES: 'https://geo.api.gouv.fr/communes',
    METEO: 'https://api.meteo-concept.com/api/forecast/daily'
  },
  API_TOKEN: '4bba169b3e3365061d39563419ab23e5016c0f838ba282498439c41a00ef1091'
};

// Éléments DOM
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const el = {
  codePostal: $('#code-postal'),
  communeSelect: $('#communeSelect'),
  validationBtn: $('#validationButton'),
  daySlider: $('#daySlider'),
  sliderValue: $('#sliderValue'),
  cityForm: $('#cityForm_form'),
  weatherSection: $('#weatherInformation'),
  loadingSpinner: $('#loadingSpinner'),
  cityFormContainer: $('#cityForm')
};

// Utilitaires
const utils = {
  toggleLoading: (show = true) => el.loadingSpinner.style.display = show ? 'flex' : 'none',
  
  showError: (msg, duration = 3000) => {
    const existing = $('#error-message');
    if (existing) existing.remove();
    
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.className = 'errorMessage';
    errorDiv.textContent = msg;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), duration);
  },
  
  isValidPostalCode: (code) => /^\d{5}$/.test(code),
  
  debounce: (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
};

// API Service
const api = {
  async fetchCommunes(codePostal) {
    try {
      utils.toggleLoading(true);
      const res = await fetch(`${CONFIG.API_URLS.COMMUNES}?codePostal=${codePostal}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Erreur API communes:', error);
      utils.showError('Erreur lors de la recherche des communes');
      throw error;
    } finally {
      utils.toggleLoading(false);
    }
  },

  async fetchMeteo(communeCode) {
    try {
      utils.toggleLoading(true);
      const res = await fetch(`${CONFIG.API_URLS.METEO}?token=${CONFIG.API_TOKEN}&insee=${communeCode}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Erreur API météo:', error);
      utils.showError('Erreur lors de la récupération des données météo');
      throw error;
    } finally {
      utils.toggleLoading(false);
    }
  }
};

// Utilitaires météo
const weather = {
  formatSunHours: (hours) => hours + (hours > 1 ? ' heures' : ' heure'),
  
  getWeatherEmoji: (f) => {
    if (f.probarain > 70) return '🌧️';
    if (f.probarain > 40) return '🌦️';
    if (f.tmax > 30) return '🔥';
    if (f.tmax > 20 && f.probarain < 20) return '☀️';
    if (f.probarain < 20 && f.sun_hours > 4) return '⛅';
    return '🌥️';
  },
  
  getWindArrow: (deg) => {
    const dirs = [
      [337.5, 360, '⬇️'], [0, 22.5, '⬇️'], [22.5, 67.5, '↙️'],
      [67.5, 112.5, '⬅️'], [112.5, 157.5, '↖️'], [157.5, 202.5, '⬆️'],
      [202.5, 247.5, '↗️'], [247.5, 292.5, '➡️'], [292.5, 337.5, '↘️']
    ];
    return dirs.find(([min, max]) => deg >= min && deg < max)?.[2] || '❓';
  },
  
  getWindEmoji: (kmh) => kmh < 20 ? '🍃' : kmh < 40 ? '🪁' : kmh < 70 ? '🌬️' : '🌪️',
  
  getRainEmoji: (mm) => mm >= 20 ? '🌊' : mm >= 10 ? '⛈️' : mm >= 1 ? '☔' : '🏜️',
  
  getDayName: (i) => i === 0 ? 'Aujourd\'hui' : i === 1 ? 'Demain' : `Dans ${i} jours`
};

// Gestionnaire d'affichage
const display = {
  displayCommunes(communes) {
    el.communeSelect.innerHTML = '<option value="">Choisissez votre commune</option>';
    
    if (communes.length === 0) {
      utils.showError('Aucune commune trouvée pour ce code postal');
      this.hideElements([el.communeSelect, el.validationBtn]);
      return;
    }
    
    communes.forEach(commune => {
      const option = document.createElement('option');
      option.value = commune.code;
      option.textContent = commune.nom;
      el.communeSelect.appendChild(option);
    });
    
    this.showElements([el.communeSelect, el.validationBtn]);
  },
  
  showElements: (elements) => elements.forEach(el => el && (el.style.display = 'block')),
  hideElements: (elements) => elements.forEach(el => el && (el.style.display = 'none')),
  
  createWeatherCard(forecast, city, dayIndex, options) {
    const card = document.createElement('div');
    card.className = 'weather-card glass-morphism';
    card.setAttribute('data-day', `day${dayIndex}`);
    if (dayIndex !== 0) card.style.display = 'none';
    
    const dayTitle = document.createElement('h3');
    dayTitle.textContent = weather.getDayName(dayIndex);
    card.appendChild(dayTitle);
    
    const content = document.createElement('div');
    content.className = 'weather-content';
    
    const emoji = document.createElement('div');
    emoji.className = 'emoji';
    emoji.textContent = weather.getWeatherEmoji(forecast);
    content.appendChild(emoji);
    
    const infoContainer = document.createElement('div');
    infoContainer.className = 'weather-info';
    
    const baseInfo = [
      ['🌡️ Température min', `${forecast.tmin}°C`],
      ['🌡️ Température max', `${forecast.tmax}°C`],
      ['☔ Probabilité de pluie', `${forecast.probarain}%`],
      ['☀️ Ensoleillement', weather.formatSunHours(forecast.sun_hours)]
    ];
    
    if (options.lat) baseInfo.push(['🌍 Latitude', city.latitude.toFixed(4)]);
    if (options.lon) baseInfo.push(['🌍 Longitude', city.longitude.toFixed(4)]);
    if (options.rain) baseInfo.push(['🌧️ Cumul pluie', `${forecast.rr10} mm ${weather.getRainEmoji(forecast.rr10)}`]);
    if (options.wind) baseInfo.push(['💨 Vent moyen', `${forecast.wind10m} km/h ${weather.getWindEmoji(forecast.wind10m)}`]);
    if (options.dir) baseInfo.push(['🧭 Direction vent', `${forecast.dirwind10m}° ${weather.getWindArrow(forecast.dirwind10m)}`]);
    
    baseInfo.forEach(([label, value]) => {
      const item = document.createElement('div');
      item.className = 'info-item';
      item.innerHTML = `<strong>${label}:</strong> ${value}`;
      infoContainer.appendChild(item);
    });
    
    content.appendChild(infoContainer);
    card.appendChild(content);
    return card;
  },
  
  createTabs(numberOfDays) {
    if (numberOfDays <= 1) return null;
    
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    
    for (let i = 0; i < numberOfDays; i++) {
      const btn = document.createElement('button');
      btn.textContent = weather.getDayName(i);
      btn.className = 'tab-button';
      if (i === 0) btn.classList.add('active');
      
      btn.addEventListener('click', () => {
        $$('.weather-card').forEach(card => card.style.display = 'none');
        $$('.tab-button').forEach(btn => btn.classList.remove('active'));
        
        const targetCard = $(`[data-day="day${i}"]`);
        if (targetCard) targetCard.style.display = 'block';
        btn.classList.add('active');
      });
      
      tabContainer.appendChild(btn);
    }
    
    return tabContainer;
  },
  
  createReloadButton() {
    const btn = document.createElement('button');
    btn.className = 'reloadButton';
    btn.innerHTML = '<i class="fas fa-redo-alt"></i> Nouvelle recherche';
    
    btn.addEventListener('click', () => {
      this.resetForm();
      btn.remove();
    });
    
    return btn;
  },
  
  resetForm() {
    el.weatherSection.style.display = 'none';
    el.weatherSection.innerHTML = '';
    el.cityFormContainer.style.display = 'block';
    
    el.codePostal.value = '';
    el.communeSelect.innerHTML = '<option value="">Choisissez votre commune</option>';
    el.daySlider.value = 1;
    el.sliderValue.textContent = '1';
    
    ['latOption', 'lonOption', 'rainOption', 'windOption', 'dirOption'].forEach(id => {
      const checkbox = $(`#${id}`);
      if (checkbox) checkbox.checked = false;
    });
    
    this.hideElements([el.communeSelect, el.validationBtn]);
  },
  
  displayWeatherData(data, numberOfDays, options) {
    el.weatherSection.innerHTML = '';
    
    const tabContainer = this.createTabs(numberOfDays);
    if (tabContainer) el.weatherSection.appendChild(tabContainer);
    
    for (let i = 0; i < numberOfDays; i++) {
      const card = this.createWeatherCard(data.forecast[i], data.city, i, options);
      el.weatherSection.appendChild(card);
    }
    
    // Créer et ajouter le bouton nouvelle recherche
    const reloadBtn = this.createReloadButton();
    document.body.appendChild(reloadBtn);
    
    el.cityFormContainer.style.display = 'none';
    el.weatherSection.style.display = 'block';
  }
};

// Gestionnaire d'événements
const events = {
  init() {
    this.setupForm();
    this.setupPostalInput();
    this.setupSlider();
    this.setupValidation();
  },
  
  setupForm() {
    el.cityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (el.communeSelect.value && el.communeSelect.style.display !== 'none') {
        this.handleValidation();
      }
    });
  },
  
  setupPostalInput() {
    const debouncedHandler = utils.debounce(async (codePostal) => {
      if (utils.isValidPostalCode(codePostal)) {
        try {
          const communes = await api.fetchCommunes(codePostal);
          display.displayCommunes(communes);
        } catch (error) {
          console.error('Erreur communes:', error);
        }
      } else {
        display.hideElements([el.communeSelect, el.validationBtn]);
      }
    }, 300);
    
    el.codePostal.addEventListener('input', (e) => {
      debouncedHandler(e.target.value.trim());
    });
    
    el.codePostal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (el.communeSelect.value && el.communeSelect.style.display !== 'none') {
          this.handleValidation();
        }
      }
    });
  },
  
  setupSlider() {
    el.daySlider.addEventListener('input', () => {
      el.sliderValue.textContent = el.daySlider.value;
    });
  },
  
  setupValidation() {
    el.validationBtn.addEventListener('click', () => {
      this.handleValidation();
    });
  },
  
  async handleValidation() {
    const selectedCommune = el.communeSelect.value;
    const selectedDays = parseInt(el.daySlider.value);
    
    if (!selectedCommune) {
      utils.showError('Veuillez sélectionner une commune');
      return;
    }
    
    const options = {
      lat: $('#latOption')?.checked || false,
      lon: $('#lonOption')?.checked || false,
      rain: $('#rainOption')?.checked || false,
      wind: $('#windOption')?.checked || false,
      dir: $('#dirOption')?.checked || false
    };
    
    try {
      const weatherData = await api.fetchMeteo(selectedCommune);
      display.displayWeatherData(weatherData, selectedDays, options);
    } catch (error) {
      console.error('Erreur météo:', error);
    }
  }
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌤️ App Météo initialisée');
  events.init();
  
  // Vérifier les éléments
  Object.entries(el).forEach(([key, element]) => {
    if (!element) console.warn(`⚠️ Élément manquant: ${key}`);
  });
});