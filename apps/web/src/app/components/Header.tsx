'use client'
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import Cookies from 'js-cookie';
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface Decoded { name?: string; type?: 'guest'; userId?: string; }

export function Header() {
  const [open, setOpen] = useState(false);
  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const token = Cookies.get('token'); // || localStorage.getItem('token_fallback');
  const router = useRouter();

  useEffect(() => {
    if (token) {
      localStorage.setItem('token_fallback', token);
      try {
        const dec: Decoded = jwtDecode(token);
        setDecoded(dec);
      } catch {}
    }
  }, [token]);

  const logout = () => {
    Cookies.remove('token');
    localStorage.removeItem('token_fallback');
    router.push('/auth/login');
  };

  const isLogged = !!decoded && decoded.type !== 'guest';
  const isGuest = !!decoded && decoded.type === 'guest';

  return (
    <header className="bg-card p-4 border-b flex justify-between items-center">
      <h1 className="text-xl font-bold">AnonChat</h1>
      <div className="flex space-x-2">
        {!token ? (
          <>
            <Button onClick={() => router.push('/auth/login')}>Login</Button>
            <Button onClick={() => router.push('/auth/register')}>Register</Button>
          </>
        ) : isGuest ? (
          <p>Guest Mode</p>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Profile ({decoded?.name})</Button>
            </DialogTrigger>
            <DialogContent>
              <p>Name: {decoded?.name}</p>
              <p>Type: User</p>
              <Button onClick={logout}>Logout</Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </header>
  );
}