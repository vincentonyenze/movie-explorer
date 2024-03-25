import "./StatusMessage.css";

// A centred message for when there are no movies to show: an error, or an
// empty result. One component, so they all look and behave the same.
//
// tone: "error" (announced straight away, role="alert") or "info"
// action: optional { label, onClick }, e.g. "Try again"
function StatusMessage({ icon, title, children, tone = "info", action }) {
  return (
    <div className={`status-message status-message--${tone}`} role={tone === "error" ? "alert" : undefined}>
      <span className="status-message__icon" aria-hidden="true">
        {icon}
      </span>
      <h2 className="status-message__title">{title}</h2>
      {children && <p className="status-message__text">{children}</p>}
      {action && (
        <button type="button" className="status-message__button" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

export default StatusMessage;
