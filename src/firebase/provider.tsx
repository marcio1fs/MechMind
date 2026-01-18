'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, getDoc, setDoc, DocumentSnapshot, DocumentData, Timestamp, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
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
            const userMappingRef = doc(firestore, "users", firebaseUser.uid);
            const mappingDoc = await getDoc(userMappingRef);
            let oficinaId;

            if (mappingDoc.exists()) {
              oficinaId = mappingDoc.data().oficinaId;
              if (!oficinaId) {
                throw new Error("Oficina ID is missing in user mapping.");
              }
            } else {
              // User mapping doesn't exist. This is a NEW USER.
              // Create all necessary documents for them in a single transaction.
              const batch = writeBatch(firestore);
              const oficinasCol = collection(firestore, "oficinas");
              const newOficinaRef = doc(oficinasCol);

              const displayName = firebaseUser.displayName || "Novo Usuário";
              
              batch.set(newOficinaRef, {
                  id: newOficinaRef.id,
                  name: `Oficina de ${displayName}`,
                  cnpj: "",
                  address: "",
                  phone: "",
                  email: firebaseUser.email,
              });

              const [firstName, ...lastName] = displayName.split(' ');
              const userDocRef = doc(firestore, "oficinas", newOficinaRef.id, "users", firebaseUser.uid);
              batch.set(userDocRef, {
                id: firebaseUser.uid,
                oficinaId: newOficinaRef.id,
                firstName: firstName || '',
                lastName: lastName.join(' ') || '',
                email: firebaseUser.email,
                role: "ADMIN",
                createdAt: serverTimestamp(),
              });

              batch.set(userMappingRef, { oficinaId: newOficinaRef.id });
              
              await batch.commit();
              oficinaId = newOficinaRef.id; // Use the new oficinaId for the profile listener
            }

            // Now that we have the oficinaId (either existing or newly created), listen to the user profile
            const profileDocRef = doc(firestore, "oficinas", oficinaId, "users", firebaseUser.uid);
            profileUnsubscribe = onSnapshot(
              profileDocRef,
              (snapshot: DocumentSnapshot<DocumentData>) => {
                if (snapshot.exists()) {
                  const profileData = { id: snapshot.id, ...snapshot.data() } as UserProfile;
                  
                  if (profileData.role !== 'ADMIN') {
                      setDoc(profileDocRef, { role: 'ADMIN' }, { merge: true }).catch(err => {
                          console.error("Failed to update user role to ADMIN:", err.message);
                      });
                  }

                  const activePlan = getUserPlan(profileData);
                  const finalProfile = { ...profileData, activePlan, role: 'ADMIN' as const }; 

                  setUserAuthState({
                    user: firebaseUser,
                    profile: finalProfile,
                    isUserLoading: false,
                    userError: null,
                  });
                } else {
                   // This should now be a very rare case, only if the batch write above fails partially.
                   setUserAuthState({ user: firebaseUser, profile: null, isUserLoading: false, userError: new Error("User profile document not found after creation attempt.") });
                }
              },
              (error) => {
                setUserAuthState({ user: firebaseUser, profile: null, isUserLoading: false, userError: error });
              }
            );
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
