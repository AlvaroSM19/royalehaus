import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/server/prisma';

// Supported unlock conditions
// - level: { minLevel: number }
// - gamesPlayed: { mode: string, count: number }
// - streak: { mode: string, days: number }
// - date: { after: string, before?: string }
// - custom: { description: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create new collectible card
    const { title, description, imageUrl, rarity, unlockRules } = req.body;
    if (!title || !imageUrl || !rarity || !unlockRules) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const card = await prisma.card.create({
      data: {
        title,
        description,
        imageUrl,
        rarity,
        unlockRules,
      },
    });
    return res.status(200).json({ card });
  }
  // TODO: Add GET, PUT, DELETE for admin
  return res.status(405).end();
}
