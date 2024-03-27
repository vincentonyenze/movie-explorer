import { getPopularMovies, TmdbError } from "../api/tmdb.js";
import { useFetch } from "../hooks/useFetch.js";
import MovieGrid from "../components/MovieGrid.jsx";
import MovieGridSkeleton from "../components/MovieGridSkeleton.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

// Outside the component: created once, so it's the SAME function on every
// render, and useFetch only loads once. (Written inside the component, it
// would be a new function each render, and useFetch would load forever.)
const loadPopular = (signal) => getPopularMovies({ signal });

// Popular movies from TMDB.
function DiscoverView({ favouriteIds, onToggleFavourite }) {
  // All the loading, error, cancelling and retrying from Steps 5-6, now in
  // one line. The component is left with what's special about it: what to
  // load, and what to show.
  const { status, data, error, retry } = useFetch(loadPopular);

  if (status === "loading") return <MovieGridSkeleton />;

  if (status === "error") {
    // Our own errors have a message written for people; anything else
    // (a bug) gets a general one
    const message = error instanceof TmdbError ? error.message : "Something unexpected went wrong.";
    return (
      <StatusMessage
        tone="error"
        icon="📡"
        title="Couldn't load movies"
        action={{ label: "Try again", onClick: retry }}
      >
        {message}
      </StatusMessage>
    );
  }

  if (data.movies.length === 0) {
    return (
      <StatusMessage icon="🍿" title="No movies here">
        TMDB didn't return any movies. Try again later.
      </StatusMessage>
    );
  }

  return (
    <MovieGrid movies={data.movies} favouriteIds={favouriteIds} onToggleFavourite={onToggleFavourite} />
  );
}

export default DiscoverView;
