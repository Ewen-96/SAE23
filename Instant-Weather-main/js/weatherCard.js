function createCard(data, numberOfDays = 1, options = {}) {
  const weatherSection = document.getElementById("weatherInformation");
  const requestSection = document.getElementById("cityForm");

  weatherSection.innerHTML = ""; // Réinitialisation

  // Création de la barre d'onglets uniquement si > 1 jour
  let tabContainer;
  if (numberOfDays > 1) {
    tabContainer = document.createElement("div");
    tabContainer.classList.add("tab-container");
    weatherSection.appendChild(tabContainer);
  }

  for (let i = 0; i < numberOfDays; i++) {
    const forecast = data.forecast[i];
    const city = data.city;

    // Carte météo
    const card = document.createElement("div");
    card.classList.add("weather-card");
    card.setAttribute("data-day", `day${i}`);
    if (numberOfDays > 1 && i !== 0) card.style.display = "none";

    const dayTitle = document.createElement("h3");
    dayTitle.textContent = `Prévision Jour ${i + 1}`;
    card.appendChild(dayTitle);

    // Détection météo (simple basée sur probarain et tmax)
    const weatherEmoji = getWeatherEmoji(forecast);

    const content = document.createElement("div");
    content.classList.add("weather-content");
    content.innerHTML = `
      <div class="emoji">${weatherEmoji}</div>
      <p><strong>Min :</strong> ${forecast.tmin}°C</p>
      <p><strong>Max :</strong> ${forecast.tmax}°C</p>
      <p><strong>Prob. de pluie :</strong> ${forecast.probarain}%</p>
      <p><strong>Soleil :</strong> ${displayHours(forecast.sun_hours)}</p>
    `;

    // Options supplémentaires
    if (options.lat) content.innerHTML += `<p><strong>Latitude :</strong> ${city.latitude.toFixed(4)}</p>`;
    if (options.lon) content.innerHTML += `<p><strong>Longitude :</strong> ${city.longitude.toFixed(4)}</p>`;
    if (options.rain)
      content.innerHTML += `<p><strong>Cumul pluie :</strong> ${forecast.rr10} mm ${getRainAmountEmoji(forecast.rr10)}</p>`;
    
    if (options.wind)
      content.innerHTML += `<p><strong>Vent moyen :</strong> ${forecast.wind10m} km/h ${getWindEmoji(forecast.wind10m)}</p>`;
    
    if (options.dir) {
      const arrow = getWindArrow(forecast.dirwind10m);
      content.innerHTML += `<p><strong>Direction vent :</strong> ${forecast.dirwind10m}° ${arrow}</p>`;
    }

    card.appendChild(content);
    weatherSection.appendChild(card);

    // Création des onglets si plusieurs jours
    if (numberOfDays > 1) {
      const tabButton = document.createElement("button");
      tabButton.textContent = `Jour ${i + 1}`;
      tabButton.classList.add("tab-button");
      if (i === 0) tabButton.classList.add("active");

      tabButton.addEventListener("click", () => {
        document.querySelectorAll(".weather-card").forEach(c => c.style.display = "none");
        document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
        card.style.display = "block";
        tabButton.classList.add("active");
      });

      tabContainer.appendChild(tabButton);
    }
  }

  // Bouton nouvelle recherche
  const reloadButton = document.createElement("div");
  reloadButton.textContent = "Nouvelle recherche";
  reloadButton.classList.add("reloadButton");
  document.body.appendChild(reloadButton);

  reloadButton.addEventListener("click", function () {
    document.getElementById("weatherInformation").style.display = "none";
    document.getElementById("weatherInformation").innerHTML = "";
    document.getElementById("cityForm").style.display = "block";
    document.getElementById("code-postal").value = "";
    document.getElementById("communeSelect").innerHTML = "";
    document.getElementById("communeSelect").style.display = "none";
    document.getElementById("validationButton").style.display = "none";
    document.getElementById("daySlider").value = 1;
    document.getElementById("sliderValue").textContent = "1";

    ["latOption", "lonOption", "rainOption", "windOption", "dirOption"].forEach(id => {
      document.getElementById(id).checked = false;
    });

    document.getElementById("optionsFieldset").style.display = "block";
    reloadButton.remove();
  });

  requestSection.style.display = "none";
  weatherSection.style.display = "block";
}

function displayHours(sunHours) {
  return sunHours + (sunHours > 1 ? " heures" : " heure");
}

function getWeatherEmoji(forecast) {
  if (forecast.probarain > 70) return "🌧️";
  if (forecast.probarain > 40) return "🌦️";
  if (forecast.tmax > 30) return "🔥";
  if (forecast.tmax > 20 && forecast.probarain < 20) return "☀️";
  if (forecast.probarain < 20 && forecast.sun_hours > 4) return "⛅";
  return "🌥️";
}

function getWindArrow(degree) {
  // Retourne une flèche correspondant à l'orientation approximative
  if (degree >= 337.5 || degree < 22.5) return "⬇️"; // Nord
  if (degree >= 22.5 && degree < 67.5) return "↙️";  // Nord-Est
  if (degree >= 67.5 && degree < 112.5) return "⬅️"; // Est
  if (degree >= 112.5 && degree < 157.5) return "↖️"; // Sud-Est
  if (degree >= 157.5 && degree < 202.5) return "⬆️"; // Sud
  if (degree >= 202.5 && degree < 247.5) return "↗️"; // Sud-Ouest
  if (degree >= 247.5 && degree < 292.5) return "➡️"; // Ouest
  if (degree >= 292.5 && degree < 337.5) return "↘️"; // Nord-Ouest
  return "❓";
}

function getWindEmoji(kmh) {
  if (kmh < 20) return "🍃";       // vent léger
  if (kmh < 40) return "🪁";       // modéré
  if (kmh < 70) return "🌬️";      // fort
  return "🌪️";                     // violent
}

function getRainAmountEmoji(mm) {
  if (mm >= 20) return "🌊";        // pluie torrentielle
  if (mm >= 10) return "⛈️";        // pluie modérée
  if (mm >= 1) return "☔";        // légère pluie
  return "🏜️";                      // pas de pluie
}
