const API_KEY = import.meta.env.VITE_WEATHER_API_KEY

export async function getWeather(city) {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=zh_tw`
    )
    const data = await response.json();
    return data;
}