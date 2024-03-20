// Settings read from the environment.
//
// Vite reads .env.local when it starts (restart `npm run dev` after editing
// it) and puts every variable starting with VITE_ on import.meta.env.
//
// ⚠ VITE_ values are copied INTO the built JavaScript, so anyone using the
// site can read them. Fine for a free, read-only TMDB token; never do it
// with a real secret (a payment key, a database password). Those belong on
// a server.
export const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN?.trim() ?? "";

export const hasToken = TMDB_TOKEN !== "";
