import { MessageCircle, Moon, Sun } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/use-auth";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { useTheme } from "./theme-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Navigation() {
  const { user, isAuthenticated, isGuest, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex-shrink-0 flex items-center cursor-pointer">
                <MessageCircle className="w-8 h-8 text-primary mr-2" />
                <span className="text-xl font-bold text-foreground">AnonChat</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            
            {!isAuthenticated && !isGuest && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/auth/login")}
                  data-testid="button-login"
                >
                  Login
                </Button>
                <Button
                  onClick={() => router.push("/auth/register")}
                  data-testid="button-register"
                >
                  Sign Up
                </Button>
              </div>
            )}
            
            {(isAuthenticated || isGuest) && (
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8 online-indicator">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user ? getInitials(user.name) : "G"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground" data-testid="text-username">
                  {user ? user.name : "Guest"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
