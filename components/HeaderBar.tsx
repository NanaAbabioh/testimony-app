"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/button";
import { HomeIcon } from "@/components/ui/icons";

export default function HeaderBar() {
  const pathname = usePathname();
  const isSearch = pathname?.startsWith("/search");
  const isMyWall = pathname?.startsWith("/my-testimony-wall");
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 bg-[hsl(var(--bg))]/80 backdrop-blur-md border-b border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-[var(--pad-medium)] py-2 flex items-center gap-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="font-serif text-lg font-bold text-[hsl(var(--brand))]">Alpha Hour</div>
        </Link>

        {/* Navigation */}
        <nav className="ml-auto flex items-center gap-1">
          <Link 
            href="/" 
            className={`
              hidden sm:inline-flex items-center gap-2 text-sm px-3 py-2 rounded-[var(--radius-btn)] 
              transition-colors duration-150
              ${isHome 
                ? "bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]" 
                : "hover:bg-black/5 dark:hover:bg-white/10 text-[hsl(var(--ink))]"
              }
            `}
          >
            <HomeIcon size={18} />
            Home
          </Link>
          
          <Link 
            href="/search" 
            className={`
              text-sm px-3 py-2 rounded-[var(--radius-btn)] transition-colors duration-150
              ${isSearch 
                ? "bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]" 
                : "hover:bg-black/5 dark:hover:bg-white/10 text-[hsl(var(--ink))]"
              }
            `}
          >
            Discover
          </Link>
          
          <Link 
            href="/my-testimony-wall" 
            className={`
              text-sm px-3 py-2 rounded-[var(--radius-btn)] transition-colors duration-150
              ${isMyWall 
                ? "bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]" 
                : "hover:bg-black/5 dark:hover:bg-white/10 text-[hsl(var(--ink))]"
              }
            `}
          >
            My Wall
          </Link>
          
          <Link href="/watch/live" className="hidden sm:inline ml-1">
            <Button size="sm">Watch Live</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}