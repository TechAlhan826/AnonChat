import type { Metadata } from "next";
//import localFont from "next/font/local";
import "./globals.css";
import { SocketProvider } from "../context/SocketProvider";
import { Header } from "./components/Header";  // New

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
// });  className={`${geistSans.variable} ${geistMono.variable}`}

export const metadata: Metadata = {
  title: "AnonChat",
  description: "Anonymous chat app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <SocketProvider>
        <body>
          <Header />  // New
          {children}
        </body>
      </SocketProvider>
    </html>
  );
}