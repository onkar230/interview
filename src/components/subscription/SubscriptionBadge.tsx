'use client';

import { Crown, Sparkles } from 'lucide-react';

interface SubscriptionBadgeProps {
  tier: 'free' | 'pro';
  size?: 'sm' | 'md' | 'lg';
}

export function SubscriptionBadge({ tier, size = 'md' }: SubscriptionBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (tier === 'pro') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-full ${sizeClasses[size]}`}
      >
        <Crown className={iconSizes[size]} />
        Pro
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-gray-200 text-gray-700 font-medium rounded-full ${sizeClasses[size]}`}
    >
      <Sparkles className={iconSizes[size]} />
      Free
    </span>
  );
}
