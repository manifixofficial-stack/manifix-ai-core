// src/pages/Vibe.jsx
import React, { useEffect, useState } from "react";
import VibeService from "../services/vibe.service.js";
import AuthService from "../services/auth.service.js";
import Logo from "../assets/logo.png";
import "../styles/vibe.css";

// Fonts available
const fonts = ["Inter", "Playfair Display", "Poppins", "Montserrat", "Cursive", "Serif"];

const Vibe = () => {
  const [user, setUser] = useState(null);
  const [vibeText, setVibeText] = useState("");
  const [privacy, setPrivacy] = useState("private");
  const [font, setFont] = useState("Inter");

  const [music, setMusic] = useState("");
  const [songQuery, setSongQuery] = useState("");
  const [songResults, setSongResults] = useState([]);

  const [myVibes, setMyVibes] = useState([]);
  const [search, setSearch] = useState("");
  const [publicVibes, setPublicVibes] = useState([]);

  // Load user & vibes
  useEffect(() => {
    AuthService.getCurrentUser().then(setUser);
    loadMyVibes();
    const interval = setInterval(loadMyVibes, 5000); // auto refresh
    return () => clearInterval(interval);
  }, []);

  // Load user's vibes
  const loadMyVibes = async () => {
    try {
      const data = await VibeService.getUserVibes();
      setMyVibes(data || []);
    } catch (err) {
      console.error("Failed to load vibes", err);
    }
  };

  // Search public vibes
  const searchPublicVibes = async (e) => {
    if (e.key !== "Enter") return;
    if (!search.trim()) return;
    try {
      const data = await VibeService.searchPublicVibes(search);
      setPublicVibes(data || []);
    } catch (err) {
      console.error("Failed to search public vibes", err);
    }
  };

  // Create vibe
  const createVibe = async () => {
    if (!vibeText.trim()) return;
    try {
      await VibeService.createVibe({ text: vibeText, privacy, font, music });
      setVibeText("");
      setMusic("");
      setSongQuery("");
      setSongResults([]);
      loadMyVibes();
    } catch (err) {
      console.error("Failed to create vibe", err);
    }
  };

  // Like a vibe
  const likeVibe = (id) => {
    setMyVibes((prev) =>
      prev.map((v) => (v.id === id ? { ...v, likes: (v.likes || 0) + 1 } : v))
    );
    setPublicVibes((prev) =>
      prev.map((v) => (v.id === id ? { ...v, likes: (v.likes || 0) + 1 } : v))
    );
  };

  // Search songs (Spotify / music API)
  const searchSongs = async (query) => {
    if (!query.trim()) {
      setSongResults([]);
      return;
    }
    try {
      const data = await VibeService.searchSongs(query); // Backend calls Spotify API
      setSongResults(data || []);
    } catch (err) {
      console.error("Failed to search songs", err);
    }
  };

  const selectSong = (song) => {
    setMusic(song.preview_url); // Spotify preview or MP3 URL
    setSongQuery(`${song.name} - ${song.artist}`);
    setSongResults([]);
  };

  return (
    <div className="vibe-page">
      <header className="vibe-header">
        <img src={Logo} alt="ManifiX Logo" className="vibe-logo" />
        <h1>✨ Your Vibe</h1>
        <p className="subtitle">Share your energy 🌙</p>
      </header>

      {/* CREATE VIBE */}
      <div className="vibe-create">
        <textarea
          placeholder="Write your vibe..."
          value={vibeText}
          onChange={(e) => setVibeText(e.target.value)}
          style={{ fontFamily: font }}
        />

        <div className="vibe-controls">
          <select value={font} onChange={(e) => setFont(e.target.value)}>
            {fonts.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <select value={privacy} onChange={(e) => setPrivacy(e.target.value)}>
            <option value="private">🔒 Private</option>
            <option value="public">🌍 Public</option>
          </select>
        </div>

        {/* SONG SEARCH */}
        <div className="song-search">
          <input
            type="text"
            placeholder="🎵 Search songs..."
            value={songQuery}
            onChange={(e) => {
              setSongQuery(e.target.value);
              searchSongs(e.target.value);
            }}
          />
          {songResults.length > 0 && (
            <ul className="song-dropdown">
              {songResults.map((s) => (
                <li key={s.id} onClick={() => selectSong(s)}>
                  {s.name} - {s.artist}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="btn" onClick={createVibe}>
          Share Vibe ✨
        </button>
      </div>

      {/* MY VIBES */}
      <section className="vibe-section">
        <h2>My Vibes</h2>
        <div className="vibe-bubbles">
          {myVibes.length === 0 && <p>No vibes yet.</p>}
          {myVibes.map((v) => (
            <div key={v.id} className="vibe-bubble" style={{ fontFamily: v.font }}>
              <p>{v.text}</p>
              {v.music && <audio controls src={v.music} />}
              <div className="vibe-footer">
                <span className="privacy">{v.privacy}</span>
                <button className="like-btn" onClick={() => likeVibe(v.id)}>❤️ {v.likes || 0}</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PUBLIC VIBES */}
      <section className="vibe-section">
        <h2>Public Vibes</h2>
        <input
          type="text"
          placeholder="Search by name or email and press Enter"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyUp={searchPublicVibes}
        />
        <div className="vibe-bubbles">
          {publicVibes.length === 0 && <p>No public vibes found.</p>}
          {publicVibes.map((v) => (
            <div key={v.id} className="vibe-bubble public" style={{ fontFamily: v.font }}>
              <p>{v.text}</p>
              {v.music && <audio controls src={v.music} />}
              <div className="vibe-footer">
                <span className="author">{v.user_name}</span>
                <button className="like-btn" onClick={() => likeVibe(v.id)}>❤️ {v.likes || 0}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Vibe;
