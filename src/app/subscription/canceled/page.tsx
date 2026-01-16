'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function SubscriptionCanceledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-gray-500" />
            </div>
            <h1 className="text-3xl font-bold font-serif text-foreground mb-2">
              Checkout Canceled
            </h1>
            <p className="text-muted-foreground">
              No worries! You can upgrade anytime.
            </p>
          </div>

          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="text-sm text-muted-foreground">
              You'll continue to have access to 1 free interview per month. You
              can upgrade to Pro anytime to get unlimited interviews and advanced
              features.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push('/interview/select')}
            >
              Continue with Free Plan
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
        </div>
      </div>
    </div>
  );
}
