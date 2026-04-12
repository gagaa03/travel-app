import { useState, useEffect } from "react";
import { getWeather } from "../services/weatherService";
import { getCountry } from "../services/countryService";
import { getExchangeRate } from "../services/exchangeService";
import { getPhoto } from "../services/unsplashService";

function TripDetail() {
    const [weather, setWeather] = useState(null);
    const [country, setCountry] = useState(null);
    const [exchange, setExchange] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const weatherData = await getWeather('Tokyo');
                const countryData = await getCountry('Japan');
                const exchangeData = await getExchangeRate('JPY');
                const photoData = await getPhoto('Tokyo');
                setWeather(weatherData);
                setCountry(countryData);
                setExchange(exchangeData);
                setPhoto(photoData);
                setLoading(false);
            } catch (err) {
                setError('資料載入失敗');
                console.log(err)
                setLoading(false);
            }
        }

        fetchData();
    },[])

    if (loading) return <p>載入中...</p>
    if (error) return <p>{error}</p>


    return (
        <>
            <h1>旅程細項</h1>
            <img 
                src={photo.urls.regular} 
                alt={photo.alt_description}
                width="600"
            />
            <p>
                Photo by <a href={photo.user.links.html} target="_blank">{photo.user.name}</a> on Unsplash
            </p>

            <h2>東京天氣</h2>
            <p>溫度：{weather.main.temp} °C</p>
            <p>天氣：{weather.weather[0].description}</p>
            <p>濕度：{weather.main.humidity} %</p>

            <h2>國家資訊</h2>
            <p>國家：{country.name.official}</p>
            <p>首都：{country.capital[0]}</p>
            <p>人口：{country.population.toLocaleString()}</p>

            <h2>匯率資訊</h2>
            <p>1 JPY = {exchange.rates.TWD.toFixed(2)} TWD (台幣) </p>
            <p>1 JPY = {exchange.rates.USD.toFixed(4)} USD (美金) </p>
        </>
    )
}



export default TripDetail;