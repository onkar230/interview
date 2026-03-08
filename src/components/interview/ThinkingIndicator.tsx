'use client';

import { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';

const THINKING_MESSAGES = [
  'Reviewing your answer...',
  'Analysing key points...',
  'Preparing follow-up...',
  'Formulating response...',
  'Almost there...',
];

const INIT_MESSAGES = [
  'Setting up your interview...',
  'Researching the company...',
  'Preparing questions...',
  'Almost ready...',
];

interface ThinkingIndicatorProps {
  isInitializing?: boolean;
}

export default function ThinkingIndicator({ isInitializing = false }: ThinkingIndicatorProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = isInitializing ? INIT_MESSAGES : THINKING_MESSAGES;

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex gap-3 justify-start">
      {/* Pulsing bot avatar */}
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center animate-[thinking-pulse_2s_ease-in-out_infinite]">
          <Bot className="h-5 w-5 text-accent" />
        </div>
      </div>

      <div className="max-w-[80%] space-y-2">
        {/* Chat bubble with bouncing dots */}
        <div className="rounded-lg p-3 bg-primary/50 border border-primary/20 text-primary-foreground shadow-md">
          {/* Bouncing dots */}
          <div className="flex items-center gap-1 mb-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-[thinking-bounce_1.4s_ease-in-out_infinite]" />
            <span className="h-2 w-2 rounded-full bg-accent animate-[thinking-bounce_1.4s_ease-in-out_0.2s_infinite]" />
            <span className="h-2 w-2 rounded-full bg-accent animate-[thinking-bounce_1.4s_ease-in-out_0.4s_infinite]" />
          </div>

          {/* Rotating status message */}
          <p className="text-xs text-primary-foreground/70 transition-opacity duration-300">
            {messages[messageIndex]}
          </p>
        </div>

        {/* Shimmer progress bar */}
        <div className="h-1 w-full rounded-full bg-primary/30 overflow-hidden">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-transparent via-accent/60 to-transparent animate-[thinking-shimmer_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
