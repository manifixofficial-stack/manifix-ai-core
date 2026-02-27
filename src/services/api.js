const API_BASE = "https://manifix-backend-666.onrender.com";

export const getWeather = (city) =>
  fetch(`${API_BASE}/api/weather?city=${city}`).then(res => res.json());

export const getNews = () =>
  fetch(`${API_BASE}/api/news`).then(res => res.json());

export const chatAI = (message) =>
  fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  }).then(res => res.json());
