// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../services/supabase.js";
import VibeService from "../services/vibe.service.js";
import "../styles/profile.css";
import Icons from "../assets/icons"; // like, share icons

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [gallery, setGallery] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initProfile();
  }, []);

  const initProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setUser(user);
    await loadProfile(user.id);
    await loadGallery(user.id);
    await loadUserVibes();
    setLoading(false);
  };

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();
    if (data?.username) setUsername(data.username);
  };

  const loadGallery = async (userId) => {
    const { data } = await supabase
      .from("gallery")
      .select("id, url")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setGallery(data || []);
  };

  const loadUserVibes = async () => {
    const userVibes = await VibeService.getUserVibes();
    setVibes(userVibes || []);
  };

  const updateUsername = async () => {
    if (!username.trim() || !user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      username,
      email: user.email,
      updated_at: new Date().toISOString(),
    });
    alert("Profile updated ✨");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("chatMessages");
    navigate("/login");
  };

  if (loading) return <div className="page-loading">Loading profile…</div>;

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <img
          src="/assets/logo.png"
          alt="ManifiX Logo"
          className="profile-logo"
          onClick={() => navigate("/chat")}
        />
        <h1>ManifiX Profile</h1>
      </header>

      <main className="profile-main">
        {/* Avatar & Info */}
        <section className="profile-info neon-card">
          <div className="avatar neon-glow">
            {username?.charAt(0)?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
          </div>
          <h2 className="neon-text">{username || "Your Identity"}</h2>
          <p className="email">{user?.email}</p>
          <a
            href="https://instagram.com/ManifiXApp"
            target="_blank"
            rel="noopener noreferrer"
            className="profile-social"
          >
            📸 Follow us on Instagram
          </a>
        </section>

        {/* Edit Username */}
        <section className="profile-edit neon-card">
          <label>Username</label>
          <input
            type="text"
            placeholder="Choose your identity"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
          />
          <button className="btn neon-btn" onClick={updateUsername}>
            Save
          </button>
        </section>

        {/* Gallery */}
        <section className="profile-gallery">
          <h3>Your Gallery</h3>
          {gallery.length === 0 && <p className="empty">No photos yet 🌙</p>}
          <div className="gallery-grid">
            {gallery.map((img) => (
              <div key={img.id} className="gallery-card neon-border">
                <img src={img.url} alt="User Upload" />
              </div>
            ))}
          </div>
        </section>

        {/* User Vibes */}
        <section className="profile-vibes">
          <h3>Your Vibes</h3>
          {vibes.length === 0 && <p className="empty">No vibes yet ✨</p>}
          <div className="card-list">
            {vibes.slice(0, 6).map((v) => (
              <div
                key={v.id}
                className="mini-card neon-card"
                style={{ fontFamily: v.font || "Poppins" }}
              >
                <p>{v.text}</p>
                {v.music && (
                  <audio controls src={v.music}>
                    Your browser does not support audio
                  </audio>
                )}
                <span>{v.privacy}</span>
                <div className="card-icons">
                  <img src={Icons.like} alt="Like" />
                  <img src={Icons.share} alt="Share" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Logout */}
        <section className="profile-logout-section">
          <button className="profile-logout neon-btn" onClick={handleLogout}>
            🔓 Logout
          </button>
        </section>
      </main>
    </div>
  );
}
