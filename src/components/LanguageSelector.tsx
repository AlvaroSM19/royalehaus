'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, SupportedLanguage } from '@/lib/useLanguage';
import { LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/data/card-translations';

export default function LanguageSelector() {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold tracking-wide bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all duration-200"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-base leading-none">{LANGUAGE_FLAGS[language]}</span>
        <span className="hidden sm:inline uppercase">{language}</span>
        <svg 
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-44 rounded-xl shadow-xl z-[100] overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 27, 20, 0.98) 0%, rgba(20, 18, 12, 0.99) 100%)',
            border: '1px solid rgba(180, 140, 60, 0.25)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 220, 120, 0.1)',
          }}
          role="listbox"
          aria-label="Available languages"
        >
          {/* Header */}
          <div 
            className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/50"
            style={{ borderBottom: '1px solid rgba(180, 140, 60, 0.15)' }}
          >
            Card Names Language
          </div>

          {/* Language Options */}
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {availableLanguages.map((lang) => {
              const isSelected = lang === language;
              return (
                <button
                  key={lang}
                  onClick={() => handleSelect(lang)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-150 ${
                    isSelected 
                      ? 'bg-amber-500/15 text-amber-200' 
                      : 'text-zinc-300 hover:bg-amber-500/10 hover:text-amber-100'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="text-lg leading-none">{LANGUAGE_FLAGS[lang]}</span>
                  <span className="flex-1 text-sm font-medium">{LANGUAGE_NAMES[lang]}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div 
            className="px-3 py-2 text-[9px] text-zinc-500 leading-tight"
            style={{ borderTop: '1px solid rgba(180, 140, 60, 0.1)' }}
          >
            Affects card names only
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(180, 140, 60, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(180, 140, 60, 0.5);
        }
      `}</style>
    </div>
  );
}
