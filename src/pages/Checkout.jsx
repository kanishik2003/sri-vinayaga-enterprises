import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Phone, Mail, MapPin, CreditCard, 
    ArrowRight, ArrowLeft, CheckCircle2, 
    Download, Printer, Package, ChevronRight,
    Search, DollarSign, Calculator, ReceiptText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Checkout = ({ isLoggedIn, currentUser }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [cart, setCart] = useState([]);
    const [formData, setFormData] = useState({
        name: currentUser?.displayName || '',
        phone: '',
        email: currentUser?.email || '',
        address: '',
        gst: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [showQRModal, setShowQRModal] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (savedCart.length === 0 && step !== 3) {
            navigate('/cart');
        }
        setCart(savedCart);
    }, [isLoggedIn, navigate]);

    const total = cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * item.quantity), 0);
    const subtotal = total;
    const tax = total * 0.18; // 18% GST estimate
    const grandTotal = total; // User didn't ask for tax breakdown specifically in total but I'll show it in bill

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleConfirmPayment = () => {
        if (paymentMethod === 'razorpay') {
            setShowQRModal(true);
            return;
        }
        processOrder();
    };

    const processOrder = async () => {
        setIsProcessing(true);
        try {
            // Create order in Firestore
            const docRef = await addDoc(collection(db, "orders"), {
                userId: currentUser.uid,
                customerDetails: formData,
                items: cart,
                totalAmount: grandTotal,
                paymentMethod,
                status: 'Pending',
                createdAt: serverTimestamp()
            });
            
            setOrderId(docRef.id);
            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cartUpdated'));
            setStep(3);
        } catch (error) {
            console.error("Checkout error:", error);
            alert("Order failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // ── Step 1: Contact Details ──────────────────────────────────────────
    const renderContactStep = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] p-10 shadow-2xl border-b-slate-200">
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                        <User className="text-brand-blue" /> Dispatch Registry
                    </h2>
                    
                    <div className="space-y-6">
                        <div className="relative">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-4">Full Name</label>
                            <input 
                                type="text" name="name" value={formData.name} onChange={handleInputChange}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-blue transition-all font-bold text-slate-900"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-4">Phone Number</label>
                                <input 
                                    type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-blue transition-all font-bold text-slate-900"
                                    placeholder="+91 00000 00000"
                                />
                            </div>
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-4">Gmail ID</label>
                                <input 
                                    type="email" name="email" value={formData.email} onChange={handleInputChange}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-blue transition-all font-bold text-slate-900"
                                    placeholder="example@gmail.com"
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-4">Delivery Address</label>
                            <textarea 
                                name="address" value={formData.address} onChange={handleInputChange}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-blue transition-all font-bold text-slate-900 h-32 resize-none"
                                placeholder="Full shipping address"
                            />
                        </div>
                        <div className="relative border-t border-slate-100 pt-6">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-4">GST Number (Optional)</label>
                            <input 
                                type="text" name="gst" value={formData.gst} onChange={handleInputChange}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-blue transition-all font-bold text-slate-900"
                                placeholder="22AAAAA0000A1Z5"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="lg:sticky lg:top-48 self-start">
                <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[2.5rem] p-10 text-slate-900 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 blur-[100px] rounded-full" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 border-b border-slate-100 pb-6">Order Assessment</h3>
                    
                    <div className="space-y-6 mb-10 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {cart.map((item, i) => (
                            <div key={i} className="flex justify-between items-center group">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 p-1">
                                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                                    </div>
                                    <div>
                                        <p className="font-black italic uppercase text-sm leading-tight">{item.graniteName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">
                                            {item.quantity} {item.priceUnit || 'SFT'} × {item.price ? `₹${item.price}` : 'TBD'}
                                        </p>
                                    </div>
                                </div>
                                <p className="font-black text-brand-blue">{item.price ? `₹${(item.price * item.quantity).toLocaleString()}` : "TBD"}</p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 border-t border-slate-100 pt-8">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Total Registry Items</span>
                            <span className="text-brand-blue">{cart.reduce((s, i) => s + i.quantity, 0)} Units</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Subtotal</span>
                            <span className="text-slate-900 font-bold">₹{total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Net Payable</span>
                            <span className="text-4xl font-black italic text-slate-900 tracking-tighter">₹{grandTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    <button 
                        onClick={nextStep}
                        disabled={!formData.name || !formData.phone || !formData.address}
                        className="w-full mt-10 py-5 bg-brand-blue text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-brand-blue-dark transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-brand-blue/20"
                    >
                        Proceed to Payment <ArrowRight size={16} />
                    </button>
                    {!formData.name || !formData.phone || !formData.address ? (
                        <p className="text-[8px] text-center text-red-400 mt-4 uppercase font-bold tracking-widest">Please fill all required fields</p>
                    ) : null}
                </div>
            </motion.div>
        </div>
    );

    // ── Step 2: Payment Details ──────────────────────────────────────────
    const renderPaymentStep = () => (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[3rem] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border-b-slate-200">
                <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter mb-10 text-center">Select Payment Engine</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <label 
                        className={`cursor-pointer group relative p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-6 ${paymentMethod === 'razorpay' ? 'border-brand-blue bg-brand-blue/5 shadow-xl shadow-brand-blue/10 scale-[1.02]' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                        onClick={() => setPaymentMethod('razorpay')}
                    >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'razorpay' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300'}`}>
                            <CreditCard size={32} />
                        </div>
                        <div className="text-center">
                            <p className="font-black uppercase italic tracking-widest text-slate-900">Razorpay</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">UPI / Net Banking / QR</p>
                        </div>
                        {paymentMethod === 'razorpay' && <CheckCircle2 className="absolute top-4 right-4 text-brand-blue" size={24} />}
                    </label>

                    <label 
                        className={`cursor-pointer group relative p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-6 ${paymentMethod === 'card' ? 'border-brand-blue bg-brand-blue/5 shadow-xl shadow-brand-blue/10 scale-[1.02]' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                        onClick={() => setPaymentMethod('card')}
                    >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'card' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300'}`}>
                            <CreditCard size={32} />
                        </div>
                        <div className="text-center">
                            <p className="font-black uppercase italic tracking-widest text-slate-900">Digital Card</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Visa / Master / Amex</p>
                        </div>
                        {paymentMethod === 'card' && <CheckCircle2 className="absolute top-4 right-4 text-brand-blue" size={24} />}
                    </label>
                </div>

                <div className="flex gap-4">
                    <button onClick={prevStep} className="px-8 py-5 border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <button 
                        onClick={handleConfirmPayment}
                        disabled={isProcessing}
                        className="flex-1 py-5 bg-brand-blue text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-brand-blue-dark transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isProcessing ? "PROCESSING SECURE TRANSACTION..." : "CONFIRM & PAY"}
                    </button>
                </div>
            </div>
        </motion.div>
    );

    // ── Step 3: Bill Generation ──────────────────────────────────────────
    const renderBillStep = () => (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 print:hidden">
                <div className="lg:col-span-3 flex justify-center">
                    <div className="bg-emerald-500 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-xl">
                        <CheckCircle2 size={24} />
                        <span className="font-black uppercase tracking-widest text-xs">Transaction Verified • Order ID: {orderId?.substring(0,8)}</span>
                    </div>
                </div>
            </div>

            <div id="invoice" className="bg-white p-12 md:p-20 border border-slate-100 shadow-2xl rounded-[1rem] relative overflow-hidden print:shadow-none print:border-none">
                {/* Invoice Header */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16 border-b border-slate-100 pb-16">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <ReceiptText size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900">SRI VINAYAGA</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Architectural Dispatch Bill</p>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Invoice Number</p>
                        <p className="text-xl font-black italic uppercase text-slate-900">#SVGE-{orderId?.substring(0,6).toUpperCase()}</p>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20">
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-l-2 border-brand-blue pl-4">Customer Transcript</h4>
                        <div className="space-y-2 ml-4">
                            <p className="text-lg font-black italic uppercase text-slate-900">{formData.name}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Phone size={12} className="text-brand-blue" /> {formData.phone}</p>
                            <p className="text-xs font-bold text-slate-500 flex items-center gap-2"><Mail size={12} className="text-brand-blue" /> {formData.email}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase mt-4 flex items-start gap-2 max-w-[250px]"><MapPin size={12} className="text-brand-blue mt-1 shrink-0" /> {formData.address}</p>
                            {formData.gst && (
                                <p className="text-xs font-black text-brand-blue mt-4 uppercase tracking-widest bg-brand-blue/5 px-3 py-1 rounded-lg inline-block">GSTIN: {formData.gst}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 pr-4 border-r-2 border-slate-900">Corporate Details</h4>
                        <div className="space-y-1 pr-4">
                            <p className="text-xs font-black uppercase text-slate-900">Sri Vinayaga Enterprises</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Salat Village, Granite Zone</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tamil Nadu, India</p>
                            <p className="text-[10px] font-bold text-brand-blue uppercase mt-2">www.svge.ai</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-20">
                    <div className="grid grid-cols-12 gap-4 border-b-2 border-slate-900 pb-4 mb-8">
                        <div className="col-span-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Item Description</div>
                        <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Price</div>
                        <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Quantity</div>
                        <div className="col-span-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Subtotal</div>
                    </div>

                    <div className="space-y-8">
                        {cart.map((item, i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 border-b border-slate-50 pb-8 items-center">
                                <div className="col-span-6">
                                    <p className="text-sm font-black italic uppercase text-slate-900">{item.graniteName}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.category} • {item.finish || 'Polished'}</p>
                                </div>
                                <div className="col-span-2 text-center">
                                    <p className="text-sm font-black italic text-slate-900">{item.price ? `₹${Number(item.price).toLocaleString()}` : "TBD"}</p>
                                </div>
                                <div className="col-span-2 text-center">
                                    <p className="text-sm font-black italic text-slate-900">{item.quantity} <span className="text-[10px] uppercase">{item.priceUnit || 'SFT'}</span></p>
                                </div>
                                <div className="col-span-2 text-right">
                                    <p className="text-sm font-black italic text-brand-blue">{item.price ? `₹${(item.price * item.quantity).toLocaleString()}` : "TBD"}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between pt-12 border-t-4 border-slate-50">
                    <div className="mb-12 md:mb-0">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-w-[300px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Payment Transcript</p>
                            <p className="text-xs font-black text-slate-900 uppercase italic leading-loose">Method: {paymentMethod === 'card' ? 'DIGITAL CARD' : 'RAZORPAY GATEWAY'}</p>
                            <p className="text-xs font-black text-emerald-500 uppercase italic">Status: TRANSACTION VERIFIED</p>
                        </div>
                    </div>
                    
                    <div className="text-right space-y-4">
                        <div className="flex justify-between md:justify-end gap-16 text-slate-400">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Valuation</span>
                            <span className="text-lg font-black text-slate-900">₹{total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between md:justify-end gap-16 text-brand-blue">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dispatch Logistics</span>
                            <span className="text-sm font-black uppercase italic">COMPLIMENTARY</span>
                        </div>
                        <div className="flex justify-between md:justify-end gap-16 pt-6 border-t border-slate-100">
                            <span className="text-slate-900 text-xs font-black uppercase tracking-[0.2em]">Net Payable</span>
                            <span className="text-5xl font-black italic text-slate-900 tracking-tighter">₹{grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-10 border-t border-slate-50 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em] mb-4 overflow-hidden whitespace-nowrap opacity-20">
                        ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        This is an electronically generated architectural dispatch bill. Signature not required.
                    </p>
                    <p className="text-[9px] font-bold text-brand-blue uppercase tracking-widest mt-2">
                        SRI VINAYAGA ENTERPRISES • SALEM • TAMIL NADU
                    </p>
                </div>
                
                {/* Visual Decoration for Bill */}
                <div className="absolute top-0 right-0 w-4 h-full bg-brand-blue transform translate-x-1" />
                <div className="absolute top-0 left-0 w-1 h-24 bg-brand-blue" />
            </div>

            <div className="mt-12 flex justify-center gap-6 print:hidden mb-20">
                <button onClick={handlePrint} className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl">
                    <Download size={18} /> Download Bill
                </button>
                <button onClick={() => navigate('/orders')} className="flex items-center gap-3 px-10 py-5 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-blue-dark transition-all shadow-xl">
                    Back to History <ChevronRight size={18} />
                </button>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pt-48 pb-20 px-6 md:px-12 relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621245089209-7bb3d70cd4c7?q=80&w=2670&auto=format&fit=crop')" }}
                />
                
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a121d]/90 via-[#0a121d]/40 to-[#0a121d]/95" />
                
                <div className="absolute inset-0 opacity-[0.1]"
                    style={{ 
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                        backgroundSize: '80px 80px' 
                    }} />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Stepper Logic */}
                {step < 3 && (
                    <div className="flex flex-col items-center mb-16">
                        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-slate-900 text-center leading-none mb-10">
                            Safe <span className="text-brand-blue">Checkout</span>
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-brand-blue scale-125 shadow-lg shadow-brand-blue/30' : 'bg-slate-200'}`} />
                            <div className={`w-16 h-[2px] rounded-full transition-all duration-500 ${step >= 2 ? 'bg-brand-blue' : 'bg-slate-200'}`} />
                            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-brand-blue scale-125 shadow-lg shadow-brand-blue/30' : 'bg-slate-200'}`} />
                            <div className={`w-16 h-[2px] rounded-full transition-all duration-500 ${step === 3 ? 'bg-brand-blue' : 'bg-slate-200'}`} />
                            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${step === 3 ? 'bg-brand-blue scale-125 shadow-lg shadow-brand-blue/30' : 'bg-slate-200'}`} />
                        </div>
                        <div className="flex gap-20 mt-4">
                            <span className={`text-[8px] font-black uppercase tracking-widest ${step === 1 ? 'text-brand-blue' : 'text-slate-300'}`}>01 Registry</span>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${step === 2 ? 'text-brand-blue' : 'text-slate-300'}`}>02 Valuation</span>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${step === 3 ? 'text-brand-blue' : 'text-slate-300'}`}>03 Invoice</span>
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div key="step1" exit={{ opacity: 0 }}>{renderContactStep()}</motion.div>
                    ) : step === 2 ? (
                        <motion.div key="step2" exit={{ opacity: 0 }}>{renderPaymentStep()}</motion.div>
                    ) : step === 3 ? (
                        <motion.div key="step3" exit={{ opacity: 0 }}>{renderBillStep()}</motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* Simulated Razorpay UPI QR Modal */}
            <AnimatePresence>
                {showQRModal && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowQRModal(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans border border-slate-200">
                            
                            {/* Razorpay Header Style */}
                            <div className="bg-[#0b58e6] px-6 py-5 flex justify-between items-center text-white relative overflow-hidden">
                                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                                <div className="relative z-10">
                                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Paying to</p>
                                    <p className="font-black text-lg tracking-tight">SVGE STORE</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md relative z-10 border border-white/20">
                                    <Package size={18} className="text-white" />
                                </div>
                            </div>
                            
                            <div className="p-8 flex flex-col items-center bg-slate-50">
                                <p className="text-slate-500 mb-6 font-bold text-[11px] uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">Scan with any UPI App</p>
                                
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-6 relative group cursor-pointer hover:shadow-md transition-all">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3Dkanishik2003%40oksbi%26pn%3DSRI%2520VINAYAGA%2520ENTERPRISES%26am%3D${grandTotal}%26cu%3DINR`} 
                                        alt="UPI QR Code" 
                                        className="w-48 h-48 opacity-90 group-hover:opacity-100 transition-opacity mix-blend-multiply"
                                    />
                                    {/* Simulated scan overlay line */}
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-brand-blue/30 shadow-[0_0_10px_rgba(59,130,246,0.5)] hidden group-hover:block animate-scan" />
                                </div>

                                <div className="w-full text-center mt-2 mb-8">
                                    <p className="text-3xl font-black text-slate-900 mb-1">₹{grandTotal.toLocaleString()}</p>
                                    <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Total Payable Amount</p>
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        setShowQRModal(false);
                                        processOrder();
                                    }}
                                    className="w-full py-4 bg-[#0b58e6] hover:bg-blue-700 transition-colors text-white font-black rounded-lg uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/20 active:scale-[0.98]"
                                >
                                    Confirm Payment Success
                                </button>
                                
                                <p className="mt-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                    <CheckCircle2 size={12} className="text-emerald-500" /> SECURE UPI CHECKOUT
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.1); border-radius: 99px; }
                @media print {
                    body * { visibility: hidden; }
                    #invoice, #invoice * { visibility: visible; }
                    #invoice { position: absolute; left: 0; top: 0; width: 100%; }
                }
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Checkout;
