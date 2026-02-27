/* ==========================================================
 * ManifiX — Manifest List
 * ----------------------------------------------------------
 * Responsibilities:
 * - Display user manifestations / notes
 * - Support private-only visibility
 * - Clean, calming, premium UI
 * - Mobile + Web ready
 * ========================================================== */

import React from "react";

const ManifestList = ({
  manifests = [],
  loading = false,
  onSelect,
}) => {
  if (loading) {
    return (
      <div className="manifest-list loading">
        ✨ Loading your manifestations...
      </div>
    );
  }

  if (!manifests.length) {
    return (
      <div className="manifest-list empty">
        🌱 No manifestations yet.  
        <br />
        Start writing your intentions.
      </div>
    );
  }

  return (
    <div className="manifest-list">
      {manifests.map((item) => (
        <div
          key={item.id}
          className="manifest-card"
          onClick={() => onSelect?.(item)}
        >
          <div className="manifest-content">
            {item.content}
          </div>

          <div className="manifest-meta">
            <span className="manifest-date">
              {new Date(item.created_at).toLocaleDateString()}
            </span>

            <span className="manifest-privacy">
              {item.is_private ? "🔒 Private" : "🌍 Public"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ManifestList;
