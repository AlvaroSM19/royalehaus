import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

// GET /api/sounds — List all available card sounds
// GET /api/sounds?cardId=5 — Check if a specific card has sounds
// GET /api/sounds?cardFolder=Knight — Get all sounds for a specific card folder
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cardId = searchParams.get('cardId')
  const cardFolder = searchParams.get('cardFolder')
  
  // If requesting sounds for a specific card folder
  if (cardFolder) {
    const cardsDir = path.join(process.cwd(), 'public', 'sounds', 'cards', 'Cards')
    const cardDir = path.join(cardsDir, cardFolder)
    
    if (!fs.existsSync(cardDir)) {
      return NextResponse.json({
        cardFolder,
        available: false,
        sounds: [],
        error: 'Card folder not found'
      })
    }
    
    try {
      const files = fs.readdirSync(cardDir)
        .filter(f => f.endsWith('.ogg') || f.endsWith('.mp3') || f.endsWith('.wav'))
        .map(f => ({
          filename: f,
          url: `/sounds/cards/Cards/${encodeURIComponent(cardFolder)}/${f}`
        }))
      
      return NextResponse.json({
        cardFolder,
        available: files.length > 0,
        sounds: files,
        total: files.length
      })
    } catch (error) {
      return NextResponse.json({
        cardFolder,
        available: false,
        sounds: [],
        error: 'Failed to read card folder'
      })
    }
  }
  
  const soundsDir = path.join(process.cwd(), 'public', 'sounds', 'cards')

  // Ensure directory exists
  if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true })
    return NextResponse.json({
      sounds: [],
      total: 0,
      directory: '/sounds/cards/',
      message: 'Sounds directory created. Upload .mp3 files named by card ID (e.g., 1.mp3, 5.mp3).'
    })
  }

  // List all sound files
  const files = fs.readdirSync(soundsDir)
    .filter(f => f.endsWith('.mp3') || f.endsWith('.ogg') || f.endsWith('.wav'))
    .sort((a, b) => {
      const numA = parseInt(a.split('.')[0], 10)
      const numB = parseInt(b.split('.')[0], 10)
      return numA - numB
    })

  const sounds = files.map(f => {
    const id = parseInt(f.split('.')[0], 10)
    const ext = f.split('.').pop()
    return {
      cardId: id,
      filename: f,
      url: `/sounds/cards/${f}`,
      format: ext,
    }
  })

  // If checking specific card
  if (cardId) {
    const id = parseInt(cardId, 10)
    const found = sounds.find(s => s.cardId === id)
    return NextResponse.json({
      cardId: id,
      available: !!found,
      sound: found || null,
    })
  }

  return NextResponse.json({
    sounds,
    total: sounds.length,
    directory: '/sounds/cards/',
    formats: ['mp3', 'ogg', 'wav'],
    naming: 'Files should be named by card ID: {cardId}.mp3 (e.g., 1.mp3 for Knight, 5.mp3 for P.E.K.K.A)',
  })
}
