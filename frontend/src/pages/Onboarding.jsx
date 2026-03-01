import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabaseClient";
import "./Onboarding.css";

export default function Onboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [learningGoal, setLearningGoal] = useState("");

  const [moduleChoice, setModuleChoice] = useState("Python");
  const [levelChoice, setLevelChoice] = useState("Beginner");
  const [interests, setInterests] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const stepMeta = useMemo(
    () => [
      { key: "profile", label: "01", title: "WHO ARE YOU?" },
      { key: "learn", label: "02", title: "LEARN?" },
      { key: "finish", label: "03", title: "READY?" },
    ],
    []
  );

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) return;

      const authedEmail = data?.user?.email || "";
      setEmail(authedEmail);

      const uid = data?.user?.id;
      if (!uid) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, email, learning_goal")
        .eq("id", uid)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name ?? "");
        setUsername(profile.username ?? "");
        setEmail(profile.email ?? authedEmail);
        setLearningGoal(profile.learning_goal ?? "");
      }
    })();
  }, []);

  const normalizeUsername = (value) => {
    const v = (value || "").trim().toLowerCase();
    return v.replace(/[^a-z0-9_]/g, "").slice(0, 32);
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setErrorMsg(error.message || "Auth error");
      return;
    }

    const user = data?.user;
    if (!user) {
      setErrorMsg("You are not signed in. Please login again.");
      return;
    }

    const uid = user.id;
    const userEmail = user.email || email || "";

    const cleanedUsername = normalizeUsername(username);

    setLoading(true);
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: uid,
        email: userEmail,
        full_name: fullName?.trim() || null,
        username: cleanedUsername || null,
        learning_goal: learningGoal?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    setLoading(false);

    if (upsertError) {
      setErrorMsg(upsertError.message || "Failed to save profile");
      return;
    }

    setStep(2);
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  };

  const handleStep2Continue = async () => {
    setErrorMsg("");

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setErrorMsg(error.message || "Auth error");
      return;
    }

    const user = data?.user;
    if (!user) {
      setErrorMsg("You are not signed in. Please login again.");
      return;
    }

    const uid = user.id;

    setLoading(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", uid);
    setLoading(false);

    if (updateError) {
      setErrorMsg(updateError.message || "Failed to save");
      return;
    }

    setStep(3);
  };

  const handleFinish = () => {
    navigate("/dashboard");
  };

  return (
    <div className="onboard-screen">
      <header className="onboard-header">
        <button type="button" className="onboard-back" onClick={handleBack}>
          ← BACK
        </button>

        <div className="onboard-steps">
          {stepMeta.map((s, idx) => {
            const n = idx + 1;
            const cls =
              n === step ? "onboard-step-dot active" : n < step ? "onboard-step-dot done" : "onboard-step-dot";
            return (
              <div key={s.key} className={cls}>
                {s.label}
              </div>
            );
          })}
        </div>

        <div className="onboard-right">
          <span className="onboard-progress">
            {step} / {stepMeta.length}
          </span>
        </div>
      </header>

      {step === 1 && (
        <main className="onboard-content">
          <div className="onboard-title-row">
            <div className="onboard-step-kicker">STEP 01</div>
            <h1 className="onboard-title">WHO ARE YOU?</h1>
          </div>

          <form className="onboard-form" onSubmit={handleContinue}>
            <div className="onboard-field">
              <label className="onboard-label">YOUR NAME (OPTIONAL)</label>
              <input
                className="onboard-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex"
                autoComplete="name"
              />
            </div>

            <div className="onboard-field">
              <label className="onboard-label">USERNAME</label>
              <input
                className="onboard-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. alexlearns"
                autoComplete="username"
              />
            </div>

            <div className="onboard-field">
              <label className="onboard-label">EMAIL (OPTIONAL)</label>
              <input
                className="onboard-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                disabled
              />
            </div>

            <div className="onboard-field">
              <label className="onboard-label">WHAT'S YOUR LEARNING GOAL?</label>
              <input
                className="onboard-input"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                placeholder="e.g. Get a job in data science"
              />
            </div>

            {errorMsg ? <div className="onboard-error">{errorMsg}</div> : null}

            <button className="onboard-cta" type="submit" disabled={loading}>
              {loading ? "SAVING..." : "CONTINUE →"}
            </button>
          </form>
        </main>
      )}

      {step === 2 && (
        <main className="onboard-content">
          <div className="onboard-title-row">
            <div className="onboard-step-kicker">STEP 02</div>
            <h1 className="onboard-title">LEARN?</h1>
          </div>

          <div className="onboard-form">
            <div className="onboard-field">
              <label className="onboard-label">PICK A MODULE</label>

              <div className="module-grid">
                <button
                  type="button"
                  className={moduleChoice === "Python" ? "module-card active" : "module-card"}
                  onClick={() => setModuleChoice("Python")}
                >
                  <div className="module-name">Python</div>
                  <div className="module-desc">Programming fundamentals to advanced</div>
                </button>

                <button type="button" className="module-card disabled">
                  <div className="module-name">Machine Learning</div>
                  <div className="module-desc">Coming soon</div>
                </button>

                <button type="button" className="module-card disabled">
                  <div className="module-name">Web Dev</div>
                  <div className="module-desc">Coming soon</div>
                </button>

                <button type="button" className="module-card disabled">
                  <div className="module-name">SQL & Databases</div>
                  <div className="module-desc">Coming soon</div>
                </button>
              </div>
            </div>

            <div className="onboard-field">
              <label className="onboard-label">YOUR CURRENT LEVEL</label>

              <div className="level-row">
                <button
                  type="button"
                  className={levelChoice === "Beginner" ? "level-card active" : "level-card"}
                  onClick={() => setLevelChoice("Beginner")}
                >
                  <div className="level-name">Beginner</div>
                  <div className="level-desc">Just starting out</div>
                </button>

                <button
                  type="button"
                  className={levelChoice === "Intermediate" ? "level-card active" : "level-card"}
                  onClick={() => setLevelChoice("Intermediate")}
                >
                  <div className="level-name">Intermediate</div>
                  <div className="level-desc">Know the basics</div>
                </button>

                <button
                  type="button"
                  className={levelChoice === "Advanced" ? "level-card active" : "level-card"}
                  onClick={() => setLevelChoice("Advanced")}
                >
                  <div className="level-name">Advanced</div>
                  <div className="level-desc">Want mastery</div>
                </button>
              </div>
            </div>

            <div className="onboard-field">
              <label className="onboard-label">INTERESTS (OPTIONAL)</label>
              <input
                className="onboard-input"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. automation, data, web apps"
              />
            </div>

            {errorMsg ? <div className="onboard-error">{errorMsg}</div> : null}

            <button className="onboard-cta" type="button" onClick={handleStep2Continue} disabled={loading}>
              {loading ? "SAVING..." : "CONTINUE →"}
            </button>
          </div>
        </main>
      )}

      {step === 3 && (
        <main className="onboard-content">
          <div className="onboard-title-row">
            <div className="onboard-step-kicker">STEP 03</div>
            <h1 className="onboard-title">READY?</h1>
          </div>

          <div className="onboard-summary">
            <div className="onboard-summary-row">
              <span className="onboard-summary-key">Name</span>
              <span className="onboard-summary-val">{fullName || "-"}</span>
            </div>
            <div className="onboard-summary-row">
              <span className="onboard-summary-key">Username</span>
              <span className="onboard-summary-val">{username || "-"}</span>
            </div>
            <div className="onboard-summary-row">
              <span className="onboard-summary-key">Email</span>
              <span className="onboard-summary-val">{email || "-"}</span>
            </div>
            <div className="onboard-summary-row">
              <span className="onboard-summary-key">Goal</span>
              <span className="onboard-summary-val">{learningGoal || "-"}</span>
            </div>
            <div className="onboard-summary-row">
              <span className="onboard-summary-key">Module</span>
              <span className="onboard-summary-val">{moduleChoice}</span>
            </div>
            <div className="onboard-summary-row">
              <span className="onboard-summary-key">Level</span>
              <span className="onboard-summary-val">{levelChoice}</span>
            </div>
          </div>

          {errorMsg ? <div className="onboard-error">{errorMsg}</div> : null}

          <button className="onboard-cta" type="button" onClick={handleFinish}>
            GO TO DASHBOARD →
          </button>
        </main>
      )}
    </div>
  );
}