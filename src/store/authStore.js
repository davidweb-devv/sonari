import { create } from "zustand";
import { supabase } from "../lib/supabase";

export const useAuth = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  initAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split("@")[0],
            avatar: session.user.user_metadata?.avatar_url || null,
          },
          isAuthenticated: true,
          loading: false,
        });
      } else {
        set({ user: null, isAuthenticated: false, loading: false });
      }
    } catch (err) {
      console.error("Auth init error:", err);
      set({ user: null, isAuthenticated: false, loading: false });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split("@")[0],
            avatar: session.user.user_metadata?.avatar_url || null,
          },
          isAuthenticated: true,
          loading: false,
        });
      } else {
        set({ user: null, isAuthenticated: false, loading: false });
      }
    });
  },

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  },

  signUp: async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) throw error;
    return { success: true, data };
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { success: true, data };
  },

  logout: async () => {
    await supabase.auth.signOut();
    try {
      localStorage.removeItem("sonari-player-storage");
      localStorage.removeItem("sonari-library");
    } catch (e) {
      console.error("Error clearing storage on logout", e);
    }
    set({ user: null, isAuthenticated: false });
    window.location.reload(); // Instantly refreshes app to a clean guest state
  },
}));