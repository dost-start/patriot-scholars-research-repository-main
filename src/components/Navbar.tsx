"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut, type Session } from "@/lib/auth-client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  Home, 
  Search, 
  Map, 
  Info, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  PlusCircle,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  LucideIcon
} from "lucide-react";

interface NavLink {
  name: string;
  href: string;
  icon: LucideIcon;
}

export default function Navbar({ initialSession }: { initialSession: Session | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: clientSession } = useSession();
  
  // Use client session if available, fallback to server session
  const session = clientSession !== undefined ? clientSession : initialSession;
  const user = session?.user as (NonNullable<Session>["user"] & { role?: string }) | undefined;
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getLinks = () => {
    if (!session) {
      return [
        { name: "Home", href: "/", icon: Home },
        { name: "Browse Papers", href: "/search", icon: Search },
        { name: "Regions", href: "/regions", icon: Map },
        { name: "About", href: "/about", icon: Info },
      ];
    }

    if (user?.role === "ADMIN") {
      return [
        { name: "Admin Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Manage Papers", href: "/admin/papers", icon: FileText },
        { name: "User Directory", href: "/admin/users", icon: Users },
        { name: "Settings", href: "/admin/settings", icon: Settings },
      ];
    }

    if (user?.role === "SCHOLAR") {
      return [
        { name: "Dashboard", href: "/scholar", icon: LayoutDashboard },
        { name: "Search Papers", href: "/search", icon: Search },
        { name: "My Submissions", href: "/scholar/submissions", icon: FileText },
        { name: "Submit Paper", href: "/scholar/submit", icon: PlusCircle },
      ];
    }

    return [
      { name: "Home", href: "/", icon: Home },
      { name: "Search Papers", href: "/search", icon: Search },
      { name: "Bookmarks", href: "/bookmarks", icon: FileText },
      { name: "About", href: "/about", icon: Info },
    ];
  };

  const navLinks = getLinks();

  const isActive = (href: string) => {
    if (href === "/" && pathname !== "/") return false;
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on path change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 flex h-[72px] w-full items-center justify-between border-b border-psrr-border bg-psrr-white px-8 lg:px-16">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-9 w-9">
            <Image
              src="/psrr.svg"
              alt="PSRR Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-display text-xl font-bold tracking-[0.1em] text-psrr-navy uppercase">
            PSRR
          </span>
        </Link>
      </div>

      {/* Center: Desktop Links */}
      <div className="hidden items-center gap-8 lg:flex">
        {!session && navLinks.map((link: NavLink) => (
          <Link
            key={link.name}
            href={link.href}
            className={`text-[13px] transition-colors hover:text-psrr-gold ${
              isActive(link.href)
                ? "font-bold text-psrr-navy-cta"
                : "font-medium text-psrr-slate"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 lg:gap-6">
        {session ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-full p-1 transition-all hover:bg-psrr-surface"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-psrr-surface border border-psrr-border text-psrr-navy shadow-sm overflow-hidden">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <svg 
                className={`hidden lg:block h-4 w-4 text-psrr-slate transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-psrr-border bg-white py-2 shadow-[0_4px_12px_0_rgba(11,31,58,0.1)] overflow-hidden">
                {/* User Info */}
                <div className="px-4 py-3 flex flex-col gap-1">
                  <span className="text-sm font-bold text-psrr-navy truncate">{session.user.name}</span>
                  <span className="text-xs text-psrr-slate truncate">{session.user.email}</span>
                </div>
                
                <div className="h-px w-full bg-psrr-border my-1" />
                
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-psrr-navy hover:bg-psrr-surface transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <svg className="h-4 w-4 text-psrr-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </Link>

                {user?.role === "SCHOLAR" && (
                  <Link
                    href="/scholar"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-psrr-slate hover:bg-psrr-surface transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    My Submissions
                  </Link>
                )}

                <div className="h-px w-full bg-psrr-border my-1" />

                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-bold text-psrr-slate hover:text-psrr-navy-cta transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-psrr-gold px-6 py-2 text-sm font-bold text-psrr-white transition-all hover:bg-psrr-gold-accent shadow-sm"
            >
              Register
            </Link>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-psrr-navy"
        >
          {isMobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 top-[72px] z-40 bg-psrr-navy/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`fixed inset-y-0 right-0 top-[72px] z-50 w-full max-w-xs bg-white p-6 shadow-xl transition-transform duration-300 lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold tracking-widest text-psrr-slate uppercase">MENU</span>
            {navLinks.map((link: NavLink) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-lg font-bold transition-colors ${
                  isActive(link.href) ? 'text-psrr-navy-cta' : 'text-psrr-navy'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {!session && (
            <div className="flex flex-col gap-3 pt-6 border-t border-psrr-border">
              <Link
                href="/login"
                className="flex h-12 w-full items-center justify-center rounded-lg border border-psrr-border font-bold text-psrr-navy"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex h-12 w-full items-center justify-center rounded-lg bg-psrr-gold font-bold text-psrr-white"
              >
                Register Account
              </Link>
            </div>
          )}

          {session && (
            <Link
              href="/scholar/submit"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-psrr-navy-cta font-bold text-psrr-white"
            >
              Submit Paper
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
