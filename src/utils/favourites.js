// Saving favourites: what's kept, and checking it when it's read back.
// Plain JavaScript, no React.

export const FAVOURITES_KEY = "movie-explorer.favourites.v1";

// The empty list. One shared array, defined once: useLocalStorage needs
// the SAME fallback on every render (a new [] each time would count as a
// change and re-run its effect).
export const NO_FAVOURITES = [];

// Only what a card and the dialog need. TMDB's movies carry more (like
// popularity, which changes daily and would go stale anyway).
const FIELDS = [
  "id",
  "title",
  "overview",
  "poster_path",
  "backdrop_path",
  "release_date",
  "vote_average",
  "vote_count",
];

export function toFavourite(movie) {
  return Object.fromEntries(FIELDS.map((field) => [field, movie[field] ?? null]));
}

// What's read back from storage -> a clean list of favourites.
// Anything unusable is dropped, never allowed to crash the page.
export function cleanFavourites(value) {
  if (!Array.isArray(value)) throw new Error("Favourites should be a list");

  const seen = new Set();
  const clean = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    if (!Number.isInteger(item.id) || typeof item.title !== "string" || item.title === "") continue;
    if (seen.has(item.id)) continue; // the same movie twice would repeat a React key
    seen.add(item.id);
    clean.push({
      ...toFavourite(item),
      overview: typeof item.overview === "string" ? item.overview : "",
      release_date: typeof item.release_date === "string" ? item.release_date : "",
      vote_average: Number.isFinite(item.vote_average) ? item.vote_average : 0,
      vote_count: Number.isFinite(item.vote_count) ? item.vote_count : 0,
    });
  }
  return clean;
}
