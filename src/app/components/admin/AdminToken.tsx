"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

interface AdminTokenProps {
  children: (token: string | null) => React.ReactNode;
}

export default function AdminToken({ children }: AdminTokenProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check for stored admin token
        const storedToken = localStorage.getItem('adminToken');
        
        if (!storedToken) {
          // No token found, redirect to login
          router.push('/admin/login');
          return;
        }

        // Verify token with server
        const response = await fetch('/api/admin/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: storedToken }),
        });

        const data = await response.json();

        if (data.valid) {
          setToken(storedToken);
        } else {
          // Token invalid, remove and redirect to login
          localStorage.removeItem('adminToken');
          router.push('/admin/login');
        }
      } catch (error) {
        console.error("Error checking admin auth:", error);
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    // This should not render as we redirect to login, but just in case
    return null;
  }

  return <>{children(token)}</>;
}