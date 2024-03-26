import { useEffect, useState } from "react";
import { getPopularMovies, isAbortError, TmdbError } from "../api/tmdb.js";
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
    // A controller can cancel the request it's given the signal of
    const controller = new AbortController();

    getPopularMovies({ signal: controller.signal })
      .then((page) => setResult({ status: "success", movies: page.movies, error: null }))
      .catch((error) => {
        // Cancelled on purpose by the cleanup below: nobody is waiting for
        // this answer any more, so do nothing
        if (isAbortError(error)) return;
        setResult({ status: "error", movies: [], error });
      });

    // CLEANUP: the function an effect returns. React calls it
    //   - before running the effect again (attempt changed: Try again)
    //   - when the component leaves the page (you switched to Favourites)
    // Here it cancels the request, so an old answer can never land on a
    // page that has moved on. (StrictMode in development runs every effect,
    // its cleanup, then the effect again, to check this exists.)
    return () => controller.abort();
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
