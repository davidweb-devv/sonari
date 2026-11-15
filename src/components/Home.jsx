
import { useMemo } from "react";
import {
  Search,
  Heart,
  Library,
  Clock3,
  ListMusic,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { usePlayer } from "../store/playerStore";
import { useLibrary } from "../store/libraryStore";
import { useAuth } from "../store/authStore";
import SearchResultCard from "./SearchResultCard";

const TAGLINES = [
  "Something mellow",
  "Back to your rhythm",
  "Your daily frequency",
  "Curated for right now",
  "What are we feeling today?",
];

function Home() {
  const navigate = useNavigate();

  const listeningEvents =
    usePlayer((state) => state.listeningEvents) || [];

  const play = usePlayer((state) => state.play);

  const likedSongs = useLibrary((state) => state.likedSongs);
  const playlists = useLibrary((state) => state.playlists);
  const setSelectedCollectionId = useLibrary(
    (state) => state.setSelectedCollectionId
  );

  const { user, isAuthenticated } = useAuth();

  const userName = useMemo(() => {
    if (!isAuthenticated || !user) return "Guest";

    return (
      user.name ||
      user.full_name ||
      user.email?.split("@")[0] ||
      "Listener"
    );
  }, [isAuthenticated, user]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";

    return "Good evening";
  }, []);

  const tagline = useMemo(
    () => TAGLINES[Math.floor(Math.random() * TAGLINES.length)],
    []
  );

  const recentSongs = useMemo(() => {
    const sortedEvents = [...listeningEvents]
      .filter((event) => event?.songId)
      .sort(
        (a, b) =>
          new Date(b.playedAt || 0) -
          new Date(a.playedAt || 0)
      );

    const seenSongs = new Set();
    const uniqueSongs = [];

    sortedEvents.forEach((event) => {
      const songId = String(event.songId);

      if (seenSongs.has(songId)) return;

      seenSongs.add(songId);

      uniqueSongs.push({
        ...event,
        id: event.songId,
        title: event.title || "Unknown Title",
        artist: event.artist || "Unknown Artist",
        image: event.image || event.cover_url || "",
        previewUrl: event.previewUrl || null,
      });
    });

    return uniqueSongs.slice(0, 6);
  }, [listeningEvents]);

  const openLibrary = () => {
    setSelectedCollectionId(null);
    navigate("/library");
  };

  const openCollection = (collectionId) => {
    setSelectedCollectionId(collectionId);
    navigate("/library");
  };

  const openSearch = () => navigate("/search");

  const openListeningHistory = () => navigate("/you");

  const tiles = [
    {
      id: "recent",
      title: "Recently Played",
      description: `${recentSongs.length} tracks in your history`,
      icon: Clock3,
      image: recentSongs[0]?.image,
      action: openListeningHistory,
      visible: recentSongs.length > 0,
    },
    {
      id: "liked",
      title: "Liked Songs",
      description: `${likedSongs.length} saved tracks`,
      icon: Heart,
      action: () => openCollection("liked"),
      visible: true,
    },
    {
      id: "library",
      title: "Your Library",
      description: "Your saved music and collections",
      icon: Library,
      action: openLibrary,
      visible: true,
    },
    {
      id: "discover",
      title: "Discover Music",
      description: "Find your next favourite",
      icon: Search,
      action: openSearch,
      visible: true,
    },
  ];

  return (
    <main className="home">
      <section className="home-intro">
        <p className="home-eyebrow">{greeting},</p>
        <h1>{userName}</h1>
        <p className="home-subtitle">{tagline}</p>
      </section>

      <section className="home-collections">
        <div className="section-header">
          <div>
            <h2>Your Space</h2>
            <p className="section-subtitle">
              Your music, all in one place
            </p>
          </div>
        </div>

        <div className="home-tile-grid">
          {tiles
            .filter((tile) => tile.visible)
            .map((tile) => {
              const Icon = tile.icon;

              return (
                <button
                  key={tile.id}
                  type="button"
                  className="home-tile"
                  onClick={tile.action}
                  style={{
                    backgroundImage: tile.image
                      ? `linear-gradient(0deg, rgba(15,15,18,0.96), rgba(15,15,18,0.15)), url("${tile.image}")`
                      : "linear-gradient(145deg, var(--surface), rgba(127,16,155,0.2))",
                  }}
                >
                  <span className="home-tile-icon">
                    <Icon size={19} />
                  </span>

                  <span className="home-tile-content">
                    <strong>{tile.title}</strong>
                    <span>{tile.description}</span>
                  </span>
                </button>
              );
            })}
        </div>
      </section>

      {recentSongs.length > 0 && (
        <section className="home-recent">
          <div className="section-header">
            <div>
              <h2>Recently Played</h2>
              <p className="section-subtitle">
                Pick up where you left off
              </p>
            </div>

            <button
              type="button"
              className="home-section-link"
              onClick={openListeningHistory}
            >
              See all
            </button>
          </div>

          <div className="search-results-list">
            {recentSongs.map((song) => (
              <SearchResultCard
                key={song.id}
                song={song}
                onClick={() => play(song, recentSongs)}
              />
            ))}
          </div>
        </section>
      )}

      {playlists.length > 0 && (
        <section className="home-playlists">
          <div className="section-header">
            <div>
              <h2>Your Playlists</h2>
              <p className="section-subtitle">
                Collections you've created
              </p>
            </div>

            <button
              type="button"
              className="home-section-link"
              onClick={openLibrary}
            >
              See all
            </button>
          </div>

          <div className="home-tile-grid">
            {playlists.map((playlist) => {
              const cover =
                playlist.coverImage || playlist.songs?.[0]?.image;

              return (
                <button
                  key={playlist.id}
                  type="button"
                  className="home-tile playlist-tile"
                  onClick={() => openCollection(playlist.id)}
                  style={{
                    backgroundImage: cover
                      ? `linear-gradient(0deg, rgba(15,15,18,0.96), rgba(15,15,18,0.2)), url("${cover}")`
                      : "linear-gradient(145deg, var(--surface), rgba(127,16,155,0.22))",
                  }}
                >
                  <span className="home-tile-icon">
                    <ListMusic size={19} />
                  </span>

                  <span className="home-tile-content">
                    <strong>{playlist.name}</strong>
                    <span>
                      {playlist.songs?.length ?? 0} tracks
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

export default Home;
