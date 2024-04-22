// A pretend TMDB for tests. It answers instantly with the sample movies,
// records every request, and can be told to fail.
//
//   const tmdb = fakeTmdb();
//   vi.stubGlobal("fetch", tmdb.fetch);   // the app's fetch() now lands here
//   ...
//   tmdb.requests  -> [{ path: "/movie/popular", params: { page: "1", ... } }]
//
// Tests never touch the network: they're fast, work offline, need no
// token, and give the same answers every time.

import { vi } from "vitest";
import { sampleMovies } from "../data/sampleMovies.js";

export const GENRES = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 27, name: "Horror" },
];

// A page of results in TMDB's own shape
export function moviePage(movies, { page = 1, totalPages = 1, totalResults = movies.length } = {}) {
  return { page, results: movies, total_pages: totalPages, total_results: totalResults };
}

export function movieDetails(movie) {
  return {
    ...movie,
    runtime: 136,
    tagline: "A test tagline.",
    genres: [{ id: 28, name: "Action" }],
    credits: {
      cast: [
        { credit_id: "c1", name: "Test Actor", character: "Hero", profile_path: null },
        { credit_id: "c2", name: "Other Actor", character: "Villain", profile_path: null },
      ],
    },
    videos: { results: [{ site: "YouTube", type: "Trailer", official: true, key: "abc123" }] },
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// routes: optional overrides, e.g. { "/search/movie": (params) => moviePage([]) }.
// A route may return a Response (to send an error status) or throw.
export function fakeTmdb(routes = {}) {
  const requests = [];

  const defaults = {
    "/movie/popular": () => moviePage(sampleMovies.slice(0, 4)),
    "/discover/movie": () => moviePage(sampleMovies.slice(0, 4)),
    "/search/movie": (params) =>
      moviePage(sampleMovies.filter((movie) => movie.title.toLowerCase().includes(params.query.toLowerCase()))),
    "/genre/movie/list": () => ({ genres: GENRES }),
  };

  const fetch = vi.fn(async (url, options = {}) => {
    // Behave like real fetch: a cancelled request rejects with AbortError
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const { pathname, searchParams } = new URL(url);
    const path = pathname.replace(/^\/3/, "");
    const params = Object.fromEntries(searchParams);
    // signal kept, so a test can check whether a request was cancelled
    requests.push({ path, params, headers: options.headers, signal: options.signal });

    const route =
      routes[path] ??
      defaults[path] ??
      // /movie/603 -> details for that sample movie
      (path.startsWith("/movie/")
        ? () => {
            const movie = sampleMovies.find((sample) => String(sample.id) === path.split("/")[2]);
            return movie ? movieDetails(movie) : json({}, 404);
          }
        : null);
    if (!route) return json({}, 404);

    const result = await route(params);
    return result instanceof Response ? result : json(result);
  });

  return { fetch, requests };
}
