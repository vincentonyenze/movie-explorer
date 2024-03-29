import { useCallback } from "react";
import { getPopularMovies, searchMovies, TmdbError } from "../api/tmdb.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { useFetch } from "../hooks/useFetch.js";
import MovieGrid from "../components/MovieGrid.jsx";
import MovieGridSkeleton from "../components/MovieGridSkeleton.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

// Popular movies, or search results when there's something in the box.
//
// query: what's typed in the search box, on every key press (App owns it)
function DiscoverView({ query, favouriteIds, onToggleFavourite }) {
  // Wait for a pause in typing. Spaces at the ends don't count: "dune "
  // is the same search as "dune", so it doesn't start a new one.
  const search = useDebounce(query.trim(), 400);

  // useCallback gives back the SAME function on every render, until
  // something in its list changes. So useFetch sees a new fetcher (and
  // loads) only when the debounced search changes, not on every render.
  //
  // (Step 7 kept loadPopular outside the component instead. That works
  // when the function needs nothing from the component; this one needs
  // `search`, so it has to live inside.)
  const loadMovies = useCallback(
    (signal) => (search ? searchMovies({ query: search, signal }) : getPopularMovies({ signal })),
    [search]
  );

  // Everything from Steps 5-7 still applies: when the search changes, the
  // old request is cancelled and the skeleton shows until the new answer
  const { status, data, error, retry } = useFetch(loadMovies);

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
    return search ? (
      // role="status" so screen reader users hear that the search found nothing
      <div role="status">
        <StatusMessage icon="🔍" title={`No movies match “${search}”`}>
          Check the spelling, or try fewer words.
        </StatusMessage>
      </div>
    ) : (
      <StatusMessage icon="🍿" title="No movies here">
        TMDB didn't return any movies. Try again later.
      </StatusMessage>
    );
  }

  return (
    <>
      {search && (
        // Announced when results arrive, so screen reader users know the
        // page changed while they were typing
        <p className="results-count" role="status">
          {data.totalResults.toLocaleString()} {data.totalResults === 1 ? "movie" : "movies"} found
        </p>
      )}
      <MovieGrid movies={data.movies} favouriteIds={favouriteIds} onToggleFavourite={onToggleFavourite} />
    </>
  );
}

export default DiscoverView;
