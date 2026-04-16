import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyPLACEHOLDER-replace-with-your-key",
  authDomain: "tictactoe-pro.firebaseapp.com",
  projectId: "tictactoe-pro",
  storageBucket: "tictactoe-pro.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
