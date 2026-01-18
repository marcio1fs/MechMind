'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, getDoc, DocumentSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { getUserPlan } from '@/lib/subscription';

// Define the shape of the user profile based on the User entity.
type UserProfile = {
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

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export interface FirebaseProviderProps {
    children: ReactNode;
    firebaseApp: FirebaseApp | null;
    firestore: Firestore | null;
    auth: Auth | null;
}


export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    profile: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth || !firestore) {
      setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: new Error("Auth or Firestore service not provided.") });
      return;
    }

    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        // Always clean up the previous profile listener when auth state changes.
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = undefined;
        }

        if (firebaseUser) {
          try {
            // 1. Get the user's oficinaId from the top-level /users mapping collection
            const userMappingRef = doc(firestore, "users", firebaseUser.uid);
            const mappingDoc = await getDoc(userMappingRef);

            if (mappingDoc.exists()) {
              const { oficinaId } = mappingDoc.data();
              if (!oficinaId) {
                throw new Error("Oficina ID is missing in user mapping.");
              }

              // 2. Now that we have the oficinaId, listen to the actual user profile document
              const profileDocRef = doc(firestore, "oficinas", oficinaId, "users", firebaseUser.uid);
              profileUnsubscribe = onSnapshot(
                profileDocRef,
                (snapshot: DocumentSnapshot<DocumentData>) => {
                  if (snapshot.exists()) {
                    const profileData = { id: snapshot.id, ...snapshot.data() } as UserProfile;
                    const activePlan = getUserPlan(profileData);

                    // Força o papel de administrador para o usuário atual para garantir acesso total.
                    const adminProfile = { ...profileData, role: 'ADMIN' as const, activePlan };

                    setUserAuthState({
                      user: firebaseUser,
                      profile: adminProfile,
                      isUserLoading: false,
                      userError: null,
                    });
                  } else {
                     // This is an inconsistent state (mapping exists, but profile doesn't).
                     // This can happen if signup fails midway. We should treat them as not fully onboarded.
                     setUserAuthState({ user: firebaseUser, profile: null, isUserLoading: false, userError: new Error("User profile document not found.") });
                  }
                },
                (error) => {
                  // Error listening to the profile document
                  setUserAuthState({ user: firebaseUser, profile: null, isUserLoading: false, userError: error });
                }
              );
            } else {
              // Mapping doesn't exist. This user hasn't completed the signup flow for this app.
              // We stop loading and the user will be redirected from protected routes.
              setUserAuthState({ user: firebaseUser, profile: null, isUserLoading: false, userError: null });
            }
          } catch(error: any) {
             setUserAuthState({ user: firebaseUser, profile: null, isUserLoading: false, userError: error });
          }
        } else {
          // User is not authenticated, clear all user and profile state.
          setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: null });
        }
      },
      (error) => {
        // Error with the auth listener itself
        setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: error });
      }
    );

    // Cleanup function for the main useEffect hook.
    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, [auth, firestore]);

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
