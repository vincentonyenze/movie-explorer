import { useCallback } from "react";
import { discoverMovies, getGenres, searchMovies, SORT_OPTIONS, TmdbError } from "../api/tmdb.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { useFetch } from "../hooks/useFetch.js";
import { usePagedMovies } from "../hooks/usePagedMovies.js";
import DiscoverFilters from "../components/DiscoverFilters.jsx";
import MovieGrid from "../components/MovieGrid.jsx";
import MovieGridSkeleton from "../components/MovieGridSkeleton.jsx";
import SearchBar from "../components/SearchBar.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

// The genre list never changes while the app runs: a fixed fetcher,
// defined outside the component (Step 7)
const loadGenres = (signal) => getGenres({ signal });

// Browse movies by genre and sort order, or search them.
//
// filters: { query, genreId, sortBy }. App owns them, so they survive a
//   visit to Favourites.
// onFiltersChange(changes): e.g. onFiltersChange({ sortBy: "vote_average.desc" })
// onResetFilters(): back to all genres, popular first
function DiscoverView({ filters, onFiltersChange, onResetFilters, favouriteIds, onToggleFavourite }) {
  const { query, genreId, sortBy } = filters;
  const searchText = query.trim(); // what's typed now, for the heading
  const search = useDebounce(searchText, 400); // what we search for, after a pause

  // Two separate requests, each with its own loading state: the genre list
  // loading (or failing) never holds up the movies, and the other way round
  const genres = useFetch(loadGenres);

  // Loads ONE page of the current list. It depends on THREE values, all in
  // the list: change any of them and it's a new list, starting again from
  // page 1. Forget one, and changing it would quietly do nothing; the
  // exhaustive-deps lint rule catches that.
  const loadPage = useCallback(
    (page, signal) =>
      search
        ? searchMovies({ query: search, page, signal }) // search can't filter or sort
        : discoverMovies({ genreId, sortBy, page, signal }),
    [search, genreId, sortBy]
  );
  const movies = usePagedMovies(loadPage);

  // ===== The heading: "Top rated comedy movies" =====
  const genreList = genres.data ?? [];
  const genreName = genreList.find((genre) => String(genre.id) === genreId)?.name;
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? "Popular";
  const title = searchText
    ? "Search results"
    : `${sortLabel} ${genreName ? genreName.toLowerCase() + " " : ""}movies`;
  const subtitle = searchText ? `Movies matching “${searchText}”` : "Browse by genre, or search for any movie";

  return (
    <>
      <div className="page__header">
        <div>
          <h1 className="page__title">{title}</h1>
          <p className="page__subtitle">{subtitle}</p>
        </div>
        <SearchBar value={query} onChange={(value) => onFiltersChange({ query: value })} />
      </div>

      {/* Search ignores genre and sort (TMDB's /search can't do them), so
          the menus step aside rather than pretend to work */}
      {searchText ? null : (
        <DiscoverFilters
          genres={genreList}
          genreId={genreId}
          sortBy={sortBy}
          onChange={onFiltersChange}
          onReset={onResetFilters}
          canReset={genreId !== "" || sortBy !== SORT_OPTIONS[0].value}
        />
      )}

      <MovieResults
        result={movies}
        search={search}
        favouriteIds={favouriteIds}
        onToggleFavourite={onToggleFavourite}
      />
    </>
  );
}

// "Can't reach TMDB..." for our own errors, a general message for bugs
function errorMessage(error) {
  return error instanceof TmdbError ? error.message : "Something unexpected went wrong.";
}

// The part under the heading: skeleton, error, nothing found, or the grid
function MovieResults({ result, search, favouriteIds, onToggleFavourite }) {
  const { status, error, retry, movies, totalResults } = result;

  if (status === "loading") return <MovieGridSkeleton />;

  if (status === "error") {
    return (
      <StatusMessage
        tone="error"
        icon="📡"
        title="Couldn't load movies"
        action={{ label: "Try again", onClick: retry }}
      >
        {errorMessage(error)}
      </StatusMessage>
    );
  }

  if (movies.length === 0) {
    return (
      // role="status" so screen reader users hear that nothing was found
      <div role="status">
        {search ? (
          <StatusMessage icon="🔍" title={`No movies match “${search}”`}>
            Check the spelling, or try fewer words.
          </StatusMessage>
        ) : (
          <StatusMessage icon="🍿" title="No movies here">
            Nothing matches these filters. Try another genre.
          </StatusMessage>
        )}
      </div>
    );
  }

  return (
    <>
      {search && (
        // Announced when results arrive, so screen reader users know the
        // page changed while they were typing
        <p className="results-count" role="status">
          {totalResults.toLocaleString()} {totalResults === 1 ? "movie" : "movies"} found
        </p>
      )}
      <MovieGrid movies={movies} favouriteIds={favouriteIds} onToggleFavourite={onToggleFavourite} />
      <LoadMore result={result} />
    </>
  );
}

// "Showing 40 of 1,117" and the Load more button
function LoadMore({ result }) {
  const { movies, totalResults, hasMore, loadMore, loadingMore, loadMoreError } = result;

  return (
    <div className="load-more">
      {/* role="status": "Showing 40 of 1,117" is read out when more arrive */}
      <p className="load-more__count" role="status">
        {hasMore
          ? `Showing ${movies.length.toLocaleString()} of ${totalResults.toLocaleString()}`
          : `That's all ${movies.length.toLocaleString()}`}
      </p>

      {loadMoreError && (
        <p className="load-more__error" role="alert">
          {errorMessage(loadMoreError)}
        </p>
      )}

      {hasMore && (
        <button
          type="button"
          className="load-more__button"
          onClick={loadMore}
          // aria-disabled instead of disabled: a disabled button loses
          // keyboard focus, and you'd have to find your place again.
          // loadMore() already ignores clicks while loading.
          aria-disabled={loadingMore}
        >
          {loadingMore ? "Loading…" : loadMoreError ? "Try again" : "Load more"}
        </button>
      )}
    </div>
  );
}

export default DiscoverView;
