import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { rateLimit } from '@/server/rate-limit';
import crypto from 'crypto';

export const runtime = 'nodejs';

function ok(data: any, status = 200) { 
  return NextResponse.json({ ok: true, data }, { status }); 
}

function fail(message: string, status = 400) { 
  return NextResponse.json({ ok: false, error: message }, { status }); 
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = rateLimit(`feedback:${ip}`, 5, 60 * 60 * 1000); // 5 per hour
    if (!rl.ok) {
      return fail('Too many feedback submissions. Please try again later.', 429);
    }

    const body = await req.json();
    const { content, email, category, username } = body;

    if (!content || typeof content !== 'string' || content.trim().length < 3) {
      return fail('Feedback content is required (min 3 chars)');
    }

    if (content.length > 2000) {
      return fail('Feedback is too long (max 2000 chars)');
    }

    // Hash IP for privacy
    const ipHash = crypto.createHash('sha256').update(ip + 'royalehaus-salt').digest('hex').substring(0, 16);
    const userAgent = req.headers.get('user-agent')?.substring(0, 255) || null;

    // Create feedback in database
    const feedback = await (prisma as any).feedback.create({
      data: {
        content: content.trim(),
        email: email?.trim() || null,
        username: username || null,
        category: category || 'suggestion',
        status: 'pending',
        ipHash,
        userAgent
      }
    });

    return ok({ id: feedback.id, message: 'Feedback received. Thank you!' });
  } catch (e: any) {
    console.error('[FEEDBACK_ERROR]', e);
    return fail('Failed to submit feedback', 500);
  }
}

// GET - Admin only, list feedbacks
export async function GET(req: NextRequest) {
  // TODO: Add admin auth check
  try {
    const feedbacks = await (prisma as any).feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return ok({ feedbacks });
  } catch (e) {
    return fail('Failed to fetch feedbacks', 500);
  }
}
