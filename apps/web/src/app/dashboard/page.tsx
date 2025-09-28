'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { Plus, Users, User, LogOut, MessageCircle, Clock, Settings, Copy, Check } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode";

interface Room {
  _id: string;
  code: string;
  name?: string;
  type: 'p2p' | 'group';
  preserveHistory: boolean;
  createdBy: string;
  createdAt: string;
  memberCount?: number;
}

interface DecodedToken {
  type?: 'guest';
  id: string;
  name?: string;
  userId?: string;
}

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  
  // Create room form
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'p2p' | 'group'>('group');
  const [preserveHistory, setPreserveHistory] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Join room form
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // Copy functionality
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const token:string = Cookies.get('token') as string || localStorage.getItem('token') as string;
    //console.log("broo", token);
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      setUser(decoded);
      setIsGuest(decoded.type === 'guest');
      fetchRooms(token);
    } catch (error) {
      console.error('Token decode error:', error);
      Cookies.remove('token');
      router.push('/auth/login');
    }
  }, [router]);

  const fetchRooms = async (token: string) => {
    try {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
  const response = await fetch(`${backendUrl}/api/rooms/my-rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      } else if (response.status === 401) {
        Cookies.remove('token');
        router.push('/auth/login');
      } else {
        toast({
          title: "Error",
          description: "Failed to load rooms",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while loading rooms",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({
        title: "Error",
        description: "Room name is required",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    const token = Cookies.get('token');
    console.log(token);
    try {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
  const response = await fetch(`${backendUrl}/api/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: roomName.trim(),
          type: roomType,
          preserveHistory,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          description: `Room "${data.name}" created successfully!`,
        });
        
        // Reset form and close dialog
        setRoomName('');
        setRoomType('group');
        setPreserveHistory(true);
        setIsCreateDialogOpen(false);
        
        // Refresh rooms list
        await fetchRooms(token!);
        
        // Navigate to the new room
        router.push(`/chat/${data.code}`);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create room",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while creating room",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Room code is required",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);
    const token = Cookies.get('token');
    
    try {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
  const response = await fetch(`${backendUrl}/api/rooms/${joinCode.trim()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setJoinCode('');
        setIsJoinDialogOpen(false);
        router.push(`/chat/${joinCode.trim()}`);
      } else if (response.status === 404) {
        toast({
          title: "Room Not Found",
          description: "The room code you entered doesn't exist.",
          variant: "destructive"
        });
      } else if (response.status === 403) {
        toast({
          title: "Room Full",
          description: "This P2P room is already full.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to join room",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while joining room",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    const token = Cookies.get('token');
    
    try {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
  const response = await fetch(`${backendUrl}/api/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast({ description: "Left room successfully" });
        await fetchRooms(token!);
      } else {
        toast({
          title: "Error",
          description: "Failed to leave room",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while leaving room",
        variant: "destructive"
      });
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({ description: "Room code copied to clipboard!" });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy room code",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    toast({ description: "Logged out successfully" });
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.name || 'Guest'} {isGuest && '(Guest)'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="hover:bg-blue-50">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Join Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Room</DialogTitle>
                  <DialogDescription>
                    Enter a room code to join an existing conversation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter room code..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                    className="font-mono tracking-wider"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsJoinDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleJoinRoom} disabled={isJoining}>
                      {isJoining ? "Joining..." : "Join Room"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                  <DialogDescription>
                    Set up a new chat room with your preferences.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Room Name
                    </label>
                    <Input
                      placeholder="Enter room name..."
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Room Type
                    </label>
                    <Select value={roomType} onValueChange={(value: 'p2p' | 'group') => setRoomType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="group">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Group Chat (Multiple users)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="p2p">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>P2P Chat (2 users only)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="preserve"
                      checked={preserveHistory}
                      onCheckedChange={(checked) => setPreserveHistory(checked as boolean)}
                    />
                    <label htmlFor="preserve" className="text-sm font-medium text-gray-700">
                      Preserve chat history
                    </label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRoom} disabled={isCreating}>
                      {isCreating ? "Creating..." : "Create Room"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {rooms.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Rooms Yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first room or join an existing one to start chatting!
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsJoinDialogOpen(true)}
                className="hover:bg-blue-50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Join Room
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Your Rooms</h2>
              <p className="text-gray-600">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card key={room._id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-white/70 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                          {room.name || `Room ${room.code}`}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-2 mt-1">
                          {room.type === 'p2p' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Users className="w-4 h-4" />
                          )}
                          <span>
                            {room.type === 'p2p' ? 'P2P Chat' : 'Group Chat'}
                          </span>
                          {room.memberCount && (
                            <span className="text-xs">• {room.memberCount} members</span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <Badge variant={room.type === 'p2p' ? 'secondary' : 'default'}>
                          {room.type.toUpperCase()}
                        </Badge>
                        {room.preserveHistory && (
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            Saved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Room Code:</span>
                        <div className="flex items-center space-x-2">
                          <code className="px-2 py-1 bg-white border rounded text-sm font-mono tracking-wider">
                            {room.code}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyCode(room.code)}
                            className="h-6 w-6 p-0 hover:bg-blue-100"
                          >
                            {copiedCode === room.code ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Created {new Date(room.createdAt).toLocaleDateString()}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/chat/${room.code}`)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Join Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLeaveRoom(room.code)}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        >
                          <LogOut className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}