import { describe, expect, it, vi } from "vitest";
import { fakeTmdb, moviePage } from "../test/fakeTmdb.js";
import { discoverMovies, getPopularMovies, isAbortError, searchMovies, TmdbError } from "./tmdb.js";

// Each test swaps the real fetch for a fake one (setup.js swaps it back)
function useFake(routes) {
  const tmdb = fakeTmdb(routes);
  vi.stubGlobal("fetch", tmdb.fetch);
  return tmdb;
}

describe("requests", () => {
  it("sends the token, and turns TMDB's page into our shape", async () => {
    const tmdb = useFake();
    const result = await getPopularMovies({ page: 1 });

    expect(tmdb.requests[0].path).toBe("/movie/popular");
    expect(tmdb.requests[0].headers.Authorization).toBe("Bearer test-token");
    expect(result).toMatchObject({ page: 1, totalPages: 1, totalResults: 4 });
    expect(result.movies).toHaveLength(4);
  });

  it("encodes search text and leaves out empty values", async () => {
    const tmdb = useFake();
    await searchMovies({ query: "the matrix & co" });
    await discoverMovies({ genreId: "" });

    expect(tmdb.requests[0].params.query).toBe("the matrix & co");
    expect(tmdb.requests[1].params).not.toHaveProperty("with_genres");
  });

  it("asks for enough votes when sorting by rating, and only released films for newest", async () => {
    const tmdb = useFake();
    await discoverMovies({ sortBy: "vote_average.desc" });
    await discoverMovies({ sortBy: "primary_release_date.desc" });

    expect(tmdb.requests[0].params["vote_count.gte"]).toBe("300");
    expect(tmdb.requests[1].params["primary_release_date.lte"]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("never claims more than TMDB's 500 pages", async () => {
    useFake({ "/movie/popular": () => moviePage([], { totalPages: 47000 }) });
    expect((await getPopularMovies()).totalPages).toBe(500);
  });
});

describe("errors", () => {
  it.each([
    [401, "TMDB rejected the token"],
    [404, "couldn't find"],
    [429, "Too many requests"],
    [503, "having problems"],
  ])("explains a %i", async (status, message) => {
    useFake({ "/movie/popular": () => new Response("{}", { status }) });

    const error = await getPopularMovies().catch((caught) => caught);
    expect(error).toBeInstanceOf(TmdbError);
    expect(error.status).toBe(status);
    expect(error.message).toContain(message);
  });

  it("explains a request that never got an answer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const error = await getPopularMovies().catch((caught) => caught);
    expect(error).toBeInstanceOf(TmdbError);
    expect(error.message).toContain("Can't reach TMDB");
  });

  it("passes a cancelled request through untouched", async () => {
    useFake();
    const controller = new AbortController();
    controller.abort();

    const error = await getPopularMovies({ signal: controller.signal }).catch((caught) => caught);
    expect(isAbortError(error)).toBe(true);
    expect(error).not.toBeInstanceOf(TmdbError);
  });
});
