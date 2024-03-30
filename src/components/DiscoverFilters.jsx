import { useRef } from "react";
import { SORT_OPTIONS } from "../api/tmdb.js";
import "./DiscoverFilters.css";

// Genre and sort menus. Controlled: the parent owns the values.
//
// genres: [{ id, name }] from TMDB, or [] while they load (then the menu
//   just offers "All genres")
// onChange(changes): e.g. onChange({ genreId: "35" })
function DiscoverFilters({ genres, genreId, sortBy, onChange, onReset, canReset }) {
  const genreSelect = useRef(null);

  function reset() {
    onReset();
    // The Reset button disappears once there's nothing to reset, which
    // would drop keyboard focus to the top of the page: continue from the
    // first menu instead
    genreSelect.current.focus();
  }

  return (
    <div className="filters" role="group" aria-label="Filters">
      <div className="filters__field">
        <label htmlFor="genre">Genre</label>
        <select
          ref={genreSelect}
          id="genre"
          className="select"
          value={genreId}
          onChange={(event) => onChange({ genreId: event.target.value })}
        >
          <option value="">All genres</option>
          {genres.map((genre) => (
            // <select> values are always strings, so the ids are too
            <option key={genre.id} value={String(genre.id)}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filters__field">
        <label htmlFor="sort">Sort by</label>
        <select
          id="sort"
          className="select"
          value={sortBy}
          onChange={(event) => onChange({ sortBy: event.target.value })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {canReset && (
        <button type="button" className="filters__reset" onClick={reset}>
          Reset
        </button>
      )}
    </div>
  );
}

export default DiscoverFilters;
