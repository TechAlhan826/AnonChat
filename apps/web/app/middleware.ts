import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isPublic = path === "/register" || path === "/login";
    const isToken = request.cookies.get('token')?.value || '';

    if (isPublic && isToken) {
        return NextResponse.redirect(new URL('/profile/1', request.nextUrl));
    }

    if (!isPublic && !isToken) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }
}

export const config = {
    matcher: [
        '/',
        '/register',
        '/login',
        '/profile'
    ]
}
