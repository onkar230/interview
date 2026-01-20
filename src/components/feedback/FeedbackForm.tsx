'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function FeedbackForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send feedback');
      }

      setSuccess(true);
      setTitle('');
      setBody('');
      setEmail('');
    } catch (err) {
      console.error('Feedback submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send feedback');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-green-100 rounded-full p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">
            Feedback Submitted!
          </h3>
          <p className="text-muted-foreground max-w-md">
            Thank you for your feedback. We will respond within 24-48 hours.
          </p>
          <Button
            onClick={() => setSuccess(false)}
            variant="outline"
            className="mt-4"
          >
            Submit Another Feedback
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-card-foreground mb-2">
            Title
          </label>
          <Input
            id="title"
            type="text"
            placeholder="Brief summary of your feedback"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-white"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-card-foreground mb-2">
            Message
          </label>
          <textarea
            id="body"
            placeholder="Please provide detailed feedback or describe your issue..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={6}
            className="w-full px-3 py-2 bg-white border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-2">
            Your Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            We'll use this to respond to your feedback
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            'Submit Feedback'
          )}
        </Button>
      </form>
    </div>
  );
}
