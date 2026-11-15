import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useLibrary = create(
  persist(
    (set) => ({
      likedSongs: [],
      playlists: [],
      selectedCollectionId: null,

      setSelectedCollectionId: (id) =>
        set({ selectedCollectionId: id }),

      clearSelectedCollection: () =>
        set({ selectedCollectionId: null }),

      toggleLike: (song) =>
        set((state) => {
          const exists = state.likedSongs.some(
            (item) => item.id === song.id
          );

          return {
            likedSongs: exists
              ? state.likedSongs.filter((item) => item.id !== song.id)
              : [song, ...state.likedSongs],
          };
        }),

      clearLikes: () => set({ likedSongs: [] }),

      createPlaylist: (name, song) => {
        const trimmedName = name.trim();
        if (!trimmedName) return null;

        const id = `playlist-${Date.now()}`;

        set((state) => ({
          playlists: [
            { id, name: trimmedName, songs: song ? [song] : [] },
            ...state.playlists,
          ],
        }));

        return id;
      },

      toggleInPlaylist: (playlistId, song) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) => {
            if (playlist.id !== playlistId) return playlist;

            const exists = playlist.songs.some(
              (item) => item.id === song.id
            );

            return {
              ...playlist,
              songs: exists
                ? playlist.songs.filter((item) => item.id !== song.id)
                : [...playlist.songs, song],
            };
          }),
        })),

      deletePlaylist: (playlistId) =>
        set((state) => ({
          playlists: state.playlists.filter(
            (playlist) => playlist.id !== playlistId
          ),
          selectedCollectionId:
            state.selectedCollectionId === playlistId
              ? null
              : state.selectedCollectionId,
        })),
    }),
    {
      name: "sonari-library",
      partialize: (state) => ({
        likedSongs: state.likedSongs,
        playlists: state.playlists,
      }),
    }
  )
);