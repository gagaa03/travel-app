export async function getCoordinates(city) {
    const API_URL = import.meta.env.VITE_API_URL
    const res = await fetch(`${API_URL}/api/geocode/search?q=${encodeURIComponent(city)}`)
    const data = await res.json()
    if (data.length === 0) throw new Error('找不到城市')
    return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
    }
}

export async function searchPlaces(query, city) {
    const q = city ? `${query}, ${city}` : query
    const API_URL = import.meta.env.VITE_API_URL
    const res = await fetch(`${API_URL}/api/geocode/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    return data.map(place => ({
        name: place.display_name.split(',').slice(0, 2).join(',').trim(),
        full: place.display_name,
        lat: parseFloat(place.lat),
        lon: parseFloat(place.lon),
    }))
}