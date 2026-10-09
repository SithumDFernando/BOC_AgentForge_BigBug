import { jwtVerify } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';

// Optimistic redirect for admin pages. The real authorization is requireAdmin() in each API route.
// Uses jose directly (no firebase-admin in the proxy) and treats a missing JWT_SECRET as signed out.
async function isAdmin(token: string | undefined): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] });
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === '/admin/login') return NextResponse.next();
  if (await isAdmin(req.cookies.get('session')?.value)) return NextResponse.next();
  return NextResponse.redirect(new URL('/admin/login', req.url));
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
