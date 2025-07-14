import { initializeApp, getApp, getApps, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

const fallbackConfig: FirebaseOptions = {
  apiKey: "AIzaSyChpQN02YQOiOqF48pd3xBv7L9v6TEe30Y",
  authDomain: "genomic-inventory-tracker.firebaseapp.com",
  projectId: "genomic-inventory-tracker",
  storageBucket: "genomic-inventory-tracker.firebasestorage.app",
  messagingSenderId: "182986234829",
  appId: "1:182986234829:web:128321d1057b740917c284",
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

export { app, db /*, auth, storage */ };