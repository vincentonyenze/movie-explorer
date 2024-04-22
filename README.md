# Movie Explorer

Browse popular movies, filter them by genre, sort them, search for any film, and open one to see its cast and trailer. Save favourites, and they're still there next time (and in sync across open tabs). It uses live data from [TMDB](https://www.themoviedb.org/), loads with skeleton placeholders, explains errors with a **Try again** button, and works fully from the keyboard. It's covered by **31 automated tests** that run against a fake TMDB.

This is **Project 16** in my beginner-to-expert web development roadmap. It rebuilds my vanilla JavaScript movie app (Project 8) in **React**, with reusable components and **custom hooks**.

<!-- Add a screenshot: save one as screenshot.png in this folder and uncomment the line below -->
<!-- ![Movie Explorer screenshot](screenshot.png) -->

## Features

- **Discover** movies by **genre** and **sort order**: Popular, Top rated, Newest, Most voted. "Top rated" ignores films with too few votes, and "Newest" only lists films already released.
- **Search as you type.** It waits until you pause, so typing "dune" sends one request, not four.
- **Load more**: adds the next 20, never showing the same movie twice, with an honest "Showing 40 of 1,117".
- **Movie details** in a dialog: it opens instantly, then loads the runtime, genres, tagline, cast and trailer in the background.
- **Favourites**: saved in your browser, checked when read back, and kept in step across open tabs.
- **Every state handled**: skeleton cards while loading, a clear message and **Try again** on errors, friendly empty states, and a "No poster" fallback.
- **Dark cinema theme**, with a light version when your system is set to light.

## Accessibility built in

- The details dialog is a real modal `<dialog>`. The page behind can't be reached, **Escape** closes it, and focus returns to the movie you opened.
- **The whole card is clickable**, but each card has **one** clear button for keyboards and screen readers (the title), plus the ♡ button.
- Toggle buttons (views, favourites) use `aria-pressed`, and the CSS styles that same attribute.
- Loading, result counts and "nothing found" are announced (`role="status"`). Errors use `role="alert"`.
- Focus never gets lost. After **Reset**, focus moves to the Genre menu, and **Load more** keeps focus while it loads (`aria-disabled`, not `disabled`).
- Ratings are read as "Rating: 8.5", not "star 8.5". Posters next to their title have empty `alt` text, so titles aren't read twice.
- Respects **reduced motion**.

## What I learned

- **`useEffect` for data fetching**, and what the dependency list really means
- **Effect cleanup**: cancelling requests with `AbortController`, clearing timers, removing event listeners
- **Why StrictMode runs effects twice** in development, and how cleanup makes that harmless
- **Race conditions**: an old, slow answer must never replace a newer one (cancelling, labelling answers, and the updater form)
- **Custom hooks**: `useFetch`, `useDebounce`, `usePagedMovies` (built on `useFetch`) and `useLocalStorage`
- **`useCallback`** and why a function's identity matters in a dependency list
- **`useRef`** for elements (focus, the dialog) and for values that never show on screen
- **Effects vs event handlers**: automatic loading in effects, clicks in handlers
- **One `status`** instead of several booleans, so impossible states stay impossible
- An **API module** with a custom error class, and why `fetch` doesn't fail on a 404
- **Vite environment variables**, and why `VITE_` values are **not secret**
- **Testing with a mocked `fetch`**, `renderHook`, fake timers, and breaking code on purpose to find gaps in the tests

## How to run

You need [Node.js](https://nodejs.org/) 22.22 or newer (24 LTS recommended). The app itself runs on 20.19+, but the test tools need 22.22+.

You also need a free TMDB **API Read Access Token**: sign up at [themoviedb.org](https://www.themoviedb.org/), then go to Settings → API.

```bash
git clone https://github.com/vincentonyenze/movie-explorer.git
cd movie-explorer
npm install
```

Copy `.env.example` to `.env.local`, and paste your token after the `=`:

```
VITE_TMDB_TOKEN=your-token-here
```

Then start it:

```bash
npm run dev
```

Open the address it prints (usually **http://localhost:5173**). If you change `.env.local`, restart `npm run dev`.

| Command | Does |
|---|---|
| `npm run dev` | runs the app while you work on it |
| `npm test` | runs the tests, and re-runs them as you save (press `q` to quit) |
| `npm run test:run` | runs the tests once |
| `npm run lint` | checks the code with oxlint (any warning fails) |
| `npm run build` | makes the finished, optimised app in `dist/` |
| `npm run preview` | serves the `dist/` build locally |

**About the token:** `.env.local` is never committed (`*.local` is in `.gitignore`). But Vite copies every `VITE_` variable **into the built JavaScript**, so anyone using a published copy of the site could read it. That's acceptable for a free, read-only TMDB token. A real secret must never be a `VITE_` variable; it belongs on a server.

## Project structure

```
src/
├── main.jsx                # Starts React and draws <App /> into #root
├── index.css               # Design tokens (dark + light), reset, layout, shared styles
├── config.js               # Reads the token from import.meta.env
├── App.jsx                 # Owns the state: view, filters, favourites, open movie
├── App.test.jsx            # Tests that use the whole app, against a fake TMDB
├── api/
│   └── tmdb.js             # The only file that talks to TMDB; TmdbError
├── hooks/
│   ├── useFetch.js         # Loading / success / error, cancelling, retry
│   ├── usePagedMovies.js   # Load more, built on useFetch
│   ├── useDebounce.js      # Waits for a pause in typing
│   └── useLocalStorage.js  # useState that remembers, synced across tabs
├── views/
│   ├── DiscoverView.jsx    # Search, filters, results, Load more
│   └── FavouritesView.jsx
├── components/
│   ├── Header.jsx          # Logo, Discover / Favourites
│   ├── SearchBar.jsx
│   ├── DiscoverFilters.jsx # Genre and sort menus
│   ├── MovieGrid.jsx       # Lays out MovieCards
│   ├── MovieCard.jsx       # The reusable card
│   ├── MovieGridSkeleton.jsx
│   ├── MovieDialog.jsx     # Details, cast and trailer in a <dialog>
│   └── StatusMessage.jsx   # Errors and empty states
├── utils/
│   ├── movie.js            # Image URLs, years, ratings, runtimes, trailers, duplicates
│   └── favourites.js       # What's saved, and checking it when read back
├── data/
│   └── sampleMovies.js     # Real TMDB movies, used by the tests
└── test/
    ├── setup.js            # Runs before each test file
    └── fakeTmdb.js         # A pretend TMDB that answers instantly
```

## Known limitations

- There are no real URLs yet: the back button doesn't close a movie or go back to a search, and you can't share a link to a movie. That needs a router (my next project).
- Genre and sort don't apply to search results, because TMDB's search can't filter by them.
- Search results only cover English titles and descriptions (`language=en-US`).
- Favourites are kept in this browser only.

## Credits

Movie data and images from [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.
