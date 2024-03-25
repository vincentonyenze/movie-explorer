import { useEffect, useState } from "react";
import { getPopularMovies, TmdbError } from "../api/tmdb.js";
import MovieGrid from "../components/MovieGrid.jsx";
import MovieGridSkeleton from "../components/MovieGridSkeleton.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

// The starting state: nothing loaded yet, so we're loading
const LOADING = { status: "loading", movies: [], error: null };

// Popular movies from TMDB.
function DiscoverView({ favouriteIds, onToggleFavourite }) {
  // ONE `status` instead of separate isLoading / hasError booleans. With
  // booleans, "loading AND error at the same time" is possible by mistake;
  // with a status, the page is always in exactly one state.
  const [result, setResult] = useState(LOADING);
  // Bumped by "Try again". It's in the effect's dependency list, so
  // changing it makes the effect run again.
  const [attempt, setAttempt] = useState(0);

  // EFFECTS run AFTER React has put the page on screen. Fetching here means
  // the skeleton shows immediately, and the movies replace it when they
  // arrive.
  //
  // The list at the end says WHEN to run it again: after the first render,
  // then whenever `attempt` changes. An empty list [] would mean "only
  // once"; no list at all would mean "after EVERY render", which, with a
  // setResult inside, would loop forever.
  useEffect(() => {
    getPopularMovies()
      .then((page) => setResult({ status: "success", movies: page.movies, error: null }))
      .catch((error) => setResult({ status: "error", movies: [], error }));
    // ⚠ Something is still missing here: nothing happens if this component
    // goes away before the answer arrives. That's Step 6.
  }, [attempt]);

  function retry() {
    // Showing the skeleton is part of the CLICK, so it happens here, in the
    // event handler, not in the effect
    setResult(LOADING);
    setAttempt((count) => count + 1);
  }

  if (result.status === "loading") return <MovieGridSkeleton />;

  if (result.status === "error") {
    // Our own errors have a message written for people; anything else
    // (a bug) gets a general one
    const message =
      result.error instanceof TmdbError ? result.error.message : "Something unexpected went wrong.";
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

  if (result.movies.length === 0) {
    return (
      <StatusMessage icon="🍿" title="No movies here">
        TMDB didn't return any movies. Try again later.
      </StatusMessage>
    );
  }

  return (
    <MovieGrid
      movies={result.movies}
      favouriteIds={favouriteIds}
      onToggleFavourite={onToggleFavourite}
    />
  );
}

export default DiscoverView;
