
import { Music2 } from "lucide-react";

function ActiveTrackIndicator({ isPlaying }) {
  return (
    <span
      className="active-track-indicator"
      aria-label={isPlaying ? "Currently playing" : "Currently paused"}
      title={isPlaying ? "Currently playing" : "Currently paused"}
    >
      {isPlaying ? (
        <span className="playing-equalizer">
          <span />
          <span />
          <span />
        </span>
      ) : (
        <Music2 size={16} />
      )}
    </span>
  );
}

export default ActiveTrackIndicator;
