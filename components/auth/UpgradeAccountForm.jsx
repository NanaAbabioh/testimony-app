'use client';

import React, { useState } from 'react';
import { useAuthContext } from '../providers/AuthProvider';
// Import shadcn/ui components
// Note: You'll need to install and configure shadcn/ui components
// Run: npx shadcn-ui@latest add card button input label
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, User, LogOut, Loader2 } from 'lucide-react';

/**
 * UpgradeAccountForm Component
 * Handles the UI for upgrading from anonymous to permanent account
 * 
 * Displays different views based on user authentication state:
 * - Loading state
 * - Guest view (anonymous user) with upgrade form
 * - Permanent account view with sign-out option
 */
export const UpgradeAccountForm = () => {
  const { user, loading, error, sendSignInLink, signOutUser } = useAuthContext();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  /**
   * Handle form submission to send sign-in link
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setSubmitMessage('Please enter your email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubmitMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    const result = await sendSignInLink(email);
    
    if (result.success) {
      setSubmitMessage(result.message);
      setEmail(''); // Clear the form
    } else {
      setSubmitMessage(`Error: ${result.message}`);
    }
    
    setIsSubmitting(false);
  };

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    setIsSubmitting(true);
    await signOutUser();
    setIsSubmitting(false);
  };

  // Loading state
  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading...</span>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <span className="text-sm">Authentication error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Guest view (anonymous user)
  if (user && user.isAnonymous) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <CardTitle>You're browsing as a guest</CardTitle>
          <CardDescription>
            Save your clips across all devices by creating a free account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Link...
                </>
              ) : (
                'Send Sign-In Link'
              )}
            </Button>
            
            {submitMessage && (
              <div className={`text-sm text-center ${
                submitMessage.includes('Error') 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                {submitMessage}
              </div>
            )}
          </form>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            We'll send you a secure link to complete your account setup. 
            No password required!
          </div>
        </CardContent>
      </Card>
    );
  }

  // Permanent account view (authenticated user with email)
  if (user && !user.isAnonymous) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Mail className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle>Account Active</CardTitle>
          <CardDescription>
            You are signed in as: <strong>{user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing Out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </>
            )}
          </Button>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            Your clips are now saved and synced across all your devices.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback view
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center text-gray-500">
          Authentication system not available
        </div>
      </CardContent>
    </Card>
  );
};