import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Warehouse, User as UserIcon, ShoppingCart, Package } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// --- Pages ---
import Home from './pages/Home';
import Products from './pages/Products';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Admin from './pages/Admin';
import UserProfile from './pages/userprofile';
import AboutUs from './pages/AboutUs';
import CalculatorPage from './pages/Calculator';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Checkout from './pages/Checkout';

// ── LoadingScreen ──────────────────────────────────────────────────────────────
const STATUSES = [
  'Initializing Systems',
  'Loading Assets',
  'Connecting Services',
  'Preparing Interface',
  'Almost Ready',
];

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    startRef.current = performance.now();
    const duration = 2200;

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const p = Math.min((elapsed / duration) * 100, 98);
      setProgress(p);
      setStatusIdx(Math.min(Math.floor((p / 100) * STATUSES.length), STATUSES.length - 1));
      if (p < 98) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const dots = useRef(
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      dur: Math.random() * 6 + 5,
      delay: Math.random() * 4,
      opacity: Math.random() * 0.35 + 0.05,
    }))
  ).current;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #0d1b32 50%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Glow blobs */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%',
        width: 340, height: 340,
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)',
      }} />
      
      {dots.map(d => (
        <div key={d.id} style={{
          position: 'absolute',
          left: `${d.x}%`, top: `${d.y}%`,
          width: d.size, height: d.size,
          background: d.id % 4 === 0 ? '#10b981' : '#3b82f6',
          borderRadius: '50%',
          opacity: d.opacity,
          animation: `floatUp ${d.dur}s ${d.delay}s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 40 }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px 6px rgba(59,130,246,0.4)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: '0.35em', color: '#ffffff', textTransform: 'uppercase' }}>SVGE</div>
      <div style={{ width: 260, marginTop: 20 }}>
        <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #10b981)', transition: 'width 0.1s linear' }} />
        </div>
      </div>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>{STATUSES[statusIdx]}</p>

      <style>{`
        @keyframes floatUp { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-18px); } }
      `}</style>
    </div>
  );
};

const Navbar = ({ isLoggedIn, authInstance, currentUser }) => {
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/admin' || location.pathname === '/profile' || location.pathname === '/cart' || location.pathname === '/orders';
  const isLightPage = location.pathname === '/calculator';

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handle);
    return () => window.removeEventListener('scroll', handle);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
    };
    updateCount();
    window.addEventListener('cartUpdated', updateCount);
    return () => window.removeEventListener('cartUpdated', updateCount);
  }, []);

  if (isAuthPage) return null;

  const handleLogout = async () => {
    if (!authInstance) return;
    try {
      await signOut(authInstance);
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      navigate('/');
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const navTextColor = isLightPage && !scrolled ? 'text-slate-900' : 'text-white/90';

  return (
    <div className="fixed top-6 w-full z-[100] px-6 md:px-12 flex justify-center pointer-events-none">
      <nav className={`w-full max-w-7xl pointer-events-auto transition-all duration-500 rounded-[2.5rem] px-10 flex items-center justify-between ${scrolled ? 'glass-navbar py-6 shadow-2xl' : 'bg-transparent py-10'}`}>
        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center text-white transform group-hover:rotate-12 transition-transform shadow-xl shadow-brand-blue/30">
            <Warehouse size={28} />
          </div>
          <span className={`text-4xl font-extrabold tracking-[0.2em] transition-colors ${isLightPage && !scrolled ? 'text-slate-900' : 'text-white'} uppercase font-display`}>SVGE</span>
        </Link>

        {(location.pathname === '/' || location.pathname === '/products' || location.pathname === '/calculator') && (
          <div className={`hidden lg:flex items-center gap-14 text-base font-bold transition-colors ${navTextColor} uppercase tracking-widest`}>
            {['Home', 'Products', 'Calculator'].map(item => (
              <Link key={item} to={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '')}`} className="hover:text-brand-blue transition-colors relative group">
                {item}
                <span className="absolute -bottom-2 left-0 w-0 h-1 bg-brand-blue transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-6">
              <Link to="/orders" className="relative p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-white" title="My Orders">
                <Package size={22} />
              </Link>
              <Link to="/cart" className="relative p-3 bg-brand-blue/10 border border-brand-blue/20 rounded-2xl hover:bg-brand-blue/20 transition-all text-brand-blue" title="My Cart">
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-red text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-blue/20 flex items-center justify-center">
                  {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="P" className="w-full h-full object-cover" /> : <UserIcon size={14} className="text-white" />}
                </div>
                <span className={`text-[10px] font-black ${isLightPage && !scrolled ? 'text-slate-900/70' : 'text-white/70'} uppercase tracking-widest hidden sm:inline`}>
                  {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                </span>
              </Link>
              <button onClick={handleLogout} className="hidden sm:block text-sm font-black uppercase tracking-widest bg-brand-red text-white px-10 py-4 rounded-2xl shadow-xl transition-all hover:bg-brand-red-dark">Sign Out</button>
            </div>
          ) : (
            <Link to="/login" className="hidden sm:block text-sm font-black uppercase tracking-widest bg-brand-blue hover:bg-brand-blue-dark text-white px-10 py-4 rounded-2xl shadow-xl transition-all">Login</Link>
          )}
        </div>
      </nav>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { auth: firebaseAuth } = await import('./firebase');
        setAuth(firebaseAuth);
        onAuthStateChanged(firebaseAuth, (user) => {
          if (user) {
            setIsLoggedIn(true);
            setCurrentUser(user);
            localStorage.setItem('isLoggedIn', 'true');
          } else if (localStorage.getItem('isAdmin') !== 'true') {
            setIsLoggedIn(false);
            setCurrentUser(null);
            localStorage.removeItem('isLoggedIn');
          }
          setLoading(false);
        });
      } catch (e) {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <div className="min-h-screen bg-brand-slate selection:bg-brand-blue selection:text-white">
        <Navbar isLoggedIn={isLoggedIn} authInstance={auth} currentUser={currentUser} />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home isLoggedIn={isLoggedIn} currentUser={currentUser} />} />
            <Route path="/products" element={<Products isLoggedIn={isLoggedIn} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/aboutus" element={<AboutUs />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/cart" element={<Cart isLoggedIn={isLoggedIn} currentUser={currentUser} />} />
            <Route path="/checkout" element={<Checkout isLoggedIn={isLoggedIn} currentUser={currentUser} />} />
            <Route path="/orders" element={<Orders isLoggedIn={isLoggedIn} currentUser={currentUser} />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}
