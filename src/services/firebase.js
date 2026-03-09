import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, signInAnonymously, EmailAuthProvider, linkWithCredential
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAghXyPbhzvU3vF-z9SCeigeJxQ-VQUCBU",
  authDomain: "pdf-viewer-hub-2026.firebaseapp.com",
  projectId: "pdf-viewer-hub-2026",
  storageBucket: "pdf-viewer-hub-2026.firebasestorage.app",
  messagingSenderId: "554812645690",
  appId: "1:554812645690:web:b2bb681af56c2e5a3eb003"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const loginUsuario = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const registrarUsuario = async (email, password) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const loginAnonimo = async () => {
  return await signInAnonymously(auth);
};

export const vincularCuentaLocal = async (email, password) => {
  const credential = EmailAuthProvider.credential(email, password);
  return await linkWithCredential(auth.currentUser, credential);
};

export const cerrarSesion = async () => {
  return await signOut(auth);
};

export const onSessionChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
