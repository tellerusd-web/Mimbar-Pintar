import React, { useState, useEffect } from 'react';
import { 
  Search, BookOpen, Copy, Printer, AlertCircle, 
  Loader2, CheckCircle, ChevronLeft, Globe, FileText, 
  ListFilter, ShieldCheck, Target, Key, Settings,
  LogOut, Lock, User, TrendingUp
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCwQYXADulyEQFqJyO08xH9p8zZWL45o08",
  authDomain: "mimbar-pintar.firebaseapp.com",
  projectId: "mimbar-pintar",
  storageBucket: "mimbar-pintar.firebasestorage.app",
  messagingSenderId: "166750053022",
  appId: "1:166750053022:web:c41b155c7d3ce27e59518f",
  measurementId: "G-PT30DDFDJB"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase init error:", error);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [authError, setAuthError] = useState("");

  const [userApiKey, setUserApiKey] = useState("");
  const [showApiModal, setShowApiModal] = useState(false);
  const [eventType, setEventType] = useState("Khutbah Jumat");
  const [khutbahStyle, setKhutbahStyle] = useState("Umum"); 
  const [customTopic, setCustomTopic] = useState(""); 
  const [themes, setThemes] = useState([]);
  
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [khutbahContent, setKhutbahContent] = useState("");
  const [isLoadingKhutbah, setIsLoadingKhutbah] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let storedDeviceId = localStorage.getItem("mimbar_device_id");
    if (!storedDeviceId) {
      storedDeviceId = 'device_' + Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem("mimbar_device_id", storedDeviceId);
    }
    setDeviceId(storedDeviceId);
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const sessionRef = doc(db, 'user_sessions', currentUser.uid);
        const unsubscribeSession = onSnapshot(sessionRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Cek apakah device yang login sama dengan yang tersimpan
            if (data.deviceId && data.deviceId !== deviceId) {
              handleForceLogout("Akun ini baru saja digunakan di perangkat lain. Anda telah dikeluarkan demi keamanan.");
            } else {
              setUser(currentUser); 
              
              const savedGeminiKey = localStorage.getItem("mimbar_gemini_key_" + currentUser.uid);
              if (savedGeminiKey) {
                setUserApiKey(savedGeminiKey);
                setShowApiModal(false);
              } else {
                setShowApiModal(true);
              }
            }
          }
        }, (err) => console.error("Snapshot error:", err));

        return () => unsubscribeSession();
      } else {
        setUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, [deviceId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setAuthError("Email dan password wajib diisi.");
    setIsLoggingIn(true);
    setAuthError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      const sessionRef = doc(db, 'user_sessions', currentUser.uid);
      await setDoc(sessionRef, {
        deviceId: deviceId,
        lastLogin: new Date().toISOString(),
        email: currentUser.email
      });
    } catch (err) {
      setAuthError("Email/Password salah, atau akun belum terdaftar.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForceLogout = async (reason) => {
    try {
      await signOut(auth);
      setUser(null);
      setAuthError(reason);
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    try {
      if (user) {
         const sessionRef = doc(db, 'user_sessions', user.uid);
         await setDoc(sessionRef, { deviceId: null }, { merge: true });
      }
      await signOut(auth);
      setUser(null);
      setThemes([]);
      setSelectedTheme(null);
    } catch (err) { console.error(err); }
  };

  const saveApiKey = () => {
    if (userApiKey.trim().length > 10) {
      localStorage.setItem("mimbar_gemini_key_" + user?.uid, userApiKey.trim());
      setShowApiModal(false);
      setError(null);
    } else {
      setError("Mohon masukkan API Key yang valid.");
    }
  };

  const EVENT_TYPES = ["Khutbah Jumat", "Khutbah Idul Fitri", "Khutbah Idul Adha", "Tausiyah Umum", "Kultum Singkat"];

  const callGeminiApiSafe = async (promptText, isJson = false) => {
    try {
      const listUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" + userApiKey;
      const listRes = await fetch(listUrl);
      if (!listRes.ok) throw new Error("API Key Gemini ditolak Google.");
      
      const listData = await listRes.json();
      let validModels = (listData.models || [])
        .filter(m => m.supportedGenerationMethods?.includes("generateContent") && m.name.includes("gemini"))
        .map(m => m.name.replace('models/', ''));

      if (validModels.length === 0) throw new Error("Tidak ada mesin AI aktif.");

      validModels.sort((a, b) => {
        if (a.includes('flash') && !b.includes('flash')) return -1;
        if (!a.includes('flash') && b.includes('flash')) return 1;
        return 0;
      });

      let lastError = "";
      for (const model of validModels) {
        try {
          const generateUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + userApiKey;
          let payload = { contents: [{ parts: [{ text: promptText }] }] };
          if (isJson) payload.generationConfig = { responseMimeType: "application/json" };

          const res = await fetch(generateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) return await res.json(); 
          else {
            const errData = await res.json().catch(() => ({}));
            lastError = errData.error?.message || "Ditolak";
          }
        } catch (err) { lastError = err.message; }
      }
      throw new Error(`Semua mesin API gagal. Info: ${lastError}`);
    } catch (err) { throw err; }
  };

  const generateTrendingThemes = async () => {
    if (!userApiKey) { setShowApiModal(true); return; }
    setIsLoadingThemes(true); setError(null); setThemes([]);
    
    const topicFocus = customTopic.trim() ? customTopic : "berita, isu, dan kondisi masyarakat Indonesia bulan ini";

    // PROMPT DIPERKUAT UNTUK KONTEKS RELEVANSI
    const promptText = `Sebagai Ulama Ahli, buatkan 10 ide tema ${eventType} yang fokus pada keresahan tentang: "${topicFocus}".
WAJIB BALAS DALAM BENTUK JSON SAJA DENGAN STRUKTUR BERIKUT (Tanpa blok kode \`\`\`):
{
  "themes": [
    {
      "title": "Judul Menarik",
      "category": "Kategori Utama",
      "trending_reason": "Konteks & Relevansi: Jelaskan mengapa tema ini sangat relevan dengan situasi/berita saat ini.",
      "description": "Deskripsi singkat materi khutbah."
    }
  ]
}`;

    try {
      const data = await callGeminiApiSafe(promptText, true);
      let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) {
        responseText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const parsed = JSON.parse(responseText);
        if (parsed.themes) setThemes(parsed.themes);
      }
    } catch (err) { setError(`Gagal: ${err.message}`); } 
    finally { setIsLoadingThemes(false); }
  };

  useEffect(() => {
    let interval;
    if (isLoadingKhutbah) {
      const steps = ["Memeriksa mesin AI...", "Menyusun Muqaddimah Bersajak...", "Menggali Dalil...", "Membersihkan Teks..."];
      let i = 0;
      setLoadingStep(steps[0]);
      interval = setInterval(() => { i++; if (i < steps.length) setLoadingStep(steps[i]); }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoadingKhutbah]);

  const generateKhutbahContent = async (theme) => {
    if (!userApiKey) { setShowApiModal(true); return; }
    setSelectedTheme(theme); setIsLoadingKhutbah(true); setKhutbahContent(""); setError(null);

    const khutbahKeduaRule = khutbahStyle === "NU" 
      ? "KHUTBAH KEDUA (FULL ARAB): 100% Bahasa Arab Berharakat, HANYA berisi Muqaddimah, Hamdalah, Shalawat, Wasiat Takwa, dan Doa. TANPA BAHASA INDONESIA." 
      : "KHUTBAH KEDUA: Muqaddimah singkat Arab, Hamdalah, Shalawat, Ringkasan pesan (Bahasa Indonesia), Doa.";

    // PROMPT DIPERKUAT UNTUK SAJAK DAN FORMAT BERSIH
    const promptText = `TUGAS: Kamu adalah Ulama Faqih dan Khotib Sastrawan Arab.
Buatkan naskah ${eventType} untuk judul: "${theme.title}" (Konteks: ${theme.trending_reason})

ATURAN SUPER KETAT WAJIB DIIKUTI:
1. MUQADDIMAH ARAB BERSAJAK: Khutbah Pertama WAJIB diawali teks Bahasa Arab berharakat yang kalimat-kalimatnya memiliki rima/sajak akhir yang sama. PISAHKAN SETIAP KALIMAT/BAIT ARAB TERSEBUT DENGAN BARIS BARU (ENTER) agar tidak menumpuk, jadikan berjarak dan lega dibaca.
2. STRUKTUR: Bagi tegas antara tulisan "KHUTBAH PERTAMA" dan "KHUTBAH KEDUA". 
3. KEDALAMAN: Bahas realitas, ruhiyah, dalil (teks Arab & arti), kisah, dan solusi praktis.
4. ATURAN KHUTBAH KEDUA: ${khutbahKeduaRule}
5. FORMAT BERSIH (PENTING!): DILARANG KERAS menggunakan simbol markdown seperti bintang (*), pagar (#), atau strip (-). Jangan tulis label seperti "Solusi:". Pisahkan antar paragraf dengan baris kosong (Enter dua kali) agar rapi saat dicetak.`;

    try {
      const data = await callGeminiApiSafe(promptText, false);
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) setKhutbahContent(responseText);
      else setError(`Gagal menghasilkan teks.`);
    } catch (err) { setError(`Kesalahan: ${err.message}`); } 
    finally { setIsLoadingKhutbah(false); }
  };

  const showToast = (message) => { setToastMessage(message); setTimeout(() => setToastMessage(""), 3000); };
  
  const copyToClipboard = () => {
    const textArea = document.createElement("textarea");
    textArea.value = khutbahContent;
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand('copy'); showToast("Naskah disalin ke clipboard!"); } 
    catch (err) { setError("Gagal menyalin teks."); }
    document.body.removeChild(textArea);
  };

  const printKhutbah = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>${eventType}: ${selectedTheme?.title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #111; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 14pt; }
        h1 { text-align: center; color: #065f46; border-bottom: 2px solid #065f46; padding-bottom: 10px; font-size: 20pt;}
        .meta { text-align: center; color: #666; font-style: italic; margin-bottom: 30px; font-size: 12pt; }
        .content { white-space: pre-wrap; text-align: justify; }
      </style></head><body>
      <h1>${selectedTheme?.title}</h1>
      <div class="meta">Jenis: ${eventType} | Kategori: ${selectedTheme?.category}</div>
      <div class="content">${khutbahContent}</div>
      <script>window.onload = () => window.print();</script></body></html>
    `);
    printWindow.document.close();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600"></div>
          <div className="text-center mb-8 mt-2">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Mimbar Pintar Pro</h1>
            <p className="text-sm text-slate-500 mt-2">Masuk dengan Akun Terdaftar</p>
          </div>

          {authError && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="nama@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kata Sandi</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={isLoggingIn} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center mt-6">
              {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Masuk"}
            </button>
          </form>
          <p className="text-xs text-center text-slate-400 mt-6">
            Lisensi 1 Akun 1 Perangkat.<br/>Login di perangkat lain akan mengeluarkan sesi ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      {/* Modal API Key Gemini */}
      {showApiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Key className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Sinkronisasi API Google</h2>
            <p className="text-slate-600 text-sm mb-6">Masukkan API Key Gemini (AI Studio) Anda untuk mengaktifkan generator mesin naskah.</p>
            <input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder="Mulai dengan 'AIzaSy...'"
              className="w-full text-center bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
            {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
            <button onClick={saveApiKey} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors">Simpan Kunci API</button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="bg-emerald-700 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setSelectedTheme(null); setThemes([]); }}>
              <BookOpen className="w-8 h-8 text-emerald-300" />
              <span className="font-bold text-xl tracking-tight hidden sm:block">Mimbar Pintar Pro</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex space-x-2 text-xs font-medium text-emerald-200 bg-emerald-800/50 px-3 py-1 rounded-full items-center">
                <User className="w-3 h-3 mr-1" /> {user?.email}
              </div>
              <button onClick={() => setShowApiModal(true)} className="flex items-center space-x-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition" title="Ganti Kunci API Gemini">
                <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Kunci API</span>
              </button>
              <button onClick={handleLogout} className="flex items-center space-x-1 text-xs font-medium bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg transition" title="Keluar">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && !showApiModal && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start space-x-3 text-red-700 animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> <p>{error}</p>
          </div>
        )}

        {/* HALAMAN GENERATOR TEMA */}
        {!selectedTheme && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
              <Globe className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-slate-800 mb-4">Generator Naskah Mimbar Terkini</h1>
              <p className="text-slate-600 max-w-2xl mx-auto mb-8 text-lg">Hasilkan naskah dengan 5 lapisan ruhiyah, Muqaddimah tematik bersajak, struktur jelas, dan format bersih siap baca.</p>
              
              <div className="max-w-4xl mx-auto mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div>
                  <label className="flex items-center text-sm font-semibold text-slate-700 mb-2"><Target className="w-4 h-4 mr-2 text-emerald-600" /> Fokus Topik (Opsional)</label>
                  <input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder="Misal: Pendidikan Anak..."
                    className="w-full bg-white border border-slate-300 hover:border-emerald-500 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="flex items-center text-sm font-semibold text-slate-700 mb-2"><ListFilter className="w-4 h-4 mr-2 text-emerald-600" /> Jenis Naskah/Acara</label>
                  <select value={eventType} onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-white border border-slate-300 hover:border-emerald-500 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium cursor-pointer transition-colors">
                    {EVENT_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
                  </select>
                </div>
                {eventType.includes("Khutbah") && (
                  <div className="animate-fade-in">
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-2"><BookOpen className="w-4 h-4 mr-2 text-emerald-600" /> Versi Khutbah Kedua</label>
                    <select value={khutbahStyle} onChange={(e) => setKhutbahStyle(e.target.value)}
                      className="w-full bg-white border border-slate-300 hover:border-emerald-500 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium cursor-pointer transition-colors">
                      <option value="Umum">Umum / Muhammadiyah</option>
                      <option value="NU">Nahdlatul Ulama (NU)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={generateTrendingThemes} disabled={isLoadingThemes}
                  className={`inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all shadow-md w-full sm:w-auto ${isLoadingThemes ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg'}`}>
                  {isLoadingThemes ? <><Loader2 className="w-6 h-6 animate-spin" /><span>Memindai AI & Tema...</span></> : <><Search className="w-6 h-6" /><span>Temukan 10 Rekomendasi Tema</span></>}
                </button>
                <button onClick={() => { if(customTopic.trim()) generateKhutbahContent({title: customTopic, category: "Spesifik", trending_reason: "Topik Khusus", description: ""}) }} disabled={!customTopic.trim() || isLoadingKhutbah}
                  className={`inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-md w-full sm:w-auto ${!customTopic.trim() ? 'bg-slate-200 text-slate-400' : 'bg-teal-700 text-white hover:bg-teal-800'}`}>
                  <FileText className="w-6 h-6" /> <span>Buat Naskah Ini</span>
                </button>
              </div>
            </div>

            {}
            {themes.length > 0 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-2">10 Rekomendasi Terpilih</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {themes.map((theme, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col p-6">
                      <span className="inline-block self-start px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full uppercase mb-4">{theme.category}</span>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">{theme.title}</h3>
                      <p className="text-slate-600 text-sm mb-4">{theme.description}</p>
                      
                      {/* KOTAK KONTEKS RELEVANSI */}
                      {theme.trending_reason && (
                         <div className="bg-emerald-50 rounded-lg p-4 mb-6 border border-emerald-100 flex-grow">
                            <h4 className="text-xs font-bold text-emerald-800 mb-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> Konteks & Relevansi:</h4>
                            <p className="text-sm text-emerald-700 italic">"{theme.trending_reason.replace('Konteks & Relevansi:', '').trim()}"</p>
                         </div>
                      )}

                      <button onClick={() => generateKhutbahContent(theme)} className="w-full py-3 px-4 bg-teal-600 text-white hover:bg-teal-700 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 mt-auto">
                        <FileText className="w-5 h-5" /> <span>Buat Naskah Bersih Siap Baca</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {}
        {selectedTheme && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-16 z-0">
              <button onClick={() => setSelectedTheme(null)} className="flex items-center text-slate-600 hover:text-emerald-700 font-medium">
                <ChevronLeft className="w-5 h-5 mr-1" /> Kembali
              </button>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button onClick={copyToClipboard} disabled={isLoadingKhutbah} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
                  <Copy className="w-4 h-4 mr-2" /> Salin
                </button>
                <button onClick={printKhutbah} disabled={isLoadingKhutbah} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
                  <Printer className="w-4 h-4 mr-2" /> Cetak
                </button>
              </div>
            </div>

            <div className="p-6 md:p-12 max-w-4xl mx-auto">
              <div className="text-center mb-10 border-b border-slate-200 pb-8">
                <span className="text-emerald-600 font-semibold mb-2 block uppercase tracking-wider text-sm">{eventType}</span>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{selectedTheme.title}</h1>
              </div>

              {isLoadingKhutbah ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-6 text-emerald-700">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 animate-spin text-emerald-300" />
                    <ShieldCheck className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xl mb-2 text-slate-800">Menyusun Naskah Berkualitas...</p>
                    <p className="text-emerald-600 font-medium h-6 animate-pulse">{loadingStep}</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-lg prose-emerald max-w-none text-slate-800 font-serif leading-relaxed text-justify">
                  <div className="whitespace-pre-wrap">{khutbahContent}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3 animate-slide-up z-50">
          <CheckCircle className="w-5 h-5 text-emerald-400" /> <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
      `}} />
    </div>
  );
}