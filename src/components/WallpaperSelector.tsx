'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface Wallpaper {
  id: string
  name: string
  preview: string
  file: string
}

// Clash Royale wallpapers
const wallpapers: Wallpaper[] = [
  { id: 'wallpaper1', name: 'Wallpaper 1', preview: '/images/wallpapers/wallpaper1-thumb.jpg', file: '/images/wallpapers/wallpaper1.webp' },
  { id: 'wallpaper2', name: 'Wallpaper 2', preview: '/images/wallpapers/wallpaper2-thumb.webp', file: '/images/wallpapers/wallpaper2.webp' },
  { id: 'wallpaper3', name: 'Wallpaper 3', preview: '/images/wallpapers/wallpaper3-thumb.jpg', file: '/images/wallpapers/wallpaper3.webp' },
  { id: 'wallpaper4', name: 'Wallpaper 4', preview: '/images/wallpapers/wallpaper4-thumb.jpg', file: '/images/wallpapers/wallpaper4.webp' },
]

export default function WallpaperSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>('')
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const portalElRef = useRef<HTMLDivElement | null>(null)

  // Create portal root
  useEffect(() => {
    const el = document.createElement('div')
    el.setAttribute('id', 'wallpaper-selector-portal')
    document.body.appendChild(el)
    portalElRef.current = el
    return () => {
      if (portalElRef.current) {
        document.body.removeChild(portalElRef.current)
        portalElRef.current = null
      }
    }
  }, [])

  // Random wallpaper on mount
  useEffect(() => {
    const random = wallpapers[Math.floor(Math.random() * wallpapers.length)]
    if (random) {
      setSelectedWallpaper(random.id)
      applyWallpaper(random.id)
    }
  }, [])

  const applyWallpaper = (wallpaperId: string) => {
    const wallpaper = wallpapers.find(w => w.id === wallpaperId)
    if (!wallpaper) return
    
    const body = document.body
    const html = document.documentElement
    
    body.classList.add('has-custom-bg')
    html.classList.add('has-custom-bg')
    
    let bgLayer = document.getElementById('wallpaper-bg') as HTMLDivElement | null
    if (!bgLayer) {
      bgLayer = document.createElement('div')
      bgLayer.id = 'wallpaper-bg'
      bgLayer.className = 'fixed inset-0 pointer-events-none z-0'
      document.body.insertBefore(bgLayer, document.body.firstChild)
    }
    
    Object.assign(bgLayer.style, {
      backgroundImage: `url('${wallpaper.file}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat'
    })
    
    body.style.backgroundImage = `url('${wallpaper.file}')`
    body.style.backgroundSize = 'cover'
    body.style.backgroundPosition = 'center'
    body.style.backgroundAttachment = 'fixed'
    body.style.backgroundRepeat = 'no-repeat'
    
    // Overlay for readability
    const existingOverlay = document.getElementById('wallpaper-overlay')
    if (!existingOverlay) {
      const overlayDiv = document.createElement('div')
      overlayDiv.id = 'wallpaper-overlay'
      overlayDiv.className = 'fixed inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50 pointer-events-none z-0'
      body.insertBefore(overlayDiv, body.firstChild)
    }
  }

  const handleWallpaperChange = (wallpaperId: string) => {
    setSelectedWallpaper(wallpaperId)
    applyWallpaper(wallpaperId)
    setIsOpen(false)
  }

  const handleToggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 320
      const spacing = 8
      const tentativeLeft = rect.left
      const maxLeft = Math.max(8, window.innerWidth - menuWidth - 8)
      const left = Math.min(tentativeLeft, maxLeft)
      const top = rect.bottom + spacing
      setMenuPos({ top, left })
    }
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    if (!isOpen) return
    const updatePos = () => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 320
      const spacing = 8
      const tentativeLeft = rect.left
      const maxLeft = Math.max(8, window.innerWidth - menuWidth - 8)
      const left = Math.min(tentativeLeft, maxLeft)
      const top = rect.bottom + spacing
      setMenuPos({ top, left })
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, { passive: true })
    window.addEventListener('keydown', onKey)
    updatePos()
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos)
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-amber-100 hover:bg-white/20"
        title="Change wallpaper"
        type="button"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="hidden md:inline">Wallpaper</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && portalElRef.current && createPortal(
        <>
          <div
            className="backdrop-highest fixed inset-0"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="dropdown-highest fixed bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl overflow-hidden"
            style={{
              width: 320,
              maxHeight: 400,
              top: menuPos.top,
              left: menuPos.left
            }}
            role="menu"
            aria-label="Wallpaper selector"
          >
            <div className="p-2 border-b border-white/10">
              <span className="text-xs text-amber-300 font-semibold">SELECT WALLPAPER</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 max-h-80 overflow-y-auto">
              {wallpapers.map((wallpaper) => (
                <button
                  key={wallpaper.id}
                  onClick={() => handleWallpaperChange(wallpaper.id)}
                  className={`relative aspect-[3/2] rounded-lg overflow-hidden border ${selectedWallpaper === wallpaper.id ? 'border-amber-400 ring-2 ring-amber-400/60' : 'border-white/20'} hover:brightness-110 transition`}
                  role="menuitem"
                  title={wallpaper.name}
                >
                  <img
                    src={wallpaper.preview}
                    alt={wallpaper.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      // Fallback for missing images
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-blue-900', 'to-indigo-900')
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                    <span className="text-[10px] text-white font-medium">{wallpaper.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>,
        portalElRef.current
      )}
    </div>
  )
}
