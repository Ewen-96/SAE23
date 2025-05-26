const codePostalInput = document.getElementById("code-postal");
const communeSelect = document.getElementById("communeSelect");
const validationButton = document.getElementById("validationButton");
const daySlider = document.getElementById("daySlider");
const sliderValue = document.getElementById("sliderValue");

async function fetchCommunesByCodePostal(codePostal) {
  try {
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${codePostal}`
    );
    const data = await response.json();
    console.table(data);
    return data;
  } catch (error) {
    console.error("Erreur lors de la requête API:", error);
    throw error;
  }
}

function displayCommunes(data) {
  communeSelect.innerHTML = "";

  if (data.length) {
    data.forEach((commune) => {
      const option = document.createElement("option");
      option.value = commune.code;
      option.textContent = commune.nom;
      communeSelect.appendChild(option);
    });
    communeSelect.style.display = "block";
    validationButton.style.display = "block";
    daySlider.style.display = "block"; // Ajout
  } else {
    const existingMessage = document.getElementById("error-message");
    if (!existingMessage) {
      const message = document.createElement("p");
      message.id = "error-message";
      message.textContent = "Le code postal saisi n'est pas valide";
      message.classList.add('errorMessage');
      document.body.appendChild(message);
    }

    communeSelect.style.display = "none";
    validationButton.style.display = "none";
    daySlider.style.display = "none"; // Ajout
    setTimeout(() => location.reload(), 3000);
  }
}

async function fetchMeteoByCommune(selectedCommune) {
  try {
    const response = await fetch(
      `https://api.meteo-concept.com/api/forecast/daily?token=4bba169b3e3365061d39563419ab23e5016c0f838ba282498439c41a00ef1091&insee=${selectedCommune}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la requête API:", error);
    throw error;
  }
}

codePostalInput.addEventListener("input", async () => {
  const codePostal = codePostalInput.value;
  communeSelect.style.display = "none";
  validationButton.style.display = "none";
  daySlider.style.display = "none";

  if (/^\d{5}$/.test(codePostal)) {
    try {
      const data = await fetchCommunesByCodePostal(codePostal);
      displayCommunes(data);
    } catch (error) {
      console.error("Une erreur est survenue lors de la recherche de la commune :", error);
      throw error;
    }
  }
});

validationButton.addEventListener("click", async () => {
  const selectedCommune = communeSelect.value;
  const selectedDays = parseInt(daySlider.value);

  const options = {
    lat: document.getElementById("latOption").checked,
    lon: document.getElementById("lonOption").checked,
    rain: document.getElementById("rainOption").checked,
    wind: document.getElementById("windOption").checked,
    dir: document.getElementById("dirOption").checked,
  };

  if (selectedCommune) {
    try {
      const data = await fetchMeteoByCommune(selectedCommune);
      createCard(data, selectedDays, options); // 👈 Appel correct ici
    } catch (error) {
      console.error("Erreur lors de la requête API meteoConcept:", error);
      throw error;
    }
  }
});

daySlider.addEventListener("input", () => {
  sliderValue.textContent = daySlider.value;
});

