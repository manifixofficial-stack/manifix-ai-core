/* ==========================================================
 * ManifiX — Profile Card
 * ----------------------------------------------------------
 * Responsibilities:
 * - Display user avatar & identity
 * - Show email / username
 * - Logout action
 * - Clean, premium, safe UI
 * ========================================================== */

import React from "react";

const ProfileCard = ({
  user = {},
  onLogout,
}) => {
  const {
    email = "user@manifix.app",
    username = "ManifiX User",
    avatar_url = null,
  } = user;

  return (
    <div className="profile-card">
      {/* ===============================
          AVATAR
      =============================== */}
      <div className="profile-avatar">
        {avatar_url ? (
          <img src={avatar_url} alt="Profile" />
        ) : (
          <div className="avatar-placeholder">
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* ===============================
          USER INFO
      =============================== */}
      <div className="profile-info">
        <div className="profile-name">{username}</div>
        <div className="profile-email">{email}</div>
      </div>

      {/* ===============================
          LOGOUT
      =============================== */}
      <button
        className="profile-logout"
        onClick={onLogout}
        aria-label="Logout"
      >
        Logout
      </button>
    </div>
  );
};

export default ProfileCard;
