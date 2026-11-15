import { useAuth } from "./store/authStore";
import { useEffect, useLayoutEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Settings as SettingsIcon } from "lucide-react";

import Navigation from "./components/Navigation";
import Home from "./components/Home";
import Search from "./components/Search";
import Library from "./components/Library";
import You from "./components/You";
import Settings from "./components/Settings";
import ComingSoon from "./components/ComingSoon";
import MiniPlayer from "./components/MiniPlayer";
import FullPlayer from "./components/FullPlayer";
import AudioEngine from "./components/AudioEngine";
import AiPage from "./components/AiPage";

import Artist from "./pages/Artist";

import { usePlayer } from "./store/playerStore";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}

function App() {
  const initAuth = useAuth((s) => s.initAuth);

  useEffect(() => {
    if (typeof initAuth === "function") {
      initAuth();
    }
  }, [initAuth]);

  const navigate = useNavigate();
  const location = useLocation();

  const closeFull = usePlayer((s) => s.closeFull);
  const isFullPlayerOpen = usePlayer(
    (s) => s.isFullPlayerOpen
  );

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = "dark";
  }, []);

  function navigateTo(page) {
    if (typeof closeFull === "function") {
      closeFull();
    }

    const paths = {
      home: "/",
      search: "/search",
      ai: "/ai",
      library: "/library",
      you: "/you",
      settings: "/settings",
    };

    navigate(paths[page] || "/");
  }

  const activePage =
    location.pathname.startsWith("/artist/")
      ? "search"
      : location.pathname === "/"
        ? "home"
        : location.pathname.split("/")[1];

  return (
    <div className="app">
      <ScrollToTop />

      <header className="app-header">
        <div className="logo">
          <span>sonari</span>
          <span>.</span>
        </div>

        <div className="header-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => navigateTo("settings")}
            aria-label="Settings"
            title="Settings"
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </header>

      <div
        className="page-transition"
        key={location.pathname}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/artist/:artistId" element={<Artist />} />
          <Route path="/library" element={<Library />} />
          <Route path="/you" element={<You />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai" element={<AiPage />} />

          <Route
            path="*"
            element={<ComingSoon title="Page not found" />}
          />
        </Routes>
      </div>

      <AudioEngine />
      <MiniPlayer />

      {isFullPlayerOpen && <FullPlayer />}

      {!isFullPlayerOpen && (
        <Navigation
          activePage={activePage}
          setActivePage={navigateTo}
        />
      )}
    </div>
  );
}

export default App;
