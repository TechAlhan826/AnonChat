'use client'
import { useState } from "react";
import { useLocation } from "wouter";
import { LogIn, Plus, Shield, Zap, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

export default function Home() {
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("group");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { isAuthenticated, createGuestSession } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-character room code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("guestToken");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers,
        body: JSON.stringify({ code: roomCode.toUpperCase() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      const data = await res.json();
      toast({
        title: "Success",
        description: `Joined room ${roomCode.toUpperCase()}!`,
      });
      
      if (isAuthenticated) {
        setLocation("/dashboard");
      } else {
        setLocation(`/chat/${roomCode.toUpperCase()}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join room",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      let endpoint = "/api/rooms/create";
      let headers: any = { "Content-Type": "application/json" };
      
      if (isAuthenticated) {
        const token = localStorage.getItem("authToken");
        if (token) headers.Authorization = `Bearer ${token}`;
      } else {
        endpoint = "/api/rooms/create-guest";
        // Create guest session if not exists
        if (!localStorage.getItem("guestToken")) {
          await createGuestSession();
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: roomName || undefined,
          type: roomType,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      const room = await res.json();
      toast({
        title: "Success",
        description: `Room created! Code: ${room.code}`,
      });

      if (isAuthenticated) {
        setLocation("/dashboard");
      } else {
        setLocation(`/chat/${room.code}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create room",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Start Chatting Anonymously</h1>
          <p className="text-xl text-muted-foreground mb-8">Join conversations instantly with a simple room code. No registration required.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Join Room Card */}
          <Card className="animate-slide-up">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Join Room</h3>
                <p className="text-muted-foreground">Enter a 6-character room code to join existing conversations</p>
              </div>
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <Label htmlFor="roomCode" className="block text-sm font-medium text-foreground mb-2">
                    Room Code
                  </Label>
                  <Input
                    id="roomCode"
                    type="text"
                    maxLength={6}
                    placeholder="ABC123"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    className="room-code text-center text-lg tracking-wider font-mono"
                    data-testid="input-room-code"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isJoining || roomCode.length !== 6}
                  data-testid="button-join-room"
                >
                  {isJoining ? "Joining..." : "Join Room"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Create Room Card */}
          <Card className="animate-slide-up delay-100">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-accent bg-opacity-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Create Room</h3>
                <p className="text-muted-foreground">Start a new conversation and invite others with a shareable code</p>
              </div>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <Label htmlFor="roomName" className="block text-sm font-medium text-foreground mb-2">
                    Room Name (Optional)
                  </Label>
                  <Input
                    id="roomName"
                    type="text"
                    placeholder="My Chat Room"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    data-testid="input-room-name"
                  />
                </div>
                <div>
                  <Label htmlFor="roomType" className="block text-sm font-medium text-foreground mb-2">
                    Room Type
                  </Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger data-testid="select-room-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">Group Chat</SelectItem>
                      <SelectItem value="p2p">One-to-One</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="secondary"
                  disabled={isCreating}
                  data-testid="button-create-room"
                >
                  {isCreating ? "Creating..." : "Create Room"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 animate-slide-up delay-200">
            <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Anonymous</h4>
            <p className="text-sm text-muted-foreground">Chat without revealing your identity. No personal data required.</p>
          </div>
          <div className="text-center p-6 animate-slide-up delay-300">
            <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Real-Time</h4>
            <p className="text-sm text-muted-foreground">Messages appear instantly. No delays, no waiting.</p>
          </div>
          <div className="text-center p-6 animate-slide-up delay-400">
            <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Scalable</h4>
            <p className="text-sm text-muted-foreground">Support for thousands of concurrent users across multiple rooms.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
