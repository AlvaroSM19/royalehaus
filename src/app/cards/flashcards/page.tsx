'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { baseCards } from '@/data';
import { ClashCard, CardRarity } from '@/types/card';
import { Home, RotateCcw, ChevronLeft, ChevronRight, Shuffle, BookOpen, RotateCw, Check, X } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';

const RARITY_COLORS: Record<CardRarity, string> = {
  Common: 'from-gray-500 to-gray-700',
  Rare: 'from-orange-500 to-orange-700',
  Epic: 'from-purple-500 to-purple-700',
  Legendary: 'from-yellow-500 to-amber-600',
  Champion: 'from-red-500 to-rose-700',
  Heroic: 'from-cyan-400 to-blue-600',
};

const RARITY_BORDERS: Record<CardRarity, string> = {
  Common: 'border-gray-500/50',
  Rare: 'border-orange-500/50',
  Epic: 'border-purple-500/50',
  Legendary: 'border-yellow-500/50',
  Champion: 'border-red-500/50',
  Heroic: 'border-cyan-400/50',
};

type FilterRarity = CardRarity | 'all';

export default function FlashcardsPage() {
  const { getCardNameTranslated } = useLanguage();
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<ClashCard[]>([]);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [unknownCards, setUnknownCards] = useState<Set<number>>(new Set());

  // Filter cards by rarity
  const filteredCards = useMemo(() => {
    if (filterRarity === 'all') return baseCards;
    return baseCards.filter(c => c.rarity === filterRarity);
  }, [filterRarity]);

  // Shuffle cards on mount and when filter changes
  const shuffleCards = useCallback(() => {
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [filteredCards]);

  useEffect(() => {
    shuffleCards();
  }, [shuffleCards]);

  const currentCard = shuffledCards[currentIndex];

  const handleNext = () => {
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(i => i + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnown = () => {
    if (currentCard) {
      setKnownCards(prev => {
        const arr: number[] = [];
        prev.forEach(id => arr.push(id));
        arr.push(currentCard.id);
        return new Set(arr);
      });
      setUnknownCards(prev => {
        const next = new Set(prev);
        next.delete(currentCard.id);
        return next;
      });
      handleNext();
    }
  };

  const handleUnknown = () => {
    if (currentCard) {
      setUnknownCards(prev => {
        const arr: number[] = [];
        prev.forEach(id => arr.push(id));
        arr.push(currentCard.id);
        return new Set(arr);
      });
      setKnownCards(prev => {
        const next = new Set(prev);
        next.delete(currentCard.id);
        return next;
      });
      handleNext();
    }
  };

  const resetProgress = () => {
    setKnownCards(new Set());
    setUnknownCards(new Set());
    shuffleCards();
  };

  const getCardImageUrl = (card: ClashCard) => `/images/cards/${card.id}.webp`;

  const formatAttackSpeed = (speed: string | null) => {
    if (!speed) return 'N/A';
    return speed.replace('-', ' ').replace(/^\w/, c => c.toUpperCase());
  };

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950/30 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-300 text-lg mb-4">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950/30 to-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-900/95 via-violet-900/95 to-indigo-900/95 border-b border-indigo-500/30 backdrop-blur-lg shadow-xl shadow-indigo-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/cards"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-600/50 hover:bg-slate-700/60 hover:border-indigo-500/50 transition-all group"
              >
                <Home className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                <span className="text-sm font-medium text-slate-200 hidden sm:inline">Wiki</span>
              </Link>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider bg-gradient-to-r from-indigo-300 via-violet-200 to-purple-300 bg-clip-text text-transparent flex items-center gap-2">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
              FLASHCARDS
            </h1>
            <button
              onClick={resetProgress}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border border-indigo-400/30 transition-all shadow-lg shadow-indigo-900/50"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="font-bold text-sm hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filters and Progress */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Rarity Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterRarity('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterRarity === 'all' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {(['Common', 'Rare', 'Epic', 'Legendary', 'Champion'] as CardRarity[]).map(rarity => (
              <button
                key={rarity}
                onClick={() => setFilterRarity(rarity)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterRarity === rarity 
                    ? `bg-gradient-to-r ${RARITY_COLORS[rarity]} text-white` 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {rarity}
              </button>
            ))}
          </div>

          {/* Progress Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-green-300">{knownCards.size} Known</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-red-300">{unknownCards.size} Learning</span>
            </div>
          </div>
        </div>

        {/* Card Counter */}
        <div className="text-center mb-4">
          <span className="text-indigo-300 font-bold">{currentIndex + 1}</span>
          <span className="text-slate-500"> / </span>
          <span className="text-slate-400">{shuffledCards.length}</span>
        </div>

        {/* Flashcard Container */}
        <div className="flex justify-center mb-6">
          <div 
            onClick={handleFlip}
            className="w-full max-w-sm aspect-[3/4] cursor-pointer perspective-1000"
            style={{ perspective: '1000px' }}
          >
            <div 
              className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front - Card Image */}
              <div 
                className={`absolute inset-0 rounded-2xl overflow-hidden border-2 ${RARITY_BORDERS[currentCard.rarity]} backface-hidden`}
                style={{
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(180deg, rgba(30, 40, 60, 0.95) 0%, rgba(20, 28, 45, 0.98) 100%)',
                }}
              >
                <div className="flex flex-col h-full p-4">
                  {/* Card image */}
                  <div className="flex-1 flex items-center justify-center">
                    <img
                      src={getCardImageUrl(currentCard)}
                      alt="?"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  
                  {/* Hint */}
                  <div className="text-center mt-4">
                    <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${RARITY_COLORS[currentCard.rarity]}`}>
                      {currentCard.rarity} {currentCard.type}
                    </span>
                  </div>
                  
                  {/* Tap to flip hint */}
                  <div className="text-center mt-3 flex items-center justify-center gap-2 text-slate-400 text-sm">
                    <RotateCw className="w-4 h-4" />
                    Tap to reveal stats
                  </div>
                </div>
              </div>

              {/* Back - Stats */}
              <div 
                className={`absolute inset-0 rounded-2xl overflow-hidden border-2 ${RARITY_BORDERS[currentCard.rarity]} rotate-y-180`}
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'linear-gradient(180deg, rgba(30, 40, 60, 0.95) 0%, rgba(20, 28, 45, 0.98) 100%)',
                }}
              >
                <div className="flex flex-col h-full p-4">
                  {/* Card Name */}
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-black text-white mb-1">{getCardNameTranslated(currentCard.id)}</h2>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${RARITY_COLORS[currentCard.rarity]}`}>
                      {currentCard.rarity} {currentCard.type}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                      <div className="text-pink-400 font-bold text-lg">{currentCard.elixir}</div>
                      <div className="text-slate-400 text-xs">Elixir</div>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                      <div className="text-cyan-400 font-bold text-lg">{currentCard.type}</div>
                      <div className="text-slate-400 text-xs">Type</div>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                      <div className="text-amber-400 font-bold text-lg capitalize">
                        {currentCard.attackType || 'N/A'}
                      </div>
                      <div className="text-slate-400 text-xs">Attack Type</div>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                      <div className="text-green-400 font-bold text-lg">
                        {currentCard.targetAir === null ? 'N/A' : currentCard.targetAir ? 'Yes' : 'No'}
                      </div>
                      <div className="text-slate-400 text-xs">Hits Air</div>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-3 text-center col-span-2">
                      <div className="text-purple-400 font-bold text-lg">
                        {formatAttackSpeed(currentCard.attackSpeed)}
                      </div>
                      <div className="text-slate-400 text-xs">Attack Speed</div>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                      <div className="text-blue-400 font-bold text-lg">
                        {currentCard.evolution_available ? '✓' : '✗'}
                      </div>
                      <div className="text-slate-400 text-xs">Evolution</div>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                      <div className="text-yellow-400 font-bold text-lg">
                        {new Date(currentCard.release_date).getFullYear()}
                      </div>
                      <div className="text-slate-400 text-xs">Released</div>
                    </div>
                  </div>

                  {/* Tap to flip hint */}
                  <div className="text-center mt-3 flex items-center justify-center gap-2 text-slate-400 text-sm">
                    <RotateCw className="w-4 h-4" />
                    Tap to see card
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex flex-col gap-4 max-w-md mx-auto">
          {/* Know/Don't Know Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUnknown}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600/30 border border-red-500/40 hover:bg-red-600/40 transition-all text-red-200 font-bold"
            >
              <X className="w-5 h-5" />
              Still Learning
            </button>
            <button
              onClick={handleKnown}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600/30 border border-green-500/40 hover:bg-green-600/40 transition-all text-green-200 font-bold"
            >
              <Check className="w-5 h-5" />
              Got It!
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              Prev
            </button>
            
            <button
              onClick={shuffleCards}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 hover:bg-indigo-600/40 transition-all text-indigo-200"
            >
              <Shuffle className="w-5 h-5" />
              Shuffle
            </button>
            
            <button
              onClick={handleNext}
              disabled={currentIndex === shuffledCards.length - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / shuffledCards.length) * 100}%` }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
