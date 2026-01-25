// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyAjncieKLfyiQezDDtRumYafb9esQfQbeY",
	authDomain: "poker-app-d4e95.firebaseapp.com",
	databaseURL: "https://poker-app-d4e95-default-rtdb.firebaseio.com",
	projectId: "poker-app-d4e95",
	storageBucket: "poker-app-d4e95.firebasestorage.app",
	messagingSenderId: "656183468930",
	appId: "1:656183468930:web:5375b937d5d4e3b3bfe59b",
	measurementId: "G-NFGH5Q778H",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // eslint-disable-line no-unused-vars
const auth = getAuth(app);
const db = getFirestore(app);
const RTDB = getDatabase(app);

export { app, auth, db, RTDB };
