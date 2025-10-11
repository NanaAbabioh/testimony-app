'use client';

import { useAuthContext } from '@/components/providers/AuthProvider';
import { UpgradeAccountForm } from '@/components/auth/UpgradeAccountForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { User, Shield, Clock, AlertTriangle } from 'lucide-react';

/**
 * Authentication Test Page
 * Displays current auth state and allows testing of all authentication features
 */
export default function AuthTestPage() {
  const { 
    user, 
    loading, 
    error, 
    authState, 
    canUpgrade, 
    isAuthenticated,
    getMagicLinkInfo,
    cancelPendingMagicLink,
    isMagicLinkCallback
  } = useAuthContext();

  const magicLinkInfo = getMagicLinkInfo();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading authentication system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Authentication System Test</h1>
          <p className="text-muted-foreground">
            Test your Firebase Anonymous Authentication with Email Link upgrade
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Authentication Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Current User State */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Current User State
              </CardTitle>
              <CardDescription>
                Current authentication status and user information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Auth State:</div>
                <div className={`capitalize ${
                  authState === 'authenticated' ? 'text-green-600' : 
                  authState === 'anonymous' ? 'text-yellow-600' : 
                  authState === 'error' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {authState}
                </div>
                
                <div className="font-medium">User ID:</div>
                <div className="font-mono text-xs">{user?.uid || 'None'}</div>
                
                <div className="font-medium">Email:</div>
                <div>{user?.email || 'None'}</div>
                
                <div className="font-medium">Anonymous:</div>
                <div>{user?.isAnonymous ? 'Yes' : 'No'}</div>
                
                <div className="font-medium">Email Verified:</div>
                <div>{user?.emailVerified ? 'Yes' : 'No'}</div>
                
                <div className="font-medium">Can Upgrade:</div>
                <div>{canUpgrade ? 'Yes' : 'No'}</div>
                
                <div className="font-medium">Is Authenticated:</div>
                <div>{isAuthenticated ? 'Yes' : 'No'}</div>
              </div>
              
              {isMagicLinkCallback && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-blue-700 text-sm font-medium">
                    Magic Link Detected! The system is processing your sign-in.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Magic Link Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Magic Link Status
              </CardTitle>
              <CardDescription>
                Current magic link flow information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Has Pending:</div>
                <div>{magicLinkInfo.hasPending ? 'Yes' : 'No'}</div>
                
                <div className="font-medium">Email:</div>
                <div>{magicLinkInfo.email || 'None'}</div>
                
                <div className="font-medium">Is Callback:</div>
                <div>{magicLinkInfo.isCallback ? 'Yes' : 'No'}</div>
                
                {magicLinkInfo.timeRemaining && (
                  <>
                    <div className="font-medium">Time Remaining:</div>
                    <div>{Math.round(magicLinkInfo.timeRemaining / 1000)}s</div>
                  </>
                )}
              </div>
              
              {magicLinkInfo.hasPending && (
                <Button 
                  onClick={cancelPendingMagicLink}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Cancel Pending Request
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Authentication Form */}
        <div className="flex justify-center">
          <UpgradeAccountForm />
        </div>

        {/* Test Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Test Instructions
            </CardTitle>
            <CardDescription>
              How to test the authentication system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Anonymous Sign-in Test</h4>
              <p className="text-sm text-muted-foreground">
                When you first load this page, you should be automatically signed in as an anonymous user. 
                Check that "Auth State" shows "anonymous" and "Anonymous" shows "Yes".
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Magic Link Upgrade Test</h4>
              <p className="text-sm text-muted-foreground">
                Enter your email address in the form above and click "Send Sign-In Link". 
                Check your email for the magic link and click it to complete the upgrade.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">3. Account Linking Verification</h4>
              <p className="text-sm text-muted-foreground">
                After clicking the magic link, you should be redirected back here with your anonymous account 
                now linked to your email. Check that "Auth State" shows "authenticated" and your email appears.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">4. Sign Out Test</h4>
              <p className="text-sm text-muted-foreground">
                Once authenticated, you can test the sign-out functionality. 
                After signing out, you should be automatically signed in anonymously again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}