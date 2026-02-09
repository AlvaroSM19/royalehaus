'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, Sword, Sparkles, Castle, Trophy, ChevronDown } from 'lucide-react'
import { cardsData } from '@/data'
import type { ClashCard, CardType, CardRarity } from '@/types/card'
import { RARITY_COLORS, TYPE_ICONS } from '@/types/card'
import { useLanguage } from '@/lib/useLanguage'

const cardTypes: CardType[] = ['Troop', 'Spell', 'Building', 'Champion', 'Tower Troop', 'Evolution', 'Hero']
const cardRarities: CardRarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Champion', 'Heroic']

export default function CardsPage() {
  const { getCardNameTranslated } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<CardType | 'all'>('all')
  const [selectedRarity, setSelectedRarity] = useState<CardRarity | 'all'>('all')
  const [selectedElixir, setSelectedElixir] = useState<number | 'all'>('all')
  const [showEvolutionsOnly, setShowEvolutionsOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'elixir' | 'rarity' | 'release'>('name')

  const filteredCards = useMemo(() => {
    let filtered = cardsData

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(card => 
        getCardNameTranslated(card.id).toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(card => card.type === selectedType)
    }

    // Rarity filter  
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(card => card.rarity === selectedRarity)
    }

    // Elixir filter
    if (selectedElixir !== 'all') {
      filtered = filtered.filter(card => card.elixir === selectedElixir)
    }

    // Evolution filter
    if (showEvolutionsOnly) {
      filtered = filtered.filter(card => card.evolution_available)
    }

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return getCardNameTranslated(a.id).localeCompare(getCardNameTranslated(b.id))
        case 'elixir':
          return a.elixir - b.elixir
        case 'rarity':
          const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary', 'Champion', 'Heroic']
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
        case 'release':
          return new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, selectedType, selectedRarity, selectedElixir, showEvolutionsOnly, sortBy, getCardNameTranslated])

  const getRarityColor = (rarity: CardRarity) => {
    const colors = RARITY_COLORS[rarity]
    return colors || RARITY_COLORS.Common
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              CARDS WIKI
            </span>
          </h1>
          <p className="text-blue-200/70 text-lg max-w-2xl mx-auto">
            Browse all {cardsData.length} Clash Royale cards. Filter and search to find what you need.
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-blue-900/30 border border-blue-700/30 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-blue-950/50 border border-blue-700/50 rounded-xl text-blue-100 placeholder-blue-400/50 focus:outline-none focus:border-yellow-400/50 transition-colors"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as CardType | 'all')}
                className="w-full px-4 py-3 bg-blue-950/50 border border-blue-700/50 rounded-xl text-blue-100 focus:outline-none focus:border-yellow-400/50 appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                {cardTypes.map(type => (
                  <option key={type} value={type}>{TYPE_ICONS[type]} {type}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
            </div>

            {/* Rarity Filter */}
            <div className="relative">
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value as CardRarity | 'all')}
                className="w-full px-4 py-3 bg-blue-950/50 border border-blue-700/50 rounded-xl text-blue-100 focus:outline-none focus:border-yellow-400/50 appearance-none cursor-pointer"
              >
                <option value="all">All Rarities</option>
                {cardRarities.map(rarity => (
                  <option key={rarity} value={rarity}>{rarity}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
            </div>

            {/* Elixir Filter */}
            <div className="relative">
              <select
                value={selectedElixir}
                onChange={(e) => setSelectedElixir(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full px-4 py-3 bg-blue-950/50 border border-blue-700/50 rounded-xl text-blue-100 focus:outline-none focus:border-yellow-400/50 appearance-none cursor-pointer"
              >
                <option value="all">All Elixir</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(elixir => (
                  <option key={elixir} value={elixir}>💧 {elixir} Elixir</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Evolution Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEvolutionsOnly}
                onChange={(e) => setShowEvolutionsOnly(e.target.checked)}
                className="w-5 h-5 rounded bg-blue-950/50 border border-blue-700/50 text-yellow-400 focus:ring-yellow-400/50"
              />
              <span className="text-blue-200/80 text-sm">Has Evolution 🧬</span>
            </label>

            {/* Sort By */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-blue-200/60 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-1.5 bg-blue-950/50 border border-blue-700/50 rounded-lg text-blue-100 text-sm focus:outline-none focus:border-yellow-400/50"
              >
                <option value="name">Name</option>
                <option value="elixir">Elixir</option>
                <option value="rarity">Rarity</option>
                <option value="release">Release Date</option>
              </select>
            </div>

            {/* Results count */}
            <span className="text-blue-200/60 text-sm">
              {filteredCards.length} cards found
            </span>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredCards.map(card => {
            const rarityColors = getRarityColor(card.rarity)
            
            return (
              <div
                key={card.id}
                className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${rarityColors.border} bg-blue-900/40 backdrop-blur-sm`}
                style={{ boxShadow: `0 0 20px ${rarityColors.glow}20` }}
              >
                {/* Card Image */}
                <div className="aspect-[5/6] relative overflow-hidden bg-gradient-to-br from-blue-900/50 to-blue-950/80">
                  <img 
                    src={`/images/cards/${card.id}.png`}
                    alt={getCardNameTranslated(card.id)}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Card Info */}
                <div className="p-3">
                  <h3 className="text-sm font-bold text-blue-50 truncate group-hover:text-yellow-300 transition-colors">
                    {getCardNameTranslated(card.id)}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${rarityColors.bg} ${rarityColors.text}`}>
                      {card.rarity}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredCards.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-blue-200 mb-2">No cards found</h3>
            <p className="text-blue-300/60">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  )
}
