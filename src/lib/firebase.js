// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyA-fn3kNs--8XmhnMSsw2v6nQH_LeIHvhA",
    authDomain: "day-compass-f6r82.firebaseapp.com",
    projectId: "day-compass-f6r82",
    storageBucket: "day-compass-f6r82.firebasestorage.app",
    messagingSenderId: "897361444884",
    appId: "1:897361444884:web:7c8d7ba4e616d99df36701"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
