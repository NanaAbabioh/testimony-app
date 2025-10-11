"use client";

import { useState, useRef, useEffect } from "react";
import { Check, CaretDown } from "@phosphor-icons/react";

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  renderOption?: (option: string) => string;
}

export default function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Select...",
  renderOption = (option) => option,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((v) => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    } else if (selectedValues.length === 1) {
      return renderOption(selectedValues[0]);
    } else if (selectedValues.length === options.length) {
      return "All Selected";
    } else {
      return `${selectedValues.length} Selected`;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">{label}:</label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="min-w-[180px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#5050F0] focus:border-[#5050F0] flex items-center justify-between gap-2"
        >
          <span className="truncate">{getDisplayText()}</span>
          <CaretDown
            size={16}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-[240px] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-[300px] overflow-y-auto">
          {/* Select All Option */}
          <div
            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer flex items-center gap-2 border-b border-gray-200 dark:border-gray-600 sticky top-0 bg-white dark:bg-gray-700 font-medium"
            onClick={handleSelectAll}
          >
            <div className="w-4 h-4 border border-gray-300 dark:border-gray-500 rounded flex items-center justify-center bg-white dark:bg-gray-600">
              {selectedValues.length === options.length && (
                <Check size={14} weight="bold" className="text-[#5050F0]" />
              )}
              {selectedValues.length > 0 && selectedValues.length < options.length && (
                <div className="w-2 h-2 bg-[#5050F0] rounded-sm" />
              )}
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-200">
              {selectedValues.length === options.length ? "Deselect All" : "Select All"}
            </span>
          </div>

          {/* Individual Options */}
          {options.map((option) => {
            const isSelected = selectedValues.includes(option);
            return (
              <div
                key={option}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer flex items-center gap-2"
                onClick={() => handleToggle(option)}
              >
                <div className="w-4 h-4 border border-gray-300 dark:border-gray-500 rounded flex items-center justify-center bg-white dark:bg-gray-600">
                  {isSelected && (
                    <Check size={14} weight="bold" className="text-[#5050F0]" />
                  )}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {renderOption(option)}
                </span>
              </div>
            );
          })}

          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
