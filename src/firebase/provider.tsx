'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, Timestamp, doc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { getSubscriptionDetails } from '@/lib/subscription';

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
    if (!auth || !firestore) {
      setUserState(s => ({ ...s, isUserLoading: false }));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // User is signed in, now fetch their profile from the /users mapping
          const userMappingRef = doc(firestore, 'users', user.uid);
          const userMappingSnap = await getDoc(userMappingRef);

          if (!userMappingSnap.exists()) {
            // This can happen during signup before the user mapping is created.
            // It's a transient state, so we can wait or assume signup flow will handle it.
            // For now, we'll treat it as loading.
            setUserState({ user, profile: null, isUserLoading: true, userError: null });
            return;
          }

          const { oficinaId } = userMappingSnap.data();

          // Now fetch the actual user profile from within their oficina subcollection
          const profileRef = doc(firestore, 'oficinas', oficinaId, 'users', user.uid);
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            const profileData = profileSnap.data() as Omit<UserProfile, 'id' | 'activePlan'>;
            
            const fullProfile: UserProfile = {
              ...profileData,
              id: user.uid,
              oficinaId,
            };
            
            const subscription = getSubscriptionDetails(fullProfile);

            setUserState({
              user,
              profile: { ...fullProfile, activePlan: subscription.plan },
              isUserLoading: false,
              userError: null,
            });
          } else {
            // This is an inconsistent state - auth user exists but no profile.
            // Could be a failed signup.
             throw new Error('Perfil de usuário não encontrado.');
          }

        } catch (error: any) {
          console.error("Erro ao buscar perfil do usuário:", error);
          setUserState({ user: null, profile: null, isUserLoading: false, userError: error });
        }
      } else {
        // User is signed out
        setUserState({ user: null, profile: null, isUserLoading: false, userError: null });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, firestore]);

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
