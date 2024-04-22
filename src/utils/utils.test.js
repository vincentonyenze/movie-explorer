import { describe, expect, it } from "vitest";
import { cleanFavourites, toFavourite } from "./favourites.js";
import { formatRating, formatRuntime, posterUrl, releaseYear, trailerUrl, uniqueById } from "./movie.js";

describe("movie helpers", () => {
  it("builds image addresses, or null with no image", () => {
    expect(posterUrl("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
    expect(posterUrl("/abc.jpg", "w780")).toBe("https://image.tmdb.org/t/p/w780/abc.jpg");
    expect(posterUrl(null)).toBeNull();
  });

  it("formats years, ratings and runtimes, with nothing for unknowns", () => {
    expect(releaseYear("2026-07-29")).toBe("2026");
    expect(releaseYear("")).toBe("");
    expect(formatRating(8.473, 120)).toBe("8.5");
    expect(formatRating(0, 0)).toBe(""); // no votes: no misleading "0.0"
    expect(formatRuntime(136)).toBe("2h 16m");
    expect(formatRuntime(45)).toBe("45m");
    expect(formatRuntime(null)).toBe("");
  });

  it("picks an official YouTube trailer first", () => {
    const videos = [
      { site: "YouTube", type: "Teaser", key: "teaser" },
      { site: "YouTube", type: "Trailer", key: "fan" },
      { site: "YouTube", type: "Trailer", official: true, key: "official" },
    ];
    expect(trailerUrl(videos)).toBe("https://www.youtube.com/watch?v=official");
    expect(trailerUrl([])).toBeNull();
  });

  it("keeps the first of any repeated movie", () => {
    const result = uniqueById([{ id: 1, n: "first" }, { id: 2 }, { id: 1, n: "repeat" }]);
    expect(result).toEqual([{ id: 1, n: "first" }, { id: 2 }]);
  });
});

describe("favourites", () => {
  it("keeps only the fields the app needs", () => {
    const saved = toFavourite({ id: 1, title: "A", popularity: 99, adult: false, poster_path: "/a.jpg" });
    expect(saved).not.toHaveProperty("popularity");
    expect(saved).toMatchObject({ id: 1, title: "A", poster_path: "/a.jpg" });
  });

  it("rejects stored data that isn't a list", () => {
    expect(() => cleanFavourites({ id: 1 })).toThrow();
  });

  it("drops what's unusable and repairs what it can", () => {
    const result = cleanFavourites([
      { id: 603, title: "The Matrix", vote_average: 8.2, vote_count: 100 },
      { id: "604", title: "String id" },
      { id: 605 },
      null,
      { id: 603, title: "Duplicate" },
      { id: 606, title: "Odd values", vote_average: "high", release_date: 1999 },
    ]);

    expect(result.map((movie) => movie.title)).toEqual(["The Matrix", "Odd values"]);
    expect(result[1]).toMatchObject({ vote_average: 0, release_date: "" });
  });
});
