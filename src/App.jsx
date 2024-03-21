import { useState } from "react";
import { hasToken } from "./config.js";
import Header from "./components/Header.jsx";
import SearchBar from "./components/SearchBar.jsx";

function App() {
  // Which page is showing. No router yet (that's Project 17): one piece of
  // state is enough to switch between two views.
  const [view, setView] = useState("discover"); // "discover" | "favourites"
  const [query, setQuery] = useState("");

  const isDiscover = view === "discover";

  return (
    <div className="app">
      <Header view={view} onViewChange={setView} favouriteCount={0} />

      <main className="page container">
        <div className="page__header">
          <div>
            <h1 className="page__title">{isDiscover ? "Popular movies" : "Your favourites"}</h1>
            <p className="page__subtitle">
              {isDiscover ? "What everyone is watching right now" : "Movies you've saved"}
            </p>
          </div>
          {isDiscover && <SearchBar value={query} onChange={setQuery} />}
        </div>

        {!hasToken ? (
          <div className="notice" role="alert">
            <strong>No TMDB token found.</strong> Copy <code>.env.example</code> to{" "}
            <code>.env.local</code>, paste your token, then restart <code>npm run dev</code>.
          </div>
        ) : (
          <div className="placeholder">
            <p>{isDiscover ? "Movies will appear here (Step 3)." : "Saved movies will appear here (Step 12)."}</p>
          </div>
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
