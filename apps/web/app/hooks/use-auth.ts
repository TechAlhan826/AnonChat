import { useState, useEffect } from "react";
import { auth, type User } from "../lib/auth";
import { useToast } from "../hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const token = auth.getCurrentToken();
    if (token) {
      // TODO: Validate token with backend and get user info
      setIsGuest(auth.isGuest());
      if (!auth.isGuest()) {
        // Mock user for authenticated users - in real app, decode JWT or fetch user
        setUser({ id: "1", name: "User", email: "user@example.com" });
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await auth.login(email, password);
      auth.setToken(response.token);
      setUser(response.user);
      setIsGuest(false);
      toast({
        title: "Success",
        description: "Successfully logged in!",
      });
      return response;
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await auth.register(name, email, password);
      toast({
        title: "Success",
        description: "Account created! Please check your email to verify.",
      });
      return response;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createGuestSession = async (displayName?: string) => {
    try {
      setIsLoading(true);
      const response = await auth.createGuestSession(displayName);
      auth.setGuestToken(response.sessionToken);
      setIsGuest(true);
      toast({
        title: "Success",
        description: "Joined as guest!",
      });
      return response;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create guest session",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    auth.removeTokens();
    setUser(null);
    setIsGuest(false);
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isGuest,
    login,
    register,
    createGuestSession,
    logout,
  };
}
