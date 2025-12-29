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

  // Keep the callback ref updated
  useEffect(() => {
    onPlaybackEndRef.current = onPlaybackEnd;
  }, [onPlaybackEnd]);

  useEffect(() => {
    if (!audioUrl) {
      console.log('[AudioPlayer] audioUrl is null, keeping lastAudioUrlRef to prevent replays');
      // DON'T reset lastAudioUrlRef here - keep it so we can detect duplicate URLs
      return;
    }

    // Don't recreate audio if it's the same URL (prevents replay bug)
    if (audioUrl === lastAudioUrlRef.current) {
      console.log('[AudioPlayer] Same audio URL detected, skipping recreation:', audioUrl.substring(0, 50));
      return;
    }

    console.log('[AudioPlayer] Creating new audio for URL:', audioUrl.substring(0, 50));
    console.log('[AudioPlayer] Previous URL was:', lastAudioUrlRef.current?.substring(0, 50) || 'null');
    lastAudioUrlRef.current = audioUrl;

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

    const audio = new Audio(audioUrl);
    internalAudioRef.current = audio;

    // Also set external ref if provided so parent can control audio
    if (externalAudioRef) {
      externalAudioRef.current = audio;
    }

    // Flag to track if this audio instance is still current
    let isCurrent = true;

    audio.oncanplaythrough = () => {
      if (!isCurrent) return; // Ignore if this audio was replaced
      setIsLoading(false);
      if (autoPlay && isCurrent) {
        audio.play().catch((err) => {
          // Silently ignore AbortError (expected when audio changes quickly)
          if (err.name !== 'AbortError') {
            console.error('Error playing audio:', err);
            setError('Unable to play audio');
          }
        });
      }
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
      setError('Error loading audio');
    };

    return () => {
      isCurrent = false; // Mark this audio instance as stale

      if (internalAudioRef.current) {
        internalAudioRef.current.pause();
        internalAudioRef.current.currentTime = 0;
        // Remove event listeners
        internalAudioRef.current.oncanplaythrough = null;
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
