import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { Loader2, AlertCircle, BookOpen, ShieldCheck, FileText, Settings } from 'lucide-react';

// PASTE API KEY BARU DI SINI (JANGAN PAKAI IMPORT.META.ENV)
const firebaseConfig = {
  apiKey: "AIzaSyDBRDRU5cSPSu4-HSaQ2Idxv9s63YnwLxk",
  authDomain: "mimbar-pintar-baru.firebaseapp.com",
  projectId: "mimbar-pintar-baru",
  storageBucket: "mimbar-pintar-baru.appspot.com",
  messagingSenderId: "847492025404",
  appId: "1:847492025404:web:f136201f7e8bde65a1c739"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, setUser);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Login gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
          <h2 className="text-2xl font-bold text-center mb-6">Mimbar Pintar Pro</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input className="w-full border p-3 rounded-lg" type="email" placeholder="Email" required onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full border p-3 rounded-lg" type="password" placeholder="Kata Sandi" required onChange={(e) => setPassword(e.target.value)} />
            <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold">{loading ? "Loading..." : "Masuk"}</button>
          </form>
          {error && <p className="text-red-500 text-xs mt-4 break-words">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-8">Dashboard Utama</h1>
        <button onClick={() => signOut(auth)} className="text-red-500 underline">Keluar</button>
      </div>
    </div>
  );
}