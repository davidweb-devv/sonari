export async function getPreviewUrl(song) {
  const name = song.title.replace(/\s*ft\..*/i, "");
  const term = encodeURIComponent(`${name} ${song.artist}`);
  const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=5`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes returned ${res.status}`);

  const data = await res.json();
  const firstWord = song.artist.toLowerCase().split(" ")[0];

  const match =
    data.results.find(
      (r) => r.previewUrl && r.artistName.toLowerCase().includes(firstWord)
    ) ?? data.results.find((r) => r.previewUrl);

  return match?.previewUrl ?? null;
}