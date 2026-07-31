import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  Search, BookOpen, Copy, Printer, AlertCircle, 
  Loader2, CheckCircle, ChevronLeft, Globe, 
  FileText, ListFilter, ShieldCheck, Target, Key, Settings, LogOut
} from 'lucide-react';

// ==========================================
// 1. KONFIGURASI FIREBASE
// ==========================================
// PENTING: Ganti dengan API Key milik Boss di bawah ini
const firebaseConfig = {
  apiKey: "AIzaSyDBRDRU5cSPSu4-HSaQ2Idxv9s63YnwLxk", 
  authDomain: "mimbar-pintar-baru.firebaseapp.com",
  projectId: "mimbar-pintar-baru",
  storageBucket: "mimbar-pintar-baru.appspot.com",
  messagingSenderId: "847492025404",
  appId: "1:847492025404:web:f136201f7e8bde65a1c739"
};

// ==========================================
// 2. DAFTAR EMAIL PEMBELI (FILTER AKSES)
// ==========================================
// Tambahkan email pelanggan yang beli aplikasi Boss di bawah ini
const ALLOWED_EMAILS = [
  "rais.abdull@gmail.com", 
  "pembeli1@gmail.com",
  "pembeli2@gmail.com"
];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ==========================================
// 3. KOMPONEN UTAMA APLIKASI
// ==========================================
export default function App() {
  // State Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [user, setUser] = useState(null);

  // State Aplikasi Khutbah
  const [userApiKey, setUserApiKey] = useState("");
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiError, setApiError] = useState(""); 
  const [eventType, setEventType] = useState("Khutbah Jumat");
  const [khutbahStyle, setKhutbahStyle] = useState("Umum");
  const [customTopic, setCustomTopic] = useState(""); 
  const [themes, setThemes] = useState([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [khutbahContent, setKhutbahContent] = useState("");
  const [isLoadingKhutbah, setIsLoadingKhutbah] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [appError, setAppError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const EVENT_TYPES = [
    "Khutbah Jumat", "Khutbah Idul Fitri", "Khutbah Idul Adha",
    "Tausiyah Umum", "Kultum Singkat", "Ceramah Kajian", "Tausiyah Hari Besar Islam"
  ];

  // Pantau status login & filter email
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Pastikan user yang masuk benar-benar ada di daftar ALLOWED_EMAILS
      if (currentUser && ALLOWED_EMAILS.includes(currentUser.email.toLowerCase())) {
        setUser(currentUser);
      } else if (currentUser) {
        signOut(auth);
        setUser(null);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Pantau API Key di LocalStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('mimbar_api_key');
    if (storedKey) {
      setUserApiKey(storedKey);
    } else if (user) {
      setShowApiModal(true);
    }
  }, [user]);

  // Fungsi Login Firebase dengan Filter
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError("");
    
    const inputEmail = email.trim().toLowerCase();

    // CEK FILTER EMAIL: Tolak jika tidak ada di daftar
    if (!ALLOWED_EMAILS.includes(inputEmail)) {
      setAuthError("Akses Ditolak: Email Anda belum terdaftar sebagai pembeli lisensi aplikasi ini.");
      setIsAuthLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, inputEmail, password);
    } catch (err) {
      setAuthError("Login gagal. Periksa kembali email dan password Anda.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Fungsi Logout
  const handleLogout = async () => {
    await signOut(auth);
    setThemes([]);
    setSelectedTheme(null);
    setKhutbahContent("");
  };

  // Fungsi Simpan API Key
  const saveApiKey = () => {
    setApiError("");
    const key = userApiKey.trim();
    
    if (!key) {
      setApiError("API Key tidak boleh kosong!");
      return;
    }
    if (!key.startsWith("AIza")) {
      setApiError("Format API Key tidak valid. Pastikan diawali dengan 'AIza...'");
      return;
    }
    
    localStorage.setItem('mimbar_api_key', key);
    setShowApiModal(false);
    showToast("API Key berhasil disimpan!");
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const getStructureGuideline = (type, style) => {
    let khutbahKeduaRule = `- KHUTBAH KEDUA: Muqaddimah singkat Arab, Hamdalah, Shalawat, Wasiat takwa, Ringkasan pesan (Bahasa Indonesia), Doa.`;
    if (style === "NU") {
      khutbahKeduaRule = `- KHUTBAH KEDUA (FULL ARAB): 100% Bahasa Arab Berharakat, TANPA BAHASA INDONESIA SAMA SEKALI. Isinya HANYA: Muqaddimah singkat, Hamdalah, Shalawat, Wasiat takwa, dan Doa untuk umat Islam.`;
    }
    const guidelines = {
      "Khutbah Jumat": `- Judul\n- KHUTBAH PERTAMA: Muqaddimah Tematik Arab Bersajak, Pengantar masalah jamaah, Dalil utama, Pembahasan inti 2–3 poin, Refleksi ruhiyah, Solusi praktis, Penutup khutbah pertama.\n${khutbahKeduaRule}`,
      "Khutbah Idul Fitri": `- Takbir pembuka (Arab)\n- KHUTBAH PERTAMA: Muqaddimah Tematik Arab, Wasiat takwa, Makna kemenangan setelah Ramadan, Refleksi diri, Pesan menjaga amal, Pesan persaudaraan, Solusi amal\n${khutbahKeduaRule}`,
      "Khutbah Idul Adha": `- Takbir pembuka yang kuat (Arab)\n- KHUTBAH PERTAMA: Muqaddimah Tematik Arab, Wasiat takwa, Pengantar Idul Adha, Keresahan jamaah, Kisah Ibrahim terarah, Pembahasan inti, Solusi praktis\n${khutbahKeduaRule}`
    };
    return guidelines[type] || `- Muqaddimah Tematik Arab, Sapaan hangat, Masalah audiens, Dalil, Kisah, Refleksi, Pesan praktis, Doa singkat`;
  };

  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, options);
        if (!res.ok) {
           const errData = await res.json().catch(() => ({}));
           throw new Error(errData.error?.message || `HTTP error! status: ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; 
      }
    }
  };

  // Generate Referensi Tema (Mencegah error 400 dengan payload yang tepat)
  const generateTrendingThemes = async () => {
    if (!userApiKey) { setShowApiModal(true); return; }
    setIsLoadingThemes(true); setAppError(null); setThemes([]);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userApiKey}`;
    const topicFocus = customTopic.trim() 
      ? `dengan FOKUS KHUSUS pada isu/tema: "${customTopic}". Cari berita atau tren terbaru yang berkaitan dengan topik tersebut.` 
      : `secara umum dari berbagai bidang (Ekonomi, Sosial, Keluarga, Teknologi, Akhlak).`;

    const promptText = `
      1. Cari berita utama, tren sosial, dan isu terkini di masyarakat Indonesia minggu ini, ${topicFocus}
      2. Identifikasi momen keagamaan Islam yang sedang berlangsung atau berdekatan saat ini.
      Berdasarkan informasi tersebut, buatkan 10 ide tema ${eventType} yang relevan.
    `;

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      tools: [{ googleSearch: {} }], 
      systemInstruction: { parts: [{ text: `Kamu adalah ulama dan pakar pembuat ide tema ${eventType} yang bijak.` }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            themes: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" }, category: { type: "STRING" },
                  trending_reason: { type: "STRING" }, description: { type: "STRING" }
                },
                required: ["title", "category", "trending_reason", "description"]
              }
            }
          }
        }
      }
    };

    try {
      const data = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (parsed.themes) setThemes(parsed.themes);
      }
    } catch (err) {
      setAppError(`Gagal mengambil tema: Pastikan API Key valid. (${err.message})`);
    } finally {
      setIsLoadingThemes(false);
    }
  };

  const generateDirectKhutbah = () => {
    if (!customTopic.trim()) {
      setAppError("Silakan ketik tema Anda di kolom 'Fokus Topik' terlebih dahulu.");
      return;
    }
    const syntheticTheme = {
      title: customTopic, category: "Topik Pilihan Anda",
      trending_reason: `Fokus pembahasan khusus mengenai: ${customTopic}`,
      description: `Naskah ${eventType} yang disusun dengan fokus utama pada ${customTopic}.`
    };
    generateKhutbahContent(syntheticTheme);
  };

  // Generate Khutbah (Paten: Muqaddimah Bersaja + Isu Viral)
  const generateKhutbahContent = async (theme) => {
    if (!userApiKey) { setShowApiModal(true); return; }
    setSelectedTheme(theme); setIsLoadingKhutbah(true); setKhutbahContent(""); setAppError(null);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userApiKey}`;
    const structureRule = getStructureGuideline(eventType, khutbahStyle);

    const promptText = `
      Buatkan naskah ${eventType} lengkap. Judul: ${theme.title}. Konteks: ${theme.trending_reason}.
      TUGAS UTAMA: 
      1. STRUKTUR: ${structureRule}
      - JIKA KHUTBAH (Jumat/Idul Fitri/Idul Adha): Tuliskan "KHUTBAH PERTAMA" dan "KHUTBAH KEDUA" sebagai pemisah.
      2. MUQADDIMAH: WAJIB MENGGUNAKAN BAHASA ARAB berharakat penuh, tematik, dan BERSAJA' (berima/sajak Arab yang indah).
      3. ISI & KONTEKSTUALISASI: Setiap penjelasan materi dan dalil WAJIB dihubungkan dengan tren, isu yang sedang viral, atau realitas masyarakat saat ini (merujuk pada konteks: ${theme.trending_reason}). Buat jamaah merasa bahwa khutbah ini sangat "relate" dengan kehidupan nyata mereka sekarang.
      4. KEDALAMAN: Masukkan tinjauan spiritual (ruhiyah), kisah teladan, dan solusi praktis yang bisa langsung diamalkan.
      5. BERSIH: Jangan gunakan simbol markdown (* atau #). Jangan ada kata pengantar dari AI. Naskah harus langsung berwujud khutbah utuh yang siap baca.
    `;

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      systemInstruction: { parts: [{ text: `Kamu adalah Ulama faqih, Khotib handal, dan Sastrawan Arab.` }] }
    };

    try {
      const data = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) setKhutbahContent(responseText);
      else setAppError(`Gagal menghasilkan naskah. API Key mungkin kehabisan kuota.`);
    } catch (err) {
      setAppError(`Terjadi kesalahan sistem: ${err.message}`);
    } finally {
      setIsLoadingKhutbah(false);
    }
  };

  useEffect(() => {
    let interval;
    if (isLoadingKhutbah) {
      const steps = ["Membangun struktur Khutbah...", "Merangkai Muqaddimah Arab Bersaja'...", "Menganalisis Isu Viral Terkini...", "Membersihkan format naskah..."];
      let i = 0; setLoadingStep(steps[0]);
      interval = setInterval(() => { i++; if (i < steps.length) setLoadingStep(steps[i]); }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoadingKhutbah]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(khutbahContent).then(() => showToast("Naskah disalin ke clipboard!")).catch(() => setAppError("Gagal menyalin teks."));
  };

  const printKhutbah = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${eventType}: ${selectedTheme.title}</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { text-align: center; color: #065f46; border-bottom: 2px solid #065f46; padding-bottom: 10px; }
            .content { font-size: 14pt; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${selectedTheme.title}</h1>
          <div class="content">${khutbahContent}</div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ==========================================
  // UI 1: HALAMAN LOGIN
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <ShieldCheck className="w-16 h-16 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">Mimbar Pintar Pro</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
              type="email" placeholder="Email Terdaftar" required 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
              className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
              type="password" placeholder="Kata Sandi" required 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button 
              disabled={isAuthLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all disabled:bg-slate-400 shadow-md"
            >
              {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Masuk Aplikasi"}
            </button>
          </form>
          
          {authError && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="break-words">{authError}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // UI 2: APLIKASI UTAMA (GENERATOR)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      
      {/* MODAL PENGATURAN API KEY GEMINI (DESAIN SS2) */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <Key className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Pengaturan API Key</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Aplikasi ini membutuhkan API Key dari Google AI Studio. Key akan disimpan secara aman di browser Anda (Local Storage).
              </p>
              
              {apiError && (
                <div className="w-full mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              <input 
                type="text" 
                value={userApiKey} 
                onChange={(e) => {
                  setUserApiKey(e.target.value);
                  setApiError(""); // Hilangkan error otomatis saat ngetik
                }}
                placeholder="Mulai dengan 'AIzaSy...'"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none mb-4 text-slate-700"
              />
              <button 
                onClick={saveApiKey} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md mb-4"
              >
                Simpan API Key
              </button>
              
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium hover:underline"
              >
                Belum punya? Dapatkan gratis di sini
              </a>
            </div>
            {localStorage.getItem('mimbar_api_key') && (
              <button onClick={() => setShowApiModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
            )}
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="bg-emerald-700 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setSelectedTheme(null); setThemes([]); }}>
              <BookOpen className="w-8 h-8 text-emerald-300" />
              <span className="font-bold text-xl tracking-tight">Mimbar Pintar Pro</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button onClick={() => setShowApiModal(true)} className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors" title="Pengaturan AI">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={handleLogout} className="flex items-center space-x-1 bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg font-medium transition-colors">
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* KONTEN UTAMA */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {appError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start space-x-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{appError}</p>
          </div>
        )}

        {/* LAYAR GENERATOR UTAMA */}
        {!selectedTheme && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
              <Globe className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-slate-800 mb-4">Generator Naskah Mimbar</h1>
              <p className="text-slate-600 max-w-2xl mx-auto mb-8">Pilih jenis acara dan masukkan topik untuk menghasilkan naskah berkualitas.</p>
              
              <div className="max-w-3xl mx-auto mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-6 text-left">
                <div className="flex-1">
                  <label className="flex items-center text-sm font-semibold text-slate-700 mb-2"><Target className="w-4 h-4 mr-2 text-emerald-600" /> Fokus Topik</label>
                  <input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder="Contoh: Menghindari Pinjol, Sabar, dll" className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="flex-1">
                  <label className="flex items-center text-sm font-semibold text-slate-700 mb-2"><ListFilter className="w-4 h-4 mr-2 text-emerald-600" /> Jenis Acara</label>
                  <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500">
                    {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                {eventType.includes("Khutbah") && (
                  <div className="flex-1">
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-2"><BookOpen className="w-4 h-4 mr-2 text-emerald-600" /> Khutbah Kedua</label>
                    <select value={khutbahStyle} onChange={(e) => setKhutbahStyle(e.target.value)} className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500">
                      <option value="Umum">Umum / Muhammadiyah</option><option value="NU">Nahdlatul Ulama (NU)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={generateTrendingThemes} disabled={isLoadingThemes} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  {isLoadingThemes ? <Loader2 className="w-5 h-5 animate-spin"/> : <Search className="w-5 h-5"/>} Temukan Referensi AI
                </button>
                <button onClick={generateDirectKhutbah} disabled={!customTopic.trim() || isLoadingKhutbah} className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-300">
                  {isLoadingKhutbah && selectedTheme?.category === "Topik Pilihan Anda" ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileText className="w-5 h-5"/>} Langsung Buat Naskah
                </button>
              </div>
            </div>

            {/* HASIL REFERENSI TEMA */}
            {themes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {themes.map((theme, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col hover:shadow-md transition">
                    <span className="text-teal-700 bg-teal-50 text-xs font-bold px-3 py-1 rounded-full w-fit mb-3">{theme.category}</span>
                    <h3 className="text-xl font-bold mb-2">{theme.title}</h3>
                    <p className="text-slate-600 text-sm mb-4 flex-grow">{theme.description}</p>
                    <button onClick={() => generateKhutbahContent(theme)} className="mt-auto w-full bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4"/> Buat Naskah
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LAYAR BACA NASKAH */}
        {selectedTheme && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="bg-slate-50 border-b px-4 py-3 flex justify-between items-center sticky top-16 z-0">
              <button onClick={() => setSelectedTheme(null)} className="flex items-center font-medium text-slate-600 hover:text-emerald-700">
                <ChevronLeft className="w-5 h-5" /> Kembali
              </button>
              <div className="flex gap-2">
                <button onClick={copyToClipboard} className="flex items-center px-4 py-2 bg-white border rounded-lg hover:bg-slate-50 font-medium">
                  <Copy className="w-4 h-4 mr-2" /> Salin
                </button>
                <button onClick={printKhutbah} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
                  <Printer className="w-4 h-4 mr-2" /> Cetak
                </button>
              </div>
            </div>
            
            <div className="p-6 md:p-12 max-w-4xl mx-auto">
              {isLoadingKhutbah ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-16 h-16 animate-spin text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold">Menyusun Naskah...</h2>
                  <p className="text-emerald-600 mt-2">{loadingStep}</p>
                </div>
              ) : (
                <div className="prose prose-lg max-w-none font-serif leading-relaxed text-justify whitespace-pre-wrap">
                  <h1 className="text-3xl text-center font-bold text-slate-900 mb-8 border-b pb-4">{selectedTheme.title}</h1>
                  {khutbahContent}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* TOAST NOTIFIKASI */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}