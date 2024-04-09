// Small helpers for showing a movie. Plain JavaScript, no React.

// TMDB gives only the end of an image's address ("/abc.jpg"). The full
// address adds a base and a size: w342 is 342px wide, enough for a card.
const IMAGE_BASE = "https://image.tmdb.org/t/p/";

export function posterUrl(path, size = "w342") {
  return path ? `${IMAGE_BASE}${size}${path}` : null;
}

// "2026-07-29" -> "2026". Unknown dates come as "" from TMDB.
export function releaseYear(date) {
  return date ? date.slice(0, 4) : "";
}

// 8.473 -> "8.5". A movie nobody has rated yet has 0 votes: show nothing,
// rather than a misleading "0.0".
export function formatRating(average, count) {
  if (!count) return "";
  return average.toFixed(1);
}

// Joins lists of movies, keeping only the FIRST of any repeated id.
// TMDB's lists shift while you browse (a movie climbs from page 2 to page
// 1 between two requests), so the same movie can arrive twice. Shown
// twice, it would also give React two items with the same key.
export function uniqueById(movies) {
  const seen = new Set();
  return movies.filter((movie) => {
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}

// 136 -> "2h 16m", 45 -> "45m". TMDB uses 0 or null when it doesn't know.
export function formatRuntime(minutes) {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
}

// The best trailer from TMDB's videos: a YouTube trailer, official ones
// first. Returns its YouTube address, or null if there isn't one.
export function trailerUrl(videos = []) {
  const trailers = videos.filter((video) => video.site === "YouTube" && video.type === "Trailer");
  const best = trailers.find((video) => video.official) ?? trailers[0];
  return best ? `https://www.youtube.com/watch?v=${best.key}` : null;
}
