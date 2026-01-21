'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const protectedRoutes = [
    '/dashboard',
    '/diagnostics',
    '/orders',
    '/os-query',
    '/vehicle-history',
    '/inventory',
    '/mechanics',
    '/financial',
    '/workshop-settings',
    '/pricing',
    '/settings',
];

const publicRoutes = ['/', '/signup', '/forgot-password'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isUserLoading) {
            return; // Don't do anything while loading
        }

        const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
        const isPublicRoute = publicRoutes.includes(pathname);

        if (!user && isProtectedRoute) {
            // If user is not logged in and tries to access a protected route, redirect to login
            router.push('/');
        }
        
        if (user && isPublicRoute) {
            // If user is logged in and tries to access a public route (like login), redirect to dashboard
            router.push('/dashboard');
        }

    }, [user, isUserLoading, router, pathname]);

    if (isUserLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    // If user is not logged in and on a protected route, show loader while redirecting
    if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
         return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // If user is logged in and on a public route, show loader while redirecting
    if (user && publicRoutes.includes(pathname)) {
         return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
