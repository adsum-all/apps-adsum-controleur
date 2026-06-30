import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";

import { type ControlEvent } from "../api.js";
import { findById } from "../directory.js";
import { enqueue, pendingCount, syncQueue } from "../queue.js";
import { verifyQrToken } from "../qr.js";

interface ScannerProps {
  token: string;
  event: ControlEvent;
  online: boolean;
  onQueueChange: () => void;
}

type View =
  | { kind: "scan" }
  | { kind: "valid"; membreId: string; label: string; matricule: string; qrToken: string }
  | { kind: "invalid"; reason: string }
  | { kind: "saved"; label: string };

export function Scanner({ token, event, online, onQueueChange }: ScannerProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [view, setView] = useState<View>({ kind: "scan" });
  const [camError, setCamError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (view.kind !== "scan") return;
    let stopped = false;
    const reader = new BrowserQRCodeReader();
    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (result && !stopped) {
          stopped = true;
          controlsRef.current?.stop();
          handleToken(result.getText());
        }
      })
      .then((controls) => {
        if (stopped) controls.stop();
        else controlsRef.current = controls;
      })
      .catch(() => setCamError("Camera indisponible. Utilisez la saisie du code ou le mode manuel."));
    return () => {
      stopped = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.kind]);

  function handleToken(qrToken: string): void {
    const v = verifyQrToken(qrToken);
    if (!v.valid || !v.membreId) {
      setView({ kind: "invalid", reason: v.reason ?? "QR non valide" });
      return;
    }
    const member = findById(v.membreId);
    const label = member ? `${member.prenoms ?? ""} ${member.nom ?? ""}`.trim() || member.matricule : "Membre";
    setView({
      kind: "valid",
      membreId: v.membreId,
      label,
      matricule: member?.matricule ?? v.membreId.slice(0, 8),
      qrToken,
    });
  }

  async function confirmPresence(v: Extract<View, { kind: "valid" }>): Promise<void> {
    enqueue({
      kind: "qr",
      qrToken: v.qrToken,
      evenementId: event.id,
      membreId: v.membreId,
      matricule: v.matricule,
      label: v.label,
    });
    onQueueChange();
    if (online) {
      await syncQueue(token);
      onQueueChange();
    }
    setView({ kind: "saved", label: v.label });
  }

  if (view.kind === "valid") {
    return (
      <div className="result result-valid">
        <div className="result-avatar">{initials(view.label)}</div>
        <h2>{view.label}</h2>
        <p className="result-id">{view.matricule} . VERIFIE</p>
        <p className="muted">{event.titre}</p>
        <button type="button" className="btn btn-ok" onClick={() => void confirmPresence(view)}>
          Confirmer la presence
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setView({ kind: "scan" })}>
          Refuser
        </button>
      </div>
    );
  }

  if (view.kind === "invalid") {
    return (
      <div className="result result-invalid">
        <div className="result-glyph result-bad">!</div>
        <h2>QR non valide</h2>
        <p className="muted">{view.reason}. Aucune presence enregistree.</p>
        <button type="button" className="btn btn-primary" onClick={() => setView({ kind: "scan" })}>
          Reessayer le scan
        </button>
      </div>
    );
  }

  if (view.kind === "saved") {
    return (
      <div className="result result-saved">
        <div className="result-glyph result-ok">OK</div>
        <h2>Presence enregistree</h2>
        <p className="muted">
          {view.label} . {event.titre}
        </p>
        <p className="muted small">file {pendingCount()} . {online ? "synchronisee" : "synchro differee"}</p>
        <button type="button" className="btn btn-ok" onClick={() => setView({ kind: "scan" })}>
          Scanner le suivant
        </button>
      </div>
    );
  }

  return (
    <div className="scanner">
      <div className="scanner-head">
        <span className="muted">{event.titre}</span>
        <span className={`badge ${online ? "badge-ok" : "badge-mut"}`}>
          {online ? "EN LIGNE" : "HORS-LIGNE"} . {pendingCount()} EN FILE
        </span>
      </div>
      <div className="scanner-frame">
        <video ref={videoRef} className="scanner-video" muted playsInline />
        <div className="scanner-reticle" aria-hidden="true" />
      </div>
      <p className="muted center">Visez le QR du membre</p>
      {camError && <p className="banner banner-error">{camError}</p>}
      <form
        className="scanner-manual"
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.trim()) handleToken(manual.trim());
        }}
      >
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Coller un code QR (ADSUM1...)"
          aria-label="Code QR"
        />
        <button type="submit" className="btn btn-ghost">
          Verifier
        </button>
      </form>
    </div>
  );
}

function initials(label: string): string {
  return label.slice(0, 2).toUpperCase();
}
