import MovieCard from "./MovieCard.jsx";
import "./MovieGrid.css";

// A responsive grid of movie cards. It doesn't care where the movies came
// from either: give it a list and it lays them out.
//
// favouriteIds: a Set of saved movie ids, so each card can be checked
// quickly (set.has(id)) instead of searching the whole favourites list
function MovieGrid({ movies, favouriteIds, onToggleFavourite }) {
  return (
    <ul className="movie-grid">
      {movies.map((movie) => (
        // TMDB's id is stable and unique: the perfect key
        <li key={movie.id}>
          <MovieCard
            movie={movie}
            isFavourite={favouriteIds.has(movie.id)}
            onToggleFavourite={onToggleFavourite}
          />
        </li>
      ))}
    </ul>
  );
}

export default MovieGrid;
