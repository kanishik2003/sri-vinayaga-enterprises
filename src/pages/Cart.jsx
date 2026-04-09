import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard, PackageCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Cart = ({ isLoggedIn, currentUser }) => {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    useEffect(() => {
        const loadCart = () => {
            const items = JSON.parse(localStorage.getItem('cart') || '[]');
            setCart(items);
        };
        loadCart();
        window.addEventListener('cartUpdated', loadCart);
        return () => window.removeEventListener('cartUpdated', loadCart);
    }, []);

    const updateQuantity = (id, delta) => {
        const newCart = cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        });
        saveCart(newCart);
    };

    const removeItem = (id) => {
        const newCart = cart.filter(item => item.id !== id);
        saveCart(newCart);
    };

    const saveCart = (newCart) => {
        localStorage.setItem('cart', JSON.stringify(newCart));
        setCart(newCart);
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const total = cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * item.quantity), 0);

    const handleCheckout = () => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        navigate('/checkout');
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#02060c] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={64} className="text-brand-blue mb-6" />
                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Access Denied</h1>
                <p className="text-slate-400 mb-8 max-w-md">Please login to access your shopping cart and architectural registry.</p>
                <button onClick={() => navigate('/login')} className="px-10 py-4 bg-brand-blue text-white font-bold rounded-2xl shadow-xl hover:bg-brand-blue-dark transition-all">Login Now</button>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-slate-50 pt-48 pb-20 px-6 md:px-12 relative overflow-hidden font-sans">
            {/* ── Background Design (Matching Orders Style) ── */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.4]"
                    style={{ 
                        backgroundImage: `linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)`,
                        backgroundSize: '50px 50px' 
                    }} />
                
                {/* Floating Geometric Shapes */}
                <div className="absolute top-[20%] left-[5%] w-64 h-64 border-[1px] border-brand-blue/20 rounded-full" />
                <div className="absolute bottom-[20%] right-[2%] w-96 h-96 border-[1px] border-brand-blue/20 rotate-45" />
                <div className="absolute top-[60%] left-[-10%] w-[500px] h-[500px] bg-brand-blue/[0.02] blur-[100px] rounded-full" />
            </div>
            
            <div className="max-w-5xl mx-auto relative z-10">
                <button onClick={() => navigate('/products')} className="flex items-center gap-2 text-slate-400 hover:text-brand-blue transition-colors mb-8 group uppercase text-[10px] font-black tracking-widest">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Products
                </button>

                <div className="flex items-center gap-4 mb-16">
                    <div className="w-16 h-16 bg-brand-blue/20 border border-brand-blue/30 rounded-[1.5rem] flex items-center justify-center text-brand-blue shadow-2xl">
                        <ShoppingCart size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-brand-blue leading-none">Your <span className="text-slate-900">Cart</span></h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">{cart.length} items in your registry</p>
                    </div>
                </div>

                {orderSuccess ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border border-emerald-500/20 rounded-[3rem] p-16 text-center shadow-2xl shadow-emerald-500/10">
                        <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40">
                            <PackageCheck size={48} />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 italic uppercase mb-4">Order Successful!</h2>
                        <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs">Our team will verify your architectural request shortly.</p>
                        <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-widest">Redirecting to order history...</p>
                    </motion.div>
                ) : cart.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-[3rem] p-20 text-center shadow-2xl">
                        <div className="w-24 h-24 bg-slate-50 border border-slate-200 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                            <ShoppingCart size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-400 uppercase italic mb-8">Registry is Empty</h2>
                        <button onClick={() => navigate('/products')} className="px-12 py-5 bg-brand-blue text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-brand-blue-dark transition-all shadow-xl">Start Browsing</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-8">
                            {cart.map((item) => (
                                <motion.div layout key={item.id} className="bg-white/70 backdrop-blur-2xl border border-white rounded-[3rem] p-10 flex gap-8 items-center group transition-all hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border-b-slate-200">
                                    <div className="w-32 h-32 rounded-3xl overflow-hidden shrink-0 border border-slate-100 shadow-sm bg-white p-2">
                                        <img src={item.imageUrl} alt={item.graniteName} className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-md mb-1 inline-block">{item.category}</span>
                                                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{item.graniteName}</h3>
                                            </div>
                                            <button onClick={() => removeItem(item.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-slate-900 text-xl font-black italic">{item.price ? `₹${Number(item.price).toLocaleString()}` : "Price TBD"} <span className="text-[10px] text-slate-400 font-bold uppercase">/ {item.priceUnit || 'sft'}</span></p>
                                            <div className="flex items-center gap-4 bg-slate-50 rounded-2xl px-4 py-2 border border-slate-100 shadow-inner">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-brand-blue transition-colors px-1"><Minus size={16} /></button>
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 1;
                                                        const newCart = cart.map(c => c.id === item.id ? { ...c, quantity: Math.max(1, val) } : c);
                                                        saveCart(newCart);
                                                    }}
                                                    className="bg-transparent text-slate-900 font-black w-14 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-sm"
                                                />
                                                <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-brand-blue transition-colors px-1"><Plus size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/80 backdrop-blur-3xl border border-white rounded-[3.5rem] p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col items-center border-b-slate-200 sticky top-48">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2" />
                                
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10 flex items-center gap-3 self-start">
                                    Financial Ledger
                                </h3>
                                
                                <div className="w-full space-y-6 mb-10">
                                    <div className="flex justify-between text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                        <span>Registry subtotal</span>
                                        <span className="text-slate-900">₹{total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                        <span>Dispatch logistics</span>
                                        <span className="text-brand-blue italic">SVGE COVERED</span>
                                    </div>
                                    <div className="flex justify-between items-baseline border-t border-slate-100 pt-6">
                                        <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest">Net valuation</span>
                                        <span className="text-4xl font-black text-slate-900 italic tracking-tighter">₹{total.toLocaleString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut}
                                    className="w-full py-5 bg-brand-blue text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-brand-blue-dark transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isCheckingOut ? (
                                        "VERIFYING TRANSACTION..."
                                    ) : (
                                        <>
                                            <CreditCard size={18} /> Confirm Order
                                        </>
                                    )}
                                </button>
                                <p className="text-[8px] text-slate-600 text-center mt-6 uppercase font-bold tracking-[0.2em]">
                                    By confirming, you agree to our <br /> architectural dispatch terms.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Cart;
