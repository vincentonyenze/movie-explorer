import { hasToken } from "./config.js";

// Step 1: just checks the setup. The real page starts in Step 2.
function App() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Movie Explorer</h1>
      {hasToken ? (
        <p>✅ TMDB token found. Ready to go.</p>
      ) : (
        <p>
          ⚠ No TMDB token. Copy <code>.env.example</code> to <code>.env.local</code>, paste your
          token, then restart <code>npm run dev</code>.
        </p>
      )}
    </main>
  );
}

export default App;
