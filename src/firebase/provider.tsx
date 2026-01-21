'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, Timestamp, doc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Define the shape of the user profile based on the User entity.
export type UserProfile = {
  id: string;
  oficinaId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  specialty?: string;
  createdAt?: Timestamp;
  activePlan?: 'PREMIUM' | 'PRO+' | 'PRO';
};

interface UserAuthState {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

export interface FirebaseServicesAndUser extends UserAuthState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export interface UserHookResult extends UserAuthState {}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export interface FirebaseProviderProps {
    children: ReactNode;
    firebaseApp: FirebaseApp | null;
    firestore: Firestore | null;
    auth: Auth | null;
}

const useFirebaseAuth = (auth: Auth | null, firestore: Firestore | null): UserAuthState => {
  const [userState, setUserState] = useState<UserAuthState>({
    user: null,
    profile: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    // For the development environment, we immediately set a mock admin user
    // to bypass login screens and facilitate rapid development.
    // This simulates a full-access user without requiring real authentication.
    // IMPORTANT: This does NOT create a real auth session. Firestore rules will see `request.auth` as `null`.
    // The rules MUST be configured to allow access for the `dev-oficina-id` without authentication.

    const mockProfile: UserProfile = {
      id: 'dev-admin-user',
      oficinaId: 'dev-oficina-id',
      firstName: 'Admin',
      lastName: 'OSMECH',
      email: 'admin@osmech.com',
      role: 'ADMIN',
      specialty: 'Gestão',
      createdAt: Timestamp.fromDate(new Date()),
      activePlan: 'PREMIUM',
    };

    // The `user` object can be partially mocked for the UI, but it won't affect backend rules.
    const mockUser = {
        uid: 'dev-admin-user',
        email: 'admin@osmech.com',
        emailVerified: true,
        displayName: 'Admin OSMECH',
        isAnonymous: true, // Indicate this is not a real, persistent user
        providerData: [],
        // Add other properties as needed by the UI, with dummy values
        photoURL: null,
        phoneNumber: null,
        tenantId: null,
        providerId: 'firebase',
        metadata: {},
        refreshToken: 'mock-token',
        delete: async () => {},
        getIdToken: async () => 'mock-id-token',
        getIdTokenResult: async () => ({ token: 'mock-id-token', claims: {}, authTime: '', expirationTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null }),
        reload: async () => {},
        toJSON: () => ({}),
    } as User;

    setUserState({
      user: mockUser,
      profile: mockProfile,
      isUserLoading: false,
      userError: null,
    });
    
  }, [auth, firestore]); // The dependencies are kept for consistency, though the effect is now static.

  return userState;
};


export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const userAuthState = useFirebaseAuth(auth, firestore);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);

    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      profile: userAuthState.profile,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    profile: context.profile,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, profile, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, profile, isUserLoading, userError };
};
