'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // If apps are already initialized, return the existing SDKs.
  if (getApps().length) {
    return getSdks(getApp());
  }

  let firebaseApp: FirebaseApp;

  // In a local development environment, we must use the firebaseConfig object.
  // The automatic initialization is intended for production deployments on Firebase App Hosting.
  if (process.env.NODE_ENV !== 'production') {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    // In production, attempt to initialize from App Hosting's environment variables.
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      console.warn('Automatic Firebase initialization failed in production. Falling back to firebaseConfig. Error: ', e);
      // As a fallback for production, use the config object. This shouldn't be reached in a correctly configured App Hosting environment.
      firebaseApp = initializeApp(firebaseConfig);
    }
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
