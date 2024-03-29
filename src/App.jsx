import { useState } from "react";
import { hasToken } from "./config.js";
import Header from "./components/Header.jsx";
import SearchBar from "./components/SearchBar.jsx";
import DiscoverView from "./views/DiscoverView.jsx";
import FavouritesView from "./views/FavouritesView.jsx";

function App() {
  // Which page is showing. No router yet (that's Project 17): one piece of
  // state is enough to switch between two views.
  const [view, setView] = useState("discover"); // "discover" | "favourites"
  const [query, setQuery] = useState("");
  // Saved movies, newest first. Whole movie objects, not just ids, so the
  // Favourites view can show them without asking the API again.
  // (Only in memory for now: saving them comes in Step 12.)
  const [favourites, setFavourites] = useState([]);

  const isDiscover = view === "discover";
  const searchText = query.trim();

  // Derived: a Set of saved ids, so every card can check "is this saved?"
  // with one quick has(), instead of searching the list each time
  const favouriteIds = new Set(favourites.map((movie) => movie.id));

  function toggleFavourite(movie) {
    setFavourites((current) =>
      current.some((saved) => saved.id === movie.id)
        ? current.filter((saved) => saved.id !== movie.id)
        : [movie, ...current]
    );
  }

  return (
    <div className="app">
      <Header view={view} onViewChange={setView} favouriteCount={favourites.length} />

      <main className="page container">
        <div className="page__header">
          <div>
            <h1 className="page__title">
              {!isDiscover ? "Your favourites" : searchText ? "Search results" : "Popular movies"}
            </h1>
            <p className="page__subtitle">
              {!isDiscover
                ? "Movies you've saved"
                : searchText
                  ? `Movies matching “${searchText}”`
                  : "What everyone is watching right now"}
            </p>
          </div>
          {isDiscover && <SearchBar value={query} onChange={setQuery} />}
        </div>

        {!hasToken ? (
          <div className="notice" role="alert">
            <strong>No TMDB token found.</strong> Copy <code>.env.example</code> to{" "}
            <code>.env.local</code>, paste your token, then restart <code>npm run dev</code>.
          </div>
        ) : isDiscover ? (
          <DiscoverView query={query} favouriteIds={favouriteIds} onToggleFavourite={toggleFavourite} />
        ) : (
          <FavouritesView
            favourites={favourites}
            favouriteIds={favouriteIds}
            onToggleFavourite={toggleFavourite}
          />
        )}
      </main>

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
