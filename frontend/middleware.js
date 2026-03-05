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

    if (['admin', 'manager', 'dispatcher'].includes(decoded.role)) {
      return decoded.role;
    }

    // Backward compatibility for older admin tokens without role.
    if (decoded.userId) return 'admin';

    return null;
  } catch {
    return null;
  }
}

const STAFF_ROLES = ['manager', 'dispatcher'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const role = getRoleFromToken(token);

  if (pathname === '/clients' || pathname === '/clients/') {
    const target = role === 'admin' ? '/admin/clients' : STAFF_ROLES.includes(role) ? '/staff/dashboard' : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname === '/') {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (STAFF_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/staff/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    const target = role === 'admin' ? '/admin/dashboard' : STAFF_ROLES.includes(role) ? '/staff/dashboard' : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith('/admin/') && role !== 'admin') {
    const target = STAFF_ROLES.includes(role) ? '/staff/dashboard' : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname === '/staff' || pathname === '/staff/') {
    const target = STAFF_ROLES.includes(role) ? '/staff/dashboard' : role === 'admin' ? '/admin/dashboard' : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith('/staff/') && !STAFF_ROLES.includes(role)) {
    const target = role === 'admin' ? '/admin/dashboard' : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/', '/clients', '/admin/:path*', '/staff/:path*'] };
