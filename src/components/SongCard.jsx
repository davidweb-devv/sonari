
import SongActionMenu from "./SongActionMenu";
import ActiveTrackIndicator from "./ActiveTrackIndicator";
import { usePlayer } from "../store/playerStore";
import { isSameTrack } from "../utils/trackUtils";

function SongCard({ song, onSelect }) {
  const currentSong = usePlayer((state) => state.song);
  const isPlaying = usePlayer((state) => state.isPlaying);

  if (!song) return null;

  const isCurrentTrack = isSameTrack(song, currentSong);

  return (
    <div
      className={`song-card ${isCurrentTrack ? "is-current-track" : ""}`}
      role="group"
      onClick={() => onSelect?.(song)}
    >
      <div className="album-art">
        <img
          src={song.image}
          alt={song.title}
          loading="lazy"
        />
      </div>

      <div className="song-info">
        <h3>{song.title}</h3>
        <p>{song.artist}</p>
      </div>

      <div
        className="song-card-actions"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {isCurrentTrack && (
          <ActiveTrackIndicator isPlaying={isPlaying} />
        )}

        <SongActionMenu song={song} />
      </div>
    </div>
  );
}

export default SongCard;
