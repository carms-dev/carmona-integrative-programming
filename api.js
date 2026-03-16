function searchCountry() {
  const country = document.getElementById("countryInput").value.trim();
  const result = document.getElementById("result");

  if (country === "") {
    result.innerHTML = `<div class="api-error">Please enter a country.</div>`;
    return;
  }

  result.innerHTML = `<div class="loading">Loading...</div>`;

  fetch(`https://restcountries.com/v3.1/name/${country}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Country not found");
      }

      return response.json();
    })

    .then((data) => {
      const c = data[0];

      result.innerHTML = `
<img src="${c.flags.png}" width="120">

<div class="api-info">
<b>Country:</b> ${c.name.common}<br>
<b>Capital:</b> ${c.capital}<br>
<b>Region:</b> ${c.region}<br>
<b>Population:</b> ${c.population.toLocaleString()}
</div>
`;
    })

    .catch((error) => {
      result.innerHTML = `
<div class="api-error">
Country not found. Please try again.
</div>
`;
    });
}
