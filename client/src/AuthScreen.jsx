import { useState } from "react";
import { Code2, LogIn, UserPlus } from "lucide-react";
import { googleLoginUrl } from "./api.js";

function AuthScreen({ initialError, onLogin, onRegister, onRetry }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegistering = mode === "register";

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (isRegistering && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await (isRegistering ? onRegister : onLogin)({ email, password });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span className="brand-mark"><Code2 size={21} aria-hidden="true"/></span>
          <span>
            <span className="brand-name">DevPrompt</span>
            <span className="brand-sub">YOUR ENGINEERING PLAYBOOK</span>
          </span>
        </div>

        <div className="auth-heading">
          <h1 id="auth-title">{isRegistering ? "Create your account" : "Welcome back"}</h1>
          <p>{isRegistering ? "Start building your personal prompt library." : "Log in to open your prompt library."}</p>
        </div>

        {initialError && (
          <div className="auth-error" role="alert">
            <span>{initialError}</span>
            {onRetry && <button className="auth-retry" type="button" onClick={onRetry}>Retry connection</button>}
          </div>
        )}
        {error && <div className="auth-error" role="alert">{error}</div>}

        <a className="google-btn" href={googleLoginUrl}>
          <span className="google-g" aria-hidden="true">G</span>
          Continue with Google
        </a>
        <div className="auth-divider"><span>or continue with email</span></div>

        <form className="auth-form" onSubmit={submit} aria-busy={busy}>
          <label className="auth-field" htmlFor="auth-email">
            Email address
            <input
              id="auth-email"
              type="email"
              name="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="auth-field" htmlFor="auth-password">
            Password
            <input
              id="auth-password"
              type="password"
              name="password"
              autoComplete={isRegistering ? "new-password" : "current-password"}
              minLength={isRegistering ? 12 : undefined}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby={isRegistering ? "auth-password-hint" : undefined}
            />
          </label>
          {isRegistering && (
            <>
              <p id="auth-password-hint" className="auth-hint">Use at least 12 characters.</p>
              <label className="auth-field" htmlFor="auth-confirm-password">
                Confirm password
                <input
                  id="auth-confirm-password"
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>
            </>
          )}
          <button className="primary-btn auth-submit" type="submit" disabled={busy}>
            {isRegistering ? <UserPlus size={16} aria-hidden="true"/> : <LogIn size={16} aria-hidden="true"/>}
            {busy ? "Please wait..." : isRegistering ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegistering ? "Already have an account?" : "New to DevPrompt?"}{" "}
          <button
            className="auth-link"
            type="button"
            onClick={() => changeMode(isRegistering ? "login" : "register")}
          >
            {isRegistering ? "Log in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default AuthScreen;
