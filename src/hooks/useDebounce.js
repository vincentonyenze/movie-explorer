import { useEffect, useState } from "react";

// Returns `value`, but only after it has stopped changing for `delay` ms.
//
//   typing:     d   du   dun   dune
//   value:      d   du   dun   dune
//   debounced:  ""  ""   ""    ""  ...400ms pause...  dune
//
// So a search runs once you pause, not on every key press.
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // Start a timer for this value...
    const timer = setTimeout(() => setDebounced(value), delay);
    // ...and if value changes before it fires (another key press), the
    // cleanup cancels it, and a new timer starts. Only the last one, after
    // a pause, gets to fire. The same cleanup idea as Step 6.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
