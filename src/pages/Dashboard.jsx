import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import supabase from "../services/supabase";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, streak, energy, completeRitual } = useApp();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  if (!user?.email_confirmed_at) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Please verify your email</h2>
        <p>Check your inbox before using ManifiX.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Welcome to ManifiX 🔥</h1>

      <p><strong>Streak:</strong> {streak} days</p>
      <p><strong>Energy:</strong> {energy}%</p>

      <button onClick={completeRitual}>
        Complete Ritual
      </button>

      <br /><br />

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          navigate("/login");
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
