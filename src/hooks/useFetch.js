import { useEffect, useState } from "react";
import { isAbortError } from "../api/tmdb.js";

// A CUSTOM HOOK: a function whose name starts with "use" and that calls
// other hooks. It lets components share stateful logic (here: loading,
// errors, cancelling, retrying) without copying it.
//
// Each component that calls useFetch gets its OWN state: it's like
// pasting these lines into the component, but written once.
//
//   const { status, data, error, retry } = useFetch(loadPopular);
//
// fetcher(signal): a function that starts the request and returns a
// promise. It must stay the same function between renders unless you want
// a new request: define it outside the component, or wrap it in
// useCallback (Step 8). A NEW fetcher means "load this instead".

export function useFetch(fetcher) {
  // The latest answer, labelled with the fetcher that asked for it
  const [result, setResult] = useState({ fetcher: null });
  // Bumped by retry(), to run the effect again with the same fetcher
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetcher(controller.signal)
      .then((data) => setResult({ fetcher, status: "success", data }))
      .catch((error) => {
        if (isAbortError(error)) return; // cancelled below: nobody's waiting
        setResult({ fetcher, status: "error", error });
      });

    return () => controller.abort();
  }, [fetcher, attempt]);

  function retry() {
    setResult({ fetcher: null }); // forget the error: back to "loading"
    setAttempt((count) => count + 1);
  }

  // DERIVED, not stored: if the answer we have is for an OLD fetcher (the
  // search changed, say), it's not the answer to this one, so we're still
  // loading. No extra state to keep in sync, and an old answer can never
  // be shown as the new one.
  if (result.fetcher !== fetcher) {
    return { status: "loading", data: undefined, error: null, retry };
  }
  return { status: result.status, data: result.data, error: result.error ?? null, retry };
}
