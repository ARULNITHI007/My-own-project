/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MapPin, 
  Mic, 
  LogOut, 
  Languages, 
  ArrowLeft,
  Check,
  X,
  CreditCard,
  Edit3,
  Copy,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc, 
  getDoc,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { TRANSLATIONS, PRICES, Language } from './constants';
import { TokenRecord, ProductItem, OperationType } from './types';

// Error handling helper as per Firebase instructions
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<'landing' | 'customer_form' | 'customer_tracking' | 'admin'>('landing');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [user, setUser] = useState<User | null>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'Arulnithi' && loginForm.password === 'Arulnithi007001') {
      setIsAdminAuthenticated(true);
      setShowLoginModal(false);
      setView('admin');
      setLoginForm({ username: '', password: '' });
    } else {
      alert('Invalid Username or Password');
    }
  };

  const onAdminClick = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdminAuthenticated(false);
    setView('landing');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Admin Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Admin Login</h3>
                <button onClick={() => setShowLoginModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Username</label>
                  <input 
                    type="text"
                    required
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <input 
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter password"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
                >
                  Login
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-xl tracking-tight text-indigo-600">Nithi Agri</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <Languages size={18} />
              {lang === 'en' ? 'தமிழ்' : 'English'}
            </button>
            {isAdminAuthenticated && (
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                title={t.logOut}
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <LandingView key="landing" setView={setView} t={t} onAdminClick={onAdminClick} isAdminAuthenticated={isAdminAuthenticated} />
          )}
          {view === 'customer_form' && (
            <CustomerForm key="form" setView={setView} t={t} lang={lang} />
          )}
          {view === 'customer_tracking' && (
            <CustomerTracking key="tracking" setView={setView} t={t} isAdminAuthenticated={isAdminAuthenticated} />
          )}
          {view === 'admin' && isAdminAuthenticated && (
            <AdminPortal key="admin" t={t} />
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="max-w-4xl mx-auto px-4 pb-12 mt-12 border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between gap-6 text-sm text-slate-500">
        <div>
          <h3 className="font-semibold text-slate-900 mb-2">{t.contact}</h3>
          <p className="flex items-center gap-2"><Phone size={14} /> 9786431737, 7603995059</p>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 mb-2">{t.location}</h3>
          <p className="flex items-center gap-2"><MapPin size={14} /> 4X6H+HGH</p>
          <a href="https://share.google/3qRDkwjn9zhnb0p8c" target="_blank" rel="no-referrer" className="text-indigo-600 hover:underline">Google Maps</a>
        </div>
      </footer>
    </div>
  );
}

function LandingView({ setView, t, onAdminClick, isAdminAuthenticated }: { setView: any, t: any, onAdminClick: any, isAdminAuthenticated: boolean, key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">{t.title}</h2>
        <p className="text-slate-600 max-w-lg mx-auto">{t.removeVillage}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => setView('customer_form')}
          className="group relative h-48 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-center items-center shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-center"
        >
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="text-indigo-600" size={32} />
          </div>
          <span className="text-xl font-bold text-slate-900">{t.customerAccess}</span>
          <p className="text-slate-500 mt-2 text-sm">{t.fillDetails}</p>
        </button>

        <button 
          onClick={() => setView('customer_tracking')}
          className="group relative h-48 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-center items-center shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-center"
        >
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Search className="text-indigo-600" size={32} />
          </div>
          <span className="text-xl font-bold text-slate-900">{t.tracking}</span>
          <p className="text-slate-500 mt-2 text-sm">{t.history}</p>
        </button>
      </div>

      <div className="flex justify-center mt-12">
        <button 
          type="button"
          onClick={onAdminClick}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors py-2 px-4 rounded-lg bg-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          {t.adminAccess}
        </button>
      </div>
    </motion.div>
  );
}

function CustomerForm({ setView, t, lang }: { setView: any, t: any, lang: Language, key?: string }) {
  const [tokenNumber, setTokenNumber] = useState<number>(0);
  const [pendingTokens, setPendingTokens] = useState<number[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Array<{key: keyof typeof PRICES, kg: number}>>([]);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const UPI_ID = "arulmissindia007@okaxis";
  const ADMIN_NAME = "Arulnithi";

  // Fetch busy tokens to ensure uniqueness
  useEffect(() => {
    const fetchBusyTokens = async () => {
      try {
        const q = query(collection(db, 'tokens'), where('status', '==', 'pending'));
        const snip = await getDocs(q);
        const tokens = snip.docs.map(d => d.data().tokenNumber);
        setPendingTokens(tokens);
      } catch (e) {
        console.error("Error fetching busy tokens", e);
      }
    };
    fetchBusyTokens();
  }, []);

  // Voice recognition setup
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t.voiceError);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-US' : 'ta-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCustomerName(transcript);
    };
    recognition.start();
  };

  const handleProductToggle = (key: keyof typeof PRICES) => {
    if (selectedProducts.find(p => p.key === key)) {
      setSelectedProducts(selectedProducts.filter(p => p.key !== key));
    } else {
      setSelectedProducts([...selectedProducts, { key, kg: 1 }]);
    }
  };

  const handleKgChange = (key: keyof typeof PRICES, kg: number) => {
    setSelectedProducts(selectedProducts.map(p => p.key === key ? { ...p, kg } : p));
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, p) => sum + (PRICES[p.key] * p.kg), 0);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    let previousAmount = 0;
    
    try {
      // Check if token was taken while filling
      const qCheck = query(collection(db, 'tokens'), where('tokenNumber', '==', tokenNumber), where('status', '==', 'pending'));
      const snipCheck = await getDocs(qCheck);
      if (!snipCheck.empty) {
        setLoading(false);
        return alert("Token " + tokenNumber + " was just taken. Please select another.");
      }

      // Lookup for previous balance
      const q = query(
        collection(db, 'tokens'), 
        where('customerName', '==', customerName.trim()), 
        orderBy('createdAt', 'desc'), 
        limit(1)
      );
      
      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          previousAmount = querySnapshot.docs[0].data().totalAmount || 0;
        }
      } catch (searchError) {
        console.warn('Could not fetch previous balance', searchError);
      }

      const items: ProductItem[] = selectedProducts.map(p => ({
        id: Math.random().toString(36).substr(2, 9),
        nameKey: p.key as any,
        kg: p.kg,
        price: PRICES[p.key],
        total: PRICES[p.key] * p.kg
      }));

      const totalAmount = paymentAmount + previousAmount;

      const docRef = await addDoc(collection(db, 'tokens'), {
        tokenNumber,
        customerName: customerName.trim(),
        items,
        totalAmount,
        previousAmount,
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: serverTimestamp()
      });

      // Save to localStorage for automatic tracking
      localStorage.setItem('lastTokenId', docRef.id);
      localStorage.setItem('lastCustomerName', customerName.trim());
      
      setView('customer_tracking');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!tokenNumber) return alert(t.selectToken);
    if (!customerName.trim()) return alert(t.enterName);
    if (selectedProducts.length === 0) return alert(t.selectProducts);
    
    setPaymentAmount(calculateTotal());
    setShowPayment(true);
  };

  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(ADMIN_NAME)}&am=${paymentAmount}&cu=INR`;

  return (
    <>
      <AnimatePresence>
        {showPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6 text-center"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">Complete Payment</h3>
                <button onClick={() => setShowPayment(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <QRCodeSVG 
                      value={upiUrl} 
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Amount to Pay</p>
                    <div className="text-4xl font-black text-indigo-600">₹{paymentAmount}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-left">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">UPI ID</p>
                      <p className="font-mono text-sm font-semibold text-slate-700">{UPI_ID}</p>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(UPI_ID);
                        alert("UPI ID Copied!");
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Copy size={18} />
                    </button>
                  </div>

                  <a 
                    href={upiUrl}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
                  >
                    <ExternalLink size={20} />
                    Open Payment App
                  </a>
                  
                  <p className="text-[10px] text-slate-400">
                    Note: Scan the QR code or use the button to complete payment. Your token will be generated immediately after clicking the button below.
                  </p>
                </div>

                <button 
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="w-full py-4 border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Registration & Finish'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
      >
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
        <button onClick={() => setView('landing')} className="p-2 hover:bg-white rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h2 className="font-bold text-lg">{t.fillDetails}</h2>
        <div className="w-10" />
      </div>

      <div className="p-6 space-y-8">
        {/* Token Selection */}
        <section className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">{t.selectToken}</label>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from({ length: 50 }, (_, i) => i + 1).map(num => {
              const isBusy = pendingTokens.includes(num);
              return (
                <button
                  key={num}
                  disabled={isBusy}
                  onClick={() => setTokenNumber(num)}
                  className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                    tokenNumber === num 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : isBusy 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed line-through'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </section>

        {/* Customer Name */}
        <section className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">{t.enterName}</label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder={t.name}
            />
            <button 
              onClick={startSpeechRecognition}
              className={`p-3 rounded-xl border transition-all ${
                isListening 
                  ? 'bg-red-50 border-red-200 text-red-500 animate-pulse' 
                  : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              <Mic size={24} />
            </button>
          </div>
          {isListening && <p className="text-xs text-indigo-500 font-medium animate-pulse">{t.voiceStart}</p>}
        </section>

        {/* Products Selection */}
        <section className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">{t.selectProducts}</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(PRICES) as Array<keyof typeof PRICES>).map(key => {
              const isSelected = selectedProducts.find(p => p.key === key);
              return (
                <div 
                  key={key}
                  className={`border rounded-xl p-4 transition-all ${
                    isSelected ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <button 
                      onClick={() => handleProductToggle(key)}
                      className="flex items-center gap-3 font-semibold text-slate-900"
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                      {t[key]}
                      <span className="text-xs font-normal text-slate-500">₹{PRICES[key]}/kg</span>
                    </button>
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                      <span className="text-sm text-slate-600 whitespace-nowrap">{t.enterKg}</span>
                      <input 
                        type="number"
                        min="1"
                        value={isSelected.kg}
                        onChange={(e) => handleKgChange(key, parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Total & Submit */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <span className="text-slate-500 text-sm">{t.totalAmount}</span>
            <div className="text-3xl font-black text-slate-900">₹{calculateTotal()}</div>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-12 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : t.ok}
          </button>
        </div>
      </div>
    </motion.div>
    </>
  );
}

function CustomerTracking({ setView, t, isAdminAuthenticated }: { setView: any, t: any, isAdminAuthenticated: boolean, key?: string }) {
  const [searchName, setSearchName] = useState(localStorage.getItem('lastCustomerName') || '');
  const [records, setRecords] = useState<TokenRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSearch = useCallback(async (name?: string) => {
    const term = name || searchName;
    if (!term.trim()) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'tokens'), 
        where('customerName', '>=', term.trim()),
        where('customerName', '<=', term.trim() + '\uf8ff'),
        orderBy('customerName'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TokenRecord));
      setRecords(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'tokens');
    } finally {
      setLoading(false);
    }
  }, [searchName, t.delete]);

  useEffect(() => {
    const lastId = localStorage.getItem('lastTokenId');
    const lastName = localStorage.getItem('lastCustomerName');
    if (lastName) {
      handleSearch(lastName);
    }
  }, []);

  const handleDelete = async (record: TokenRecord) => {
    // If not admin, check restriction
    if (!isAdminAuthenticated && (record.status !== 'completed' || record.paymentStatus !== 'paid')) {
      alert(t.deleteRestriction || "Note: Records can only be deleted after work is COMPLETED and PAID.");
      return;
    }

    if (!confirm(t.delete + '?')) return;

    console.log('Attempting to delete record:', record.id);
    setDeletingId(record.id!);
    try {
      if (!record.id) throw new Error("Missing record ID");
      await deleteDoc(doc(db, 'tokens', record.id!));
      console.log('Successfully deleted from Firestore');
      setRecords(records.filter(r => r.id !== record.id));
      if (record.id === localStorage.getItem('lastTokenId')) {
        localStorage.removeItem('lastTokenId');
      }
      alert(t.deleted || "Deleted successfully");
    } catch (error) {
      console.error('Delete error details:', error);
      alert("Delete failed: " + (error instanceof Error ? error.message : "Unknown error"));
      handleFirestoreError(error, OperationType.DELETE, 'tokens');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOnlinePay = (record: TokenRecord) => {
    const UPI_ID = "arulmissindia007@okaxis";
    const ADMIN_NAME = "Arulnithi";
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(ADMIN_NAME)}&am=${record.totalAmount}&cu=INR`;
    window.location.href = upiUrl;
  };

  const lastTokenId = localStorage.getItem('lastTokenId');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <button onClick={() => setView('landing')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h2 className="text-2xl font-bold">{t.tracking}</h2>
      </div>

      <div className="flex gap-2">
        <input 
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          placeholder={t.name}
        />
        <button 
          onClick={() => handleSearch()}
          className="px-6 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-md"
        >
          <Search size={20} />
          {searchName ? t.searching : t.history}
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-slate-500 py-12">{t.searching}</p>
        ) : records.length === 0 ? (
          (searchName || lastTokenId) && <p className="text-center text-slate-500 py-12">{t.noRecords}</p>
        ) : (
          records.map(record => (
            <div 
              key={record.id} 
              className={`bg-white border rounded-2xl p-6 shadow-sm relative overflow-hidden group transition-all ${
                record.id === lastTokenId ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-slate-200'
              }`}
            >
              {record.id === lastTokenId && (
                <div className="absolute top-0 left-0 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-br-lg">
                  {t.lastOrder}
                </div>
              )}
              
              <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-xs font-bold uppercase tracking-wider ${
                record.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {t[record.status]}
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-6 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-xl">
                      {record.tokenNumber}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{record.customerName}</h3>
                      <p className="text-xs text-slate-400">
                        {record.createdAt?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {record.items.map(item => (
                      <span key={item.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-sm text-slate-600 font-medium">
                        {t[item.nameKey]} ({item.kg}kg)
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end gap-4 min-w-[200px]">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">{t.totalAmount}</p>
                    <div className="text-3xl font-black text-indigo-600">₹{record.totalAmount}</div>
                    {record.previousAmount > 0 && (
                      <p className="text-xs text-slate-500 mt-1">{t.previousBalance}: ₹{record.previousAmount}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    {record.paymentStatus !== 'paid' && (
                      <button 
                        onClick={() => handleOnlinePay(record)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-all"
                      >
                        <CreditCard size={16} />
                        {t.payOnline}
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(record)}
                      disabled={deletingId === record.id}
                      className={`p-2 transition-all ${
                        deletingId === record.id 
                          ? 'text-slate-200 cursor-not-allowed animate-pulse' 
                          : 'text-slate-400 hover:text-red-600 active:scale-90'
                      }`}
                      title={isAdminAuthenticated ? "Delete" : "Only available when Completed and Paid"}
                    >
                      <Trash2 size={20} className={deletingId === record.id ? 'animate-spin' : ''} />
                    </button>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold ${
                      record.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {record.paymentStatus === 'paid' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      {t[record.paymentStatus]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function AdminPortal({ t }: { t: any, key?: string }) {
  const [records, setRecords] = useState<TokenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ totalAmount: 0, previousAmount: 0 });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'tokens'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TokenRecord));
      setRecords(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'tokens');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const updateStatus = async (id: string, field: 'status' | 'paymentStatus', value: string) => {
    try {
      await updateDoc(doc(db, 'tokens', id), { [field]: value });
      setRecords(records.map(r => r.id === id ? { ...r, [field]: value } : r));
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'tokens');
    }
  };

  const handleSaveAmounts = async (id: string) => {
    try {
      await updateDoc(doc(db, 'tokens', id), { 
        totalAmount: editFields.totalAmount, 
        previousAmount: editFields.previousAmount 
      });
      setRecords(records.map(r => r.id === id ? { ...r, ...editFields } : r));
      setEditingId(null);
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'tokens');
    }
  };

  const startEditing = (record: TokenRecord) => {
    setEditingId(record.id!);
    setEditFields({ totalAmount: record.totalAmount, previousAmount: record.previousAmount });
  };

  const handleDelete = async (record: TokenRecord) => {
    if (!confirm(t.delete + '?')) return;
    console.log('Admin deleting record:', record.id);
    setDeletingId(record.id!);
    try {
      if (!record.id) throw new Error("Missing record ID");
      await deleteDoc(doc(db, 'tokens', record.id!));
      console.log('Admin successfully deleted from Firestore');
      setRecords(records.filter(r => r.id !== record.id));
      if (record.id === localStorage.getItem('lastTokenId')) {
        localStorage.removeItem('lastTokenId');
      }
      alert(t.deleted || "Deleted successfully");
    } catch (error) {
      console.error('Admin delete error:', error);
      alert("Delete failed: " + (error instanceof Error ? error.message : "Unknown error"));
      handleFirestoreError(error, OperationType.DELETE, 'tokens');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{t.allCustomers}</h2>
        <button onClick={fetchRecords} className="p-2 text-indigo-600 hover:bg-slate-100 rounded-lg">
          <Clock size={20} />
        </button>
      </div>

      <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t.tokenNumber}</th>
              <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t.name}</th>
              <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t.productDetails}</th>
              <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t.amount}</th>
              <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t.workStatus}</th>
              <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">{t.paymentStatus}</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="p-12 text-center text-slate-400">{t.searching}</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-slate-400">{t.noRecords}</td></tr>
            ) : (
              records.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      {record.tokenNumber}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-900">{record.customerName}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {record.items.map(item => (
                        <span key={item.id} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                          {t[item.nameKey]} ({item.kg}kg)
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    {editingId === record.id ? (
                      <div className="space-y-2 min-w-[120px]">
                        <div>
                          <label className="text-[10px] uppercase text-slate-400 font-bold">{t.amount}</label>
                          <input 
                            type="number" 
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={editFields.totalAmount}
                            onChange={(e) => setEditFields({ ...editFields, totalAmount: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-400 font-bold">{t.previousBalance}</label>
                          <input 
                            type="number" 
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={editFields.previousAmount}
                            onChange={(e) => setEditFields({ ...editFields, previousAmount: Number(e.target.value) })}
                          />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleSaveAmounts(record.id!)} className="bg-indigo-600 text-white p-1 rounded hover:bg-indigo-700">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-600 p-1 rounded hover:bg-slate-300">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors" onClick={() => startEditing(record)}>
                        <div className="font-bold text-indigo-600 flex items-center gap-1.5">
                          ₹{record.totalAmount}
                          <Edit3 size={11} className="text-slate-400 opacity-50 group-hover:opacity-100" />
                        </div>
                        {record.previousAmount > 0 && <div className="text-[10px] text-slate-400 font-medium">Prev: ₹{record.previousAmount}</div>}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => updateStatus(record.id!, 'status', record.status === 'pending' ? 'completed' : 'pending')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        record.status === 'completed' 
                          ? 'bg-green-100 text-green-700 shadow-sm' 
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      {record.status === 'completed' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      {t[record.status]}
                    </button>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => updateStatus(record.id!, 'paymentStatus', record.paymentStatus === 'unpaid' ? 'paid' : 'unpaid')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        record.paymentStatus === 'paid' 
                          ? 'bg-blue-100 text-blue-700 shadow-sm' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {record.paymentStatus === 'paid' ? <CreditCard size={14} /> : <Clock size={14} />}
                      {t[record.paymentStatus]}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(record)}
                      disabled={deletingId === record.id}
                      className={`p-2 transition-all ${
                        deletingId === record.id 
                          ? 'text-slate-200 cursor-not-allowed animate-pulse' 
                          : 'text-slate-400 hover:text-red-600 active:scale-95'
                      }`}
                    >
                      <Trash2 size={20} className={deletingId === record.id ? 'animate-spin' : ''} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// Add these to window for the compiler
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
