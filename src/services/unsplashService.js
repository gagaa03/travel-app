const API_KEY = import.meta.env.VITE_UNSPLASH_API_KEY;

export async function getPhoto(keyword) {
    const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${keyword}&per_page=1&client_id=${API_KEY}`
    );

    const data = await response.json();
    return data.results[0];
}