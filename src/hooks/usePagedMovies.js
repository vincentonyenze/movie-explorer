import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../api/tmdb.js";
import { uniqueById } from "../utils/movie.js";
import { useFetch } from "./useFetch.js";

// TMDB always sends 20 movies per page
const PAGE_SIZE = 20;

// A list of movies you can extend with "Load more".
//
//   const list = usePagedMovies(loadPage);
//   list.movies, list.hasMore, list.loadMore(), list.loadingMore ...
//
// loadPage(page, signal): loads one page, e.g. page 2. Same rule as
// useFetch: keep it the same function (useCallback) until the LIST itself
// should change (a new search, genre or sort), which starts again from page 1.
//
// A custom hook built from other hooks, including our own useFetch:
//   - page 1 loads automatically, in an effect (useFetch)
//   - later pages load when you click, in an event handler (loadMore)
export function usePagedMovies(loadPage) {
  // ===== Page 1 =====
  const loadFirstPage = useCallback((signal) => loadPage(1, signal), [loadPage]);
  const first = useFetch(loadFirstPage);

  // ===== Pages 2, 3, ... =====
  // Labelled with the loadPage they belong to, like useFetch: when the
  // list changes, the extra pages of the OLD list stop counting at once
  const [more, setMore] = useState({ loadPage: null, pages: [], status: "idle", error: null });
  const extra = more.loadPage === loadPage ? more : { pages: [], status: "idle", error: null };

  // The request in progress, so it can be cancelled. A ref, not state: it's
  // bookkeeping that never appears on screen.
  const controllerRef = useRef(null);

  // Cancel a "Load more" in progress when the list changes, or when the
  // component goes away. An effect with ONLY a cleanup: it starts nothing.
  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, [loadPage]);

  // Every page so far, page 1 first
  const pages = first.status === "success" ? [first.data, ...extra.pages] : [];
  const lastPage = pages.at(-1);

  async function loadMore() {
    // Ignore extra clicks while a page is already on its way
    if (!lastPage || extra.status === "loading") return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setMore({ loadPage, pages: extra.pages, status: "loading", error: null });

    try {
      const page = await loadPage(lastPage.page + 1, controller.signal);
      // The updater form: if the list changed while we waited, `current`
      // belongs to the new list, and this page must not be added to it
      setMore((current) =>
        current.loadPage === loadPage
          ? { loadPage, pages: [...current.pages, page], status: "idle", error: null }
          : current
      );
    } catch (error) {
      if (isAbortError(error)) return;
      setMore((current) =>
        current.loadPage === loadPage ? { ...current, status: "error", error } : current
      );
    }
  }

  return {
    // Page 1's status: "loading" shows the skeleton, "error" the full message
    status: first.status,
    error: first.error,
    retry: first.retry,
    movies: uniqueById(pages.flatMap((page) => page.movies)),
    // TMDB may report a million results but serves only 500 pages of 20:
    // count what can actually be reached
    totalResults: pages[0] ? Math.min(pages[0].totalResults, pages[0].totalPages * PAGE_SIZE) : 0,
    hasMore: Boolean(lastPage && lastPage.page < lastPage.totalPages),
    loadMore,
    loadingMore: extra.status === "loading",
    loadMoreError: extra.status === "error" ? extra.error : null,
  };
}
