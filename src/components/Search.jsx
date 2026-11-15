
import { useEffect, useState } from "react";
import { Search, X, Music2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import SearchResultCard from "../components/SearchResultCard";
import ActiveTrackIndicator from "../components/ActiveTrackIndicator";
import { readStorage, writeStorage } from "../utils/storage";
import { usePlayer } from "../store/playerStore";
import { isSameTrack } from "../utils/trackUtils";
import {
  searchSonariTracks,
  searchSonariArtists,
} from "../services/musicService";

const STORAGE_KEY = "sonari-recent-searches";
const MAX_RECENT_SEARCHES = 9;
const MAX_ARTIST_SUGGESTIONS = 5;

const GENRES = [
  "Afrobeats",
  "R&B",
  "Rap",
  "Hip-Hop",
  "Soul",
  "Electronic",
  "Pop",
  "Chill",
];

function loadRecentSearches() {
  const saved = readStorage(STORAGE_KEY, []);

  if (!Array.isArray(saved)) return [];

  return saved
    .map((item) => {
      if (typeof item === "string") {
        return {
          term: item,
          artist: "",
          image: "",
        };
      }

      if (item && typeof item.term === "string") {
        return {
          term: item.term,
          artist: item.artist || "",
          image: item.image || "",
        };
      }

      return null;
    })
    .filter(Boolean)
    .slice(0, MAX_RECENT_SEARCHES);
}

function buildMixedResults(songs, artists) {
  const results = [];
  let artistIndex = 0;

  songs.forEach((song, index) => {
    results.push({
      type: "song",
      data: song,
    });

    if (
      (index + 1) % 2 === 0 &&
      artists[artistIndex]
    ) {
      results.push({
        type: "artist",
        data: artists[artistIndex],
      });

      artistIndex += 1;
    }
  });

  while (artistIndex < artists.length) {
    results.push({
      type: "artist",
      data: artists[artistIndex],
    });

    artistIndex += 1;
  }

  if (songs.length === 0) {
    return artists.map((artist) => ({
      type: "artist",
      data: artist,
    }));
  }

  return results;
}

function buildRecentSearchQuery(item) {
  const title = item.term?.trim() || "";
  const artist = item.artist?.trim() || "";

  if (!title) return "";
  if (!artist) return title;

  return `${title} ${artist}`;
}

function SearchPage() {
  const play = usePlayer((state) => state.play);
  const currentSong = usePlayer((state) => state.song);
  const isPlaying = usePlayer((state) => state.isPlaying);

  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState("songs");

  const [recentSearches, setRecentSearches] = useState(
    loadRecentSearches
  );

  const [searchResults, setSearchResults] = useState([]);
  const [songResults, setSongResults] = useState([]);
  const [artistResults, setArtistResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchTerm = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  useEffect(() => {
    writeStorage(STORAGE_KEY, recentSearches);
  }, [recentSearches]);

  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setSearchResults([]);
      setSongResults([]);
      setArtistResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setSearchResults([]);
    setSongResults([]);
    setArtistResults([]);

    const timer = setTimeout(async () => {
      try {
        const [songs, artists] = await Promise.all([
          searchSonariTracks(term, {
            signal: controller.signal,
          }),
          searchSonariArtists(term, {
            signal: controller.signal,
          }),
        ]);

        if (controller.signal.aborted) return;

        // Use song artwork to enrich matching artist results
        // whenever iTunes doesn't provide artist artwork.
        const artworkByArtist = new Map();

        songs.forEach((song) => {
          if (song.artistId && song.image) {
            if (!artworkByArtist.has(song.artistId)) {
              artworkByArtist.set(
                song.artistId,
                song.image
              );
            }
          }
        });

        const enrichedArtists = artists.map((artist) => ({
          ...artist,
          image:
            artist.image ||
            artworkByArtist.get(artist.id) ||
            "",
        }));

        const artistSuggestions = enrichedArtists.slice(
          0,
          MAX_ARTIST_SUGGESTIONS
        );

        setSongResults(songs);
        setArtistResults(enrichedArtists);

        setSearchResults(
          buildMixedResults(songs, artistSuggestions)
        );

        setIsLoading(false);
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Search failed:", error);

        if (!controller.signal.aborted) {
          setSearchResults([]);
          setSongResults([]);
          setArtistResults([]);
          setIsLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function saveSearch(name, image = "", artist = "") {
    const trimmedName = name?.trim();

    if (!trimmedName) return;

    const newItem = {
      term: trimmedName,
      artist: artist || "",
      image: image || "",
    };

    setRecentSearches((current) =>
      [
        newItem,
        ...current.filter(
          (item) =>
            !(
              item.term.toLowerCase() ===
                trimmedName.toLowerCase() &&
              (item.artist || "").toLowerCase() ===
                (artist || "").toLowerCase()
            )
        ),
      ].slice(0, MAX_RECENT_SEARCHES)
    );
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) return;

    setQuery(trimmedQuery);
  }

  function removeRecentSearch(search, artist = "") {
    setRecentSearches((current) =>
      current.filter(
        (item) =>
          !(
            item.term === search &&
            (item.artist || "") === artist
          )
      )
    );
  }

  function clearRecentSearches() {
    setRecentSearches([]);
  }

  function openArtist(artist) {
    saveSearch(artist.name, artist.image);

    navigate(
      `/artist/${encodeURIComponent(artist.id)}`
    );
  }

  function handleResultClick(result) {
    if (result.type === "artist") {
      openArtist(result.data);
      return;
    }

    const selectedSong = result.data;

    saveSearch(
      selectedSong.title,
      selectedSong.image,
      selectedSong.artist
    );

    play(selectedSong, songResults);
  }

  const visibleResults =
    searchMode === "artists"
      ? artistResults.map((artist) => ({
          type: "artist",
          data: artist,
        }))
      : searchResults;

  return (
    <main className="search-page">
      <div className="search-header">
        <h1>Search</h1>

        <form
          className="search-bar"
          role="search"
          onSubmit={handleSearchSubmit}
        >
          <Search size={20} aria-hidden="true" />

          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck="false"
            aria-label="Search songs and artists"
            placeholder={
              searchMode === "artists"
                ? "Search for an artist..."
                : "What do you want to listen to?"
            }
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />

          {query && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </form>

        <div
          className="search-mode-switch"
          role="tablist"
          aria-label="Search category"
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "14px",
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={searchMode === "songs"}
            onClick={() => setSearchMode("songs")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 15px",
              borderRadius: "20px",
              border: "1px solid var(--border)",
              background:
                searchMode === "songs"
                  ? "var(--accent, #7f109b)"
                  : "var(--surface)",
              color: "var(--text)",
              font: "inherit",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            <Music2 size={15} />
            Songs
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={searchMode === "artists"}
            onClick={() => setSearchMode("artists")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 15px",
              borderRadius: "20px",
              border: "1px solid var(--border)",
              background:
                searchMode === "artists"
                  ? "var(--accent, #7f109b)"
                  : "var(--surface)",
              color: "var(--text)",
              font: "inherit",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            <Users size={15} />
            Artists
          </button>
        </div>
      </div>

      {searchTerm && (
        <section className="search-results">
          <div className="section-result">
            <h2>
              {searchMode === "artists"
                ? "Artists"
                : "Results"}

              {isLoading && (
                <span className="search-loading">
                  {" "} (Searching...)
                </span>
              )}
            </h2>
          </div>

          {visibleResults.length > 0 && (
            <div className="search-results-list">
              {visibleResults.map((result) => (
                <SearchResultCard
                  key={`${result.type}-${result.data.id}`}
                  type={result.type}
                  song={
                    result.type === "song"
                      ? result.data
                      : null
                  }
                  artist={
                    result.type === "artist"
                      ? result.data
                      : null
                  }
                  onClick={() =>
                    handleResultClick(result)
                  }
                />
              ))}
            </div>
          )}

          {!isLoading && visibleResults.length === 0 && (
            <div role="status">
              <p className="search-empty">
                No{" "}
                {searchMode === "artists"
                  ? "artists"
                  : "results"}{" "}
                found for "{query.trim()}"
              </p>

              <p className="search-empty-hint">
                {searchMode === "artists"
                  ? "Try another spelling or search using more of the artist's name."
                  : "Check the spelling, or try another song or genre."}
              </p>
            </div>
          )}
        </section>
      )}

      {!searchTerm && recentSearches.length > 0 && (
        <section className="recent-searches">
          <div className="section-header">
            <div>
              <h2>Recent Searches</h2>
            </div>

            <button
              type="button"
              className="clear-recent-searches"
              onClick={clearRecentSearches}
            >
              Clear
            </button>
          </div>

          <div className="recent-search-list">
            {recentSearches.map((item, index) => {
              const recentTrack = item.artist
                ? {
                    title: item.term,
                    artist: item.artist,
                  }
                : null;

              const isCurrentTrack =
                recentTrack &&
                isSameTrack(recentTrack, currentSong);

              return (
                <div
                  className={`recent-search-card ${
                    isCurrentTrack
                      ? "is-current-track"
                      : ""
                  }`}
                  key={`${item.term}-${item.artist}-${index}`}
                >
                  <button
                    type="button"
                    className="recent-search-content"
                    onClick={() =>
                      setQuery(
                        buildRecentSearchQuery(item)
                      )
                    }
                  >
                    <div className="recent-search-artwork recent-search-placeholder">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <Search size={20} />
                      )}
                    </div>

                    <div className="recent-search-info">
                      <span className="recent-search-title">
                        {item.term}
                      </span>

                      {item.artist && (
                        <span className="recent-search-artist">
                          {item.artist}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="recent-search-actions">
                    {isCurrentTrack && (
                      <ActiveTrackIndicator
                        isPlaying={isPlaying}
                      />
                    )}

                    <button
                      type="button"
                      className="remove-search"
                      onClick={() =>
                        removeRecentSearch(
                          item.term,
                          item.artist
                        )
                      }
                      aria-label={`Remove ${item.term}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!searchTerm && (
        <section className="browse-section">
          <div className="section-header">
            <h2>Browse</h2>
          </div>

          <div className="browse-grid">
            {GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                className="browse-card"
                onClick={() => {
                  setSearchMode("songs");
                  setQuery(genre);
                }}
              >
                {genre}
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default SearchPage;
