import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary to-accent animate-fade-out transition-opacity duration-300 opacity-0 pointer-events-none">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">AnonChat</h1>
            <p className="text-white text-opacity-80">Anonymous Real-Time Chat</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary to-accent">
      {/* Background pattern with chat bubbles */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-16 h-16 bg-white rounded-full opacity-20"></div>
        <div className="absolute top-32 right-20 w-12 h-12 bg-white rounded-full opacity-15"></div>
        <div className="absolute bottom-20 left-32 w-20 h-20 bg-white rounded-full opacity-25"></div>
        <div className="absolute bottom-40 right-16 w-14 h-14 bg-white rounded-full opacity-20"></div>
      </div>
      
      <div className="text-center animate-pulse">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-4">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">AnonChat</h1>
          <p className="text-white text-opacity-80">Anonymous Real-Time Chat</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    </div>
  );
}
