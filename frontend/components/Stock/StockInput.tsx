"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Loader2, Building2, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { searchStock } from '@/lib/api/analysis';
import type { StockSearchResult } from '@/types/stock';

interface StockInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function StockInput({
  value,
  onChange,
  placeholder = "종목코드 또는 회사명 (예: AAPL, 삼성전자)",
  className,
  disabled = false,
}: StockInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 검색 결과 가져오기 (디바운스 적용)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || value.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchStock(value);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('종목 검색 실패:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = useCallback(() => {
    onChange('');
    setSearchResults([]);
    setShowDropdown(false);
  }, [onChange]);

  const handleSelect = useCallback((result: StockSearchResult) => {
    onChange(result.symbol);
    setShowDropdown(false);
    setSearchResults([]);
    inputRef.current?.blur();
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  const marketColors = {
    US: 'text-blue-500',
    KR: 'text-rose-500',
  };

  const marketLabels = {
    US: '미국',
    KR: '한국',
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "relative flex items-center rounded-xl border transition-all duration-300",
          isFocused
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="absolute left-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (searchResults.length > 0) {
              setShowDropdown(true);
            }
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-12 pr-12 py-6 text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 자동완성 드롭다운 */}
      {showDropdown && searchResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 py-2 bg-popover border border-border rounded-xl shadow-lg max-h-80 overflow-y-auto"
        >
          {searchResults.map((result, index) => (
            <button
              key={`${result.symbol}-${index}`}
              type="button"
              onClick={() => handleSelect(result)}
              className={cn(
                "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors",
                "hover:bg-accent focus:bg-accent focus:outline-none",
                selectedIndex === index && "bg-accent"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg",
                result.market === 'US' ? "bg-blue-500/10" : "bg-rose-500/10"
              )}>
                {result.market === 'US' ? (
                  <Globe className={cn("h-5 w-5", marketColors[result.market])} />
                ) : (
                  <Building2 className={cn("h-5 w-5", marketColors[result.market])} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{result.name}</span>
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    result.market === 'US'
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-rose-500/10 text-rose-500"
                  )}>
                    {marketLabels[result.market as keyof typeof marketLabels]}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {result.symbol}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 text-sm text-muted-foreground">
        한국 주식: 삼성전자, 005930.KS | 미국 주식: AAPL, GOOGL, MSFT
      </p>
    </div>
  );
}
