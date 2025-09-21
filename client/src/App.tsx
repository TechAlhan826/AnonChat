import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { SplashScreen } from "./components/splash-screen";
import { Navigation } from "./components/navigation";
import { ThemeProvider } from "./components/theme-provider";
import { ToastProvider } from "./components/toast-provider";
import Home from "./pages/home";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import ForgotPassword from "./pages/auth/forgot-password";
import Dashboard from "./pages/dashboard";
import ChatRoom from "./pages/chat/[code]";
import NotFound from "./pages/not-found";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        {showSplash ? (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        ) : (
          <div className="min-h-screen bg-background text-foreground">
            <Navigation />
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/auth/login" component={Login} />
              <Route path="/auth/register" component={Register} />
              <Route path="/auth/forgot-password" component={ForgotPassword} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/chat/:code" component={ChatRoom} />
              <Route component={NotFound} />
            </Switch>
          </div>
        )}
        <ToastProvider />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
