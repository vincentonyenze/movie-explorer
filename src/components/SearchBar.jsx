import "./SearchBar.css";

// The search box. Controlled: App owns the text (value) and gets every
// change through onChange. It doesn't search yet; that's Step 8.
function SearchBar({ value, onChange }) {
  return (
    // role="search" marks it as a landmark: screen reader users can jump
    // straight to it. Submitting does nothing (results will appear as you
    // type), so Enter must not reload the page.
    <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="search-input" className="visually-hidden">
        Search movies
      </label>
      <span className="search__icon" aria-hidden="true">
        🔍
      </span>
      <input
        id="search-input"
        type="search"
        className="search__input"
        placeholder="Search movies…"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </form>
  );
}

export default SearchBar;
