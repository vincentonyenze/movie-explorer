import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import { sampleMovies } from "./data/sampleMovies.js";
import { fakeTmdb, moviePage } from "./test/fakeTmdb.js";

// The whole app, used like a person would, against a fake TMDB.
// "findBy..." queries WAIT (up to a second) for something to appear: that's
// how tests handle loading, debouncing and anything else asynchronous.

function renderApp(routes) {
  const tmdb = fakeTmdb(routes);
  vi.stubGlobal("fetch", tmdb.fetch);
  const user = userEvent.setup();
  const view = render(<App />);
  return { tmdb, user, ...view };
}

// The titles of the movie cards on screen, in order
function cardTitles() {
  return screen.queryAllByRole("article").map((card) => within(card).getByRole("heading").textContent);
}

function requestsTo(tmdb, path) {
  return tmdb.requests.filter((request) => request.path === path);
}

describe("browsing", () => {
  it("shows a skeleton, then the movies", async () => {
    renderApp();

    expect(screen.getByRole("status")).toHaveTextContent("Loading movies…");
    expect(await screen.findByRole("heading", { name: "Spider-Man: Brand New Day" })).toBeInTheDocument();
    expect(cardTitles()).toHaveLength(4);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Popular movies");
  });

  it("explains an error, and tries again", async () => {
    let calls = 0;
    const { user } = renderApp({
      "/discover/movie": () => (++calls === 1 ? new Response("{}", { status: 503 }) : moviePage(sampleMovies.slice(0, 2))),
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("TMDB is having problems");
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "Hope" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("filters by genre", async () => {
    const { tmdb, user } = renderApp();
    await screen.findAllByRole("article");

    // The genre list loads separately: wait for Comedy to be in the menu
    await screen.findByRole("option", { name: "Comedy" });
    await user.selectOptions(screen.getByLabelText("Genre"), "Comedy");

    await waitFor(() => expect(requestsTo(tmdb, "/discover/movie").at(-1).params.with_genres).toBe("35"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Popular comedy movies");
  });

  it("cancels the old request when the genre changes mid-load", async () => {
    const { tmdb, user } = renderApp({
      // All genres: slow (never answers during this test). Comedy: instant.
      "/discover/movie": ({ with_genres }) =>
        with_genres === "35" ? moviePage(sampleMovies.slice(5, 6)) : new Promise(() => {}),
    });
    await screen.findByRole("option", { name: "Comedy" });

    await user.selectOptions(screen.getByLabelText("Genre"), "Comedy");

    expect(await screen.findAllByRole("article")).toHaveLength(1);
    const [allGenres, comedy] = requestsTo(tmdb, "/discover/movie");
    expect(allGenres.signal.aborted).toBe(true); // the effect's cleanup did this
    expect(comedy.signal.aborted).toBe(false);
  });

  it("loads more, without repeating a movie", async () => {
    const { tmdb, user } = renderApp({
      // Page 2 starts with the last movie of page 1, like TMDB really does
      "/discover/movie": ({ page }) =>
        page === "1"
          ? moviePage(sampleMovies.slice(0, 4), { page: 1, totalPages: 2, totalResults: 8 })
          : moviePage(sampleMovies.slice(3, 7), { page: 2, totalPages: 2, totalResults: 8 }),
    });
    await screen.findAllByRole("article");
    expect(screen.getByText("Showing 4 of 8")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("That's all 7")).toBeInTheDocument();
    expect(cardTitles()).toHaveLength(7);
    expect(new Set(cardTitles()).size).toBe(7);
    expect(requestsTo(tmdb, "/discover/movie").map((request) => request.params.page)).toEqual(["1", "2"]);
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });
});

describe("searching", () => {
  it("searches once, after you stop typing", async () => {
    const { tmdb, user } = renderApp();
    await screen.findAllByRole("article");

    await user.type(screen.getByRole("searchbox", { name: "Search movies" }), "spider");

    expect(await screen.findByText("1 movie found")).toBeInTheDocument();
    expect(cardTitles()).toEqual(["Spider-Man: Brand New Day"]);
    // Six key presses, ONE request: the debounce at work
    expect(requestsTo(tmdb, "/search/movie").map((request) => request.params.query)).toEqual(["spider"]);
    // Genre and sort don't apply to search, so they're hidden
    expect(screen.queryByLabelText("Genre")).not.toBeInTheDocument();
  });

  it("says when nothing matches", async () => {
    const { user } = renderApp();
    await screen.findAllByRole("article");

    await user.type(screen.getByRole("searchbox", { name: "Search movies" }), "qwxz");

    expect(await screen.findByText("No movies match “qwxz”")).toBeInTheDocument();
  });
});

describe("details", () => {
  it("opens a movie, loads its cast, and closes", async () => {
    const { user } = renderApp();

    await user.click(await screen.findByRole("button", { name: "Hope" }));

    const dialog = screen.getByRole("dialog", { name: "Hope" });
    // Shown straight away, from the card's data
    const hope = sampleMovies.find((movie) => movie.title === "Hope");
    expect(within(dialog).getByText(hope.overview)).toBeInTheDocument();
    // Loaded in the background
    expect(await within(dialog).findByText("Test Actor")).toBeInTheDocument();
    expect(within(dialog).getByText(/2h 16m/)).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /watch trailer/i })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=abc123"
    );

    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("favourites", () => {
  it("saves a movie, shows it in Favourites, and remembers it after a reload", async () => {
    const { user, unmount } = renderApp();

    await user.click(await screen.findByRole("button", { name: "Save Hope" }));
    expect(screen.getByRole("button", { name: "Save Hope" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /favourites/i }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your favourites");
    expect(cardTitles()).toEqual(["Hope"]);

    // "Reload": a brand-new app, with localStorage kept
    unmount();
    renderApp();
    expect(screen.getByRole("button", { name: /favourites/i })).toHaveTextContent("1");
  });
});
