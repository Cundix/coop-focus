import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBzS8Be6YJGYUCMnc4LbUPREe1zYjis2ew",
  authDomain: "productivityapp-db26d.firebaseapp.com",
  projectId: "productivityapp-db26d",
  storageBucket: "productivityapp-db26d.firebasestorage.app",
  messagingSenderId: "152740687382",
  appId: "1:152740687382:web:abaab1f7561b359a53cf37"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
