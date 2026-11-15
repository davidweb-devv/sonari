
import { useMemo } from "react";
import { usePlayer } from "../store/playerStore";
import {
  Headphones,
  Music2,
  UserRound,
  Clock,
  Play,
  Trophy,
} from "lucide-react";

import ActiveTrackIndicator from "../components/ActiveTrackIndicator";
import { isSameTrack } from "../utils/trackUtils";

function formatListeningTime(seconds) {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function getStartOfWeek() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  // Monday is the first day of the week.
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);

  return date;
}

function You() {
  const listeningEvents =
    usePlayer((state) => state.listeningEvents) || [];

  const play = usePlayer((state) => state.play);
  const currentSong = usePlayer((state) => state.song);
  const isPlaying = usePlayer((state) => state.isPlaying);

  const {
    playbackHistory,
    totalPlays,
    listeningTime,
    topArtist,
    artistsListenedTo,
    weeklyTopSong,
  } = useMemo(() => {
    const songStats = new Map();
    const artists = new Map();
    const weeklySongStats = new Map();
    const sessions = new Set();

    const validEvents = [...listeningEvents]
      .filter((event) => event?.songId)
      .filter((event) => {
        if (event.sessionId) {
          if (sessions.has(event.sessionId)) return false;
          sessions.add(event.sessionId);
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.playedAt || 0) -
          new Date(a.playedAt || 0)
      );

    // Build complete listening history.
    validEvents.forEach((event) => {
      const songId = String(event.songId);

      if (!songStats.has(songId)) {
        songStats.set(songId, {
          ...event,
          id: event.id || event.songId,
          title: event.title || "Unknown Title",
          artist: event.artist || "Unknown Artist",
          image: event.image || event.cover_url || "",
          previewUrl: event.previewUrl || null,
          plays: 0,
        });
      }

      songStats.get(songId).plays += 1;
    });

      const playbackHistory = Array.from(songStats.values()).sort(
    (a, b) =>
      b.plays - a.plays ||
      new Date(b.playedAt || 0) -
        new Date(a.playedAt || 0)
  )
  .slice(0, 7);
  
    // Calculate this week's statistics.
    const startOfWeek = getStartOfWeek();

    const weeklyEvents = validEvents.filter((event) => {
      const playedAt = new Date(event.playedAt);

      return (
        !Number.isNaN(playedAt.getTime()) &&
        playedAt >= startOfWeek
      );
    });

    weeklyEvents.forEach((event) => {
      const songId = String(event.songId);

      if (!weeklySongStats.has(songId)) {
        weeklySongStats.set(songId, {
          ...event,
          id: event.id || event.songId,
          title: event.title || "Unknown Title",
          artist: event.artist || "Unknown Artist",
          image: event.image || event.cover_url || "",
          previewUrl: event.previewUrl || null,
          plays: 0,
        });
      }

      const song = weeklySongStats.get(songId);
      song.plays += 1;

      // Keep the latest available song information.
      if (!song.image && (event.image || event.cover_url)) {
        song.image = event.image || event.cover_url;
      }

      if (!song.previewUrl && event.previewUrl) {
        song.previewUrl = event.previewUrl;
      }

      if (
        !song.title ||
        song.title === "Unknown Title"
      ) {
        song.title = event.title || song.title;
      }

      if (
        !song.artist ||
        song.artist === "Unknown Artist"
      ) {
        song.artist = event.artist || song.artist;
      }
    });

    const weeklyTopSong = Array.from(
      weeklySongStats.values()
    ).sort(
      (a, b) =>
        b.plays - a.plays ||
        new Date(b.playedAt || 0) -
          new Date(a.playedAt || 0)
    )[0] || null;

    weeklyEvents.forEach((event) => {
      if (!event.artist) return;

      const artistKey =
        event.artistKey || event.artist.toLowerCase();

      if (!artists.has(artistKey)) {
        artists.set(artistKey, {
          name: event.artist,
          plays: 0,
        });
      }

      artists.get(artistKey).plays += 1;
    });

    const weeklyListeningSeconds = weeklyEvents.reduce(
      (total, event) =>
        total + Math.max(0, Number(event.listenedSeconds) || 0),
      0
    );

    const weeklyArtistStats = Array.from(artists.values()).sort(
      (a, b) => b.plays - a.plays
    );

    return {
      playbackHistory,
      totalPlays: weeklyEvents.length,
      listeningTime: formatListeningTime(
        weeklyListeningSeconds
      ),
      topArtist: weeklyArtistStats[0]?.name || "—",
      artistsListenedTo: weeklyArtistStats.length,
      weeklyTopSong,
    };
  }, [listeningEvents]);

  const isTopSongCurrent =
    weeklyTopSong &&
    isSameTrack(weeklyTopSong, currentSong);

  return (
    <main
  className="you-page"
  style={{
    padding: "4px 20px 100px",
  }}
>
      
<header
  style={{
    display: "flex",
    alignItems: "center",
    gap: "11px",
    marginBottom: "18px",
  }}
>
  <div
    style={{
      width: "42px",
      height: "42px",
      borderRadius: "50%",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      color: "var(--text)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <UserRound size={20} strokeWidth={1.7} />
  </div>

  <div>
    <h2
      style={{
        margin: 0,
        fontSize: "17px",
        color: "var(--text)",
      }}
    >
      Your Listening Space
    </h2>

    <p
      style={{
        margin: "3px 0 0",
        fontSize: "11px",
        color: "var(--muted)",
      }}
    >
      Your music, your history, your taste.
    </p>
  </div>
</header>


      {/* Your Top Song This Week */}
      <section
        className="weekly-top-song"
        style={{
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "14px",
          }}
        >
          <Trophy
            size={17}
            color="var(--focus)"
          />

          <h3
            style={{
              fontSize: "16px",
              color: "var(--text)",
              margin: 0,
            }}
          >
            Your Top Song This Week
          </h3>
        </div>

        {weeklyTopSong ? (
          <button
            type="button"
            onClick={() => play(weeklyTopSong, playbackHistory)}
            disabled={!weeklyTopSong.previewUrl}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "14px",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              background:
                "linear-gradient(120deg, var(--surface), rgba(127,16,155,0.16))",
              textAlign: "left",
              color: "var(--text)",
              font: "inherit",
              cursor: weeklyTopSong.previewUrl
                ? "pointer"
                : "default",
              opacity: weeklyTopSong.previewUrl ? 1 : 0.75,
            }}
            title={
              weeklyTopSong.previewUrl
                ? "Play your top song"
                : "Preview unavailable"
            }
          >
            {weeklyTopSong.image ? (
              <img
                src={weeklyTopSong.image}
                alt=""
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "12px",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Music2 size={28} color="var(--muted)" />
              </div>
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  display: "block",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "1.2px",
                  color: "var(--focus)",
                  textTransform: "uppercase",
                  marginBottom: "7px",
                }}
              >
                Most played this week
              </span>

              <h4
                style={{
                  margin: 0,
                  fontSize: "16px",
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {weeklyTopSong.title}
              </h4>

              <p
                style={{
                  margin: "5px 0 8px",
                  fontSize: "12px",
                  color: "var(--muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {weeklyTopSong.artist}
              </p>

              <span
                style={{
                  fontSize: "11px",
                  color: "var(--muted)",
                }}
              >
                {weeklyTopSong.plays}{" "}
                {weeklyTopSong.plays === 1 ? "play" : "plays"} this week
              </span>
            </div>

            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "var(--accent, #7f109b)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isTopSongCurrent && isPlaying ? (
                <ActiveTrackIndicator isPlaying={isPlaying} />
              ) : (
                <Play size={17} fill="currentColor" />
              )}
            </div>
          </button>
        ) : (
          <div
            style={{
              padding: "24px 16px",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              textAlign: "center",
            }}
          >
            <Headphones
              size={25}
              color="var(--muted)"
            />

            <p
              style={{
                color: "var(--text)",
                fontSize: "13px",
                margin: "10px 0 5px",
              }}
            >
              Your weekly favourite is waiting.
            </p>

            <span
              style={{
                color: "var(--muted)",
                fontSize: "11px",
              }}
            >
              Start listening and your top song will appear here.
            </span>
          </div>
        )}
      </section>

      {/* Weekly Statistics */}
      <section
        className="stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          margin: "20px 0 30px",
        }}
      >
        <div className="you-stat-card">
          <Headphones size={18} />
          <span>Total Plays This Week</span>
          <h3>{totalPlays.toLocaleString()}</h3>
        </div>

        <div className="you-stat-card">
          <Clock size={18} />
          <span>Listening Time This Week</span>
          <h3>{listeningTime}</h3>
        </div>

        <div className="you-stat-card">
          <Music2 size={18} />
          <span>Top Artist This Week</span>
          <h3 title={topArtist}>{topArtist}</h3>
        </div>

        <div className="you-stat-card">
          <UserRound size={18} />
          <span>Artists Explored This Week</span>
          <h3>{artistsListenedTo.toLocaleString()}</h3>
        </div>
      </section>

      {/* Listening History */}
      <section className="you-history-section">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              color: "var(--text)",
              margin: 0,
            }}
          >
            Listening History
          </h3>
        </div>

        {playbackHistory.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {playbackHistory.map((song) => {
              const isCurrentTrack = isSameTrack(
                song,
                currentSong
              );

              return (
                <button
                  key={song.id}
                  type="button"
                  className={`you-history-row ${
                    isCurrentTrack ? "is-current-track" : ""
                  }`}
                  disabled={!song.previewUrl}
                  onClick={() => play(song)}
                  title={
                    song.previewUrl
                      ? "Play song"
                      : "Preview unavailable"
                  }
                  style={{
                    width: "100%",
                    border: "none",
                    textAlign: "left",
                    background: "transparent",
                    cursor: song.previewUrl
                      ? "pointer"
                      : "default",
                    font: "inherit",
                    color: "inherit",
                    appearance: "none",
                    opacity: song.previewUrl ? 1 : 0.65,
                  }}
                >
                  {song.image ? (
                    <img
                      src={song.image}
                      alt=""
                      style={{
                        width: "46px",
                        height: "46px",
                        borderRadius: "9px",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div className="you-history-placeholder">
                      <Music2 size={19} />
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4
                      className="you-history-title"
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {song.title}
                    </h4>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "var(--muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {song.artist}
                    </p>
                  </div>

                  <span className="you-history-count">
                    {song.plays}{" "}
                    {song.plays === 1 ? "play" : "plays"}
                  </span>

                  {isCurrentTrack && (
                    <ActiveTrackIndicator isPlaying={isPlaying} />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="you-history-empty">
            <Headphones size={25} />
            <p>Your listening story starts here.</p>
            <span>
              Play some music and your history will appear here.
            </span>
          </div>
        )}
      </section>
    </main>
  );
}

export default You;
