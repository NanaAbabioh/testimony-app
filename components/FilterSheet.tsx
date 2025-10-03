"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";

type Category = { id: string; name: string };

function useUrlState() {
  const sp = useSearchParams();
  return {
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
    sort: sp.get("sort") ?? "relevance", // relevance | newest | most-saved
  };
}

export default function FilterSheet({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const urlState = useUrlState();

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(urlState.q);
  const [category, setCategory] = useState(urlState.category);
  const [from, setFrom] = useState(urlState.from);
  const [to, setTo] = useState(urlState.to);
  const [sort, setSort] = useState<"relevance"|"newest"|"most-saved">(urlState.sort as any);

  // Sync state when URL changes
  useEffect(() => {
    setQ(urlState.q);
    setCategory(urlState.category);
    setFrom(urlState.from);
    setTo(urlState.to);
    setSort(urlState.sort as any);
  }, [urlState.q, urlState.category, urlState.from, urlState.to, urlState.sort]);

  function apply() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (sort && sort !== "relevance") params.set("sort", sort);
    
    const queryString = params.toString();
    router.replace(queryString ? `/search?${queryString}` : "/search");
    setOpen(false);
  }

  function resetAll() {
    setQ("");
    setCategory("");
    setFrom("");
    setTo("");
    setSort("relevance");
    router.replace("/search");
    setOpen(false);
  }

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  const hasActiveFilters = q || category || from || to || sort !== "relevance";

  return (
    <>
      {/* Trigger Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setOpen(true)}
        className={hasActiveFilters ? "border-[hsl(var(--brand))] text-[hsl(var(--brand))]" : ""}
      >
        Filters
        {hasActiveFilters && <span className="ml-1 text-xs">•</span>}
      </Button>

      {/* Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setOpen(false)} 
          />
          
          {/* Panel - Mobile bottom sheet / Desktop right panel */}
          <div className="relative ml-auto flex flex-col bottom-0 left-0 right-0 sm:inset-auto sm:right-0 sm:top-0 sm:h-full sm:w-[420px] bg-[hsl(var(--bg))] rounded-t-[var(--radius-card)] sm:rounded-l-[var(--radius-card)] sm:rounded-t-none shadow-[var(--shadow)] border border-black/10 dark:border-white/10 max-h-[85vh] sm:max-h-full">
            {/* Header */}
            <div className="flex-shrink-0 p-[var(--pad-medium)] border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="font-semibold text-lg">Filters</div>
              <button 
                onClick={() => setOpen(false)} 
                className="text-sm opacity-70 hover:opacity-100 transition-opacity px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
              >
                Close
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-[var(--pad-medium)] space-y-6">
              {/* Search Query */}
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  className="w-full border border-black/10 dark:border-white/15 rounded-[var(--radius-btn)] px-3 py-2.5 bg-white/60 dark:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 focus:border-[hsl(var(--brand))]"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="e.g., healing, visa, job…"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-3">Category</label>
                <div className="flex flex-wrap gap-2">
                  <Chip active={category === ""} onClick={() => setCategory("")}>
                    All
                  </Chip>
                  {categories.map((c) => (
                    <Chip 
                      key={c.id} 
                      active={category === c.id} 
                      onClick={() => setCategory(c.id)}
                    >
                      {c.name}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium mb-3">Date range</label>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-[hsl(var(--ink))]/70 mb-1">From</div>
                    <input 
                      type="date" 
                      className="w-full border border-black/10 dark:border-white/15 rounded-[var(--radius-btn)] px-3 py-2.5 bg-white/60 dark:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 focus:border-[hsl(var(--brand))]" 
                      value={from} 
                      onChange={(e) => setFrom(e.target.value)} 
                    />
                  </div>
                  <div>
                    <div className="text-xs text-[hsl(var(--ink))]/70 mb-1">To</div>
                    <input 
                      type="date" 
                      className="w-full border border-black/10 dark:border-white/15 rounded-[var(--radius-btn)] px-3 py-2.5 bg-white/60 dark:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 focus:border-[hsl(var(--brand))]" 
                      value={to} 
                      onChange={(e) => setTo(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort by</label>
                <select 
                  className="w-full border border-black/10 dark:border-white/15 rounded-[var(--radius-btn)] px-3 py-2.5 bg-white/60 dark:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 focus:border-[hsl(var(--brand))]" 
                  value={sort} 
                  onChange={(e) => setSort(e.target.value as any)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="most-saved">Most saved</option>
                </select>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0 p-[var(--pad-medium)] border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <button 
                onClick={resetAll} 
                disabled={!hasActiveFilters}
                className="text-sm underline opacity-80 hover:opacity-100 transition-opacity disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
              >
                Reset all
              </button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={apply}>
                  Apply filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}