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
    const { user, profile, isUserLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isUserLoading) {
            return; // Don't do anything while loading
        }

        const isProtectedRoute = protectedRoutes.includes(pathname);
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
    
    // If user is not logged in, only allow access to public routes
    if (!user && !publicRoutes.includes(pathname)) {
        return null; // or a loading spinner, but redirection is handled in useEffect
    }

    // If user is logged in, don't allow access to public routes (like login page)
    if (user && publicRoutes.includes(pathname)) {
        return null; // or a loading spinner
    }

    return <>{children}</>;
}
