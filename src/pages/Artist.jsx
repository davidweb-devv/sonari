
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Pause,
  Music2,
  Disc3,
  CalendarDays,
  Clock3,
} from "lucide-react";

import { usePlayer } from "../store/playerStore";
import { isSameTrack } from "../utils/trackUtils";

import {
  getSonariArtist,
  getSonariArtistTracks,
  getSonariArtistAlbums,
} from "../services/musicService";

import "./Artist.css";

function formatDuration(durationMs) {
  if (!durationMs) return "";

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getReleaseYear(date) {
  if (!date) return "";

  const year = new Date(date).getFullYear();

  return Number.isNaN(year) ? "" : year;
}

function Artist() {
  const { artistId } = useParams();
  const navigate = useNavigate();

  const play = usePlayer((state) => state.play);
  const currentSong = usePlayer((state) => state.song);
  const isPlaying = usePlayer((state) => state.isPlaying);

  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadArtistPage() {
      setIsLoading(true);
      setError("");
      setArtist(null);
      setTracks([]);
      setAlbums([]);

      try {
        const [artistData, trackData, albumData] =
          await Promise.all([
            getSonariArtist(artistId, {
              signal: controller.signal,
            }),
            getSonariArtistTracks(artistId, {
              signal: controller.signal,
            }),
            getSonariArtistAlbums(artistId, {
              signal: controller.signal,
            }),
          ]);

        if (controller.signal.aborted) return;

        if (!artistData) {
          setError("We couldn't find this artist.");
          setIsLoading(false);
          return;
        }

        setArtist(artistData);
        setTracks(trackData);
        setAlbums(albumData);
        setIsLoading(false);
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Artist page failed to load:", err);

        if (!controller.signal.aborted) {
          setError("Something went wrong loading this artist.");
          setIsLoading(false);
        }
      }
    }

    loadArtistPage();

    return () => controller.abort();
  }, [artistId]);

  function playArtistTracks(selectedTrack) {
    if (!tracks.length) return;

    play(selectedTrack, tracks);
  }

  const heroImage =
    artist?.image ||
    tracks[0]?.image ||
    "";

  if (isLoading) {
    return (
      <main className="artist-page">
        <div className="artist-loading">
          <div className="artist-loading-spinner" />
          <p>Loading artist...</p>
        </div>
      </main>
    );
  }

  if (error || !artist) {
    return (
      <main className="artist-page">
        <button
          className="artist-back-button"
          onClick={() => navigate(-1)}
          type="button"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="artist-error">
          <Music2 size={34} />
          <h2>Artist unavailable</h2>
          <p>{error || "This artist could not be found."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="artist-page">
      <button
        className="artist-back-button"
        onClick={() => navigate(-1)}
        type="button"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <section className="artist-hero">
        <div
          className="artist-hero-background"
          style={
            heroImage
              ? { backgroundImage: `url("${heroImage}")` }
              : {}
          }
        />

        <div className="artist-hero-content">
          <div className="artist-image-wrapper">
            {heroImage ? (
              <img
                src={heroImage}
                alt={`${artist.name} artwork`}
                className="artist-image"
              />
            ) : (
              <div className="artist-image-placeholder">
                <Music2 size={48} />
              </div>
            )}
          </div>

          <div className="artist-details">
            <span className="artist-verified-label">
              {artist.artistType || "Artist"}
            </span>

            <h1>{artist.name}</h1>

            <div className="artist-meta">
              {artist.genre && (
                <span>{artist.genre}</span>
              )}

              {tracks.length > 0 && (
                <span>
                  {tracks.length} tracks available
                </span>
              )}
            </div>

            {tracks.length > 0 && (
              <button
                className="artist-play-button"
                type="button"
                onClick={() => playArtistTracks(tracks[0])}
              >
                <Play size={17} fill="currentColor" />
                Play artist
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="artist-section">
        <div className="artist-section-heading">
          <div>
            <h2>Popular songs</h2>
            <p>Explore music from {artist.name}</p>
          </div>
        </div>

        {tracks.length > 0 ? (
          <div className="artist-track-list">
            {tracks.slice(0, 10).map((track, index) => {
              const active = isSameTrack(track, currentSong);
              const currentlyPlaying = active && isPlaying;

              return (
                <div
                  className={`artist-track ${
                    active ? "is-active" : ""
                  }`}
                  key={track.id}
                  onClick={() => playArtistTracks(track)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      playArtistTracks(track);
                    }
                  }}
                >
                  <span className="artist-track-number">
                    {active ? (
                      <span className="artist-track-playing">
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : (
                      index + 1
                    )}
                  </span>

                  <div className="artist-track-artwork">
                    {track.image ? (
                      <img
                        src={track.image}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <Music2 size={19} />
                    )}
                  </div>

                  <div className="artist-track-info">
                    <span className="artist-track-title">
                      {track.title}
                    </span>
                    <span className="artist-track-album">
                      {track.album}
                    </span>
                  </div>

                  <span className="artist-track-duration">
                    {formatDuration(track.durationMs)}
                  </span>

                  <button
                    className="artist-track-play"
                    type="button"
                    aria-label={
                      currentlyPlaying
                        ? `Pause ${track.title}`
                        : `Play ${track.title}`
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      playArtistTracks(track);
                    }}
                  >
                    {currentlyPlaying ? (
                      <Pause size={17} fill="currentColor" />
                    ) : (
                      <Play size={17} fill="currentColor" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="artist-empty">
            <Music2 size={25} />
            <p>No tracks are available for this artist yet.</p>
          </div>
        )}
      </section>

      <section className="artist-section">
        <div className="artist-section-heading">
          <div>
            <h2>Discography</h2>
            <p>Albums and releases</p>
          </div>
        </div>

        {albums.length > 0 ? (
          <div className="artist-album-grid">
            {albums.map((album) => {
              const year = getReleaseYear(album.releaseDate);

              return (
                <article
                  className="artist-album-card"
                  key={album.id}
                >
                  <div className="artist-album-artwork">
                    {album.image ? (
                      <img
                        src={album.image}
                        alt={`${album.title} cover`}
                        loading="lazy"
                      />
                    ) : (
                      <Disc3 size={34} />
                    )}
                  </div>

                  <div className="artist-album-info">
                    <h3>{album.title}</h3>

                    <div className="artist-album-meta">
                      {year && (
                        <span>
                          <CalendarDays size={12} />
                          {year}
                        </span>
                      )}

                      {album.trackCount && (
                        <span>
                          <Clock3 size={12} />
                          {album.trackCount} tracks
                        </span>
                      )}
                    </div>

                    <span className="artist-album-type">
                      {album.collectionType || "Release"}
                    </span>
                  </div>

                  {album.albumUrl && (
                    <a
                      className="artist-album-link"
                      href={album.albumUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${album.title} on Apple Music`}
                    >
                      <Play size={15} />
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="artist-empty">
            <Disc3 size={25} />
            <p>No releases are available for this artist yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default Artist;
