import Link from 'next/link';
import Image from 'next/image';
import FeedbackForm from '@/components/feedback/FeedbackForm';

export const metadata = {
  title: 'Feedback & Support',
  description: 'Send us your feedback or get support for Mojo Interview',
};

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Mojo Interview Logo"
            width={48}
            height={48}
            className="object-contain"
          />
          <span className="text-2xl font-bold text-primary">Mojo Interview</span>
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Feedback & Support
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We'd love to hear from you! Share your feedback, report issues, or ask questions.
            We'll get back to you within 24-48 hours.
          </p>
        </div>

        <FeedbackForm />

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-primary hover:underline text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
