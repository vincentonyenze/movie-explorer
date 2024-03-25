import "./MovieGridSkeleton.css";

// Grey placeholder cards while movies load. Same grid, same card shape as
// the real thing, so nothing jumps when the movies arrive.
function MovieGridSkeleton({ count = 12 }) {
  return (
    <div role="status">
      {/* The shapes mean nothing to a screen reader: it hears this instead */}
      <span className="visually-hidden">Loading movies…</span>
      <ul className="movie-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          // Nothing will ever be reordered here, so the index is a fine key
          <li key={index} className="skeleton-card">
            <div className="skeleton-card__poster skeleton" />
            <div className="skeleton-card__body">
              <div className="skeleton skeleton-card__line" />
              <div className="skeleton skeleton-card__line skeleton-card__line--short" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MovieGridSkeleton;
