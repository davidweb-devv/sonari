// Placeholder catalogue. `genres` powers search and the Browse tiles.
// Genre tags are first-pass guesses: correct them as you see fit.

export const recentlyPlayed = [
  {
    id: 1,
    title: "Tell Everybody ft. Leon Thomas",
    artist: "Davido",
    image: "/artwork/davido.jpeg",
    genres: ["afrobeats", "r&b"],
  },
  {
    id: 2,
    title: "Ice Cream",
    artist: "Mavo",
    image: "/artwork/mavo.jpeg",
    genres: ["afrobeats", "r&b"],
  },
  {
    id: 3,
    title: "Understand",
    artist: "OMAH LAY",
    image: "/artwork/omah lay.jpeg",
    genres: ["afrobeats", "r&b"],
  },
  {
    id: 4,
    title: "Oh No",
    artist: "Rema",
    image: "/artwork/rema.jpeg",
    genres: ["afrobeats", "pop"],
  },
  {
    id: 5,
    title: "Slick",
    artist: "Victony",
    image: "/artwork/victony.jpeg",
    genres: ["afrobeats", "r&b"],
  },
  {
    id: 6,
    title: "BIG PERFORMER",
    artist: "Blaqbonez",
    image: "/artwork/blaqbonez.jpeg",
    genres: ["rap", "hip-hop"],
  },
];

export const madeForYou = [
  {
    id: 7,
    title: "Late Night Drive",
    artist: "Sonari Mix",
    image: "/artwork/davido.jpeg",
    genres: ["r&b", "chill"],
  },
  {
    id: 8,
    title: "Easy Afrobeats",
    artist: "Sonari Mix",
    image: "/artwork/rema.jpeg",
    genres: ["afrobeats", "chill"],
  },
  {
    id: 9,
    title: "Slow and Familiar",
    artist: "Sonari Mix",
    image: "/artwork/mavo.jpeg",
    genres: ["soul", "chill"],
  },
  {
    id: 10,
    title: "Your Kind of R&B",
    artist: "Sonari Mix",
    image: "/artwork/raye.jpeg",
    genres: ["r&b", "soul"],
  },
];

export const basedOnListening = [
  {
    id: 11,
    title: "Everything",
    artist: "Victony",
    image: "/artwork/everything.jpeg",
    genres: ["afrobeats", "r&b"],
  },
  {
    id: 12,
    title: "Free Fall ft. J. Cole",
    artist: "Tems",
    image: "/artwork/tems.jpeg",
    genres: ["r&b", "soul"],
  },
  {
    id: 13,
    title: "Franchise ft. Young Thug & Mia",
    artist: "Travis Scott",
    image: "/artwork/travis.jpeg",
    genres: ["rap", "hip-hop"],
  },
  {
    id: 14,
    title: "WHERE IS MY HUSBAND!",
    artist: "RAYE",
    image: "/artwork/raye.jpeg",
    genres: ["soul", "pop"],
  },
];

export const allSongs = [
  ...recentlyPlayed,
  ...madeForYou,
  ...basedOnListening,
];
