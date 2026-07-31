import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { Loader2, AlertCircle, BookOpen, ShieldCheck } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyDBRDRU5cSPSu4-HSaQ2Idxv9s63YnwLxk",
  authDomain: "mimbar-pintar-baru.firebaseapp.com",
  projectId: "mimbar-pintar-baru",
  storageBucket: "mimbar-pintar-baru.firebasestorage.app",
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <ShieldCheck className="w-16 h-16 text-emerald-600 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold">Selamat Datang di Mimbar Pintar Pro</h1>
          <button onClick={() => signOut(auth)} className="mt-4 text-red-600 underline">Keluar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <BookOpen className="w-12 h-12 text-emerald-600"/>
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Mimbar Pintar Pro</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" type="email" placeholder="Email" required onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" type="password" placeholder="Kata Sandi" required onChange={(e) => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition-all disabled:bg-slate-400">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : "Masuk"}
          </button>
        </form>
        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4"/><span>{error}</span></div>}
      </div>
    </div>
  );
}