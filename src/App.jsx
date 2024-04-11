import { useState } from "react";
import { DEFAULT_SORT } from "./api/tmdb.js";
import { hasToken } from "./config.js";
import Header from "./components/Header.jsx";
import MovieDialog from "./components/MovieDialog.jsx";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { cleanFavourites, FAVOURITES_KEY, NO_FAVOURITES, toFavourite } from "./utils/favourites.js";
import DiscoverView from "./views/DiscoverView.jsx";
import FavouritesView from "./views/FavouritesView.jsx";

// What Discover starts with, and goes back to on Reset
const DEFAULT_FILTERS = { query: "", genreId: "", sortBy: DEFAULT_SORT };

function App() {
  // Which page is showing. No router yet (that's Project 17): one piece of
  // state is enough to switch between two views.
  const [view, setView] = useState("discover"); // "discover" | "favourites"
  // Everything that decides what Discover shows, in one object. It lives
  // here, not in DiscoverView, so your search and filters are still there
  // after a visit to Favourites.
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  // Saved movies, newest first. Whole movie objects, not just ids, so the
  // Favourites view can show them without asking the API again. Swapping
  // useState for useLocalStorage is all it took to make them last: the
  // rest of the app doesn't know or care where they're kept.
  const [favourites, setFavourites] = useLocalStorage(FAVOURITES_KEY, NO_FAVOURITES, cleanFavourites);
  // The movie whose details are open, or null. Lives here, above both
  // views, because a movie can be opened from either.
  const [selectedMovie, setSelectedMovie] = useState(null);

  // Derived: a Set of saved ids, so every card can check "is this saved?"
  // with one quick has(), instead of searching the list each time
  const favouriteIds = new Set(favourites.map((movie) => movie.id));

  function updateFilters(changes) {
    // Keep the other filters, replace only the ones that changed
    setFilters((current) => ({ ...current, ...changes }));
  }

  function resetFilters() {
    // Reset the menus, but keep whatever is in the search box
    setFilters((current) => ({ ...DEFAULT_FILTERS, query: current.query }));
  }

  function toggleFavourite(movie) {
    setFavourites((current) =>
      current.some((saved) => saved.id === movie.id)
        ? current.filter((saved) => saved.id !== movie.id)
        : [toFavourite(movie), ...current]
    );
  }

  return (
    <div className="app">
      <Header view={view} onViewChange={setView} favouriteCount={favourites.length} />

      <main className="page container">
        {!hasToken ? (
          <>
            <h1 className="page__title">Almost ready</h1>
            <div className="notice" role="alert">
              <strong>No TMDB token found.</strong> Copy <code>.env.example</code> to{" "}
              <code>.env.local</code>, paste your token, then restart <code>npm run dev</code>.
            </div>
          </>
        ) : view === "discover" ? (
          <DiscoverView
            filters={filters}
            onFiltersChange={updateFilters}
            onResetFilters={resetFilters}
            favouriteIds={favouriteIds}
            onToggleFavourite={toggleFavourite}
            onSelect={setSelectedMovie}
          />
        ) : (
          <FavouritesView
            favourites={favourites}
            favouriteIds={favouriteIds}
            onToggleFavourite={toggleFavourite}
            onSelect={setSelectedMovie}
          />
        )}
      </main>

      {/* Only on the page while a movie is open. key: a different movie is
          a fresh dialog with fresh state, never the last one's leftovers. */}
      {selectedMovie && (
        <MovieDialog
          key={selectedMovie.id}
          movie={selectedMovie}
          isFavourite={favouriteIds.has(selectedMovie.id)}
          onToggleFavourite={toggleFavourite}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      <footer className="footer">
        <div className="container">
          Movie data and images from <a href="https://www.themoviedb.org/">TMDB</a>. This product uses
          the TMDB API but is not endorsed or certified by TMDB.
        </div>
      </footer>
    </div>
  );
}

export default App;
