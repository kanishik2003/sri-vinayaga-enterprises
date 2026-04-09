import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Scissors,
    Globe,
    Phone,
    Mail,
    MapPin,
    ChevronRight,
    TrendingUp,
    Award,
    Users,
    Warehouse,
    ArrowRight,
    Star,
    Zap,
    Cpu,
    Send,
    Linkedin,
    Twitter,
    Github,
    Search,
    Maximize2,
    X,
    Headphones,
    ShoppingCart,
    Package
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import ChatBot from '../components/ChatBot/ChatBot';
import AdminChatBot from '../components/ChatBot/AdminChatBot';
import './Home.css';

// --- Custom Hooks ---

const useMagnetic = () => {
    const ref = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        setPosition({ x: dx * 0.2, y: dy * 0.2 });
    };

    const reset = () => setPosition({ x: 0, y: 0 });

    return { ref, position, handleMouseMove, reset };
};

const useCounter = (end, duration = 2000, trigger = false) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!trigger) return;
        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [end, duration, trigger]);

    return count;
};

// --- Sub-Components ---

const Typewriter = ({ texts, delay = 3000 }) => {
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);

    useEffect(() => {
        if (subIndex === texts[index].length + 1 && !reverse) {
            setReverse(true);
            return;
        }
        if (subIndex === 0 && reverse) {
            setReverse(false);
            setIndex((prev) => (prev + 1) % texts.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, reverse ? 75 : 150);

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse, texts]);

    return <span>{texts[index].substring(0, subIndex)}</span>;
};

const StarCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let animFrameId;
        let stars = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            initStars();
        };

        const initStars = () => {
            stars = [];
            const count = Math.floor((canvas.width * canvas.height) / 2000);
            for (let i = 0; i < count; i++) {
                const layer = i % 3; // 0=back, 1=mid, 2=front
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: layer === 0 ? Math.random() * 0.6 + 0.2 : layer === 1 ? Math.random() * 1 + 0.6 : Math.random() * 1.5 + 1,
                    opacity: Math.random(),
                    opacityDir: Math.random() > 0.5 ? 1 : -1,
                    blinkSpeed: layer === 0 ? Math.random() * 0.003 + 0.001 : layer === 1 ? Math.random() * 0.005 + 0.003 : Math.random() * 0.008 + 0.005,
                    drift: (Math.random() - 0.5) * (layer === 0 ? 0.04 : layer === 1 ? 0.08 : 0.14),
                    color: Math.random() > 0.85 ? '#7eceff' : '#ffffff',
                    glow: layer === 2 && Math.random() > 0.6,
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach(s => {
                s.opacity += s.blinkSpeed * s.opacityDir;
                if (s.opacity >= 1) { s.opacity = 1; s.opacityDir = -1; }
                if (s.opacity <= 0.05) { s.opacity = 0.05; s.opacityDir = 1; }
                s.x += s.drift;
                if (s.x < 0) s.x = canvas.width;
                if (s.x > canvas.width) s.x = 0;

                ctx.save();
                if (s.glow) {
                    ctx.shadowColor = s.color;
                    ctx.shadowBlur = 8;
                }
                ctx.globalAlpha = s.opacity;
                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            animFrameId = requestAnimationFrame(draw);
        };

        resize();
        draw();
        window.addEventListener('resize', resize);
        return () => {
            cancelAnimationFrame(animFrameId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    );
};

const Hero = ({ currentUser }) => {
    const magnetic1 = useMagnetic();
    const magnetic2 = useMagnetic();

    return (
        <section
            className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at 50% 40%, #0d2040 0%, #081525 40%, #040c14 100%)' }}
        >
            <StarCanvas />
            <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >

                    <h1 className="mb-12 tracking-tighter leading-none">
                        {currentUser ? (
                            <div className="flex flex-col items-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8 }}
                                    className="flex flex-wrap items-center justify-center gap-x-4 mb-2"
                                >
                                    <span className="welcome-cursive">Welcome,</span>
                                    <span className="user-name-gradient">{currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}!</span>
                                </motion.div>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.8 }}
                                    className="delighted-text"
                                >
                                    We're delighted to have you at
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6, duration: 0.8 }}
                                    className="company-title-main"
                                >
                                    SRI VINAYAGA <br /> ENTERPRISES
                                </motion.div>

                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8 }}
                                    className="flex flex-wrap items-center justify-center gap-x-4 mb-2"
                                >
                                    <span className="welcome-cursive">Welcome to</span>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4, duration: 0.8 }}
                                    className="company-title-main user-name-gradient"
                                >
                                    SRI VINAYAGA <br /> ENTERPRISES
                                </motion.div>

                            </div>
                        )}
                    </h1>


                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
                        {currentUser ? (
                            <>
                                <motion.button
                                    ref={magnetic1.ref}
                                    onMouseMove={magnetic1.handleMouseMove}
                                    onMouseLeave={magnetic1.reset}
                                    animate={{ x: magnetic1.position.x, y: magnetic1.position.y }}
                                    onClick={() => navigate('/orders')}
                                    className="w-full sm:w-auto px-10 py-5 bg-white text-black font-bold rounded-2xl shadow-2xl flex items-center justify-center gap-3 group shimmer-effect overflow-hidden relative"
                                >
                                    <Package size={20} />
                                    My Orders
                                </motion.button>
                                <motion.button
                                    ref={magnetic2.ref}
                                    onMouseMove={magnetic2.handleMouseMove}
                                    onMouseLeave={magnetic2.reset}
                                    animate={{ x: magnetic2.position.x, y: magnetic2.position.y }}
                                    className="w-full sm:w-auto px-10 py-5 glass glass-lift border-white/30 text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-white transition-all shadow-xl"
                                    onClick={() => navigate('/cart')}
                                >
                                    <ShoppingCart size={20} className="text-brand-blue" />
                                    View Cart
                                </motion.button>
                            </>
                        ) : (
                            <>
                                <motion.button
                                    ref={magnetic1.ref}
                                    onMouseMove={magnetic1.handleMouseMove}
                                    onMouseLeave={magnetic1.reset}
                                    animate={{ x: magnetic1.position.x, y: magnetic1.position.y }}
                                    onClick={() => navigate('/products')}
                                    className="w-full sm:w-auto px-10 py-5 bg-white text-black font-bold rounded-2xl shadow-2xl flex items-center justify-center gap-3 group shimmer-effect overflow-hidden relative"
                                >
                                    Browse Collection
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </motion.button>

                                <motion.button
                                    ref={magnetic2.ref}
                                    onMouseMove={magnetic2.handleMouseMove}
                                    onMouseLeave={magnetic2.reset}
                                    animate={{ x: magnetic2.position.x, y: magnetic2.position.y }}
                                    className="w-full sm:w-auto px-10 py-5 glass glass-lift border-white/30 text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-white transition-all shadow-xl"
                                    onClick={() => window.location.href = '/login'}
                                >
                                    <MessageSquare size={20} className="text-brand-blue" />
                                    Login to Access AI Chat
                                </motion.button>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>


        </section>
    );
};

const ProductCard = ({ name, price, image, category, color, dimensions, onViewDetails }) => {
    // --- COLOR CONFIG FOR BADGE ---
    const badgeStyle = {
        color: '#00FF54', // NEW VIBRANT GREEN FOR SLAB
        backgroundColor: 'rgba(0, 255, 84, 0.1)',
        borderColor: 'rgba(0, 255, 84, 0.2)'
    };
    // ------------------------------

    return (
        <div className="flip-card h-[450px]">
            <div className="flip-card-inner">
                {/* FRONT SIDE */}
                <div className="flip-card-front relative shadow-2xl group cursor-pointer border border-white/5">
                    <img src={image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-slate via-transparent to-transparent opacity-80"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-12 h-12 rounded-full glass border-white/30 flex items-center justify-center text-black scale-50 group-hover:scale-100 transition-transform shadow-xl">
                            <Maximize2 size={24} />
                        </div>
                    </div>
                    <div className="absolute bottom-8 left-8 text-left">
                        <span
                            style={badgeStyle}
                            className="text-[10px] uppercase font-bold tracking-widest py-1 px-2 mb-2 inline-block border rounded-md"
                        >
                            {category}
                        </span>
                        <h3 className="text-2xl font-bold text-white">{name}</h3>
                    </div>
                </div>

                {/* BACK SIDE */}
                <div className="flip-card-back glass p-10 flex flex-col justify-center items-center text-center shadow-2xl border-white/30 text-brand-slate">
                    <Warehouse size={48} className="text-brand-blue mb-6" />
                    <h3 className="text-3xl font-bold mb-2">{name}</h3>
                    <p className="text-brand-blue text-xl font-bold mb-6">{price}</p>

                    <button
                        onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                        className="w-full py-4 bg-black text-white font-bold rounded-xl transition-all shadow-xl hover:bg-gray-900 uppercase text-[10px] tracking-widest"
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProductDetailsModal = ({ product, onClose, isLoggedIn }) => {
    if (!product) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 z-20 p-3 bg-white/20 hover:bg-white/40 text-white md:text-slate-400 md:hover:bg-slate-100 rounded-full transition-all">
                    <X size={24} />
                </button>

                {/* Left Side: Image Gallery Style */}
                <div className="md:w-1/2 relative bg-slate-100 min-h-[400px]">
                    <img src={product.imageUrl} alt={product.graniteName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
                </div>

                {/* Right Side: Details */}
                <div className="md:w-1/2 p-10 md:p-14 overflow-y-auto">
                    <div className="mb-8">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-3 inline-block px-3 py-1 bg-cyan-50 border border-cyan-100 rounded-lg">
                            {product.category}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-4">
                            {product.graniteName}
                        </h2>
                        <p className="text-3xl font-bold text-slate-900">
                            ₹{product.price} <span className="text-sm font-normal text-slate-400">/ {product.priceUnit || 'sft'}</span>
                        </p>
                        <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase tracking-widest">
                            Stock: {product.stockQuantity || 'Contact Owner'}
                        </p>
                    </div>

                    {product.options && product.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 mb-12">
                            {product.options.map((opt, i) => (
                                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">{opt.key}</span>
                                    <span className="text-sm font-bold text-slate-900 uppercase italic">{opt.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mb-12">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-3">
                            <ArrowRight size={14} className="text-cyan-500" /> Technical Description
                        </h4>
                        <p className="text-slate-600 text-lg leading-relaxed font-medium">
                            {product.description || "This premium natural stone slab has been meticulously verified by our digital inspection AI. Our Signature Registry ensures only the highest quality architectural components are made available for our elite clientele."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100">
                        {isLoggedIn ? (
                            <button 
                                onClick={(e) => {
                                    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                                    const existing = cart.find(item => item.id === product.id);
                                    if (existing) {
                                        existing.quantity += 1;
                                    } else {
                                        cart.push({ ...product, quantity: 1 });
                                    }
                                    localStorage.setItem('cart', JSON.stringify(cart));
                                    window.dispatchEvent(new Event('cartUpdated'));
                                    
                                    const btn = e.currentTarget;
                                    const original = btn.innerHTML;
                                    btn.innerHTML = 'Added!';
                                    btn.style.backgroundColor = '#10b981';
                                    btn.style.color = 'white';
                                    setTimeout(() => {
                                        btn.innerHTML = original;
                                        btn.style.backgroundColor = '';
                                        btn.style.color = '';
                                    }, 2000);
                                }}
                                className="flex-1 py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-cyan-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={16} /> Add to Cart
                            </button>
                        ) : (
                            <button 
                                onClick={() => window.location.href = '/login'} 
                                className="flex-1 py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-cyan-600 transition-all shadow-xl shadow-slate-900/10"
                            >
                                Login to Add to Cart
                            </button>
                        )}
                        <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-600 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-slate-200 transition-all">
                            Back to Gallery
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const ProductGallery = ({ onViewDetails }) => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "products"),
            orderBy("createdAt", "desc"),
            limit(6)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <section id="products" className="py-16 px-6 md:px-12 bg-brand-slate relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col items-center justify-center mb-12 gap-8">
                    <div className="w-full">
                        <div className="section-title-wrapper">
                            <h2 className="bg-watermark">PRODUCTS</h2>
                            <h3 className="fg-title">Our Products</h3>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-white/20 font-bold uppercase tracking-[0.5em] text-xs animate-pulse">
                        Synchronizing Stones...
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {products.map((p) => (
                                <ProductCard
                                    key={p.id}
                                    name={p.graniteName}
                                    price={p.price == null ? 'Contact Owner' : `₹${p.price}/ ${p.priceUnit || 'sft'}`}
                                    image={p.imageUrl}
                                    category={p.category}
                                    onViewDetails={() => onViewDetails(p)}
                                />
                            ))}
                        </div>
                        <div className="flex justify-center mt-16">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/products')}
                                className="px-10 py-4 glass border-white/20 text-white font-bold rounded-2xl flex items-center gap-3 hover:bg-white hover:text-black transition-all shadow-xl uppercase tracking-widest text-[10px]"
                            >
                                View All Products
                                <ArrowRight size={18} />
                            </motion.button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

const ServiceCard = ({ icon: Icon, title, desc, gradient }) => (
    <div className="p-10 glass glass-lift rounded-3xl border-white/30 group hover:bg-white transition-all duration-500 overflow-hidden relative shadow-xl">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
        <div className="text-brand-blue mb-8 w-16 h-16 bg-white rounded-2xl flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-md border border-gray-100">
            <Icon size={32} />
        </div>
        <h3 className="text-2xl font-bold text-black mb-4">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-8">{desc}</p>
        <div className="flex items-center gap-2 text-brand-blue text-xs font-bold uppercase tracking-widest group-hover:translate-x-2 transition-all duration-500">
            Learn More <ChevronRight size={14} />
        </div>
    </div>
);

const Services = () => (
    <section id="services" className="py-32 px-6 md:px-12 bg-brand-slate-light border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ServiceCard
                icon={MessageSquare}
                title="AI Chat Protocol"
                desc="24/7 autonomous support for technical specs, pricing, and live stock updates."
                gradient="from-blue-500 to-cyan-500"
            />
            <ServiceCard
                icon={Scissors}
                title="Custom Atelier"
                desc="Precision-engineered fabrication facility with sub-millimeter edge detailing."
                gradient="from-emerald-500 to-teal-500"
            />
            <ServiceCard
                icon={Globe}
                title="Global Logistics"
                desc="Intermodal shipping solutions reaching architectural sites across 50+ nations."
                gradient="from-purple-500 to-indigo-500"
            />
            <ServiceCard
                icon={Cpu}
                title="Smart Inventory"
                desc="Digital twin mapping for every slab in our stock, available in live previews."
                gradient="from-orange-500 to-pink-500"
            />
        </div>
    </section>
);


const Footer = () => (
    <footer id="contact" className="relative pt-32 pb-12 px-6 md:px-12 bg-brand-slate border-t border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 mb-24">
                <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-8 group cursor-pointer font-bold uppercase tracking-tighter text-white">
                        <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-xl shadow-brand-blue/20">
                            <Warehouse size={20} />
                        </div>
                        <span className="text-2xl font-extrabold tracking-[0.2em] font-display">SVGE</span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mb-8">
                        Integrating natural craftsmanship with autonomous engineering. Global leaders in premium stone architectural solutions.
                    </p>
                    <div className="flex gap-4">
                        {[Linkedin, Twitter, Github].map((Icon, i) => (
                            <a key={i} href="#" className="w-10 h-10 rounded-full glass border-white/30 flex items-center justify-center text-black hover:bg-white transition-all transform hover:-translate-y-1 shadow-lg">
                                <Icon size={18} />
                            </a>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-10">Navigation</h4>
                    <ul className="space-y-4 text-sm text-gray-500 font-bold uppercase tracking-widest overflow-hidden">
                        {['Home', 'Products', 'Calculator'].map(item => (
                            <li key={item} className="hover:text-brand-blue transition-all cursor-pointer transform hover:translate-x-2">
                                <a href={item === 'Home' ? '/' : `/${item.toLowerCase()}`} className="block w-full">{item}</a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-10">Communications</h4>
                    <div className="space-y-6 text-sm text-gray-400 font-medium">
                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-brand-blue transition-all group-hover:bg-brand-blue group-hover:text-white">
                                <Phone size={14} />
                            </div>
                            <span>+91 75300 17411</span>
                        </div>
                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-brand-blue transition-all group-hover:bg-brand-blue group-hover:text-white">
                                <Mail size={14} />
                            </div>
                            <span>appavum73@gmail.com</span>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-brand-blue shrink-0">
                                <MapPin size={14} />
                            </div>
                            <span className="leading-relaxed text-sm">
                                Flat No.:2/1G, PANANGADU,<br />
                                REDDIYUR, SALEM<br />
                                PIN Code: 636004
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">
                <div className="flex flex-col gap-1">
                    <span>© 2026 SRI VINAYAGA ENTERPRISES</span>
                    <span className="text-gray-500">Owned by: M.Appavu</span>
                </div>
                <div className="flex gap-10">
                    <a href="#" className="hover:text-brand-blue transition-colors">Privacy</a>
                    <a href="#" className="hover:text-brand-blue transition-colors">Compliance</a>
                    <a href="#" className="hover:text-brand-blue transition-colors">Terms</a>
                </div>
            </div>
        </div>
    </footer>
);



const StickyActions = ({ onOpenChat, onOpenAdminChat, currentUser }) => {
    const navigate = useNavigate();
    
    if (!currentUser) return null;

    return (
        <div className="fixed bottom-10 right-10 z-[1000] flex flex-col gap-4">
            <motion.button
                whileHover={{ scale: 1.1, rotate: -12 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.4)] relative group"
                onClick={onOpenAdminChat}
            >
                <Headphones size={30} />
                <span className="absolute right-full mr-4 px-4 py-2 glass border-white/30 rounded-xl text-xs font-bold text-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl">Admin Message</span>
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.1, rotate: 12 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 bg-brand-blue text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(59,130,246,0.4)] relative group"
                onClick={onOpenChat}
            >
                <MessageSquare size={30} />
                <span className="absolute right-full mr-4 px-4 py-2 glass border-white/30 rounded-xl text-xs font-bold text-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl">AI Chat Bot</span>
            </motion.button>
        </div>
    );
};

const Home = ({ isLoggedIn, currentUser }) => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);

    const openChat = () => {
        setIsChatOpen(true);
    };

    const openAdminChat = () => {
        setIsAdminChatOpen(true);
    };

    useEffect(() => {
        const handleOpenChat = () => {
            setIsChatOpen(true);
        };
        window.addEventListener('open-ai-chat', handleOpenChat);
        return () => window.removeEventListener('open-ai-chat', handleOpenChat);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div className="fixed top-0 left-0 right-0 h-1 bg-brand-blue z-[200] origin-left" style={{ scaleX }} />
            <Hero currentUser={currentUser} />
            <ProductGallery onViewDetails={setSelectedProduct} />
            <Services />

            <AnimatePresence>
                {selectedProduct && (
                    <ProductDetailsModal
                        product={selectedProduct}
                        onClose={() => setSelectedProduct(null)}
                        isLoggedIn={isLoggedIn}
                    />
                )}
            </AnimatePresence>

            <Footer />
            <StickyActions onOpenChat={openChat} onOpenAdminChat={openAdminChat} currentUser={currentUser} />

            <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentUser={currentUser} />
            <AdminChatBot isOpen={isAdminChatOpen} onClose={() => setIsAdminChatOpen(false)} currentUser={currentUser} />

            {/* Persistent CTA Bar */}
            <div className="fixed bottom-0 left-0 w-full z-[150] md:hidden glass py-4 px-6 flex items-center justify-center border-t border-gray-200 backdrop-blur-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-brand-blue border border-gray-200">
                        <Phone size={16} />
                    </div>
                    <span className="text-black font-bold text-sm tracking-tighter uppercase">+91 7530017411</span>
                </div>
            </div>
        </motion.div>
    );
};

export default Home;
