import { useCallback, useEffect, useRef } from "react";
import { getMovieDetails, TmdbError } from "../api/tmdb.js";
import { useFetch } from "../hooks/useFetch.js";
import { formatRating, formatRuntime, posterUrl, releaseYear, trailerUrl } from "../utils/movie.js";
import "./MovieDialog.css";

// One movie in full, in a modal <dialog>.
//
// movie: the movie from the card. It's shown straight away; the extra
//   details (runtime, genres, cast, trailer) load in the background.
// onClose(): the dialog has closed (Escape, ✕, or a click outside)
//
// The browser's <dialog>, opened with showModal(), does the hard parts for
// free: it sits on top of everything, makes the page behind it inert (no
// clicking or tabbing into it), closes on Escape, and when it closes, puts
// focus back on the button that opened it.
function MovieDialog({ movie, isFavourite, onToggleFavourite, onClose }) {
  const dialogRef = useRef(null);

  // React puts the <dialog> on the page, closed. showModal() opens it, and
  // only works on a real element: a job for an effect, which runs once the
  // element exists. (StrictMode runs this twice: the check stops the second
  // showModal() from throwing "already open".)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
  }, []);

  // Details load only now, when someone actually opens this movie
  const loadDetails = useCallback((signal) => getMovieDetails(movie.id, { signal }), [movie.id]);
  const details = useFetch(loadDetails);

  // Always close THROUGH the dialog, never by just removing it: that's what
  // fires its "close" event and puts focus back where it was
  function close() {
    dialogRef.current.close();
  }

  // A click on the dark backdrop lands on the <dialog> itself; clicks on
  // the content land on elements inside it
  function handleClick(event) {
    if (event.target === event.currentTarget) close();
  }

  const year = releaseYear(movie.release_date);
  const rating = formatRating(movie.vote_average, movie.vote_count);
  const poster = posterUrl(movie.poster_path, "w342");
  const backdrop = posterUrl(movie.backdrop_path, "w780");
  const titleId = `movie-${movie.id}-title`;

  return (
    <dialog
      ref={dialogRef}
      className="movie-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleClick}
    >
      <div className="movie-dialog__content">
        {backdrop && <img className="movie-dialog__backdrop" src={backdrop} alt="" />}

        <button type="button" className="movie-dialog__close" onClick={close} aria-label="Close">
          <span aria-hidden="true">✕</span>
        </button>

        <div className="movie-dialog__main">
          {poster && <img className="movie-dialog__poster" src={poster} alt="" width="342" height="513" />}

          <div className="movie-dialog__info">
            <h2 id={titleId} className="movie-dialog__title">
              {movie.title}
            </h2>

            <p className="movie-dialog__facts">
              {[year, formatRuntime(details.data?.runtime), rating && `★ ${rating}`]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {details.data?.genres?.length > 0 && (
              <ul className="movie-dialog__genres" aria-label="Genres">
                {details.data.genres.map((genre) => (
                  <li key={genre.id}>{genre.name}</li>
                ))}
              </ul>
            )}

            {details.data?.tagline && <p className="movie-dialog__tagline">“{details.data.tagline}”</p>}

            <p className="movie-dialog__overview">{movie.overview || "No overview available."}</p>

            <div className="movie-dialog__actions">
              <button
                type="button"
                className="movie-dialog__button movie-dialog__button--primary"
                aria-pressed={isFavourite}
                onClick={() => onToggleFavourite(movie)}
              >
                <span aria-hidden="true">{isFavourite ? "♥" : "♡"}</span>
                {isFavourite ? "Saved" : "Save"}
              </button>

              {trailerUrl(details.data?.videos?.results) && (
                <a
                  className="movie-dialog__button"
                  href={trailerUrl(details.data.videos.results)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span aria-hidden="true">▶</span> Watch trailer
                  <span className="visually-hidden"> (opens YouTube in a new tab)</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <MovieExtras details={details} />
      </div>
    </dialog>
  );
}

// The cast, which needs the details request: loading, failed, or loaded
function MovieExtras({ details }) {
  if (details.status === "loading") {
    return (
      <div className="movie-dialog__section" role="status">
        <span className="visually-hidden">Loading cast…</span>
        <div className="movie-dialog__cast-skeleton" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="skeleton movie-dialog__skeleton-person" />
          ))}
        </div>
      </div>
    );
  }

  if (details.status === "error") {
    const message =
      details.error instanceof TmdbError ? details.error.message : "Something unexpected went wrong.";
    return (
      <div className="movie-dialog__section movie-dialog__error" role="alert">
        <p>Couldn't load the cast and trailer. {message}</p>
        <button type="button" className="movie-dialog__button" onClick={details.retry}>
          Try again
        </button>
      </div>
    );
  }

  const cast = details.data.credits?.cast?.slice(0, 10) ?? [];
  if (cast.length === 0) return null;

  return (
    <section className="movie-dialog__section" aria-labelledby="cast-heading">
      <h3 id="cast-heading" className="movie-dialog__heading">
        Cast
      </h3>
      <ul className="movie-dialog__cast">
        {cast.map((person) => (
          // The same actor can play two parts: credit_id is unique per role
          <li key={person.credit_id} className="person">
            {person.profile_path ? (
              <img
                className="person__photo"
                src={posterUrl(person.profile_path, "w185")}
                alt=""
                width="185"
                height="278"
                loading="lazy"
              />
            ) : (
              <div className="person__photo person__photo--empty" aria-hidden="true">
                👤
              </div>
            )}
            <span className="person__name">{person.name}</span>
            {person.character && <span className="person__role">{person.character}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default MovieDialog;
