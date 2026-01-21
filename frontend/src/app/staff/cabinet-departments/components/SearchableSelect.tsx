"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  label: string;
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  loading?: boolean;
  required?: boolean;
  onSearch?: (keyword: string) => void;
  searchPlaceholder?: string;
  initialDisplay?: { label: string; subLabel?: string }; // For showing current value before options load
  disabled?: boolean;
}

export default function SearchableSelect({
  label,
  placeholder = "เลือก...",
  value,
  onValueChange,
  options,
  loading = false,
  required = false,
  onSearch,
  searchPlaceholder = "ค้นหา...",
  initialDisplay,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(""); // Clear search when closing
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset initial load flag when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      initialLoadDone.current = false;
    }
  }, [isOpen]);

  // Load initial data immediately when dropdown opens, then handle search with debounce
  useEffect(() => {
    if (!isOpen || !onSearch) return;

    // First time opening dropdown - load immediately without debounce
    if (!initialLoadDone.current) {
      onSearch("");
      initialLoadDone.current = true;
      return;
    }

    // Subsequent searches - use debounce
    const debounce = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [searchTerm, isOpen]); // ลบ onSearch ออกจาก dependencies

  // Filter options locally if no onSearch provided
  const filteredOptions = onSearch
    ? options
    : options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opt.subLabel?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const selectedOption = options.find((opt) => opt.value === value);
  
  // Use initialDisplay if value exists but not found in options yet
  const displayValue = selectedOption || (value && initialDisplay ? initialDisplay : null);

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            setIsOpen(!isOpen);
            if (!isOpen) {
              setSearchTerm(""); // Reset search when opening
            }
          }}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md bg-white transition-colors",
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "hover:bg-gray-50",
            !displayValue && !disabled && "text-gray-500"
          )}
        >
          <span className="truncate">
            {displayValue ? (
              <span>
                {displayValue.label}
                {displayValue.subLabel && (
                  <span className="text-gray-500 ml-2">- {displayValue.subLabel}</span>
                )}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "transform rotate-180")} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[300px] overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  autoFocus
                />
              </div>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto max-h-[240px]">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">กำลังโหลด...</span>
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500">ไม่พบข้อมูล</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onValueChange(option.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors",
                      option.value === value && "bg-blue-50 text-blue-600"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      {option.subLabel && (
                        <span className="text-xs text-gray-500">{option.subLabel}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
