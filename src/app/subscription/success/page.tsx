'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Crown, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Give webhook time to process (usually instant but add small delay for safety)
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Activating Your Pro Subscription...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we set up your account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold font-serif text-foreground mb-2">
              Welcome to Pro!
            </h1>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-full px-4 py-1.5 mb-4">
              <Crown className="h-4 w-4" />
              Pro Member
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-foreground mb-2">
              Your subscription is active!
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Subscription active</li>
              <li>• Unlimited mock interviews</li>
              <li>• Advanced AI feedback</li>
              <li>• Cancel anytime, no commitment</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push('/interview/select')}
            >
              Start Your First Pro Interview
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </div>

          {sessionId && (
            <p className="text-xs text-muted-foreground mt-4">
              Session ID: {sessionId.substring(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
