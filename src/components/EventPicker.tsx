import { type ControlEvent } from "../api.js";
import { formatTime } from "../format.js";

interface EventPickerProps {
  events: ControlEvent[];
  loading: boolean;
  error: string | null;
  onPick: (event: ControlEvent) => void;
}

export function EventPicker({ events, loading, error, onPick }: EventPickerProps): JSX.Element {
  return (
    <div className="screen">
      <h1 className="screen-title">Evenement de pointage</h1>
      <p className="screen-sub">Choisissez la session a controler.</p>
      {loading && <p className="muted">Chargement des evenements...</p>}
      {error && <p className="banner banner-error">{error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="muted">Aucun evenement ouvert ou a venir.</p>
      )}
      <ul className="list">
        {events.map((e) => (
          <li key={e.id}>
            <button type="button" className="event" onClick={() => onPick(e)}>
              <div className="event-main">
                <strong>{e.titre}</strong>
                <span className="muted">{formatTime(e.debut)}</span>
              </div>
              <div className="event-meta">
                {e.lieu && <span className="muted">{e.lieu}</span>}
                <span className={`badge ${e.session_ouverte ? "badge-ok" : "badge-mut"}`}>
                  {e.session_ouverte ? "OUVERT" : `Volet ${e.volet}`}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
