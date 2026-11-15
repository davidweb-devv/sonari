import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  Share2,
  Moon,
  Volume2,
  Mic2,
  FileText,
  X,
  Send,
  ListPlus,
  Check,
  Plus,
  MoreVertical,
  Disc,
  User,
  Clock,
} from "lucide-react";

import QueueList from "./QueueList";
import { usePlayer } from "../store/playerStore";
import { useLibrary } from "../store/libraryStore";
import { useNavigation } from "../store/NavigationStore";
import { getRecommendations } from "../utils/recommend";

const SLEEP_OPTIONS = [0, 15, 30, 60];

function ScrollingTitle({ title }) {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const text = titleRef.current;

    if (!container || !text) return;

    const checkOverflow = () => {
      const overflow = text.scrollWidth - container.clientWidth;
      container.style.setProperty(
        "--title-distance",
        `${text.scrollWidth + 40}px`
      );
      setShouldScroll(overflow > 1);
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
      className={`full-title-window${shouldScroll ? " is-scrolling" : ""}`}
      title={title}
    >
      <div className="full-title-track">
        <h2 ref={titleRef} className="full-title-text">
          {title}
        </h2>

        {shouldScroll && (
          <h2 className="full-title-text" aria-hidden="true">
            {title}
          </h2>
        )}
      </div>
    </div>
  );
}

const PLAYER_PANELS = [
  { id: "queue", label: "Queue", Icon: ListMusic },
  { id: "lyrics", label: "Lyrics", Icon: Mic2 },
  { id: "credits", label: "Credits", Icon: FileText },
  { id: "ai", label: "Sonari AI", Icon: null },
];

function formatTime(seconds) {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function SeekBar() {
  const currentTime = usePlayer((state) => state.currentTime);
  const duration = usePlayer((state) => state.duration);
  const seek = usePlayer((state) => state.seek);

  const [scrubTime, setScrubTime] = useState(null);
  const [pendingSeek, setPendingSeek] = useState(null);
  const pointerActive = useRef(false);

  const safeDuration =
    Number.isFinite(duration) && duration > 0 ? duration : 0;

  useEffect(() => {
    if (pendingSeek === null) return;

    if (Math.abs(currentTime - pendingSeek) < 1) {
      setPendingSeek(null);
    }
  }, [currentTime, pendingSeek]);

  const displayTime =
    scrubTime !== null
      ? scrubTime
      : pendingSeek !== null
        ? pendingSeek
        : currentTime;

  const safeDisplayTime = Math.max(
    0,
    Math.min(displayTime || 0, safeDuration)
  );

  const fill =
    safeDuration > 0 ? (safeDisplayTime / safeDuration) * 100 : 0;

  function commitSeek(value) {
    const target = Math.max(0, Math.min(value, safeDuration));

    pointerActive.current = false;
    setScrubTime(null);
    setPendingSeek(target);
    seek(target);
  }

  return (
    <div className="full-seek">
      <input
        type="range"
        min="0"
        max={safeDuration || 100}
        step="0.1"
        value={Math.min(safeDisplayTime, safeDuration || 100)}
        disabled={safeDuration === 0}
        onPointerDown={(event) => {
          pointerActive.current = true;
          setScrubTime(Number(event.currentTarget.value));
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onChange={(event) => {
          const value = Number(event.target.value);

          if (pointerActive.current) {
            setScrubTime(value);
          } else {
            commitSeek(value);
          }
        }}
        onPointerUp={(event) =>
          commitSeek(Number(event.currentTarget.value))
        }
        onPointerCancel={() => {
          pointerActive.current = false;
          setScrubTime(null);
        }}
        onBlur={(event) => {
          if (pointerActive.current) {
            commitSeek(Number(event.currentTarget.value));
          }
        }}
        style={{ "--fill": `${fill}%` }}
        aria-label="Seek"
      />

      <div className="full-times">
        <span>{formatTime(displayTime)}</span>
        <span>{formatTime(safeDuration)}</span>
      </div>
    </div>
  );
}

function FullPlayer() {
  const {
    song,
    upNext,
    played,
    isPlaying,
    status,
    shuffle,
    repeat,
    isFullOpen,
    volume,
    sleepMinutes,
    toggle,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
    closeFull,
    play,
    playFromQueue,
    removeFromQueue,
    duplicateInQueue,
    setVolume,
    setSleepTimer,
    addToQueue,
    playNext,
  } = usePlayer(
    useShallow((state) => ({
      song: state.song,
      upNext: state.upNext,
      played: state.played,
      isPlaying: state.isPlaying,
      status: state.status,
      shuffle: state.shuffle,
      repeat: state.repeat,
      isFullOpen: state.isFullPlayerOpen,
      volume: state.volume,
      sleepMinutes: state.sleepMinutes,
      toggle: state.togglePlay,
      next: state.next,
      previous: state.previous,
      toggleShuffle: state.toggleShuffle,
      cycleRepeat: state.toggleRepeat,
      closeFull: state.closeFull,
      play: state.play,
      playFromQueue: state.playFromQueue,
      removeFromQueue: state.removeFromQueue,
      duplicateInQueue: state.duplicateInQueue,
      setVolume: state.setVolume,
      setSleepTimer: state.setSleepTimer,
      addToQueue: state.addToQueue,
      playNext: state.playNext,
    }))
  );

  const liked = useLibrary((state) =>
    state.likedSongs.some((item) => item.id === song?.id)
  );

  const toggleLike = useLibrary((state) => state.toggleLike);
  const playlists = useLibrary((state) => state.playlists);
  const createPlaylist = useLibrary((state) => state.createPlaylist);
  const toggleInPlaylist = useLibrary((state) => state.toggleInPlaylist);

  const { filterByArtist, filterByAlbum } = useNavigation();

  const [touchStart, setTouchStart] = useState(null);
  const [showQueue, setShowQueue] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [activePanel, setActivePanel] = useState("queue");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiNotice, setAiNotice] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const playerRef = useRef(null);
  const optionsRef = useRef(null);

  const queueOpen = isFullOpen && showQueue;
  const playlistsOpen = isFullOpen && showPlaylists;
  const sheetsOpen = queueOpen || playlistsOpen;

  const recommendations = useMemo(() => {
    if (!song || upNext.length > 0) return [];

    const heard = [...played, song];

    return getRecommendations({
      played: heard,
      exclude: heard,
    });
  }, [song, played, upNext.length]);

  useEffect(() => {
    if (!isFullOpen) {
      setShowQueue(false);
      setShowPlaylists(false);
      setShowOptions(false);
    }
  }, [isFullOpen]);

  useEffect(() => {
    if (!isFullOpen) return;

    const previouslyFocused = document.activeElement;
    playerRef.current?.focus({ preventScroll: true });

    return () => {
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [isFullOpen]);

  useEffect(() => {
    if (!isFullOpen) return;

    const onKey = (event) => {
      const player = usePlayer.getState();

      if (event.key === "Escape") {
        if (showOptions) {
          setShowOptions(false);
        } else if (showQueue || showPlaylists) {
          setShowQueue(false);
          setShowPlaylists(false);
        } else {
          player.closeFull();
        }
        return;
      }

      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable
      ) {
        return;
      }

      if (event.code === "Space" && event.target.tagName !== "BUTTON") {
        event.preventDefault();
        player.toggle();
      }

      if (event.key === "ArrowRight") {
        player.seek(Math.min(player.duration, player.currentTime + 10));
      }

      if (event.key === "ArrowLeft") {
        player.seek(Math.max(0, player.currentTime - 10));
      }
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isFullOpen, showQueue, showPlaylists, showOptions]);

  useEffect(() => {
    if (!showOptions) return;

    function handleOutsideClick(event) {
      if (!optionsRef.current?.contains(event.target)) {
        setShowOptions(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);

    return () =>
      document.removeEventListener("pointerdown", handleOutsideClick);
  }, [showOptions]);

  if (!song) return null;

  const subtitle =
    status === "loading"
      ? "Loading…"
      : status === "unavailable"
        ? "Preview unavailable"
        : song.artist;

  const savedSomewhere =
    liked ||
    playlists.some((playlist) =>
      playlist.songs.some((item) => item.id === song.id)
    );

  async function handleShare() {
    const text = `${song.title} by ${song.artist}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Sonari", text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Sharing may be cancelled or unavailable.
    }
  }

  function cycleSleep() {
    const currentIndex = SLEEP_OPTIONS.indexOf(sleepMinutes);
    const nextIndex = (currentIndex + 1) % SLEEP_OPTIONS.length;

    setSleepTimer(SLEEP_OPTIONS[nextIndex]);
  }

  function chooseSleepTimer(minutes) {
    setSleepTimer(minutes);
    setShowOptions(false);
  }

  function openPanel(panelId) {
    setActivePanel(panelId);
    setShowPlaylists(false);
    setShowOptions(false);

    if (panelId !== "queue") {
      setShowQueue(false);
      return;
    }

    setShowQueue(window.matchMedia("(max-width: 760px)").matches);
  }

  function openPlaylists() {
    setShowOptions(false);
    setShowQueue(false);
    setShowPlaylists(true);
  }

  function closeSheets() {
    setShowQueue(false);
    setShowPlaylists(false);
  }

  function handleCreatePlaylist(event) {
    event.preventDefault();

    const id = createPlaylist(newPlaylistName, song);

    if (id) setNewPlaylistName("");
  }

  function handleAiSubmit(event) {
    event.preventDefault();
    setAiNotice(true);
  }

  function handleTouchEnd(event) {
    if (sheetsOpen) {
      setTouchStart(null);
      return;
    }

    if (touchStart === null) return;

    const distance = event.changedTouches[0].clientY - touchStart;

    if (event.currentTarget.scrollTop === 0 && distance > 100) {
      closeFull();
    }

    setTouchStart(null);
  }

  function runMenuAction(action) {
    setShowOptions(false);
    action();
  }

  return (
    <>
      <div
        ref={playerRef}
        tabIndex={-1}
        className={isFullOpen ? "full-player open" : "full-player"}
        inert={!isFullOpen}
        role="dialog"
        aria-label="Now playing"
        aria-modal="true"
        style={{ "--art": `url("${song.image}")` }}
        onTouchStart={(event) =>
          setTouchStart(event.touches[0].clientY)
        }
        onTouchEnd={handleTouchEnd}
      >
        <div className="full-top">
          <button
            type="button"
            className="icon-btn"
            onClick={closeFull}
            aria-label="Close player"
          >
            <ChevronDown size={26} />
          </button>

          <span>Now playing</span>

          <div className="full-options-wrap" ref={optionsRef}>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowOptions((value) => !value)}
              aria-label="More song options"
              aria-expanded={showOptions}
              title="More options"
            >
              <MoreVertical size={23} />
            </button>

            {showOptions && (
              <div className="full-options-menu">
                <div className="full-options-heading"></div>

                <button
                  type="button"
                  onClick={() =>
                    runMenuAction(() => playNext(song))
                  }
                >
                  <SkipForward size={18} />
                  <span>Play Next</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    runMenuAction(() => addToQueue(song))
                  }
                >
                  <ListPlus size={18} />
                  <span>Add to Queue</span>
                </button>

                <button
                  type="button"
                  onClick={() => runMenuAction(openPlaylists)}
                >
                  <ListMusic size={18} />
                  <span>Add to Playlist</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    runMenuAction(() => toggleLike(song))
                  }
                >
                  <Heart
                    size={18}
                    fill={liked ? "currentColor" : "none"}
                  />
                  <span>
                    {liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    runMenuAction(() => handleShare())
                  }
                >
                  <Share2 size={18} />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    runMenuAction(() =>
                      filterByArtist(song.artist)
                    )
                  }
                >
                  <User size={18} />
                  <span>Go to Artist</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    runMenuAction(() =>
                      filterByAlbum(song.album || song.title)
                    )
                  }
                >
                  <Disc size={18} />
                  <span>Go to Album</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    runMenuAction(() => setActivePanel("credits"))
                  }
                >
                  <FileText size={18} />
                  <span>View Credits</span>
                </button>

                <div className="full-options-divider" />

                <div className="full-options-heading">
                  <Moon size={15} />
                  Sleep timer
                  {sleepMinutes > 0 && (
                    <span className="full-sleep-active">
                      {sleepMinutes}m
                    </span>
                  )}
                </div>

                <div className="full-sleep-options">
                  {SLEEP_OPTIONS.map((minutes) => (
                    <button
                      type="button"
                      key={minutes}
                      className={
                        sleepMinutes === minutes ? "selected" : ""
                      }
                      onClick={() => chooseSleepTimer(minutes)}
                    >
                      {minutes === 0 ? "Off" : `${minutes} minutes`}
                      {sleepMinutes === minutes && (
                        <Check size={16} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="full-layout">
          <section className="full-main">
            <div className="full-art">
              <img
                key={song.id}
                src={song.image}
                alt={`${song.title} artwork`}
              />
            </div>

            <div className="full-meta">
              <div className="full-song-details">
                <ScrollingTitle title={song.title} />
                <p title={subtitle}>{subtitle}</p>
              </div>

              <div className="full-actions">
                <button
                  type="button"
                  className={liked ? "icon-btn active" : "icon-btn"}
                  onClick={() => toggleLike(song)}
                  aria-pressed={liked}
                  aria-label={
                    liked
                      ? "Remove from liked songs"
                      : "Add to liked songs"
                  }
                >
                  <Heart
                    size={22}
                    fill={liked ? "currentColor" : "none"}
                  />
                </button>

                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => openPanel("queue")}
                  aria-label="Open queue"
                  title="Queue"
                >
                  <ListMusic size={22} />
                </button>
              </div>
            </div>

            <SeekBar />

            <div className="full-controls">
              <button
                type="button"
                className={shuffle ? "icon-btn active" : "icon-btn"}
                onClick={toggleShuffle}
                aria-pressed={shuffle}
                aria-label="Shuffle"
              >
                <Shuffle size={20} />
              </button>

              <button
                type="button"
                className="icon-btn"
                onClick={previous}
                aria-label="Previous song"
                style={{ width: 48, height: 48 }}
              >
                <SkipBack size={32} fill="currentColor" />
              </button>

              <button
                type="button"
                className="play-btn"
                onClick={toggle}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause size={30} fill="currentColor" />
                ) : (
                  <Play size={30} fill="currentColor" />
                )}
              </button>

              <button
                type="button"
                className="icon-btn"
                onClick={next}
                aria-label="Next song"
                style={{ width: 48, height: 48 }}
              >
                <SkipForward size={32} fill="currentColor" />
              </button>

              <button
                type="button"
                className={repeat !== "off" ? "icon-btn active" : "icon-btn"}
                onClick={cycleRepeat}
                aria-label={`Repeat: ${repeat}`}
              >
                {repeat === "one" ? (
                  <Repeat1 size={20} />
                ) : (
                  <Repeat size={20} />
                )}
              </button>
            </div>

            <div className="full-extras">
              <button
                type="button"
                className={savedSomewhere ? "icon-btn active" : "icon-btn"}
                onClick={openPlaylists}
                aria-label="Add to library or playlist"
                title="Add to library or playlist"
              >
                <ListPlus size={22} />
              </button>

              <label className="full-volume">
                <Volume2 size={18} aria-hidden="true" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(event) =>
                    setVolume(Number(event.target.value))
                  }
                  style={{ "--fill": `${volume * 100}%` }}
                  aria-label="Volume"
                />
              </label>

              <button
                type="button"
                className="icon-btn"
                onClick={handleShare}
                aria-label="Share"
                title="Share track"
              >
                <Share2 size={22} />
              </button>
            </div>
          </section>

          <aside className="full-side-panel">
            <div className="full-panel-heading">
              <div>
                <span className="full-panel-eyebrow">YOUR MUSIC</span>
                <h2>Explore</h2>
              </div>
              <span className="sonari-sparkle" aria-hidden="true">✦</span>
            </div>

            <div
              className="full-panel-tabs"
              role="tablist"
              aria-label="Player features"
            >
              {PLAYER_PANELS.map(({ id, label, Icon }) => (
                <button
                  type="button"
                  key={id}
                  role="tab"
                  aria-selected={activePanel === id}
                  className={
                    activePanel === id
                      ? "full-panel-tab active"
                      : "full-panel-tab"
                  }
                  onClick={() => openPanel(id)}
                >
                  {Icon ? (
                    <Icon size={18} />
                  ) : (
                    <span className="sonari-sparkle" aria-hidden="true">
                      ✦
                    </span>
                  )}
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="full-panel-body" role="tabpanel">
              {activePanel === "queue" && (
                <div className="full-queue-panel">
                  <div className="full-panel-section-title">
                    <div>
                      <h3>Up next</h3>
                      <p>
                        {upNext.length}{" "}
                        {upNext.length === 1 ? "track" : "tracks"}
                      </p>
                    </div>
                  </div>

                  <div className="full-queue-current">
                    <img src={song.image} alt="" />
                    <div>
                      <span>NOW PLAYING</span>
                      <strong title={song.title}>{song.title}</strong>
                      <small>{song.artist}</small>
                    </div>
                  </div>

                  <QueueList
                    upNext={upNext}
                    recommendations={recommendations}
                    onPlayQueued={playFromQueue}
                    onPlayRecommended={(rec) =>
                      play(rec, recommendations)
                    }
                    onDuplicate={duplicateInQueue}
                    onRemove={removeFromQueue}
                  />
                </div>
              )}

              {activePanel === "lyrics" && (
                <div className="full-panel-message">
                  <div className="full-panel-message-icon">
                    <Mic2 size={28} />
                  </div>
                  <h3>Lyrics</h3>
                  <p>Lyrics aren't available for this track yet.</p>
                  <span className="full-feature-note">
                    Lyrics support is coming later
                  </span>
                </div>
              )}

              {activePanel === "credits" && (
                <div className="full-panel-message">
                  <div className="full-panel-message-icon">
                    <FileText size={28} />
                  </div>
                  <h3>Credits</h3>
                  <p>
                    <strong>{song.artist}</strong>
                    {song.source === "audius"
                      ? " shared this track on Audius. Sonari streams it with the artist's credit."
                      : " — the preview is provided by Apple's iTunes Search API."}
                  </p>
                  <span className="full-feature-note">
                    Full songwriter and producer credits coming later
                  </span>
                </div>
              )}

              {activePanel === "ai" && (
                <div className="full-ai-panel">
                  <div className="full-panel-message-icon">
                    <span className="sonari-sparkle" aria-hidden="true">
                      ✦
                    </span>
                  </div>
                  <h3>Music, understood.</h3>
                  <p>
                    Have questions about this song? Sonari AI will help you
                    explore its sound, mood, and story.
                  </p>

                  <form onSubmit={handleAiSubmit}>
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(event) => {
                        setAiPrompt(event.target.value);
                        setAiNotice(false);
                      }}
                      placeholder="Ask about this song…"
                      aria-label="Ask Sonari about this song"
                    />

                    <button
                      type="submit"
                      disabled={!aiPrompt.trim()}
                      aria-label="Send question"
                      title="Send question"
                    >
                      <Send size={18} />
                    </button>
                  </form>

                  <small role="status">
                    {aiNotice
                      ? "Sonari AI isn't connected yet, so your question wasn't sent."
                      : "Sonari AI responses aren't connected yet."}
                  </small>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {createPortal(
        <>
          <div
            className={
              sheetsOpen ? "queue-backdrop open" : "queue-backdrop"
            }
            onClick={closeSheets}
            aria-hidden="true"
          />

          <section
            className={queueOpen ? "queue-sheet open" : "queue-sheet"}
            aria-label="Queue"
            aria-modal="true"
            role="dialog"
            inert={!queueOpen}
          >
            <div className="queue-sheet-header">
              <h3>Queue</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowQueue(false)}
                aria-label="Close queue"
              >
                <X size={21} />
              </button>
            </div>

            <div className="full-queue-current">
              <img src={song.image} alt="" />
              <div>
                <span>NOW PLAYING</span>
                <strong>{song.title}</strong>
                <small>{song.artist}</small>
              </div>
            </div>

            <QueueList
              upNext={upNext}
              recommendations={recommendations}
              onPlayQueued={(qid) => {
                playFromQueue(qid);
                setShowQueue(false);
              }}
              onPlayRecommended={(rec) => {
                play(rec, recommendations);
                setShowQueue(false);
              }}
              onDuplicate={duplicateInQueue}
              onRemove={removeFromQueue}
            />
          </section>

          <section
            className={playlistsOpen ? "queue-sheet open" : "queue-sheet"}
            aria-label="Add to library or playlist"
            aria-modal="true"
            role="dialog"
            inert={!playlistsOpen}
          >
            <div className="queue-sheet-header">
              <h3>Save to</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPlaylists(false)}
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </div>

            <form className="new-playlist" onSubmit={handleCreatePlaylist}>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(event) =>
                  setNewPlaylistName(event.target.value)
                }
                placeholder="New playlist name"
                aria-label="New playlist name"
              />

              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                aria-label="Create playlist"
                title="Create playlist"
              >
                <Plus size={18} />
              </button>
            </form>

            <ul>
              <li>
                <button
                  type="button"
                  className="queue-item"
                  onClick={() => toggleLike(song)}
                  aria-pressed={liked}
                >
                  <span className="save-icon">
                    <Heart
                      size={18}
                      fill={liked ? "currentColor" : "none"}
                    />
                  </span>
                  <span className="save-text">
                    <strong>Liked Songs</strong>
                    <small>Your library</small>
                  </span>
                  {liked && <Check size={18} className="save-check" />}
                </button>
              </li>

              {playlists.map((playlist) => {
                const inPlaylist = playlist.songs.some(
                  (item) => item.id === song.id
                );

                return (
                  <li key={playlist.id}>
                    <button
                      type="button"
                      className="queue-item"
                      onClick={() => toggleInPlaylist(playlist.id, song)}
                      aria-pressed={inPlaylist}
                    >
                      <span className="save-icon">
                        <ListMusic size={18} />
                      </span>
                      <span className="save-text">
                        <strong>{playlist.name}</strong>
                        <small>
                          {playlist.songs.length}{" "}
                          {playlist.songs.length === 1 ? "song" : "songs"}
                        </small>
                      </span>
                      {inPlaylist && (
                        <Check size={18} className="save-check" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>,
        document.body
      )}
    </>
  );
}

export default FullPlayer;
