import MovieGrid from "../components/MovieGrid.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

// The movies you've saved. No loading here: they're already in memory.
function FavouritesView({ favourites, favouriteIds, onToggleFavourite }) {
  if (favourites.length === 0) {
    return (
      <StatusMessage icon="♡" title="No favourites yet">
        Tap the heart on any movie to save it here.
      </StatusMessage>
    );
  }

  return (
    <MovieGrid movies={favourites} favouriteIds={favouriteIds} onToggleFavourite={onToggleFavourite} />
  );
}

export default FavouritesView;
