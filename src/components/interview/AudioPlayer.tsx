'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string | null;
  autoPlay?: boolean;
  onPlaybackEnd?: () => void;
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>;
}

export default function AudioPlayer({ audioUrl, autoPlay = true, onPlaybackEnd, audioRef: externalAudioRef }: AudioPlayerProps) {
  const internalAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onPlaybackEndRef = useRef(onPlaybackEnd);
  const lastAudioUrlRef = useRef<string | null>(null);
  const isInitializingRef = useRef(false); // Prevent double initialization in Strict Mode

  // Keep the callback ref updated
  useEffect(() => {
    onPlaybackEndRef.current = onPlaybackEnd;
  }, [onPlaybackEnd]);

  useEffect(() => {
    if (!audioUrl) return;

    // Don't recreate audio if it's the same URL AND we're already initializing
    if (audioUrl === lastAudioUrlRef.current && isInitializingRef.current) return;

    // Don't recreate audio if it's the same URL AND audio is currently playing
    if (audioUrl === lastAudioUrlRef.current && internalAudioRef.current && !internalAudioRef.current.paused) return;

    isInitializingRef.current = true;

    // Stop and cleanup any existing audio before creating new one
    if (internalAudioRef.current) {
      const oldAudio = internalAudioRef.current;
      oldAudio.pause();
      oldAudio.currentTime = 0;
      // Remove all event listeners to prevent stale callbacks
      oldAudio.oncanplaythrough = null;
      oldAudio.onplay = null;
      oldAudio.onpause = null;
      oldAudio.onended = null;
      oldAudio.onerror = null;
      oldAudio.src = ''; // Clear source
      oldAudio.load(); // Reset the audio element
    }

    setIsLoading(true);
    setError(null);

    const audio = new Audio();
    internalAudioRef.current = audio;

    // Also set external ref if provided so parent can control audio
    if (externalAudioRef) {
      externalAudioRef.current = audio;
    }

    // Flag to track if this audio instance is still current
    let isCurrent = true;
    let hasStartedPlaying = false; // Track if we've already started playback

    // Set up event handlers BEFORE setting src
    audio.oncanplaythrough = () => {
      if (!isCurrent) return;
      setIsLoading(false);
      isInitializingRef.current = false;
      if (autoPlay && isCurrent && !hasStartedPlaying) {
        hasStartedPlaying = true;
        audio.play().catch((err) => {
          if (err.name !== 'AbortError') {
            setError('Unable to play audio');
          }
        });
      }
    };

    audio.onloadstart = () => {};

    audio.onloadedmetadata = () => {};

    audio.onloadeddata = () => {
      if (!isCurrent) return;
      // If canplaythrough doesn't fire within 500ms, try to play anyway
      setTimeout(() => {
        if (isCurrent && !hasStartedPlaying && autoPlay) {
          hasStartedPlaying = true;
          setIsLoading(false);
          isInitializingRef.current = false;
          audio.play().catch((err) => {
            if (err.name !== 'AbortError') {
              setError('Unable to play audio');
            }
          });
        }
      }, 500);
    };

    audio.onplay = () => {
      if (!isCurrent) return;
      setIsPlaying(true);
    };

    audio.onpause = () => {
      if (!isCurrent) return;
      setIsPlaying(false);
    };

    audio.onended = () => {
      if (!isCurrent) return;
      setIsPlaying(false);
      if (onPlaybackEndRef.current) {
        onPlaybackEndRef.current();
      }
    };

    audio.onerror = () => {
      if (!isCurrent) return;
      setIsLoading(false);
      isInitializingRef.current = false; // Reset on error
      setError('Error loading audio');
    };

    // Set src and load AFTER all event handlers are attached
    audio.src = audioUrl;
    audio.load();

    // Only update lastAudioUrlRef after we've started loading
    // This prevents duplicate URL check from firing before audio loads
    lastAudioUrlRef.current = audioUrl;

    return () => {
      isCurrent = false; // Mark this audio instance as stale
      isInitializingRef.current = false; // Reset initialization flag

      if (internalAudioRef.current) {
        internalAudioRef.current.pause();
        internalAudioRef.current.currentTime = 0;
        // Remove all event listeners
        internalAudioRef.current.oncanplaythrough = null;
        internalAudioRef.current.onloadstart = null;
        internalAudioRef.current.onloadedmetadata = null;
        internalAudioRef.current.onloadeddata = null;
        internalAudioRef.current.onplay = null;
        internalAudioRef.current.onpause = null;
        internalAudioRef.current.onended = null;
        internalAudioRef.current.onerror = null;
        internalAudioRef.current = null;
      }
      if (externalAudioRef) {
        externalAudioRef.current = null;
      }
    };
  }, [audioUrl, autoPlay]);

  if (!audioUrl) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      ) : isPlaying ? (
        <Volume2 className="h-5 w-5 text-blue-600 animate-pulse" />
      ) : (
        <VolumeX className="h-5 w-5 text-gray-400" />
      )}

      <div className="flex-1">
        {isLoading && <span className="text-sm text-gray-600">Loading audio...</span>}
        {isPlaying && <span className="text-sm text-gray-600">AI is speaking...</span>}
        {!isLoading && !isPlaying && !error && (
          <span className="text-sm text-gray-600">Audio ready</span>
        )}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    </div>
  );
}
