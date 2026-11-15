export function isSameTrack(first, second) {
  if (!first || !second) return false;

  const firstId = first.id ?? first.trackId ?? first.track_id;
  const secondId = second.id ?? second.trackId ?? second.track_id;

  // First, compare IDs when they match.
  if (
    firstId != null &&
    secondId != null &&
    String(firstId) === String(secondId)
  ) {
    return true;
  }

  // Fall back to title and artist when IDs differ.
  const normalize = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const firstTitle = normalize(first.title);
  const secondTitle = normalize(second.title);

  const firstArtist = normalize(first.artist);
  const secondArtist = normalize(second.artist);

  return (
    firstTitle !== "" &&
    firstArtist !== "" &&
    firstTitle === secondTitle &&
    firstArtist === secondArtist
  );
}