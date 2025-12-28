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
      lastAudioUrlRef.current = null;
      return;
    }

    // Don't recreate audio if it's the same URL
    if (audioUrl === lastAudioUrlRef.current) {
      console.log('Same audio URL, skipping recreation');
      return;
    }

    console.log('Creating new audio for URL:', audioUrl.substring(0, 50));
    lastAudioUrlRef.current = audioUrl;

    // Stop any existing audio before creating new one
    if (internalAudioRef.current) {
      internalAudioRef.current.pause();
      internalAudioRef.current.currentTime = 0;
    }

    setIsLoading(true);
    setError(null);

    const audio = new Audio(audioUrl);
    internalAudioRef.current = audio;

    // Also set external ref if provided so parent can control audio
    if (externalAudioRef) {
      externalAudioRef.current = audio;
    }

    audio.oncanplaythrough = () => {
      setIsLoading(false);
      if (autoPlay) {
        audio.play().catch((err) => {
          console.error('Error playing audio:', err);
          setError('Unable to play audio');
        });
      }
    };

    audio.onplay = () => {
      setIsPlaying(true);
    };

    audio.onpause = () => {
      setIsPlaying(false);
    };

    audio.onended = () => {
      setIsPlaying(false);
      if (onPlaybackEndRef.current) {
        onPlaybackEndRef.current();
      }
    };

    audio.onerror = () => {
      setIsLoading(false);
      setError('Error loading audio');
    };

    return () => {
      if (internalAudioRef.current) {
        internalAudioRef.current.pause();
        internalAudioRef.current.currentTime = 0;
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
