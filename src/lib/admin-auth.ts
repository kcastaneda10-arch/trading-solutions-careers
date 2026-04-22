import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple admin authentication using a shared secret.
 * Set ADMIN_SECRET in your environment variables.
 * The admin page sends this as Bearer token.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const auth = req.headers.get('authorization');
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'ADMIN_SECRET not configured' }, { status: 500 });
  }

  if (!auth || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null; // Auth passed
}
