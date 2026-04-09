import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Warehouse, Github, Twitter, Linkedin, ChevronRight } from 'lucide-react';
import './Login.css';

// Firebase imports - dynamic
import { auth as firebaseAuth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const CSSParticles = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="particle"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100 + 100}%`,
                        width: `${Math.random() * 4 + 2}px`,
                        height: `${Math.random() * 4 + 2}px`,
                        animation: `floatParticle ${Math.random() * 10 + 10}s linear infinite`,
                        animationDelay: `${Math.random() * 10}s`,
                        background: 'rgba(255, 255, 255, 0.4)'
                    }}
                />
            ))}
        </div>
    );
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Step 1: Check Auth system readiness
        if (!firebaseAuth) {
            setError('Auth system not ready. Please refresh.');
            return;
        }

        // Step 2: Basic validation (prevent empty fields)
        if (!email.trim() || !password.trim()) {
            setError('Please enter your credentials.');
            return;
        }

        setIsSubmitting(true);

        // Step 3: Admin Login Logic (Requirement 2 & 3)
        const adminEmail = 'admin123@gmail.com';
        const adminPassword = '123456';

        // Check if user is attempting to login as admin
        if (email.toLowerCase() === adminEmail) {
            if (password === adminPassword) {
                // Successful Admin Login
                setIsSubmitting(false);
                alert('Welcome Admin! Accessing management portal.');

                // Set persistence
                localStorage.setItem('isAdmin', 'true');
                localStorage.setItem('isLoggedIn', 'true');

                // Redirect directly to Admin Page
                navigate('/admin');
                return;
            } else {
                // Requirement 3: Admin credentials are wrong -> show error message
                // Requirement 3: Do NOT redirect to signup page automatically
                setIsSubmitting(false);
                setError('Incorrect password for Administrator.');
                return;
            }
        }

        // Step 4: Normal User Login (Firebase Auth)
        try {
            // Attempt to authenticate with Firebase
            await signInWithEmailAndPassword(firebaseAuth, email, password);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('isAdmin', 'false');
            navigate('/'); // Successful user login
        } catch (err) {
            console.error("Login Error:", err);
            const errorCode = err.code;

            // Step 5: Error Handling (Requirement: DO NOT REDIRECT TO SIGNUP)
            if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
                setError('Email or Password is wrong.');
            } else if (errorCode === 'auth/wrong-password') {
                setError('Email or Password is wrong.');
            } else {
                setError(err.message.replace('Firebase:', '').trim());
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center relative overflow-hidden gradient-animate py-20 px-4"
        >
            <CSSParticles />

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="max-w-md w-full relative z-10"
            >
                <div className="flex items-center justify-center gap-3 mb-10 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white transform group-hover:rotate-12 transition-transform shadow-2xl">
                        <Warehouse size={28} />
                    </div>
                    <span className="text-3xl font-extrabold tracking-tighter text-white uppercase">S V G E</span>
                </div>

                <div className="glass p-8 md:p-10 rounded-3xl border-white/40 shadow-2xl text-black overflow-hidden">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-black mb-2">Architect Portal</h1>
                        <p className="text-gray-600 text-sm font-medium">Access your global stone registry</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ x: -4, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-xl mb-6 text-center animate-shake"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-black placeholder:text-gray-400 outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-black placeholder:text-gray-400 outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                            <label className="flex items-center gap-2 text-gray-500 cursor-pointer hover:text-black transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black/20" />
                                Remember Me
                            </label>
                            <a href="#" className="text-black hover:underline transition-colors">Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-black hover:bg-gray-900 text-white font-bold rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 group shimmer-effect overflow-hidden relative"
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Enter Vault
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-600 mb-6">Don't have an account? <Link to="/signup" className="text-black font-extrabold hover:underline">Sign up</Link></p>
                        <div className="flex justify-center gap-4">
                            {[Linkedin, Twitter, Github].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white transition-all shadow-sm">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-colors">
                        <ChevronRight size={14} className="rotate-180" />
                        BACK TO HOME
                    </Link>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Login;
