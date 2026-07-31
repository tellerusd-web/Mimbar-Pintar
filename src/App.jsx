import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { Loader2, AlertCircle, BookOpen, ShieldCheck, FileText, Settings, Key } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyCwQYXADulyEQFqJyO08xH9p8zZWL45o08",
  authDomain: "mimbar-pintar.firebaseapp.com",
  projectId: "mimbar-pintar",
  storageBucket: "mimbar-pintar.firebasestorage.app",
  messagingSenderId: "166750053022",
  appId: "1:166750053022:web:c41b155c7d3ce27e59518f"
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="flex justify-center mb-6"><BookOpen className="w-12 h-12 text-emerald-600"/></div>
          <h2 className="text-2xl font-bold text-center mb-6">Mimbar Pintar Pro</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input className="w-full border p-3 rounded-lg" type="email" placeholder="Email" required onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full border p-3 rounded-lg" type="password" placeholder="Kata Sandi" required onChange={(e) => setPassword(e.target.value)} />
            <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold">
              {loading ? <Loader2 className="animate-spin mx-auto"/> : "Masuk"}
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="text-emerald-600"/> Dashboard Utama
          </h1>
          <button onClick={() => signOut(auth)} className="text-red-600 font-medium text-sm underline">Keluar</button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-xl hover:shadow-md transition">
            <FileText className="w-8 h-8 text-emerald-600 mb-4"/>
            <h3 className="font-bold text-lg">Generator Khutbah</h3>
            <p className="text-slate-500 text-sm mb-4">Buat naskah khutbah otomatis yang menyentuh hati.</p>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Buka Generator</button>
          </div>
          <div className="p-6 border rounded-xl hover:shadow-md transition">
            <Settings className="w-8 h-8 text-emerald-600 mb-4"/>
            <h3 className="font-bold text-lg">Pengaturan</h3>
            <p className="text-slate-500 text-sm mb-4">Kelola profil dan API Key Anda di sini.</p>
            <button className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold">Atur Akun</button>
          </div>
        </div>
      </div>
    </div>
  );
}