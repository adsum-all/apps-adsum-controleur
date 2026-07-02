import { useState } from "react";

import { ApiError, login } from "../api.js";

interface LoginProps {
  onAuth: (token: string) => void;
}

export function Login({ onAuth }: LoginProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onAuth(await login(email, password));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login-logo" aria-hidden="true">
        A
      </div>
      <div className="login-brand">ADSUM</div>
      <p className="login-sub">Contrôle des entrées, scan à la porte</p>
      <form onSubmit={submit} className="login-form">
        <label>
          <span>Courriel</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          <span>Mot de passe</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <p className="login-note">Accès réservé aux contrôleurs autorisés.</p>
    </div>
  );
}
