import { useEffect, useState } from "react";

// Like useState, but the value is kept in localStorage: it's still there
// after a refresh, and stays in step across open tabs.
//
//   const [favourites, setFavourites] = useLocalStorage(KEY, [], cleanFavourites);
//
// key: where it's stored
// fallback: the value when nothing (usable) is stored
// clean(value): checks what was read back and returns a safe version, or
//   throws if it's unusable. Stored data is untrusted: an old version of
//   the app, a hand edit in DevTools, or a half-written file (P15, Step 10).
//
// ⚠ fallback and clean must stay the same between renders (define them
// outside the component): they're in an effect's dependency list.

function read(key, fallback, clean) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : clean(JSON.parse(raw));
  } catch {
    // Blocked storage, broken JSON, or clean() said no
    return fallback;
  }
}

export function useLocalStorage(key, fallback, clean = (value) => value) {
  // Lazy initial state: read storage once, on the first render only
  const [value, setValue] = useState(() => read(key, fallback, clean));

  // Save after every change
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Full or blocked: the app keeps working, it just won't remember
    }
  }, [key, value]);

  // Another tab changed it: take the new value. The browser fires
  // "storage" in every OTHER tab of this site when localStorage changes.
  useEffect(() => {
    function handleStorage(event) {
      if (event.storageArea === localStorage && event.key === key) {
        setValue(read(key, fallback, clean));
      }
    }
    window.addEventListener("storage", handleStorage);
    // Cleanup again: stop listening when the component goes away. Without
    // it, every remount would add one more listener.
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, fallback, clean]);

  return [value, setValue];
}
