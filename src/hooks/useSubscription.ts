import { useState, useEffect } from 'react';

interface SubscriptionData {
  tier: 'free' | 'pro';
  status: string;
  interviewsUsed: number;
  interviewLimit: number | null;
  canStartInterview: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  isLoading: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData>({
    tier: 'free',
    status: 'active',
    interviewsUsed: 0,
    interviewLimit: 1,
    canStartInterview: true,
    trialEndsAt: null,
    currentPeriodEnd: null,
    isLoading: true,
  });

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setSubscription({ ...data, isLoading: false });
      } else {
        setSubscription((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const upgradeToPro = async () => {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Error: No checkout URL received. Please try again.');
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to start checkout: ${errorData.error || 'Unknown error'}. Please try again.`);
      }
    } catch (error) {
      alert('Network error while starting checkout. Please check your connection and try again.');
    }
  };

  const manageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error('Failed to create portal session');
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
    }
  };

  return {
    ...subscription,
    upgradeToPro,
    manageSubscription,
    refresh: fetchSubscription,
  };
}
