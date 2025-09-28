'use client'
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { UserCircle, ArrowRight } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import Cookies from 'js-cookie';

function GuestAuthContent() {
  const [guestName, setGuestName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    // Check if user is already authenticated
    const token = Cookies.get('token');
    if (token) {
      router.push(redirectPath);
    }
  }, [router, redirectPath]);

  const handleGuestLogin = async () => {
    const name = guestName.trim() || `Guest_${Math.random().toString(36).substr(2, 6)}`;
    
    setIsLoading(true);
    
    try {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
  const response = await fetch(`${backendUrl}/api/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Set token in cookies
        Cookies.set('token', data.token, { 
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        
        toast({
          description: `Welcome, ${name}!`,
        });
        
        // Navigate to the redirect path
        router.push(redirectPath);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create guest session",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGuestLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <Card className="w-full max-w-md shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">Join as Guest</CardTitle>
          <CardDescription className="text-gray-600">
            Enter a display name to continue, or we'll generate one for you.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="guestName" className="text-sm font-medium text-gray-700">
              Display Name (Optional)
            </label>
            <Input
              id="guestName"
              type="text"
              placeholder="Enter your display name..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-center"
              maxLength={20}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 text-center">
              Leave empty for a random name
            </p>
          </div>
          
          <Button
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating session...</span>
              </div>
            ) : (
              <>
                <span>Continue as Guest</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/auth/login')}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GuestAuth() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <GuestAuthContent />
    </Suspense>
  );
}