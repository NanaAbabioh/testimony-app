'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

/**
 * Magic Link Completion Page
 * Handles the completion of magic link authentication
 * Users are redirected here when they click the magic link in their email
 */
export default function FinishSignInPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Completing your sign-in...');

  useEffect(() => {
    const handleSignInCompletion = async () => {
      try {
        // Wait for the auth hook to process the magic link
        const timeout = setTimeout(() => {
          if (status === 'processing') {
            setStatus('error');
            setMessage('Sign-in took too long. Please try again.');
          }
        }, 10000); // 10 second timeout

        // The useAuth hook will automatically handle the magic link completion
        // We just need to wait for the user state to update
        const checkInterval = setInterval(() => {
          if (!loading && user) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            
            if (user.isAnonymous) {
              // This shouldn't happen after magic link completion, but handle it
              setStatus('error');
              setMessage('Account linking failed. Please try again.');
            } else {
              // Success! User is now authenticated
              setStatus('success');
              setMessage(`Welcome, ${user.email}! Your account is now active.`);
              
              // Redirect to home page after a short delay
              setTimeout(() => {
                router.push('/');
              }, 2000);
            }
          }
        }, 100);

        // Cleanup on unmount
        return () => {
          clearTimeout(timeout);
          clearInterval(checkInterval);
        };
      } catch (error) {
        console.error('Error in sign-in completion:', error);
        setStatus('error');
        setMessage('Something went wrong. Please try signing in again.');
      }
    };

    handleSignInCompletion();
  }, [user, loading, router, status]);

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'processing':
        return 'Completing Sign-In';
      case 'success':
        return 'Sign-In Successful!';
      case 'error':
        return 'Sign-In Failed';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-xl">{getTitle()}</CardTitle>
          <CardDescription>
            {status === 'processing' && 'Please wait while we complete your sign-in...'}
            {status === 'success' && 'You will be redirected shortly.'}
            {status === 'error' && 'Please try requesting a new sign-in link.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            {message}
          </div>
          
          {status === 'error' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-blue-500 hover:text-blue-700 underline text-sm"
              >
                Return to Home
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}