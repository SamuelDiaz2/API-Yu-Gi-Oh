import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD97Qy1MQoot0Nq2-K93KMY_MHzLhlEDXA",
  authDomain: "yu-gi-oh-3df21.firebaseapp.com",
  projectId: "yu-gi-oh-3df21",
  storageBucket: "yu-gi-oh-3df21.firebasestorage.app",
  messagingSenderId: "740773946210",
  appId: "1:740773946210:web:decc69635d92b28a85c23b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // ✅ ¡Esto es necesario!
export { auth, db };