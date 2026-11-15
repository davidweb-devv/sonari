
import { useState } from "react";
import { useSettings } from "../store/settingsStore";
import { useLibrary } from "../store/libraryStore";
import { writeStorage } from "../utils/storage";

function Settings() {
  const autoplay = useSettings((s) => s.autoplay);
  const setAutoplay = useSettings((s) => s.setAutoplay);
  const likedCount = useLibrary((s) => s.likedSongs.length);
  const clearLikes = useLibrary((s) => s.clearLikes);

  const [message, setMessage] = useState("");

  function flash(text) {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  }

  function clearSearches() {
    writeStorage("sonari-recent-searches", []);
    flash("Search history cleared");
  }

  function handleClearLikes() {
    if (window.confirm("Remove all liked songs?")) {
      clearLikes();
      flash("Liked songs cleared");
    }
  }

  return (
    <main className="settings">
      <h1>Settings</h1>

      <section className="settings-group">
        <h2>Playback</h2>

        <div className="settings-row">
          <div>
            <p className="settings-label">Autoplay next song</p>
            <p className="settings-hint">
              Keep playing when a song ends
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={autoplay}
            aria-label="Autoplay next song"
            className="switch"
            onClick={() => setAutoplay(!autoplay)}
          >
            <span />
          </button>
        </div>
      </section>

      <section className="settings-group">
        <h2>Your data</h2>

        <div className="settings-row">
          <div>
            <p className="settings-label">Search history</p>
            <p className="settings-hint">
              Remove your recent searches
            </p>
          </div>

          <button
            type="button"
            className="settings-button"
            onClick={clearSearches}
          >
            Clear
          </button>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-label">Liked songs</p>
            <p className="settings-hint">
              {likedCount} saved
            </p>
          </div>

          <button
            type="button"
            className="settings-button"
            onClick={handleClearLikes}
            disabled={likedCount === 0}
          >
            Clear
          </button>
        </div>
      </section>

      <section className="settings-group">
        <h2>About</h2>

        <p className="settings-hint">
          Sonari 0.1, early preview
        </p>

        <p className="settings-hint">
          Full-length music from independent artists on Audius.
          Previews from the iTunes Search API. Artists are credited
          on every track.
        </p>
      </section>

      {message && (
        <p className="settings-toast" role="status">
          {message}
        </p>
      )}
    </main>
  );
}

export default Settings;
