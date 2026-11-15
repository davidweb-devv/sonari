
import { useEffect, useRef } from "react";
import { usePlayer } from "../store/playerStore";

function createSessionId(song) {
  return song
    ? `${song.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    : null;
}

export default function AudioEngine() {
  const audioRef = useRef(null);

  const listenedSecondsRef = useRef(0);
  const lastCurrentTimeRef = useRef(null);
  const countedRef = useRef(false);
  const sessionIdRef = useRef(null);
  const lastSavedSecondRef = useRef(0);

  const song = usePlayer((state) => state.song);
  const isPlaying = usePlayer((state) => state.isPlaying);
  const volume = usePlayer((state) => state.volume);
  const isMuted = usePlayer((state) => state.isMuted);
  const seekTo = usePlayer((state) => state.seekTo);

  const clearSeek = usePlayer((state) => state.clearSeek);
  const setTime = usePlayer((state) => state.setTime);
  const setStatus = usePlayer((state) => state.setStatus);
  const handleEnded = usePlayer((state) => state.handleEnded);

  const isPreview = Boolean(song?.previewUrl);

  // Save the latest duration to the existing listening event.
  function saveListeningDuration() {
    const sessionId = sessionIdRef.current;

    if (!sessionId || !countedRef.current) return;

    const seconds = listenedSecondsRef.current;

    usePlayer.setState((state) => {
      const events = state.listeningEvents || [];

      const exists = events.some(
        (event) => event.sessionId === sessionId
      );

      if (!exists) return state;

      return {
        listeningEvents: events.map((event) =>
          event.sessionId === sessionId
            ? {
                ...event,
                listenedSeconds: seconds,
              }
            : event
        ),
      };
    });

    lastSavedSecondRef.current = Math.floor(seconds);
  }

  // Reset listening progress for a new track.
  useEffect(() => {
    // Save the previous track before starting a new session.
    saveListeningDuration();

    listenedSecondsRef.current = 0;
    lastCurrentTimeRef.current = null;
    countedRef.current = false;
    lastSavedSecondRef.current = 0;

    sessionIdRef.current = createSessionId(song);

    return () => {
      saveListeningDuration();
    };
  }, [song?.id, song?.qid, song?.previewUrl]);

  // Synchronize volume.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPreview) return;

    audio.volume = Math.max(0, Math.min(1, volume ?? 1));
    audio.muted = Boolean(isMuted);
  }, [isPreview, volume, isMuted]);

  // Start or pause playback.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPreview) return;

    if (!isPlaying) {
      audio.pause();
      lastCurrentTimeRef.current = null;
      return;
    }

    audio.play().catch((error) => {
      console.warn("Preview playback could not start:", error);
      setStatus("error");
    });
  }, [
    song?.id,
    song?.qid,
    song?.previewUrl,
    isPlaying,
    isPreview,
    setStatus,
  ]);

  // Record genuine playback progress.
  function trackListeningProgress(audio) {
    if (
      !audio ||
      audio.paused ||
      audio.seeking ||
      audio.ended
    ) {
      return;
    }

    const currentTime = audio.currentTime;
    const previousTime = lastCurrentTimeRef.current;

    lastCurrentTimeRef.current = currentTime;

    if (previousTime === null) return;

    const difference = currentTime - previousTime;

    // Ignore seeking and unexpected timeline jumps.
    if (difference <= 0 || difference > 2.5) return;

    listenedSecondsRef.current += difference;

    const duration = audio.duration;

    const threshold =
      Number.isFinite(duration) && duration > 0
        ? Math.min(30, duration / 2)
        : 15;

    // Qualify the play only once.
    if (!countedRef.current &&
        listenedSecondsRef.current >= threshold) {
      const currentSong = usePlayer.getState().song;
      const sessionId = sessionIdRef.current;

      if (!currentSong || !sessionId) return;

      const recordListening =
        usePlayer.getState().recordListening;

      if (typeof recordListening === "function") {
        recordListening(
          currentSong,
          sessionId,
          listenedSecondsRef.current
        );

        countedRef.current = true;
        saveListeningDuration();
      }
    }

    // Continue saving actual listening time after qualification.
    if (countedRef.current) {
      const currentWholeSecond = Math.floor(
        listenedSecondsRef.current
      );

      if (currentWholeSecond > lastSavedSecondRef.current) {
        saveListeningDuration();
      }
    }
  }

  // Continuously track playback.
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !isPreview || !isPlaying) return;

    let animationFrame;

    function updateProgress() {
      if (!audio.paused && !audio.ended) {
        setTime(audio.currentTime, audio.duration);
        trackListeningProgress(audio);
      }

      animationFrame = requestAnimationFrame(updateProgress);
    }

    animationFrame = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrame);
  }, [
    isPreview,
    isPlaying,
    song?.id,
    song?.qid,
    setTime,
  ]);

  // Handle seeking without counting skipped sections.
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !isPreview || seekTo == null) return;

    const seek = () => {
      const maxTime = Number.isFinite(audio.duration)
        ? audio.duration
        : 0;

      audio.currentTime = Math.max(
        0,
        Math.min(seekTo, maxTime)
      );

      lastCurrentTimeRef.current = audio.currentTime;

      setTime(audio.currentTime, audio.duration);
      clearSeek();
    };

    if (audio.readyState >= 1) {
      seek();
    } else {
      audio.addEventListener("loadedmetadata", seek, {
        once: true,
      });

      return () => {
        audio.removeEventListener("loadedmetadata", seek);
      };
    }
  }, [
    seekTo,
    isPreview,
    song?.id,
    song?.qid,
    clearSeek,
    setTime,
  ]);

  if (!song || !isPreview) return null;

  return (
    <audio
      key={song.qid || song.id}
      ref={audioRef}
      src={song.previewUrl}
      preload="metadata"
      onLoadedMetadata={(event) => {
        setTime(
          event.currentTarget.currentTime,
          event.currentTarget.duration
        );
      }}
      onTimeUpdate={(event) => {
        const audio = event.currentTarget;

        setTime(audio.currentTime, audio.duration);
        trackListeningProgress(audio);
      }}
      onSeeking={(event) => {
        lastCurrentTimeRef.current =
          event.currentTarget.currentTime;
      }}
      onSeeked={(event) => {
        lastCurrentTimeRef.current =
          event.currentTarget.currentTime;
      }}
      onPlay={(event) => {
        lastCurrentTimeRef.current =
          event.currentTarget.currentTime;

        setStatus("playing");
      }}
      onPause={() => {
        lastCurrentTimeRef.current = null;
        saveListeningDuration();

        if (!audioRef.current?.ended) {
          setStatus("paused");
        }
      }}
      onEnded={() => {
        saveListeningDuration();

        if (usePlayer.getState().repeat === "one") {
          const audio = audioRef.current;
          if (!audio) return;

          // Start a fresh listening session for the repeat.
          listenedSecondsRef.current = 0;
          countedRef.current = false;
          lastCurrentTimeRef.current = 0;
          lastSavedSecondRef.current = 0;

          sessionIdRef.current = createSessionId(
            usePlayer.getState().song
          );

          audio.currentTime = 0;

          audio.play().catch((error) => {
            console.warn(
              "Repeat playback could not start:",
              error
            );
            setStatus("error");
          });
        } else {
          handleEnded();
        }
      }}
      onError={() => setStatus("error")}
    />
  );
}
