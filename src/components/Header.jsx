import "./Header.css";

// The bar across the top: the logo, and the two views.
//
// view: "discover" or "favourites" (App owns it)
// onViewChange(view): asks App to switch
// favouriteCount: shown on the Favourites button
function Header({ view, onViewChange, favouriteCount }) {
  return (
    <header className="header">
      <div className="container header__inner">
        <a
          href="/"
          className="header__brand"
          onClick={(event) => {
            // No page reload: just go back to Discover
            event.preventDefault();
            onViewChange("discover");
          }}
        >
          <span className="header__logo" aria-hidden="true">
            🎬
          </span>
          Movie Explorer
        </a>

        <nav aria-label="Views">
          <ul className="header__nav">
            <li>
              <button
                type="button"
                className="header__link"
                aria-pressed={view === "discover"}
                onClick={() => onViewChange("discover")}
              >
                Discover
              </button>
            </li>
            <li>
              <button
                type="button"
                className="header__link"
                aria-pressed={view === "favourites"}
                onClick={() => onViewChange("favourites")}
              >
                Favourites
                <span className="header__count">{favouriteCount}</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
