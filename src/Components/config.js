// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0mo_0LmRFaZs_sqePsJNIPgwXU4CeaXM",
  authDomain: "sales-ai-analyst-8acf5.firebaseapp.com",
  projectId: "sales-ai-analyst-8acf5",
  storageBucket: "sales-ai-analyst-8acf5.appspot.com",
  messagingSenderId: "662693103212",
  appId: "1:662693103212:web:6c6c2754213c8d48bd3a49",
  measurementId: "G-4GD0FBKGYP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
