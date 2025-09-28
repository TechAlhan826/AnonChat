'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { MessageCircle, Users, Lock, Zap, Shield, Globe, Plus, ArrowRight } from "lucide-react";
import { useToast } from "./hooks/use-toast";
import Cookies from 'js-cookie';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const token = Cookies.get('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
  const response = await fetch(`${backendUrl}/api/rooms/${roomCode.trim()}`);
      
      if (response.ok) {
        router.push(`/auth/guest?redirect=/chat/${roomCode.trim()}`);
      } else if (response.status === 404) {
        toast({
          title: "Room Not Found",
          description: "The room code you entered doesn't exist.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to check room. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = () => {
    router.push('/auth/guest?redirect=/dashboard');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AnonChat
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/auth/login')}
              className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => router.push('/auth/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Anonymous Chat,
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Infinite Possibilities</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Connect with people around the world in secure, anonymous chat rooms. 
              No registration required - just jump in and start talking.
            </p>
          </div>

          {/* Quick Join Card */}
          <Card className="max-w-md mx-auto mb-12 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-center space-x-2 text-gray-800">
                <ArrowRight className="w-5 h-5 text-blue-600" />
                <span>Join a Room</span>
              </CardTitle>
              <CardDescription>Enter a room code to join an existing conversation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter room code..."
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-center text-lg font-mono tracking-wider"
                disabled={isLoading}
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={handleJoinRoom}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Joining...</span>
                    </div>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Join Room
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleCreateRoom}
                  variant="outline"
                  className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:shadow-lg hover:scale-105"
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Room
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Anonymous & Secure</h3>
                <p className="text-gray-600">Chat without revealing your identity. Your privacy is our priority.</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors duration-300">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Real-time Messaging</h3>
                <p className="text-gray-600">Experience lightning-fast message delivery with live typing indicators.</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors duration-300">
                  <Globe className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Global Access</h3>
                <p className="text-gray-600">Connect with people from around the world, no matter where you are.</p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to start chatting?</h3>
            <p className="text-blue-100 mb-6">
              Create an account for additional features like room management and chat history.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => router.push('/auth/register')}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 transition-all duration-200 hover:shadow-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Sign Up Free
              </Button>
              <Button 
                onClick={() => router.push('/auth/login')}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 transition-all duration-200 hover:shadow-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <MessageCircle className="w-6 h-6" />
            <span className="text-xl font-bold">AnonChat</span>
          </div>
          <p className="text-gray-400">
            Anonymous, secure, and real-time messaging for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
}