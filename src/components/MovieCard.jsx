import { useState } from "react";
import { formatRating, posterUrl, releaseYear } from "../utils/movie.js";
import "./MovieCard.css";

// One movie: poster, title, year, rating, and a favourite button.
//
// It only SHOWS a movie. It doesn't know where the movie came from (the
// API, favourites, sample data), which is what makes it reusable: the
// Discover grid, search results and favourites all use this same card.
//
// movie: a movie in TMDB's shape ({ id, title, poster_path, ... })
// isFavourite: whether it's saved
// onToggleFavourite(movie): asks the parent to save or unsave it
// onSelect(movie): asks the parent to show its details
function MovieCard({ movie, isFavourite, onToggleFavourite, onSelect }) {
  // If the poster fails to load (a broken link, or offline), show the
  // fallback instead of the browser's broken-image icon
  const [imageFailed, setImageFailed] = useState(false);

  const src = posterUrl(movie.poster_path);
  const year = releaseYear(movie.release_date);
  const rating = formatRating(movie.vote_average, movie.vote_count);

  return (
    <article className="movie-card">
      <div className="movie-card__poster">
        {src && !imageFailed ? (
          <img
            src={src}
            // The title is right below, so a screen reader would hear it
            // twice: an empty alt marks the image as decoration
            alt=""
            // Reserves the space before the image arrives, so the page
            // doesn't jump around while posters load
            width="342"
            height="513"
            // Only downloads posters that are on (or near) the screen
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="movie-card__no-poster" aria-hidden="true">
            <span>🎬</span>
            No poster
          </div>
        )}

        {rating && (
          <span className="movie-card__rating">
            <span aria-hidden="true">★</span>
            <span className="visually-hidden">Rating:</span> {rating}
          </span>
        )}

        <button
          type="button"
          className="movie-card__favourite"
          // aria-pressed: "Save Hope, toggle button, pressed"
          aria-pressed={isFavourite}
          aria-label={`Save ${movie.title}`}
          title={isFavourite ? "Remove from favourites" : "Add to favourites"}
          onClick={() => onToggleFavourite(movie)}
        >
          <span aria-hidden="true">{isFavourite ? "♥" : "♡"}</span>
        </button>
      </div>

      <div className="movie-card__body">
        {/* The title is the button that opens the details. Its ::after (in
            the CSS) stretches over the whole card, so clicking anywhere on
            the card works, while the page still has ONE clear button per
            movie for keyboards and screen readers. */}
        <h3 className="movie-card__title">
          <button type="button" className="movie-card__open" onClick={() => onSelect(movie)}>
            <span className="movie-card__title-text">{movie.title}</span>
          </button>
        </h3>
        {year && <p className="movie-card__year">{year}</p>}
      </div>
    </article>
  );
}

export default MovieCard;
