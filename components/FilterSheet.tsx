"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button";
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
  const [sort, setSort] = useState<"relevance"|"newest"|"most-saved">(urlState.sort as any);

  // Sync state when URL changes
  useEffect(() => {
    setQ(urlState.q);
    setCategory(urlState.category);
    setSort(urlState.sort as any);
  }, [urlState.q, urlState.category, urlState.sort]);

  function apply() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (sort && sort !== "relevance") params.set("sort", sort);

    const queryString = params.toString();
    router.replace(queryString ? `/search?${queryString}` : "/search");
    setOpen(false);
  }

  function resetAll() {
    setQ("");
    setCategory("");
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

  const hasActiveFilters = q || category || sort !== "relevance";

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={`w-full sm:w-auto touch-manipulation bg-white text-gray-900 border-gray-300 hover:bg-gray-50 ${hasActiveFilters ? "border-[#301934] text-[#301934]" : ""}`}
      >
        Filters
        {hasActiveFilters && <span className="ml-1 text-xs">•</span>}
      </Button>

      {/* Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel - Mobile bottom sheet / Desktop right panel */}
          <div className="absolute bottom-0 left-0 right-0 sm:right-0 sm:top-0 sm:bottom-auto sm:left-auto sm:h-full sm:w-[420px] bg-white rounded-t-xl sm:rounded-l-xl sm:rounded-t-none shadow-2xl border border-gray-200 max-h-[85vh] sm:max-h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="font-semibold text-lg text-gray-900">Filters</div>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white">
              {/* Search Query */}
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-900 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-[#301934]/20 focus:border-[#301934]"
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


              {/* Sort */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort by</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-[#301934]/20 focus:border-[#301934]"
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
            <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 bg-white flex items-center justify-between">
              <button
                onClick={resetAll}
                disabled={!hasActiveFilters}
                className="text-sm text-gray-600 underline hover:text-gray-900 transition-colors disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
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