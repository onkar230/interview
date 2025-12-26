'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string | null;
  autoPlay?: boolean;
  onPlaybackEnd?: () => void;
}

export default function AudioPlayer({ audioUrl, autoPlay = true, onPlaybackEnd }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!audioUrl) return;

    setIsLoading(true);
    setError(null);

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

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
      if (onPlaybackEnd) {
        onPlaybackEnd();
      }
    };

    audio.onerror = () => {
      setIsLoading(false);
      setError('Error loading audio');
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl, autoPlay, onPlaybackEnd]);

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
