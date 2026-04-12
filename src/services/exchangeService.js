export async function getExchangeRate(baseCurrency) {
    const response = await fetch(
        `https://open.er-api.com/v6/latest/${baseCurrency}`
    );

    const data = await response.json();
    return data;
}