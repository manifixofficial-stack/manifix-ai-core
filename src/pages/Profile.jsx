// src/pages/Profile.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../services/supabase";

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    setUser(user);

    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();

    if (data) {
      setUsername(data.username || "");
      setAvatarUrl(data.avatar_url || null);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    await supabase.from("profiles").upsert({
      id: user.id,
      username,
      avatar_url: avatarUrl,
      email: user.email,
      updated_at: new Date().toISOString(),
    });

    alert("Profile updated ✅");
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    const filePath = `avatars/${user.id}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (error) {
      alert("Upload failed");
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    setAvatarUrl(data.publicUrl);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1 style={{ marginBottom: 30 }}>Profile Settings</h1>

      {/* Avatar Section */}
      <div style={cardStyle}>
        <h3>Profile Photo</h3>

        <div style={{ marginBottom: 15 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div style={avatarPlaceholder}>
              {username?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>

        <input type="file" accept="image/*" onChange={handleAvatarUpload} />
      </div>

      {/* Account Info */}
      <div style={cardStyle}>
        <h3>Account</h3>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      {/* Username */}
      <div style={cardStyle}>
        <h3>Username</h3>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleSave} style={buttonStyle}>
          Save Changes
        </button>
      </div>

      {/* Logout */}
      <div style={cardStyle}>
        <h3>Security</h3>
        <button onClick={handleLogout} style={logoutStyle}>
          Logout
        </button>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  marginBottom: "20px",
};

const avatarPlaceholder = {
  width: 120,
  height: 120,
  borderRadius: "50%",
  background: "#6366f1",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 40,
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "10px",
  marginBottom: "10px",
  borderRadius: "6px",
  border: "1px solid #ddd",
};

const buttonStyle = {
  padding: "8px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const logoutStyle = {
  padding: "8px 16px",
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
