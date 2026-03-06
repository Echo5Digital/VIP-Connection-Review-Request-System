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

  if (pathname === '/') {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (role === 'manager') {
      return NextResponse.redirect(new URL('/staff/dashboard', request.url));
    }
    if (role === 'dispatcher') {
      return NextResponse.redirect(new URL('/staff/manifest', request.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    if (role === 'manager') return NextResponse.redirect(new URL('/staff/dashboard', request.url));
    if (role === 'dispatcher') return NextResponse.redirect(new URL('/staff/manifest', request.url));
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/admin/') && role !== 'admin') {
    if (role === 'manager') return NextResponse.redirect(new URL('/staff/dashboard', request.url));
    if (role === 'dispatcher') return NextResponse.redirect(new URL('/staff/manifest', request.url));
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname === '/staff' || pathname === '/staff/') {
    if (role === 'manager') return NextResponse.redirect(new URL('/staff/dashboard', request.url));
    if (role === 'dispatcher') return NextResponse.redirect(new URL('/staff/manifest', request.url));
    const target = role === 'admin' ? '/admin/dashboard' : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith('/staff/') && !STAFF_ROLES.includes(role)) {
    const target = role === 'admin' ? '/admin/dashboard' : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Dispatcher cannot access analytics/management pages
  const DISPATCHER_BLOCKED = ['/staff/dashboard', '/staff/feedback', '/staff/users', '/staff/profile'];
  if (role === 'dispatcher' && DISPATCHER_BLOCKED.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/staff/manifest', request.url));
  }

  // Manager cannot access operations pages
  const MANAGER_BLOCKED = ['/staff/manifest', '/staff/users', '/staff/profile'];
  if (role === 'manager' && MANAGER_BLOCKED.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/staff/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/', '/admin', '/admin/:path*', '/staff', '/staff/:path*'] };
