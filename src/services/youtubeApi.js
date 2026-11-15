// src/services/youtubeApi.js

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export async function searchYouTubeMusic(query) {
  if (!YOUTUBE_API_KEY) {
    console.error("Missing VITE_YOUTUBE_API_KEY in environment variables.");
    return [];
  }

  // Append 'official audio' to lean heavily towards studio tracks rather than live/vlogs
  const refinedQuery = `${query} official audio`;

  const url = `${BASE_URL}/search?part=snippet&type=video&videoCategoryId=10&maxResults=12&q=${encodeURIComponent(
    refinedQuery
  )}&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Map YouTube search results into Sonari's clean track object format
    return data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title
        .replace(/(&quot;)/g, '"')
        .replace(/(&amp;)/g, '&')
        .replace(/&#39;/g, "'"),
      artist: item.snippet.channelTitle.replace(" - Topic", "").replace("VEVO", "").trim(),
      image: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      source: 'youtube_music',
    }));
  } catch (err) {
    console.error("Error fetching from YouTube Music API:", err);
    return [];
  }
}