// Ranks dynamically supplied songs based on listening similarity.
// Matching genres contribute once each, while matching artists
// receive double weight.

export function getRecommendations({
  played = [],
  candidates = [],
  exclude = [],
  limit = 6,
} = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const genreScore = {};
  const artistScore = {};

  played.forEach((song) => {
    (song.genres ?? []).forEach((genre) => {
      const normalizedGenre = genre.toLowerCase();

      genreScore[normalizedGenre] =
        (genreScore[normalizedGenre] ?? 0) + 1;
    });

    if (song.artist) {
      const normalizedArtist = song.artist.toLowerCase();

      artistScore[normalizedArtist] =
        (artistScore[normalizedArtist] ?? 0) + 1;
    }
  });

  const excludedIds = new Set(
    exclude.map((song) => song.id)
  );

  return candidates
    .filter(
      (song) =>
        song &&
        song.id &&
        !excludedIds.has(song.id)
    )
    .map((song, index) => {
      const genreMatch = (song.genres ?? []).reduce(
        (sum, genre) =>
          sum + (genreScore[genre.toLowerCase()] ?? 0),
        0
      );

      const artistMatch = song.artist
        ? (artistScore[song.artist.toLowerCase()] ?? 0) * 2
        : 0;

      return {
        song,
        index,
        score: genreMatch + artistMatch,
      };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(0, limit))
    .map((item) => item.song);
}