const normalize = (value) =>
  String(value ?? "").toLowerCase().trim();

function getGenres(song) {
  const genres = song?.genres ?? [];

  return (Array.isArray(genres) ? genres : [genres])
    .map(normalize);
}

function getSongKey(song) {
  return String(song?.id ?? song?.title ?? "");
}

function getLikedKeys(libraryState = {}) {
  return new Set(
    (libraryState.likedSongs ?? []).map((item) =>
      typeof item === "string" ? item : getSongKey(item)
    )
  );
}

function getPromptGenres(query) {
  if (/chill|relax|mellow|slow|calm|late.?night/.test(query)) {
    return ["chill", "r&b", "soul", "afrobeats"];
  }

  if (/party|energy|hype|upbeat|workout|gym/.test(query)) {
    return ["rap", "hip-hop", "afrobeats", "pop"];
  }

  if (/afrobeats|afro-fusion|african|naija|nigerian/.test(query)) {
    return ["afrobeats", "afro-fusion"];
  }

  if (/focus|coding|study|work|concentrat/.test(query)) {
    return ["chill", "instrumental", "ambient", "soul"];
  }

  if (/sad|heartbreak|emotional|lonely/.test(query)) {
    return ["r&b", "soul", "chill"];
  }

  return [];
}

function rankSongs(
  prompt,
  playerState = {},
  libraryState = {},
  candidates = []
) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const query = normalize(prompt);
  const genres = getPromptGenres(query);
  const playCounts = playerState.playCounts ?? {};
  const likedKeys = getLikedKeys(libraryState);

  const recentSongs = [
    ...(playerState.played ?? []),
    ...(playerState.history ?? []),
    ...(playerState.song ? [playerState.song] : []),
  ];

  const recentKeys = new Set(recentSongs.map(getSongKey));

  const ranked = candidates
    .filter((song) => song && song.id)
    .map((song) => {
      const songGenres = getGenres(song);
      const title = normalize(song.title);
      const artist = normalize(song.artist);
      const key = getSongKey(song);

      let score = Math.random() * 0.5;

      if (genres.some((genre) => songGenres.includes(genre))) {
        score += 5;
      }

      if (query && title && query.includes(title)) score += 4;
      if (query && artist && query.includes(artist)) score += 3;

      if (likedKeys.has(key)) score += 2;

      score +=
        Math.min(Number(playCounts[song.id] ?? 0), 10) * 0.2;

      if (recentKeys.has(key)) score -= 2;

      return { song, score };
    });

  return ranked
    .sort((a, b) => b.score - a.score)
    .map((item) => item.song);
}

export function processAiPrompt(
  prompt = "",
  playerState = {},
  libraryState = {},
  candidates = []
) {
  const query = normalize(prompt);

  const totalPlays = Object.values(
    playerState.playCounts ?? {}
  ).reduce(
    (sum, count) => sum + (Number(count) || 0),
    0
  );

  const likedCount = libraryState.likedSongs?.length ?? 0;

  if (/stats|taste|profile|what do i listen/.test(query)) {
    return {
      type: "text",
      message:
        `Your current play counts total ${totalPlays} plays, ` +
        `and you have ${likedCount} liked songs. ` +
        "As you listen and save more music, Sonari can use that activity to improve recommendations.",
      songs: [],
    };
  }

  const songs = rankSongs(
    query,
    playerState,
    libraryState,
    candidates
  ).slice(0, 5);

  if (!songs.length) {
    return {
      type: "text",
      message:
        "I couldn't find suitable tracks in the current catalog. Try another vibe or search for an artist.",
      songs: [],
    };
  }

  let message = "Here are some tracks to get your session started.";

  if (!query) {
    message =
      "Your AI DJ is ready. Here's a fresh selection from the available catalog.";
  } else if (/chill|relax|mellow|slow|calm|late.?night/.test(query)) {
    message = "Here's a mellow selection for your session.";
  } else if (/party|energy|hype|upbeat|workout|gym/.test(query)) {
    message = "Here's a higher-energy selection for your session.";
  } else if (/focus|coding|study|work|concentrat/.test(query)) {
    message = "Here's a selection for your focus session.";
  } else if (/afrobeats|afro-fusion|african|naija|nigerian/.test(query)) {
    message =
      "Here's an Afrobeats-inspired selection from the available catalog.";
  }

  return {
    type: "playlist",
    message,
    songs,
  };
}