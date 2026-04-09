import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Mail, Lock, User, CheckCircle, ChevronRight } from 'lucide-react';
import './SignUp.css';

// Firebase imports - dynamic
import { auth as firebaseAuth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);



const CSSParticles = () => {
    const [mousePos, setMousePos] = useState({ x: -2000, y: -2000 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const particles = useMemo(() => {
        return [...Array(100)].map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            initialTop: Math.random() * 120,
            size: Math.random() * 4 + 1.2,
            duration: Math.random() * 10 + 5,
            delay: Math.random() * 2,
        }));
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full bg-[#0d1428]">
            {particles.map((p) => (
                <InteractiveParticle key={p.id} config={p} mousePos={mousePos} />
            ))}
        </div>
    );
};

const InteractiveParticle = ({ config, mousePos }) => {
    const particleRef = useRef(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isNear, setIsNear] = useState(false);

    useEffect(() => {
        const checkProximity = () => {
            if (!particleRef.current) return;
            const rect = particleRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dx = centerX - mousePos.x;
            const dy = centerY - mousePos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const threshold = 140;
            if (distance < threshold) {
                const force = (threshold - distance) / threshold;
                const repulsionX = (dx / distance) * 45 * force;
                const repulsionY = (dy / distance) * 45 * force;

                setOffset({ x: repulsionX, y: repulsionY });
                setIsNear(true);
            } else {
                setOffset({ x: 0, y: 0 });
                setIsNear(false);
            }
        };

        const frame = requestAnimationFrame(checkProximity);
        return () => cancelAnimationFrame(frame);
    }, [mousePos]);

    return (
        <div
            ref={particleRef}
            className="particle"
            style={{
                left: `${config.left}%`,
                top: `${config.initialTop}%`,
                width: `${config.size}px`,
                height: `${config.size}px`,
                animation: `floatParticle ${config.duration}s linear infinite`,
                animationDelay: `${config.delay}s`,
                background: isNear ? '#3b82f6' : 'rgba(255, 255, 255, 0.45)',
                boxShadow: isNear
                    ? '0 0 15px #3b82f6, 0 0 30px rgba(59, 130, 246, 0.2)'
                    : '0 0 8px rgba(255, 255, 255, 0.1)',
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${isNear ? 2.2 : 1})`,
                transition: 'transform 0.4s cubic-bezier(0.1, 0.8, 0.2, 1), background 0.3s, box-shadow 0.3s',
                opacity: isNear ? 1 : 0.6,
                zIndex: isNear ? 40 : 1
            }}
        />
    );
};

const SignUp = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accepted, setAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // OTP states
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email.trim()) {
            setError('Please enter your email to receive an OTP.');
            return;
        }

        setIsSendingOtp(true);
        try {
            const res = await fetch('https://sri-vinayaga-enterprises.onrender.com/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('OTP sent to your email!');
                setOtpSent(true);
            } else {
                setError(data.error || 'Failed to send OTP.');
            }
        } catch (err) {
            setError('Could not connect to backend server. Is it running?');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!firebaseAuth) {
            setError('Authentication service is currently unavailable. Please refresh.');
            return;
        }

        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
            setError('All fields are required.');
            return;
        }

        if (!otpSent || !otp.trim()) {
            setError('Please send and enter the OTP.');
            return;
        }

        if (!accepted) {
            setError('Please accept the Terms & Conditions');
            return;
        }

        setIsSubmitting(true);
        try {
            // Verify OTP via Backend
            const res = await fetch('https://sri-vinayaga-enterprises.onrender.com/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();

            if (!res.ok) {
                // Return an error to stop execution; removing "Firebase:" logic temporarily for generic errors
                throw new Error(data.error || 'Invalid OTP');
            }

            // OTP verified, now create in Firebase
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`
            });

            // Create User Document in Firestore (Requirement 4 & 6)
            const { db } = await import('../firebase');
            const { doc, setDoc } = await import('firebase/firestore');
            await setDoc(doc(db, "users", user.uid), {
                name: `${firstName} ${lastName}`,
                email: email,
                phone: '',
                address: '',
                dob: '',
                district: '',
                country: '',
                language: 'English',
                profilePhoto: '',
                createdAt: new Date().toISOString()
            });

            setSuccess('Registration successful! Redirecting to login page...');
            setTimeout(() => navigate('/login'), 2000);

        } catch (err) {
            console.error("Signup Error:", err);
            const message = err.message.replace('Firebase:', '').trim();
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Try logging in.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError(message || 'Registration failed.');
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
            className="min-h-screen flex items-center justify-center relative overflow-hidden deep-space-bg py-10 px-4"
        >
            <CSSParticles />
            <div className="signup-container">
                <div className="signup-left">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2>Create your<br />Account</h2>
                    </motion.div>
                </div>

                <div className="signup-right">
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h1>Sign Up</h1>

                        {error && (
                            <motion.div
                                initial={{ x: -4, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-xl mb-6 text-center animate-shake"
                            >
                                {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-green-500/10 border border-green-500/50 text-green-500 text-xs p-3 rounded-xl mb-6 text-center"
                            >
                                <CheckCircle size={14} className="inline mr-2 mb-0.5" />
                                {success}
                            </motion.div>
                        )}

                        <form className="signup-form" onSubmit={handleJoin}>
                            <div className="input-row">
                                <input
                                    type="text"
                                    placeholder="First name"
                                    className="signup-input"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Last name"
                                    className="signup-input"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>

                            <input
                                type="email"
                                placeholder="Email address"
                                className="signup-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <button
                                type="button"
                                className="join-btn"
                                style={{ marginBottom: '16px', background: otpSent ? '#4b5563' : undefined }}
                                onClick={handleSendOtp}
                                disabled={isSendingOtp}
                            >
                                {isSendingOtp ? "Sending OTP..." : (otpSent ? "Resend OTP" : "Send OTP to Email")}
                            </button>

                            {otpSent && (
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    className="signup-input"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength="6"
                                />
                            )}

                            <input
                                type="password"
                                placeholder="Password"
                                className="signup-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={accepted}
                                    onChange={(e) => setAccepted(e.target.checked)}
                                />
                                Accept Terms & Conditions
                            </label>

                            <button type="submit" className="join-btn" disabled={isSubmitting || !otpSent}>
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>Verify OTP & Join us <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>

                        <div className="divider">or</div>

                        <div className="social-btns">
                            <button className="social-btn">
                                <GoogleIcon />
                                Sign up with Google
                            </button>

                        </div>

                        <p className="mt-8 text-center text-sm font-bold text-gray-500">
                            Already have an account? <Link to="/login" className="text-black hover:underline ml-1">Log In</Link>
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="absolute bottom-3 text-center w-full">
                <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                    <ChevronRight size={14} className="rotate-180" />
                    BACK TO HOME
                </Link>
            </div>
        </motion.div>
    );
};

export default SignUp;
