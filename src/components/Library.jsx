
import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ListMusic,
  Play,
  Plus,
  Shuffle,
  Trash2,
  X,
  Image as ImageIcon,
  Check,
  Search,
  Upload,
} from "lucide-react";

import SearchResultCard from "./SearchResultCard";
import { useLibrary } from "../store/libraryStore";
import { usePlayer } from "../store/playerStore";
import { searchSonariTracks } from "../services/musicService";
import { shuffled } from "../utils/shuffle";

const LIKED_ID = "liked";

function Library() {
  const likedSongs = useLibrary((s) => s.likedSongs);
  const playlists = useLibrary((s) => s.playlists);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const deletePlaylist = useLibrary((s) => s.deletePlaylist);
  const toggleInPlaylist = useLibrary((s) => s.toggleInPlaylist);

  const selectedCollectionId = useLibrary(
    (s) => s.selectedCollectionId
  );
  const clearSelectedCollection = useLibrary(
    (s) => s.clearSelectedCollection
  );

  const play = usePlayer((s) => s.play);

  const [openId, setOpenId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState("");

  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [showArtModal, setShowArtModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [songSearchQuery, setSongSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const fileInputRef = useRef(null);

  const isLiked = openId === LIKED_ID;
  const playlist = playlists.find((item) => item.id === openId);
  const songs = isLiked ? likedSongs : playlist?.songs ?? [];

  // Open a collection requested by another page.
  useEffect(() => {
    if (!selectedCollectionId) return;

    setOpenId(selectedCollectionId);
    clearSelectedCollection();
  }, [selectedCollectionId, clearSelectedCollection]);

  // Search the real music catalogue.
  useEffect(() => {
    const query = songSearchQuery.trim();

    if (!showAddSongsModal || query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const results = await searchSonariTracks(query, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setSearchResults(results);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Library song search failed:", error);
          setSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [songSearchQuery, showAddSongsModal]);

  function handleCreateSubmit(e) {
    e.preventDefault();

    if (!playlistTitle.trim()) return;

    const newId = createPlaylist(playlistTitle.trim());

    setPlaylistTitle("");
    setShowCreateModal(false);

    if (newId) setOpenId(newId);
  }

  function playAll() {
    if (songs.length === 0) return;

    usePlayer.setState({ shuffle: false });
    play(songs[0], songs);
  }

  function shuffleAll() {
    if (songs.length === 0) return;

    const order = shuffled(songs);

    usePlayer.setState({ shuffle: true });
    play(order[0], order);
  }

  function confirmDelete() {
    if (!playlist) return;

    deletePlaylist(playlist.id);
    setShowDeleteConfirm(false);
    setOpenId(null);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];

    if (!file || !playlist) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      useLibrary.setState((state) => ({
        playlists: state.playlists.map((item) =>
          item.id === playlist.id
            ? { ...item, coverImage: reader.result }
            : item
        ),
      }));

      setShowArtModal(false);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleGenerateAiArt(e) {
    e.preventDefault();

    if (!aiPrompt.trim() || !playlist) return;

    setAiGenerating(true);

    // Temporary artwork selection until image generation is connected.
    setTimeout(() => {
      const sampleArtworks = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop",
      ];

      const selected =
        sampleArtworks[
          Math.floor(Math.random() * sampleArtworks.length)
        ];

      useLibrary.setState((state) => ({
        playlists: state.playlists.map((item) =>
          item.id === playlist.id
            ? { ...item, coverImage: selected }
            : item
        ),
      }));

      setAiGenerating(false);
      setShowArtModal(false);
      setAiPrompt("");
    }, 1200);
  }

  function openAddSongsModal() {
    setSongSearchQuery("");
    setSearchResults([]);
    setShowAddSongsModal(true);
  }

  function openCollection(id) {
    setOpenId(id);
  }

  // Collection detail: Liked Songs or an individual playlist.
  if (isLiked || playlist) {
    const coverImage = isLiked
      ? null
      : playlist.coverImage || songs[0]?.image || null;

    return (
      <main className="collection-detail" style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            className="back-link"
            onClick={() => setOpenId(null)}
            style={{ margin: 0 }}
          >
            <ChevronLeft size={18} aria-hidden="true" />
            Library
          </button>

          {!isLiked && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Delete playlist"
              title="Delete playlist"
              style={{ color: "var(--muted)" }}
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <header className="collection-head">
          <div
            className="collection-art"
            style={{
              position: "relative",
              overflow: "hidden",
              cursor: isLiked ? "default" : "pointer",
            }}
            onClick={() => {
              if (!isLiked) setShowArtModal(true);
            }}
            title={!isLiked ? "Click to change artwork" : undefined}
          >
            {isLiked ? (
              <Heart size={48} fill="currentColor" />
            ) : coverImage ? (
              <img
                src={coverImage}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--muted)",
                }}
              >
                <ImageIcon size={38} />
                <span style={{ fontSize: 11, fontWeight: 600 }}>
                  Add Art
                </span>
              </div>
            )}
          </div>

          <div className="collection-info">
            <p className="collection-kind">
              {isLiked ? "Collection" : "Playlist"}
            </p>

            <h1>{isLiked ? "Liked Songs" : playlist.name}</h1>

            <p className="collection-count">
              {songs.length} {songs.length === 1 ? "song" : "songs"}
            </p>

            <div
              className="collection-actions"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 12,
              }}
            >
              <button
                type="button"
                className="primary-btn"
                onClick={playAll}
                disabled={songs.length === 0}
              >
                <Play size={18} fill="currentColor" />
                Play
              </button>

              <button
                type="button"
                className="ghost-btn"
                onClick={shuffleAll}
                disabled={songs.length === 0}
              >
                <Shuffle size={18} />
                Shuffle
              </button>
            </div>
          </div>
        </header>

        {songs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p className="search-empty-hint" style={{ marginBottom: 16 }}>
              No songs in this playlist yet.
            </p>

            {!isLiked && (
              <button
                type="button"
                className="primary-btn"
                onClick={openAddSongsModal}
                style={{
                  display: "inline-flex",
                  margin: "0 auto",
                }}
              >
                <Plus size={18} />
                Add your first song
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="search-results-list">
              {songs.map((song, index) => (
                <SearchResultCard
                  key={song.id ?? `${song.title}-${song.artist}-${index}`}
                  song={song}
                  playlistId={isLiked ? undefined : playlist?.id}
                  onClick={() => play(song, songs)}
                />
              ))}
            </div>

            {!isLiked && (
              <div style={{ marginTop: 24, textAlign: "center" }}>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={openAddSongsModal}
                  style={{
                    display: "inline-flex",
                    margin: "0 auto",
                  }}
                >
                  <Plus size={16} />
                  Add more songs
                </button>
              </div>
            )}
          </div>
        )}

        {/* Delete playlist confirmation */}
        {showDeleteConfirm && playlist && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
              background: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 340,
                background: "var(--surface)",
                padding: 24,
                borderRadius: 16,
                border: "1px solid var(--border)",
                textAlign: "center",
              }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                Delete playlist?
              </h3>

              <p
                style={{
                  fontSize: 14,
                  color: "var(--muted)",
                  marginBottom: 24,
                  lineHeight: 1.4,
                }}
              >
                Are you sure you want to delete{" "}
                <strong>"{playlist.name}"</strong>? This action cannot be
                undone.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: 24,
                    background: "#e53935",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add songs modal */}
        {showAddSongsModal && playlist && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
              background: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              padding: 24,
              maxWidth: 500,
              margin: "auto",
              borderRadius: 16,
              border: "1px solid var(--border)",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3>Add Songs to {playlist.name}</h3>

              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowAddSongsModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 14,
                  color: "var(--muted)",
                }}
              />

              <input
                type="text"
                placeholder="Search songs or artists..."
                value={songSearchQuery}
                onChange={(e) => setSongSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 38px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "#fff",
                  outline: "none",
                }}
              />
            </div>

            {songSearchQuery.trim().length < 2 ? (
              <p
                className="search-empty-hint"
                style={{ textAlign: "center", padding: 24 }}
              >
                Search for a song or artist to add music to your playlist.
              </p>
            ) : searchLoading ? (
              <p
                className="search-empty-hint"
                style={{ textAlign: "center", padding: 24 }}
              >
                Searching for music...
              </p>
            ) : searchResults.length === 0 ? (
              <p
                className="search-empty-hint"
                style={{ textAlign: "center", padding: 24 }}
              >
                No matching songs found. Try another search.
              </p>
            ) : (
              <div className="search-results-list">
                {searchResults.map((song) => {
                  const inThisPlaylist = playlist.songs.some(
                    (item) => item.id === song.id
                  );

                  return (
                    <div className="collection-row" key={song.id}>
                      <SearchResultCard
                        song={song}
                        onClick={() => {}}
                      />

                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => toggleInPlaylist(playlist.id, song)}
                        style={{
                          background: inThisPlaylist
                            ? "var(--accent)"
                            : "var(--surface)",
                        }}
                        title={inThisPlaylist ? "Remove" : "Add"}
                        aria-label={
                          inThisPlaylist
                            ? `Remove ${song.title} from playlist`
                            : `Add ${song.title} to playlist`
                        }
                      >
                        {inThisPlaylist ? (
                          <Check size={16} />
                        ) : (
                          <Plus size={16} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Playlist artwork modal */}
        {showArtModal && playlist && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
              background: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 400,
                background: "var(--surface)",
                padding: 24,
                borderRadius: 16,
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                  Playlist Cover Artwork
                </h3>

                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowArtModal(false)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />

              <button
                type="button"
                className="collection-item"
                style={{
                  width: "100%",
                  padding: 16,
                  marginBottom: 16,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  cursor: "pointer",
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "var(--surface)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Upload size={20} />
                </div>

                <div style={{ textAlign: "left" }}>
                  <strong style={{ display: "block", fontSize: 15 }}>
                    Choose from files
                  </strong>

                  <small style={{ color: "var(--muted)", fontSize: 12 }}>
                    Upload image from device
                  </small>
                </div>
              </button>

              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid var(--border)",
                  margin: "16px 0",
                }}
              />

              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span className="sonari-sparkle" aria-hidden="true">
                    ✦
                  </span>

                  <strong style={{ fontSize: 15 }}>Create with AI</strong>
                </div>

                <form onSubmit={handleGenerateAiArt}>
                  <input
                    type="text"
                    placeholder="e.g., Cyberpunk rain, synthwave sunset..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "#121215",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "#fff",
                      marginBottom: 12,
                      outline: "none",
                    }}
                  />

                  <button
                    type="submit"
                    disabled={!aiPrompt.trim() || aiGenerating}
                    className="primary-btn"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    {aiGenerating
                      ? "Generating cover..."
                      : "Generate Artwork"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // Main Library view.
  return (
    <main className="library" style={{ position: "relative" }}>
      <div
        className="section-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1>Your Library</h1>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            padding: 8,
            display: "grid",
            placeItems: "center",
          }}
          aria-label="Create playlist"
          title="Create playlist"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

      <ul className="collection-list">
        <li>
          <button
            type="button"
            className="collection-item"
            onClick={() => openCollection(LIKED_ID)}
          >
            <span className="collection-cover liked">
              <Heart size={22} fill="currentColor" />
            </span>

            <span className="collection-text">
              <strong>Liked Songs</strong>

              <small>
                {likedSongs.length}{" "}
                {likedSongs.length === 1 ? "song" : "songs"}
              </small>
            </span>

            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </li>

        {playlists.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="collection-item"
              onClick={() => openCollection(item.id)}
            >
              <span
                className="collection-cover"
                style={{ overflow: "hidden" }}
              >
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : item.songs[0]?.image ? (
                  <img
                    src={item.songs[0].image}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <ListMusic size={22} />
                )}
              </span>

              <span className="collection-text">
                <strong>{item.name}</strong>

                <small>
                  {item.songs.length}{" "}
                  {item.songs.length === 1 ? "song" : "songs"}
                </small>
              </span>

              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {/* Create playlist modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setShowCreateModal(false)}
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
            }}
            aria-label="Close"
          >
            <X size={28} />
          </button>

          <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
            <h2 style={{ fontSize: 24, marginBottom: 24, fontWeight: 700 }}>
              Give your playlist a name
            </h2>

            <form onSubmit={handleCreateSubmit}>
              <input
                type="text"
                autoFocus
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                placeholder="My Playlist #1"
                style={{
                  width: "100%",
                  padding: 16,
                  fontSize: 18,
                  fontWeight: 600,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "#fff",
                  textAlign: "center",
                  outline: "none",
                  marginBottom: 24,
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "12px 24px", borderRadius: 24 }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!playlistTitle.trim()}
                  style={{
                    padding: "12px 28px",
                    borderRadius: 24,
                    background: "#ffffff",
                    color: "#141417",
                    border: "none",
                    fontWeight: 700,
                    cursor: playlistTitle.trim() ? "pointer" : "default",
                    opacity: playlistTitle.trim() ? 1 : 0.5,
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Library;
