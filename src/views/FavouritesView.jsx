import MovieGrid from "../components/MovieGrid.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

// The movies you've saved. No loading here: they're already in memory.
function FavouritesView({ favourites, favouriteIds, onToggleFavourite, onSelect }) {
  return (
    <>
      <div className="page__header">
        <div>
          <h1 className="page__title">Your favourites</h1>
          <p className="page__subtitle">
            {favourites.length === 1 ? "1 movie saved" : `${favourites.length} movies saved`}
          </p>
        </div>
      </div>

      {favourites.length === 0 ? (
        <StatusMessage icon="♡" title="No favourites yet">
          Tap the heart on any movie to save it here.
        </StatusMessage>
      ) : (
        <MovieGrid
          movies={favourites}
          favouriteIds={favouriteIds}
          onToggleFavourite={onToggleFavourite}
          onSelect={onSelect}
        />
      )}
    </>
  );
}

export default FavouritesView;
