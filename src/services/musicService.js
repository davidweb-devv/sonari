
const ITUNES_BASE_URL = "https://itunes.apple.com";

function getProviderArtistId(artistId) {
  return String(artistId ?? "").replace(
    /^itunes-artist-/,
    ""
  );
}

function getLargeArtwork(url) {
  if (!url) return "";

  return url.replace(
    /\d+x\d+bb\.(jpg|png|webp)/i,
    "600x600bb.$1"
  );
}

async function requestItunes(
  endpoint,
  params = {},
  options = {}
) {
  const searchParams = new URLSearchParams(params);

  const response = await fetch(
    `${ITUNES_BASE_URL}/${endpoint}?${searchParams.toString()}`,
    { signal: options.signal }
  );

  if (!response.ok) {
    throw new Error(
      `iTunes request failed: ${response.status}`
    );
  }

  return response.json();
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getSearchScore(track, query) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = normalizedQuery
    .split(/\s+/)
    .filter(Boolean);

  const title = normalizeSearchText(track.title);
  const artist = normalizeSearchText(track.artist);
  const album = normalizeSearchText(track.album);

  let score = 0;

  if (title === normalizedQuery) score += 30;
  if (artist === normalizedQuery) score += 20;

  if (title.includes(normalizedQuery)) score += 15;
  if (artist.includes(normalizedQuery)) score += 10;

  tokens.forEach((token) => {
    if (title.split(" ").some((word) => word === token)) {
      score += 6;
    } else if (title.includes(token)) {
      score += 3;
    }

    if (artist.split(" ").some((word) => word === token)) {
      score += 6;
    } else if (artist.includes(token)) {
      score += 3;
    }

    if (album.includes(token)) {
      score += 1;
    }
  });

  return score;
}

function getArtistSearchScore(artist, query) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedName = normalizeSearchText(artist.name);

  const tokens = normalizedQuery
    .split(/\s+/)
    .filter(Boolean);

  let score = 0;

  if (normalizedName === normalizedQuery) {
    score += 100;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    score += 50;
  }

  if (normalizedName.includes(normalizedQuery)) {
    score += 25;
  }

  tokens.forEach((token) => {
    if (normalizedName.split(" ").includes(token)) {
      score += 10;
    } else if (normalizedName.includes(token)) {
      score += 5;
    }
  });

  return score;
}

function normalizeTrack(item) {
  return {
    id: `itunes-${item.trackId}`,

    provider: "itunes",
    providerTrackId: String(item.trackId),
    trackId: String(item.trackId),

    title: item.trackName || "Unknown track",
    artist: item.artistName || "Unknown artist",
    album: item.collectionName || "Single",

    artistId: item.artistId
      ? `itunes-artist-${item.artistId}`
      : null,

    albumId: item.collectionId
      ? `itunes-album-${item.collectionId}`
      : null,

    genres: item.primaryGenreName
      ? [item.primaryGenreName.toLowerCase()]
      : [],

    durationMs: item.trackTimeMillis ?? null,
    releaseDate: item.releaseDate ?? null,

    image: getLargeArtwork(
      item.artworkUrl600 ||
        item.artworkUrl100 ||
        item.artworkUrl60
    ),

    previewUrl: item.previewUrl ?? null,
    source: "itunes-preview",
  };
}

function normalizeArtist(item) {
  if (!item?.artistId) return null;

  return {
    id: `itunes-artist-${item.artistId}`,

    provider: "itunes",
    providerArtistId: String(item.artistId),

    name: item.artistName || "Unknown artist",
    genre: item.primaryGenreName || null,

    genres: item.primaryGenreName
      ? [item.primaryGenreName.toLowerCase()]
      : [],

    artistType: item.artistType || "Artist",
    artistUrl: item.artistLinkUrl || null,

    image: getLargeArtwork(
      item.artworkUrl600 ||
        item.artworkUrl100 ||
        item.artworkUrl60
    ),
  };
}

function normalizeAlbum(item) {
  if (!item?.collectionId) return null;

  return {
    id: `itunes-album-${item.collectionId}`,

    provider: "itunes",
    providerAlbumId: String(item.collectionId),

    title: item.collectionName || "Unknown album",
    artist: item.artistName || "Unknown artist",

    artistId: item.artistId
      ? `itunes-artist-${item.artistId}`
      : null,

    image: getLargeArtwork(item.artworkUrl100),

    releaseDate: item.releaseDate || null,
    trackCount: item.trackCount ?? null,
    genre: item.primaryGenreName || null,
    collectionType: item.collectionType || null,

    albumUrl: item.collectionViewUrl || null,
  };
}

// ----------------------------------------
// SEARCH SONGS
// ----------------------------------------

export async function searchSonariTracks(
  query,
  options = {}
) {
  const searchTerm = String(query ?? "").trim();

  if (!searchTerm) return [];

  try {
    const data = await requestItunes(
      "search",
      {
        term: searchTerm,
        entity: "song",
        limit: 50,
      },
      options
    );

    return (data.results ?? [])
      .filter((item) => item.trackId)
      .map(normalizeTrack)
      .map((track, index) => ({
        track,
        index,
        score: getSearchScore(track, searchTerm),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.index - b.index;
      })
      .slice(0, 12)
      .map((result) => result.track);
  } catch (error) {
    if (error.name === "AbortError") throw error;

    console.error(
      "Sonari music search failed:",
      error
    );

    return [];
  }
}

// ----------------------------------------
// SEARCH ARTISTS
// ----------------------------------------

export async function searchSonariArtists(
  query,
  options = {}
) {
  const searchTerm = String(query ?? "").trim();

  if (!searchTerm) return [];

  try {
    const data = await requestItunes(
      "search",
      {
        term: searchTerm,
        entity: "musicArtist",
        limit: 50,
      },
      options
    );

    return (data.results ?? [])
      .map(normalizeArtist)
      .filter(Boolean)
      .map((artist, index) => ({
        artist,
        index,
        score: getArtistSearchScore(
          artist,
          searchTerm
        ),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.index - b.index;
      })
      .map((result) => result.artist);
  } catch (error) {
    if (error.name === "AbortError") throw error;

    console.error(
      "Sonari artist search failed:",
      error
    );

    return [];
  }
}

// ----------------------------------------
// GET ARTIST INFORMATION
// ----------------------------------------

export async function getSonariArtist(
  artistId,
  options = {}
) {
  const providerArtistId = getProviderArtistId(artistId);

  if (!providerArtistId) return null;

  try {
    const data = await requestItunes(
      "lookup",
      {
        id: providerArtistId,
      },
      options
    );

    const artist = (data.results ?? []).find(
      (item) =>
        item.wrapperType === "artist" || item.artistId
    );

    return normalizeArtist(artist);
  } catch (error) {
    if (error.name === "AbortError") throw error;

    console.error(
      "Sonari artist lookup failed:",
      error
    );

    return null;
  }
}

// ----------------------------------------
// GET ARTIST ALBUMS
// ----------------------------------------

export async function getSonariArtistAlbums(
  artistId,
  options = {}
) {
  const providerArtistId = getProviderArtistId(artistId);

  if (!providerArtistId) return [];

  try {
    const data = await requestItunes(
      "lookup",
      {
        id: providerArtistId,
        entity: "album",
        limit: 200,
      },
      options
    );

    return (data.results ?? [])
      .filter((item) => item.collectionId)
      .map(normalizeAlbum)
      .filter(Boolean)
      .sort((a, b) => {
        const dateA = a.releaseDate
          ? new Date(a.releaseDate).getTime()
          : 0;

        const dateB = b.releaseDate
          ? new Date(b.releaseDate).getTime()
          : 0;

        return dateB - dateA;
      });
  } catch (error) {
    if (error.name === "AbortError") throw error;

    console.error(
      "Sonari artist albums failed:",
      error
    );

    return [];
  }
}

// ----------------------------------------
// GET ARTIST TRACKS
// ----------------------------------------

export async function getSonariArtistTracks(
  artistId,
  options = {}
) {
  const providerArtistId = getProviderArtistId(artistId);

  if (!providerArtistId) return [];

  try {
    const data = await requestItunes(
      "lookup",
      {
        id: providerArtistId,
        entity: "song",
        limit: 200,
      },
      options
    );

    return (data.results ?? [])
      .filter((item) => item.trackId)
      .map(normalizeTrack);
  } catch (error) {
    if (error.name === "AbortError") throw error;

    console.error(
      "Sonari artist tracks failed:",
      error
    );

    return [];
  }
}
