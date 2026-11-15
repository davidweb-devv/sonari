
import { create } from "zustand";
import { persist } from "zustand/middleware";

let sleepTimerId = null;

function withQid(song) {
  if (!song) return null;

  return {
    ...song,
    qid:
      song.qid ||
      `${song.id}-${Math.random().toString(36).substring(2, 9)}`,
  };
}

function shuffled(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function getArtistKey(song) {
  if (song?.artistId) return String(song.artistId);

  if (song?.artist) {
    return `artist:${song.artist.trim().toLowerCase()}`;
  }

  return null;
}

export const usePlayer = create(
  persist(
    (set, get) => ({
      // Player state
      song: null,
      isPlaying: false,
      isFullPlayerOpen: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
      repeat: "off",
      shuffle: false,
      status: "idle",
      seekTo: null,
      sleepMinutes: 0,

      // Queue and playback history
      upNext: [],
      history: [],
      played: [],
      context: [],

      // Listening statistics
      listeningEvents: [],
      playCounts: {},
      artistPlayCounts: {},

      // Record a qualified listening session once.
      recordListening: (song, sessionId, listenedSeconds) => {
        if (!song || !sessionId) return;

        set((state) => {
          const alreadyRecorded = state.listeningEvents.some(
            (event) => event.sessionId === sessionId
          );

          if (alreadyRecorded) return {};

          const artistKey = getArtistKey(song);
          const songKey = String(song.id);

          const event = {
  id: sessionId,
  sessionId,
  songId: song.id,
  title: song.title,
  artist: song.artist,
  image: song.image,
  previewUrl: song.previewUrl || null,
  album: song.album || "",
  artistId: song.artistId || null,
  durationMs: song.durationMs || null,
  source: song.source || null,
  playedAt: new Date().toISOString(),
  listenedSeconds,
};

          return {
            listeningEvents: [
              ...state.listeningEvents,
              event,
            ],
            playCounts: {
              ...state.playCounts,
              [songKey]: (state.playCounts[songKey] || 0) + 1,
            },
            artistPlayCounts: artistKey
              ? {
                  ...state.artistPlayCounts,
                  [artistKey]:
                    (state.artistPlayCounts[artistKey] || 0) + 1,
                }
              : state.artistPlayCounts,
          };
        });
      },

      // Full-player visibility
      openFull: () => set({ isFullPlayerOpen: true }),
      closeFull: () => set({ isFullPlayerOpen: false }),

      // Start a song and establish its listening context.
      play: (songToPlay, list = []) => {
        if (!songToPlay) return;

        const state = get();
        const activeList = list.length > 0 ? list : [songToPlay];

        const index = activeList.findIndex(
          (item) => item.id === songToPlay.id
        );

        const before = index > 0 ? activeList.slice(0, index) : [];
        const after = index >= 0 ? activeList.slice(index + 1) : [];

        set({
          song: withQid(songToPlay),
          upNext: (state.shuffle ? shuffled(after) : after).map(withQid),
          history: before.map(withQid),
          context: activeList,
          played: state.song
            ? [...state.played, state.song].slice(-40)
            : state.played,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
          seekTo: null,
          status: "loading",
        });
      },

      pause: () => set({ isPlaying: false }),

      resume: () => {
        if (get().song) {
          set({ isPlaying: true });
        }
      },

      togglePlay: () =>
        set((state) => ({
          isPlaying: !state.isPlaying,
        })),

      // Playback progress and seeking
      setTime: (currentTime, duration) =>
        set((state) => ({
          currentTime,
          duration: duration || state.duration,
        })),

      seek: (time) => set({ seekTo: time }),

      clearSeek: () => set({ seekTo: null }),

      setStatus: (status) => set({ status }),

      // Volume
      setVolume: (volume) =>
        set({
          volume: Math.max(0, Math.min(1, volume)),
          isMuted: volume === 0,
        }),

      toggleMute: () =>
        set((state) => ({
          isMuted: !state.isMuted,
        })),

      // Repeat and shuffle
      toggleRepeat: () =>
        set((state) => {
          const modes = ["off", "one", "all"];
          const index = modes.indexOf(state.repeat);

          return {
            repeat: modes[(index + 1) % modes.length],
          };
        }),

      toggleShuffle: () =>
        set((state) => ({
          shuffle: !state.shuffle,
          upNext: !state.shuffle
            ? shuffled(state.upNext)
            : [...state.upNext],
        })),

      // Add a song to the queue
      addToQueue: (song) => {
        if (!song) return;

        set((state) => ({
          upNext: [...state.upNext, withQid(song)],
        }));
      },

      // Play a particular queued item
      playFromQueue: (qid) => {
        const state = get();
        const index = state.upNext.findIndex((item) => item.qid === qid);

        if (index === -1) return;

        const selected = state.upNext[index];
        const skipped = state.upNext.slice(0, index);

        set({
          song: selected,
          upNext: state.upNext.slice(index + 1),
          played: [
            ...state.played,
            ...(state.song ? [state.song] : []),
            ...skipped,
          ].slice(-40),
          isPlaying: true,
          currentTime: 0,
          duration: 0,
          seekTo: null,
          status: "loading",
        });
      },

      // Duplicate a queue item
      duplicateInQueue: (qid) => {
        const state = get();
        const index = state.upNext.findIndex((item) => item.qid === qid);

        if (index === -1) return;

        const duplicate = withQid(state.upNext[index]);
        const queue = [...state.upNext];

        queue.splice(index + 1, 0, duplicate);

        set({ upNext: queue });
      },

      // Remove a queue item
      removeFromQueue: (qid) =>
        set((state) => ({
          upNext: state.upNext.filter((item) => item.qid !== qid),
        })),

      // Next track
      next: () => {
        const state = get();

        if (state.upNext.length === 0) {
          if (state.repeat === "all" && state.context.length > 0) {
            state.play(state.context[0], state.context);
          } else {
            set({
              isPlaying: false,
              status: "idle",
            });
          }

          return;
        }

        const nextSong = state.upNext[0];

        set({
          song: nextSong,
          upNext: state.upNext.slice(1),
          played: state.song
            ? [...state.played, state.song].slice(-40)
            : state.played,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
          seekTo: null,
          status: "loading",
        });
      },

      // Previous track; restart if past 3 seconds
      previous: () => {
        const state = get();

        if (state.currentTime > 3 || state.played.length === 0) {
          set({ seekTo: 0 });
          return;
        }

        const previousSong = state.played[state.played.length - 1];

        set({
          song: previousSong,
          played: state.played.slice(0, -1),
          upNext: state.song
            ? [state.song, ...state.upNext]
            : state.upNext,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
          seekTo: null,
          status: "loading",
        });
      },

      // Handle a track finishing
      handleEnded: () => {
        const state = get();

        if (state.repeat === "one") {
          set({
            currentTime: 0,
            seekTo: null,
            isPlaying: true,
            status: "loading",
          });
        } else {
          state.next();
        }
      },

      // Sleep timer
      setSleepTimer: (minutes) => {
        if (sleepTimerId !== null) {
          clearTimeout(sleepTimerId);
          sleepTimerId = null;
        }

        const safeMinutes = Math.max(0, Number(minutes) || 0);

        set({ sleepMinutes: safeMinutes });

        if (safeMinutes === 0) return;

        sleepTimerId = setTimeout(() => {
          set({
            isPlaying: false,
            sleepMinutes: 0,
          });

          sleepTimerId = null;
        }, safeMinutes * 60 * 1000);
      },

      // Reset playback without deleting listening statistics
      resetPlayer: () => {
        if (sleepTimerId !== null) {
          clearTimeout(sleepTimerId);
          sleepTimerId = null;
        }

        set({
          song: null,
          isPlaying: false,
          isFullPlayerOpen: false,
          currentTime: 0,
          duration: 0,
          upNext: [],
          history: [],
          played: [],
          context: [],
          seekTo: null,
          sleepMinutes: 0,
          status: "idle",
        });
      },
    }),
    {
      name: "sonari-player-storage",

     partialize: (state) => ({
  // Current listening session
  song: state.song,
  upNext: state.upNext,
  context: state.context,
  currentTime: state.currentTime,
  duration: state.duration,

  // Player preferences
  volume: state.volume,
  isMuted: state.isMuted,
  repeat: state.repeat,
  shuffle: state.shuffle,

  // Playback history and statistics
  history: state.history,
  played: state.played,
  listeningEvents: state.listeningEvents,
  playCounts: state.playCounts,
  artistPlayCounts: state.artistPlayCounts,
}),
    }
  )
);
