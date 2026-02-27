import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-container">
      <div className="notfound-card">
        <h1 className="notfound-code">404</h1>

        <h2 className="notfound-title">
          This path doesn’t exist ✨
        </h2>

        <p className="notfound-text">
          But you’re not lost.
          <br />
          Let’s get you back to something meaningful.
        </p>

        <div className="notfound-actions">
          <button
            className="primary-btn"
            onClick={() => navigate("/")}
          >
            Go to Dashboard
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
