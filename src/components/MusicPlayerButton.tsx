import { useEffect, useRef, useState } from "react";
import { Music2, Volume2 } from "lucide-react";

import songsData from "../data/songs.json";

// Vite resolves these WAV files into URLs for development and production.
const songFiles = import.meta.glob("../songs/*.wav", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const songs = songsData
  .map((song) => ({
    ...song,
    src: songFiles[`../songs/${song.file}`],
  }))
  .filter((song) => Boolean(song.src));

export default function MusicPlayerButton() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentSong, setCurrentSong] = useState("");

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  async function togglePlayback() {
    // Stop the current song when the button is clicked again.
    if (isPlaying) {
      audioRef.current?.pause();
      audioRef.current = null;
      setIsPlaying(false);
      setCurrentSong("");
      return;
    }

    if (songs.length === 0) {
      console.error("No playable WAV files were found in src/songs.");
      return;
    }

    // Pick a random song every time playback starts.
    const randomIndex = Math.floor(Math.random() * songs.length);
    const song = songs[randomIndex];

    if (!song.src) return;

    const audio = new Audio(song.src);
    audio.volume = volume;
    audioRef.current = audio;

    audio.onended = () => {
      if (audioRef.current === audio) {
        audioRef.current = null;
        setIsPlaying(false);
        setCurrentSong("");
      }
    };

    audio.onerror = () => {
      if (audioRef.current === audio) {
        audioRef.current = null;
        setIsPlaying(false);
        setCurrentSong("");
      }
      console.error(`Unable to play ${song.file}`);
    };

    try {
      await audio.play();
      setCurrentSong(song.name);
      setIsPlaying(true);
    } catch (error) {
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      setIsPlaying(false);
      console.error("Music playback failed:", error);
    }
  }

  function handleVolumeChange(value: number) {
    const nextVolume = Math.min(1, Math.max(0, value));

    setVolume(nextVolume);

    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center">
      {isPlaying && (
        <div className="mb-3 flex flex-col items-center gap-2 rounded-full border border-muted bg-background/95 px-3 py-4 shadow-lg backdrop-blur-md">
          <Volume2 size={16} className="text-foreground" aria-hidden="true" />

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => handleVolumeChange(Number(event.target.value))}
            aria-label="Music volume"
            title={`Volume: ${Math.round(volume * 100)}%`}
            className="h-24 w-2 cursor-pointer accent-primary"
            style={{
              writingMode: "vertical-lr",
              direction: "rtl",
            }}
          />

          <span className="text-[10px] font-medium text-foreground">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? "Stop music" : "Play random music"}
        aria-pressed={isPlaying}
        title={isPlaying ? `Stop ${currentSong}` : "Play random music"}
        className={`group flex h-14 w-14 items-center justify-center rounded-full border shadow-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 ${
          isPlaying
            ? "border-primary bg-primary text-foreground"
            : "border-muted bg-background text-foreground hover:bg-primary"
        }`}
      >
        <Music2
          size={23}
          strokeWidth={2}
          className={isPlaying ? "animate-pulse" : ""}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
