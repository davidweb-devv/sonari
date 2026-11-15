
import { Music2, UserRound, ArrowUpRight } from "lucide-react";
import SongActionMenu from "./SongActionMenu";
import ActiveTrackIndicator from "./ActiveTrackIndicator";
import { usePlayer } from "../store/playerStore";
import { isSameTrack } from "../utils/trackUtils";

function SearchResultCard({
  song,
  artist,
  type,
  onClick,
  playlistId,
}) {
  const currentSong = usePlayer((state) => state.song);
  const isPlaying = usePlayer((state) => state.isPlaying);

  const isArtist = type === "artist" && artist;
  const item = isArtist ? artist : song;

  if (!item) return null;

  const title = isArtist ? artist.name : song.title;
  const subtitle = isArtist
    ? artist.genre || "Artist"
    : song.artist;

  const image = item.image || "";
  const isCurrentTrack = !isArtist && isSameTrack(song, currentSong);

  function handleKeyDown(event) {
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.(song);
    }
  }

  return (
    <div
      className={`search-result-card ${
        isArtist ? "artist-result" : "song-result"
      } ${isCurrentTrack ? "is-current-track" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(song)}
      onKeyDown={handleKeyDown}
      aria-current={isCurrentTrack ? "true" : undefined}
    >
      <div className={`search-result-artwork ${isArtist ? "artist-artwork" : ""}`}>
        {isArtist ? (
          <UserRound className="search-artwork-fallback" size={24} />
        ) : (
          <Music2 className="search-artwork-fallback" size={22} />
        )}

        {image && (
          <img
            src={image}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>

      <div className="search-result-info">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>

      {isArtist ? (
        <div className="search-result-type">
          <span>Artist</span>
          <ArrowUpRight size={17} />
        </div>
      ) : (
        <div
          className="search-result-actions"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {isCurrentTrack && (
            <ActiveTrackIndicator isPlaying={isPlaying} />
          )}

          <SongActionMenu
            song={song}
            playlistId={playlistId}
          />
        </div>
      )}
    </div>
  );
}

export default SearchResultCard;
