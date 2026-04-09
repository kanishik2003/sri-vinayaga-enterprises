import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCa2gyqjJ8tSB2p36R72AXNmBjNDcQ4a7o",
    authDomain: "granite-982e4.firebaseapp.com",
    projectId: "granite-982e4",
    storageBucket: "granite-982e4.firebasestorage.app",
    messagingSenderId: "1050410780374",
    appId: "1:1050410780374:web:393d7c92d96f67c5432b77",
    measurementId: "G-20X6H97VTR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;
