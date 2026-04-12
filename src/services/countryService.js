export async function getCountry(countryName) {
    const response = await fetch(
        `https://restcountries.com/v3.1/name/${countryName}`
    );

    const data = await response.json();
    return data[0];
}