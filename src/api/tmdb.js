// Everything about talking to TMDB, in one place.
//
// Components never call fetch() themselves: they call these functions and
// get back clean data, or a TmdbError with a message a person can read.
// If TMDB changes something, or we switch to another movie API, only this
// file changes.
//
// Every function takes an optional `signal` (from an AbortController), so
// a request that's no longer needed can be cancelled. That's Step 6.

import { TMDB_TOKEN } from "../config.js";

const API_BASE = "https://api.themoviedb.org/3";

// TMDB never returns more than 500 pages, whatever total_pages says
const MAX_PAGES = 500;

// An error the page can show as-is. `status` is the HTTP status (0 when
// the request never reached TMDB).
export class TmdbError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
  }
}

// True when a request was cancelled on purpose (controller.abort()).
// That's not a failure, so there's nothing to show the user.
export function isAbortError(error) {
  return error?.name === "AbortError";
}

// A friendly message for each kind of failure
function messageFor(status) {
  if (status === 401) return "TMDB rejected the token. Check VITE_TMDB_TOKEN in .env.local.";
  if (status === 404) return "TMDB couldn't find that.";
  if (status === 429) return "Too many requests. Wait a moment and try again.";
  if (status >= 500) return "TMDB is having problems right now. Try again soon.";
  return `Something went wrong (error ${status}).`;
}

// The one place fetch() is called.
//   path: "/movie/popular"
//   params: { page: 2, query: "dune" }, turned into ?page=2&query=dune
export async function tmdbFetch(path, params = {}, { signal } = {}) {
  if (!TMDB_TOKEN) {
    throw new TmdbError("No TMDB token. Add VITE_TMDB_TOKEN to .env.local.");
  }

  // URLSearchParams handles the encoding: "the matrix & co" -> the+matrix+%26+co
  const query = new URLSearchParams({ language: "en-US" });
  for (const [key, value] of Object.entries(params)) {
    // Leave out empty values, so callers can pass { genre: "" } safely
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}?${query}`, {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        Accept: "application/json",
      },
      signal,
    });
  } catch (error) {
    // A cancelled request isn't a failure: pass it on untouched, so the
    // caller can recognise it (error.name === "AbortError") and ignore it
    if (isAbortError(error)) throw error;
    // fetch() only throws when the request never got an answer: offline,
    // DNS failure, blocked. (A 404 or 500 IS an answer, see below.)
    throw new TmdbError("Can't reach TMDB. Check your internet connection.");
  }

  // fetch() is happy with ANY answer, even "500 server error", so checking
  // response.ok (status 200-299) is our job
  if (!response.ok) throw new TmdbError(messageFor(response.status), response.status);

  return response.json();
}

// TMDB's lists look like { page, results, total_pages, total_results }.
// Turn that into names that read well in our code.
function toMoviePage(data) {
  return {
    movies: data.results,
    page: data.page,
    totalPages: Math.min(data.total_pages, MAX_PAGES),
    totalResults: data.total_results,
  };
}

// ===== The functions components use =====

export async function getPopularMovies({ page = 1, signal } = {}) {
  return toMoviePage(await tmdbFetch("/movie/popular", { page }, { signal }));
}

export async function searchMovies({ query, page = 1, signal } = {}) {
  const data = await tmdbFetch("/search/movie", { query, page, include_adult: false }, { signal });
  return toMoviePage(data);
}

// Browse with filters: a genre and/or a sort order
//   sortBy: TMDB's names, e.g. "popularity.desc", "vote_average.desc"
export async function discoverMovies({ genreId, sortBy = "popularity.desc", page = 1, signal } = {}) {
  const params = {
    with_genres: genreId,
    sort_by: sortBy,
    page,
    include_adult: false,
    // Without this, "highest rated" is full of films with 1 vote of 10/10
    "vote_count.gte": sortBy.startsWith("vote_average") ? 300 : undefined,
  };
  return toMoviePage(await tmdbFetch("/discover/movie", params, { signal }));
}

// [{ id: 28, name: "Action" }, ...]
export async function getGenres({ signal } = {}) {
  const data = await tmdbFetch("/genre/movie/list", {}, { signal });
  return data.genres;
}

// One movie in full, with its cast and videos in the SAME request
// (append_to_response saves two extra round trips)
export async function getMovieDetails(id, { signal } = {}) {
  return tmdbFetch(`/movie/${id}`, { append_to_response: "credits,videos" }, { signal });
}
