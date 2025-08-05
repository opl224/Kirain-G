// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQryMQRD4AwXqI6X-03cDbKdDJ6lHaTmE",
  authDomain: "kirain-gang.firebaseapp.com",
  projectId: "kirain-gang",
  storageBucket: "kirain-gang.appspot.com",
  messagingSenderId: "1008558405409",
  appId: "1:1008558405409:web:f5fd8a7724c4eba1e0f060"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
