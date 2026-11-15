
import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipForward } from "lucide-react";
import { usePlayer } from "../store/playerStore";

function MiniScrollingTitle({ title }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;

    if (!container || !text) return;

    const checkOverflow = () => {
      const titleWidth = text.scrollWidth;
      const containerWidth = container.clientWidth;

      const needsScrolling = titleWidth > containerWidth + 1;

      container.style.setProperty(
        "--mini-title-distance",
        `${titleWidth + 32}px`
      );

      setShouldScroll(needsScrolling);
    };

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);

    observer.observe(container);
    observer.observe(text);

    return () => observer.disconnect();
  }, [title]);

  return (
    <div
      ref={containerRef}
      className={`mini-title-window${
        shouldScroll ? " is-scrolling" : ""
      }`}
      title={title}
    >
      <div className="mini-title-track">
        <h4 ref={textRef} className="mini-title-text">
          {title}
        </h4>

        {shouldScroll && (
          <h4 className="mini-title-text" aria-hidden="true">
            {title}
          </h4>
        )}
      </div>
    </div>
  );
}

export default function MiniPlayer() {
  const song = usePlayer((state) => state.song);
  const isPlaying = usePlayer((state) => state.isPlaying);
  const status = usePlayer((state) => state.status);
  const currentTime = usePlayer((state) => state.currentTime);
  const duration = usePlayer((state) => state.duration);

  const togglePlay = usePlayer((state) => state.togglePlay);
  const next = usePlayer((state) => state.next);
  const openFull = usePlayer((state) => state.openFull);

  if (!song) return null;

  const progress = duration
    ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
    : 0;

  return (
    <div className="mini-player">
      <button
        type="button"
        className="mini-open"
        onClick={openFull}
        aria-label={`Open player for ${song.title}`}
      >
        <img src={song.image} alt="" />

        <div className="mini-info">
          <MiniScrollingTitle title={song.title} />

          <p>
            {status === "unavailable"
              ? "Preview unavailable"
              : song.artist}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause size={20} fill="currentColor" />
        ) : (
          <Play size={20} fill="currentColor" />
        )}
      </button>

      <button
        type="button"
        onClick={next}
        aria-label="Next song"
      >
        <SkipForward size={20} fill="currentColor" />
      </button>

      <div
        className="mini-progress"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
