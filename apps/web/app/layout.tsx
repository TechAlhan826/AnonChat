'use client'

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/theme-provider";
import { ToastProvider } from "./components/toast-provider";
import { Navigation } from "./components/navigation";
import { useState } from "react";
import { SplashScreen } from "./components/splash-screen";
import "./index.css"; 
import './globals.css';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light">
            {showSplash ? (
              <SplashScreen onComplete={() => setShowSplash(false)} />
            ) : (
              <div className="min-h-screen bg-background text-foreground">
                <Navigation />
                {children} {/* Next renders the current page here */}
              </div>
            )}
            <ToastProvider />
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
