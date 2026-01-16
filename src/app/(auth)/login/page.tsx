'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSupabaseClient } from '@/lib/supabase-client';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 LOGIN STARTED - Form submitted');
    console.log('📧 Email being used:', email);
    console.log('🔐 Password length:', password?.length || 0);

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔵 STEP 1: Getting Supabase client...');
      const supabase = getSupabaseClient();
      console.log('✅ STEP 1 COMPLETE: Supabase client obtained');

      console.log('🔵 STEP 2: Calling signInWithPassword...');
      console.log('   Using email:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔵 STEP 2 COMPLETE: Login response received');
      console.log('   Response data:', data);
      console.log('   Response error:', error);

      if (error) {
        console.error('❌ ERROR DETECTED from Supabase');
        console.error('   Error code:', error.status);
        console.error('   Error message:', error.message);
        console.error('   Error name:', error.name);
        console.error('   Full error object:', error);

        // Check for specific error cases
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address. Check your inbox for the confirmation link.');
        } else if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. If you just signed up, make sure you clicked the verification link in your email (check spam folder too).');
        } else {
          throw error;
        }
      }

      console.log('✅ LOGIN SUCCESS!');
      console.log('   User ID:', data.user?.id);
      console.log('   User email:', data.user?.email);
      console.log('   Email confirmed:', data.user?.email_confirmed_at);
      console.log('   Session exists:', !!data.session);
      console.log('   Access token exists:', !!data.session?.access_token);

      // Verify session is actually set
      console.log('🔵 STEP 3: Verifying session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('   Session verified:', !!session);
      console.log('   Session user:', session?.user?.email);

      if (!session) {
        console.error('❌ ERROR: Session not found after login!');
        throw new Error('Login succeeded but session was not created. Please try again.');
      }

      console.log('✅ STEP 3 COMPLETE: Session verified');
      console.log('🔵 STEP 4: Saving remember me preference and initiating redirect');

      // Save or clear remembered email based on checkbox
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        console.log('✅ Email saved to localStorage');
      } else {
        localStorage.removeItem('rememberedEmail');
        console.log('✅ Cleared remembered email from localStorage');
      }

      // Redirect using Next.js router
      router.push('/interview/select');
      router.refresh(); // Refresh to update middleware session

      console.log('✅ REDIRECT INITIATED - If you see this, redirect should happen soon');
    } catch (err) {
      console.error('❌❌❌ CATCH BLOCK - ERROR OCCURRED ❌❌❌');
      console.error('Error type:', err?.constructor?.name);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      console.error('Full error:', err);

      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);

      // Also log to console in a very visible way
      console.error('='.repeat(80));
      console.error('FINAL ERROR MESSAGE SHOWN TO USER:', errorMessage);
      console.error('='.repeat(80));
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error('OAuth error:', err);
      setError(err instanceof Error ? err.message : 'OAuth login failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
              Mojo Interview
            </div>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Log in to continue your interview practice
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-card-foreground">
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading}
              >
                GitHub
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
            <div className="pt-3 border-t border-border">
              <p className="text-center text-xs text-muted-foreground">
                Just signed up? Check your email for a verification link before logging in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
