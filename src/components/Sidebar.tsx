"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, type Session } from "@/lib/auth-client";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Search, 
  Home, 
  Info, 
  Map, 
  PlusCircle,
  ChevronRight,
  Settings,
  History,
  Database,
  LucideIcon
} from "lucide-react";

interface SidebarLink {
  name: string;
  href: string;
  icon: LucideIcon;
}

export default function Sidebar({ initialSession }: { initialSession: Session | null }) {
  const pathname = usePathname();
  const { data: clientSession } = useSession();
  
  // Use client session if available, fallback to server session
  const session = clientSession !== undefined ? clientSession : initialSession;
  const user = session?.user as (NonNullable<Session>["user"] & { role?: string }) | undefined;

  const getLinks = () => {
    if (!session) return [];

    if (user?.role === "ADMIN") {
      return [
        { name: "Admin Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Manage Papers", href: "/admin/papers", icon: FileText },
        { name: "User Directory", href: "/admin/users", icon: Users },
        { name: "SPAS Management", href: "/admin/spas", icon: Database },
        { name: "Audit Logs", href: "/admin/audit", icon: History },
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

    // Default Public User Logged In
    return [
      { name: "Home", href: "/", icon: Home },
      { name: "Search Papers", href: "/search", icon: Search },
      { name: "Bookmarks", href: "/bookmarks", icon: FileText },
      { name: "About", href: "/about", icon: Info },
    ];
  };

  const links = getLinks();

  if (!session) return null;

  const isActive = (href: string) => {
    if (href === pathname) return true;
    if (href !== "/" && href !== "/admin" && href !== "/scholar" && pathname.startsWith(href)) return true;
    return false;
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <aside className={`hidden w-[280px] flex-col border-r lg:flex sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto transition-colors duration-300 ${
      isAdmin 
        ? "bg-[#0B1F3A] border-[#0B1F3A]" 
        : "bg-white border-psrr-border"
    }`}>
      <div className="p-8">
        <div className="mb-8">
          <h2 className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
            isAdmin ? "text-psrr-slate-light" : "text-psrr-slate"
          }`}>
            {user?.role ? `${user.role} Navigation` : "Navigation"}
          </h2>
        </div>
        
        <nav className="flex flex-col gap-2">
          {links.map((link: SidebarLink) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group flex items-center justify-between rounded-xl px-4 py-3 transition-all ${
                  active
                    ? isAdmin 
                      ? "bg-white/10 text-white" 
                      : "bg-psrr-navy/5 text-psrr-navy-cta"
                    : isAdmin
                      ? "text-psrr-slate-light hover:bg-white/5 hover:text-white"
                      : "text-psrr-slate hover:bg-psrr-surface hover:text-psrr-navy"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-[18px] w-[18px] ${
                    active 
                      ? isAdmin ? "text-psrr-gold" : "text-psrr-navy-cta" 
                      : isAdmin ? "text-psrr-slate-light group-hover:text-white" : "text-psrr-slate group-hover:text-psrr-navy"
                  }`} />
                  <span className={`text-sm ${active ? "font-bold" : "font-medium"}`}>
                    {link.name}
                  </span>
                </div>
                {active && (
                  <ChevronRight className={`h-4 w-4 ${
                    isAdmin ? "text-psrr-gold" : "text-psrr-navy-cta"
                  }`} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
