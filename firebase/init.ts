import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCWmzPYgzOAB65jz7krjep0V5n-dPwsSjs",
  authDomain: "apto-sigma.firebaseapp.com",
  projectId: "apto-sigma",
  storageBucket: "apto-sigma.firebasestorage.app",
  messagingSenderId: "306488627106",
  appId: "1:306488627106:web:772cf4a6dd679450bd6cfb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();