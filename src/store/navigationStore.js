import { create } from "zustand";

export const useNavigation = create((set) => ({
  currentView: "home", // 'home' | 'search' | 'library' | 'you' | 'ai' | 'login'
  searchQuery: "",
  selectedArtist: null,
  selectedAlbum: null,

  setView: (view, query = "") =>
    set({
      currentView: view,
      searchQuery: query,
      selectedArtist: null,
      selectedAlbum: null,
    }),

  filterByArtist: (artistName) =>
    set({
      currentView: "search",
      searchQuery: artistName,
      selectedArtist: artistName,
    }),

  filterByAlbum: (albumName) =>
    set({
      currentView: "search",
      searchQuery: albumName,
      selectedAlbum: albumName,
    }),
}));