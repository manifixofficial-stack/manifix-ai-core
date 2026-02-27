import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase  from "../services/supabase";
import { useApp } from "../context/AppContext";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading } = useApp();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile(data);

        if (data.role !== "admin") {
          navigate("/dashboard");
        }
      }
    };

    fetchProfile();
  }, [user, navigate]);

  if (!profile) return <div>Checking access...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h1>👑 Admin Panel</h1>
      <p>You are logged in as ADMIN</p>

      <button onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default Admin;
