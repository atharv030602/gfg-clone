/**
 * Firebase Configuration
 *
 * SETUP: Create a Firebase project at https://console.firebase.google.com
 * 1. Create a new project (or use existing)
 * 2. Enable Authentication (Email/Password + Google provider)
 * 3. Create a Firestore database
 * 4. Go to Project Settings > General > Your apps > Add web app
 * 5. Copy the config object and paste below
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// TODO: Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Check if Firebase is properly configured
export function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "YOUR_API_KEY";
}

export default app;
