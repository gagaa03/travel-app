import { useState, useEffect } from "react";
import { getWeather } from "../services/weatherService";

const useWeather = (value) => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [weatherError, setWeatherError] = useState(false);

    useEffect(() => {
        if (!value) return;
        async function fetchData() {
            try {
                const data = await getWeather(value);
                setWeather(data);
            } catch (err) {
                setWeatherError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [value])

    return { weather, loading, weatherError };
}

export {useWeather};

