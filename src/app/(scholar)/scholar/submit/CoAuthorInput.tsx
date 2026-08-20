"use client"

import { useState, useEffect, useRef } from "react";
import { searchScholars } from "./user-search-actions";

interface CoAuthor {
  name: string;
  userId?: string;
}

interface CoAuthorInputProps {
  value: CoAuthor;
  onChange: (value: CoAuthor) => void;
  onRemove: () => void;
}

interface Scholar {
  id: string;
  name: string;
  email: string;
}

export function CoAuthorInput({ value, onChange, onRemove }: CoAuthorInputProps) {
  const [query, setQuery] = useState(value.name);
  const [results, setResults] = useState<Scholar[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!touched) return;

    const timer = setTimeout(async () => {
      if (query.length >= 2 && !value.userId) {
        setLoading(true);
        try {
          const scholars = await searchScholars(query);
          setResults(scholars);
          setShowResults(true);
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, value.userId, touched]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (scholar: Scholar) => {
    onChange({ name: scholar.name, userId: scholar.id });
    setQuery(scholar.name);
    setShowResults(false);
    setTouched(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setTouched(true);
    // If user is typing after selecting someone, clear the userId to treat as custom name
    onChange({ name: newValue, userId: undefined });
  };

  return (
    <div className="relative flex items-center gap-2" ref={containerRef}>
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search by name or email, or type custom name"
          className="h-10 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
        />
        {value.userId && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="flex h-5 items-center rounded-full bg-emerald-100 px-2 text-[10px] font-bold text-emerald-700">
              LINKED USER
            </span>
          </div>
        )}
        
        {showResults && (
          <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-psrr-border bg-white shadow-xl">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-xs text-psrr-slate">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-psrr-gold border-t-transparent" />
                Searching scholars...
              </div>
            ) : results.length > 0 ? (
              results.map((scholar) => (
                <button
                  key={scholar.id}
                  type="button"
                  onClick={() => handleSelect(scholar)}
                  className="flex w-full flex-col px-4 py-2 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-sans text-sm font-bold text-psrr-navy">{scholar.name}</span>
                  <span className="font-sans text-xs text-psrr-slate">{scholar.email}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-psrr-slate italic">
                No active scholars found matching "{query}"
              </div>
            )}
          </div>
        )}
      </div>
      
      <button
        type="button"
        onClick={onRemove}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-psrr-border text-psrr-slate hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  );
}
