import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface GuestSession {
  sessionToken: string;
  displayName: string;
}

export const auth = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    return await res.json();
  },

  async register(name: string, email: string, password: string): Promise<{ message: string; userId: string }> {
    const res = await apiRequest("POST", "/api/auth/register", { name, email, password });
    return await res.json();
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
    return await res.json();
  },

  async createGuestSession(displayName?: string): Promise<GuestSession> {
    const res = await apiRequest("POST", "/api/auth/guest", { displayName });
    return await res.json();
  },

  setToken(token: string) {
    localStorage.setItem("authToken", token);
  },

  getToken(): string | null {
    return localStorage.getItem("authToken");
  },

  setGuestToken(token: string) {
    localStorage.setItem("guestToken", token);
  },

  getGuestToken(): string | null {
    return localStorage.getItem("guestToken");
  },

  removeTokens() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("guestToken");
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  isGuest(): boolean {
    return !!this.getGuestToken() && !this.getToken();
  },

  getCurrentToken(): string | null {
    return this.getToken() || this.getGuestToken();
  },
};
