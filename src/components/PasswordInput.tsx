import { useId, useState } from "react";

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Champ de saisie de mot de passe avec bouton "afficher / masquer" (icone oeil).
 * Le bouton est un <button type="button"> pour ne jamais soumettre le formulaire.
 * Reprend le style des inputs existants du front (classes .login-form input, etc.).
 */
export function PasswordInput(props: PasswordInputProps): JSX.Element {
  const [voir, setVoir] = useState(false);
  const generatedId = useId();
  const inputId = props.id ?? generatedId;

  return (
    <div className="password-field">
      <input {...props} id={inputId} type={voir ? "text" : "password"} className="password-field-input" />
      <button
        type="button"
        className="password-toggle"
        aria-label={voir ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={voir}
        aria-controls={inputId}
        title={voir ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        onClick={() => setVoir((prev) => !prev)}
      >
        {voir ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a20.42 20.42 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.35 20.35 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
