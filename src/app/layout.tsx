import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Patriot Scholars Research Repository",
    template: "%s | PSRR",
  },
  description:
    "DOST-SEI Patriot Scholars Research Repository — discover and share scholars' research papers.",
  icons: {
    icon: "/psrr.svg",
    apple: "/psrr.svg",
  },
};

import { ToastProvider } from "@/components/Toast";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch session on the server for instant UI rendering
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-psrr-surface text-psrr-navy">
        <ToastProvider>
          <Navbar initialSession={session} />
          <div className="flex flex-1">
            <Sidebar initialSession={session} />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
