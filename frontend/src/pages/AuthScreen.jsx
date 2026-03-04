import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useApp } from "../context/AppContext";

export default function AuthScreen() {
  const { navigate } = useApp();

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) navigate("onboarding");
    })();
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (!email || !password) throw new Error("Email and password are required.");

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data?.user && !data?.session) {
          setInfo("Signup success. Confirm email, then sign in.");
          setMode("signin");
          return;
        }

        navigate("onboarding");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      navigate("onboarding");
    } catch (e) {
      setError(e?.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0b0b" }}>
      <div style={{ width: "min(420px, 92vw)", background: "#121212", border: "1px solid #2a2a2a", borderRadius: 14, padding: 28 }}>
        <h1 style={{ color: "white", margin: 0, fontSize: 28 }}>Account</h1>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setMode("signin")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 10,
              border: mode === "signin" ? "1px solid #e8ff00" : "1px solid #2a2a2a",
              background: "transparent",
              color: mode === "signin" ? "#e8ff00" : "#cfcfcf",
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 10,
              border: mode === "signup" ? "1px solid #e8ff00" : "1px solid #2a2a2a",
              background: "transparent",
              color: mode === "signup" ? "#e8ff00" : "#cfcfcf",
              cursor: "pointer",
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          <label style={{ color: "#9a9a9a", fontSize: 12, letterSpacing: "0.12em" }}>EMAIL</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            style={{ padding: 12, borderRadius: 10, border: "1px solid #2a2a2a", background: "#0f0f0f", color: "white" }}
          />

          <label style={{ color: "#9a9a9a", fontSize: 12, letterSpacing: "0.12em" }}>PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            style={{ padding: 12, borderRadius: 10, border: "1px solid #2a2a2a", background: "#0f0f0f", color: "white" }}
          />

          {error ? (
            <div style={{ marginTop: 6, padding: 10, borderRadius: 10, background: "rgba(255,0,0,0.12)", color: "#ffb3b3", border: "1px solid rgba(255,0,0,0.25)" }}>
              {error}
            </div>
          ) : null}

          {info ? (
            <div style={{ marginTop: 6, padding: 10, borderRadius: 10, background: "rgba(232,255,0,0.10)", color: "#e8ff00", border: "1px solid rgba(232,255,0,0.20)" }}>
              {info}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "none", background: "#e8ff00", color: "#111", fontWeight: 800, cursor: "pointer" }}
          >
            {loading ? "PLEASE WAIT..." : mode === "signup" ? "CREATE ACCOUNT →" : "CONTINUE →"}
          </button>

          <button
            type="button"
            onClick={() => navigate("welcome")}
            style={{ marginTop: 10, background: "transparent", border: "none", color: "#cfcfcf", cursor: "pointer" }}
          >
            ← Back
          </button>
        </form>
      </div>
    </div>
  );
}