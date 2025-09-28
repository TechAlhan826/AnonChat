import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "../context/SocketProvider";
import { Toaster } from "./components/ui/toaster";
import "../remove-console-prod";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AnonChat - Anonymous Real-time Chat",
  description: "Anonymous, secure, and real-time messaging for everyone",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SocketProvider>
          {children}
          <Toaster />
        </SocketProvider>
      </body>
    </html>
  );
}