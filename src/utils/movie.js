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
