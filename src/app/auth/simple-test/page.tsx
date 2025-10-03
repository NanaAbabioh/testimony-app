'use client';

import { useAuthContext } from '@/components/providers/AuthProvider';
import { UpgradeAccountForm } from '@/components/auth/UpgradeAccountForm';

export default function SimpleAuthTest() {
  const { user, loading, authState } = useAuthContext();

  if (loading) {
    return <div className="p-8">Loading authentication...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="mb-8 p-4 border rounded">
        <h2 className="font-semibold mb-2">Current Auth State:</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify({ authState, user }, null, 2)}
        </pre>
      </div>

      <div className="max-w-md">
        <UpgradeAccountForm />
      </div>
    </div>
  );
}