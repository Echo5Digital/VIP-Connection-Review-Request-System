import { NextResponse } from 'next/server';

function getRoleFromToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
    const decoded = JSON.parse(atob(payload));

    if (decoded.role === 'admin' || decoded.role === 'client') {
      return decoded.role;
    }

    // Backward compatibility for older admin tokens without role.
    if (decoded.userId) return 'admin';

    return null;
  } catch {
    return null;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const role = getRoleFromToken(token);

  if (pathname === '/') {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (role === 'client') {
      return NextResponse.redirect(new URL('/client/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    const target = role === 'admin' ? '/admin/dashboard' : role === 'client' ? '/client/dashboard' : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith('/admin/') && role !== 'admin') {
    const target = role === 'client' ? '/client/dashboard' : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname === '/client' || pathname === '/client/') {
    const target = role === 'client' ? '/client/dashboard' : role === 'admin' ? '/admin/dashboard' : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith('/client/') && role !== 'client') {
    const target = role === 'admin' ? '/admin/dashboard' : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/', '/admin/:path*', '/client/:path*'] };
