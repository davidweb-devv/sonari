import { useState, useEffect } from "react";
import {
  MoreVertical,
  Share2,
  Plus,
  MinusCircle,
  ListPlus,
  ListOrdered,
  Disc,
  User,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import { usePlayer } from "../store/playerStore";
import { useLibrary } from "../store/libraryStore";
import { useNavigation } from "../store/NavigationStore";

function SongActionMenu({ song, playlistId }) {
  const [open, setOpen] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [touchStartY, setTouchStartY] = useState(null);
  const [translateY, setTranslateY] = useState(0);

  const playNext = usePlayer((s) => s.playNext);
  const addToQueue = usePlayer((s) => s.addToQueue);

  const toggleLike = useLibrary((s) => s.toggleLike);
  const toggleInPlaylist = useLibrary((s) => s.toggleInPlaylist);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const playlists = useLibrary((s) => s.playlists);

  const liked = useLibrary((s) =>
    s.likedSongs.some((item) => item.id === song?.id)
  );

  const { filterByArtist, filterByAlbum } = useNavigation();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!song) return null;

  function handleClose() {
    setOpen(false);
    setShowPlaylistPicker(false);
    setNewPlaylistName("");
    setTranslateY(0);
    setTouchStartY(null);
  }

  function handleTouchStart(event) {
    setTouchStartY(event.touches[0].clientY);
  }

  function handleTouchMove(event) {
    if (touchStartY === null) return;

    const currentY = event.touches[0].clientY;
    const difference = currentY - touchStartY;

    if (difference > 0) {
      setTranslateY(difference);
    }
  }

  function handleTouchEnd() {
    if (translateY > 80) {
      handleClose();
    } else {
      setTranslateY(0);
    }

    setTouchStartY(null);
  }

  async function handleShare() {
    const text = `${song.title} by ${song.artist}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Sonari",
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Sharing may be cancelled by the user.
    }

    handleClose();
  }

  function handleAddToPlaylist(playlist) {
    const alreadyAdded = playlist.songs?.some(
      (item) => item.id === song.id
    );

    // Avoid toggling a song off if it is already in the playlist.
    if (!alreadyAdded) {
      toggleInPlaylist(playlist.id, song);
    }

    handleClose();
  }

  function handleCreatePlaylist(event) {
    event.preventDefault();

    const name = newPlaylistName.trim();
    if (!name) return;

    const playlistId = createPlaylist(name, song);

    if (playlistId) {
      handleClose();
    }
  }

  return (
    <>
      <button
        type="button"
        className="icon-btn small"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label="Song options"
        title="Options"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          style={overlayStyle}
          onClick={handleClose}
        >
          <div
            style={{
              ...sheetStyle,
              transform: `translateY(${translateY}px)`,
              transition:
                touchStartY !== null
                  ? "none"
                  : "transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1)",
            }}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div style={dragHandleStyle} />

            {showPlaylistPicker ? (
              <>
                <div style={pickerHeaderStyle}>
                  <button
                    type="button"
                    style={backButtonStyle}
                    onClick={() => setShowPlaylistPicker(false)}
                    aria-label="Back to song options"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={headingStyle}>Add to playlist</h3>
                    <p style={subheadingStyle}>
                      Choose where to save this song
                    </p>
                  </div>

                  <button
                    type="button"
                    style={backButtonStyle}
                    onClick={handleClose}
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form
                  onSubmit={handleCreatePlaylist}
                  style={createPlaylistStyle}
                >
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(event) =>
                      setNewPlaylistName(event.target.value)
                    }
                    placeholder="Create a new playlist"
                    aria-label="New playlist name"
                    maxLength={60}
                    style={playlistInputStyle}
                  />

                  <button
                    type="submit"
                    disabled={!newPlaylistName.trim()}
                    style={{
                      ...createButtonStyle,
                      opacity: newPlaylistName.trim() ? 1 : 0.45,
                    }}
                    aria-label="Create playlist"
                  >
                    <Plus size={20} />
                  </button>
                </form>

                <div style={playlistListStyle}>
                  {playlists.length === 0 ? (
                    <p style={emptyStateStyle}>
                      You haven't created any playlists yet. Create one above
                      to save this song.
                    </p>
                  ) : (
                    playlists.map((playlist) => {
                      const alreadyAdded = playlist.songs?.some(
                        (item) => item.id === song.id
                      );

                      return (
                        <button
                          key={playlist.id}
                          type="button"
                          style={{
                            ...playlistRowStyle,
                            opacity: alreadyAdded ? 0.7 : 1,
                          }}
                          onClick={() =>
                            handleAddToPlaylist(playlist)
                          }
                        >
                          <div style={playlistIconStyle}>
                            <ListPlus size={20} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={playlistNameStyle}>
                              {playlist.name}
                            </span>
                            <span style={playlistCountStyle}>
                              {playlist.songs?.length || 0} songs
                            </span>
                          </div>

                          {alreadyAdded && (
                            <Check
                              size={19}
                              color="#c98be0"
                              aria-label="Already added"
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={songHeaderStyle}>
                  <img
                    src={song.image}
                    alt=""
                    style={songImageStyle}
                  />

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={songTitleStyle}>{song.title}</h4>
                    <p style={songArtistStyle}>{song.artist}</p>
                  </div>
                </div>

                <div style={actionListStyle}>
                  <ActionButton
                    icon={<Share2 size={20} />}
                    label="Share"
                    onClick={handleShare}
                  />

                  <ActionButton
                    icon={liked ? <MinusCircle size={20} /> : <Plus size={20} />}
                    label={
                      liked
                        ? "Remove from Liked Songs"
                        : "Add to Liked Songs"
                    }
                    onClick={() => {
                      toggleLike(song);
                      handleClose();
                    }}
                  />

                  <ActionButton
                    icon={<ListPlus size={20} />}
                    label="Add to Playlist"
                    onClick={() => setShowPlaylistPicker(true)}
                  />

                  {playlistId && (
                    <ActionButton
                      icon={<MinusCircle size={20} />}
                      label="Remove from this playlist"
                      onClick={() => {
                        toggleInPlaylist(playlistId, song);
                        handleClose();
                      }}
                    />
                  )}

                  <ActionButton
                    icon={<ListOrdered size={20} />}
                    label="Play Next"
                    onClick={() => {
                      playNext(song);
                      handleClose();
                    }}
                  />

                  <ActionButton
                    icon={<ListPlus size={20} />}
                    label="Add to Queue"
                    onClick={() => {
                      addToQueue(song);
                      handleClose();
                    }}
                  />

                  <div style={separatorStyle} />

                  <ActionButton
                    icon={<Disc size={20} />}
                    label="Go to album"
                    onClick={() => {
                      handleClose();
                      filterByAlbum(song.album || song.title);
                    }}
                  />

                  <ActionButton
                    icon={<User size={20} />}
                    label="Go to artist"
                    onClick={() => {
                      handleClose();
                      filterByArtist(song.artist);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      className="queue-item"
      style={actionRowStyle}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(0,0,0,0.75)",
  backdropFilter: "blur(8px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  animation: "fadeIn 0.15s ease-out",
};

const sheetStyle = {
  background: "#18181c",
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: "16px 20px 36px",
  maxHeight: "85vh",
  overflowY: "auto",
  boxShadow: "0 -10px 40px rgba(0,0,0,0.6)",
  border: "1px solid rgba(255,255,255,0.08)",
  touchAction: "pan-y",
};

const dragHandleStyle = {
  width: 36,
  height: 5,
  background: "rgba(255,255,255,0.3)",
  borderRadius: 3,
  margin: "0 auto 20px",
  cursor: "grab",
};

const songHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 20,
  paddingBottom: 16,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const songImageStyle = {
  width: 52,
  height: 52,
  borderRadius: 8,
  objectFit: "cover",
};

const songTitleStyle = {
  fontSize: 16,
  fontWeight: 700,
  margin: "0 0 4px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: "#fff",
};

const songArtistStyle = {
  fontSize: 13,
  color: "var(--muted)",
  margin: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const actionListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const actionRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "12px 14px",
  fontSize: 15,
  fontWeight: 500,
  color: "#e1e1e6",
  background: "transparent",
  border: "none",
  width: "100%",
  textAlign: "left",
  borderRadius: 8,
  cursor: "pointer",
};

const separatorStyle = {
  height: 1,
  background: "rgba(255,255,255,0.06)",
  margin: "8px 0",
};

const pickerHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 20,
};

const backButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  flexShrink: 0,
  border: "none",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.07)",
  color: "#fff",
  cursor: "pointer",
};

const headingStyle = {
  margin: 0,
  color: "#fff",
  fontSize: 17,
  fontWeight: 700,
};

const subheadingStyle = {
  margin: "4px 0 0",
  color: "var(--muted)",
  fontSize: 13,
};

const createPlaylistStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 18,
};

const playlistInputStyle = {
  flex: 1,
  minWidth: 0,
  height: 46,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  outline: "none",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontSize: 14,
};

const createButtonStyle = {
  width: 46,
  height: 46,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: 10,
  background: "#7f109b",
  color: "#fff",
  cursor: "pointer",
};

const playlistListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  maxHeight: "45vh",
  overflowY: "auto",
};

const playlistRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "11px 8px",
  border: "none",
  borderRadius: 10,
  background: "transparent",
  color: "#fff",
  textAlign: "left",
  cursor: "pointer",
};

const playlistIconStyle = {
  width: 42,
  height: 42,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  background: "rgba(255,255,255,0.08)",
  color: "#c98be0",
  flexShrink: 0,
};

const playlistNameStyle = {
  display: "block",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const playlistCountStyle = {
  display: "block",
  marginTop: 3,
  color: "var(--muted)",
  fontSize: 12,
};

const emptyStateStyle = {
  color: "var(--muted)",
  fontSize: 13,
  lineHeight: 1.5,
  textAlign: "center",
  padding: "20px 12px",
};

export default SongActionMenu;