'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, X } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  reason?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
  reason,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold font-serif text-foreground mb-2">
            Upgrade to Pro
          </h2>
          {reason && (
            <p className="text-amber-700 bg-amber-50/50 border border-amber-200 rounded-lg p-3 mb-4">
              {reason}
            </p>
          )}
          <p className="text-muted-foreground">
            Unlock unlimited interviews
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-primary">£20</div>
            <div className="text-sm text-muted-foreground">per month</div>
            <div className="text-xs text-green-700 font-medium mt-1">
              Cancel anytime
            </div>
          </div>

          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-card-foreground">
                Unlimited mock interviews
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-card-foreground">
                Advanced AI-powered feedback
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-card-foreground">
                Personalised coaching insights
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-card-foreground">
                Interview history & analytics
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-card-foreground">Priority support</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button size="lg" className="w-full" onClick={onUpgrade}>
            Upgrade Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Maybe Later
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Cancel anytime. No commitment.
        </p>
      </div>
    </div>
  );
}
