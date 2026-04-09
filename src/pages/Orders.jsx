import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, CheckCircle2, AlertCircle, ArrowLeft, ShoppingBag, ReceiptText, Phone, Mail, MapPin, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { XCircle } from 'lucide-react';

const Orders = ({ isLoggedIn, currentUser }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        if (!isLoggedIn || !currentUser) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "orders"),
            where("userId", "==", currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orderList = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(order => order.status !== 'Cancelled')
                .sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
                    return timeB - timeA;
                });
            setOrders(orderList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isLoggedIn, currentUser]);

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this architectural dispatch request?")) return;

        try {
            await updateDoc(doc(db, "orders", orderId), {
                status: 'Cancelled',
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error cancelling order:", error);
            alert("Failed to cancel order. Please contact support.");
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#02060c] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={64} className="text-brand-blue mb-6" />
                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Access Denied</h1>
                <p className="text-slate-400 mb-8 max-w-md">Please login to view your order history and dispatch status.</p>
                <button onClick={() => navigate('/login')} className="px-10 py-4 bg-brand-blue text-white font-bold rounded-2xl shadow-xl hover:bg-brand-blue-dark transition-all">Login Now</button>
            </div>
        );
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now';
        const dateObj = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(dateObj);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-slate-50 pt-48 pb-20 px-6 md:px-12 relative overflow-hidden font-sans">
            {/* ── Background Design (Matching Estimator Style) ── */}
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
                {/* ── Header Section ── */}
                <div className="text-center mb-16">
                    <motion.button 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate('/')} 
                        className="flex items-center gap-2 text-slate-400 hover:text-brand-blue transition-colors mx-auto mb-8 uppercase text-[10px] font-black tracking-[0.3em]"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </motion.button>
                    
                    <motion.h1 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter text-brand-blue leading-none mb-6 drop-shadow-sm"
                    >
                        MY ORDER HISTORY
                    </motion.h1>
                </div>

                {loading ? (
                    <div className="text-center py-40">
                        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-brand-blue/40 font-black uppercase tracking-[0.5em] text-[10px]">Syncing Data...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-[#0a121d] rounded-[3rem] p-20 text-center shadow-2xl overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 to-transparent pointer-events-none" />
                        <div className="w-24 h-24 bg-brand-blue/20 border border-brand-blue/30 text-brand-blue rounded-3xl flex items-center justify-center mx-auto mb-8 relative z-10">
                            <ShoppingBag size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase italic mb-8 relative z-10">Historical Registry Empty</h2>
                        <button onClick={() => navigate('/products')} className="px-12 py-5 bg-brand-blue text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-brand-blue-dark transition-all shadow-xl relative z-10">Explore Catalog</button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {orders.map((order, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                key={order.id} 
                                className="bg-white rounded-[3rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-slate-200"
                            >
                                {/* ── Order Card Header ── */}
                                <div className="bg-[#0a121d] p-8 md:p-10 flex flex-wrap justify-between items-center gap-8 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                                     
                                     <div className="flex items-center gap-6 relative z-10">
                                         <div className="w-14 h-14 bg-brand-blue/20 rounded-2xl flex items-center justify-center text-brand-blue border border-brand-blue/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                             <Package size={28} />
                                         </div>
                                         <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-1">DISPATCH ID</p>
                                            <div className="flex items-center gap-3">
                                                <p className="text-white font-mono text-sm uppercase font-bold tracking-tighter">#{order.id.substring(0, 12)}</p>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    order.status === 'Completed' || order.status === 'Finished' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                    order.status === 'Shipped' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                                    order.status === 'Processing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                    order.status === 'Cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                }`}>
                                                    {order.status || 'Pending'}
                                                </span>
                                            </div>
                                         </div>
                                     </div>

                                     <div className="flex items-center gap-12 relative z-10">
                                         <div className="hidden sm:block">
                                             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">VERIFICATION DATE</p>
                                             <p className="text-white font-black text-sm italic">{formatDate(order.createdAt)}</p>
                                         </div>
                                         <div className="text-right">
                                             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">NET VALUATION</p>
                                             <p className="text-3xl font-black text-white italic tracking-tighter transition-colors group-hover:text-brand-blue">₹{order.totalAmount.toLocaleString()}</p>
                                         </div>
                                     </div>
                                </div>

                                {/* ── Order Details (Light Body) ── */}
                                <div className="p-8 md:p-12">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-1.5 h-6 bg-brand-blue rounded-full" />
                                        <h4 className="text-xs font-black uppercase tracking-[0.4em] text-slate-900">
                                            Architectural Inventory Snapshot
                                        </h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {order.items.map((item, i) => (
                                            <motion.div 
                                                whileHover={{ y: -5 }}
                                                key={i} 
                                                className="flex gap-6 items-center p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group transition-all"
                                            >
                                                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                                                    <img src={item.imageUrl} alt={item.graniteName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-brand-blue mb-1">{item.category}</p>
                                                    <p className="text-sm font-black text-slate-800 uppercase italic tracking-tighter truncate leading-tight mb-2">{item.graniteName}</p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">UNIT: {item.quantity}</span>
                                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-blue/10 text-brand-blue'}`}>
                                                            {order.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                     {order.status === 'Pending' && (
                                        <div className="mt-12 flex justify-end gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                            <button 
                                                onClick={() => setSelectedOrder(order)}
                                                className="flex items-center gap-2 px-8 py-4 bg-brand-blue/10 text-brand-blue rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-blue hover:text-white transition-all shadow-xl shadow-brand-blue/10 active:scale-95 border border-brand-blue/20"
                                            >
                                                <ReceiptText size={18} /> 
                                                View Bill
                                            </button>
                                            <button 
                                                onClick={() => handleCancelOrder(order.id)}
                                                className="group flex items-center gap-3 px-8 py-4 bg-red-50 text-red-500 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10 active:scale-95 border border-red-100"
                                            >
                                                <XCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
                                                Cancel Dispatch Request
                                            </button>
                                        </div>
                                    )}
                                    {order.status !== 'Pending' && (
                                        <div className="mt-12 flex justify-end animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                            <button 
                                                onClick={() => setSelectedOrder(order)}
                                                className="flex items-center gap-2 px-8 py-4 bg-brand-blue/10 text-brand-blue rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-blue hover:text-white transition-all shadow-xl shadow-brand-blue/10 active:scale-95 border border-brand-blue/20"
                                            >
                                                <ReceiptText size={18} /> 
                                                View Bill
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Invoice Modal ── */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-[100] flex justify-center p-6 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-transparent overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-4xl h-fit my-auto flex flex-col pt-10 print:pt-0">
                            
                            {/* Close button - hidden when printing */}
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="absolute right-0 top-0 mt-2 bg-white text-slate-800 p-2 rounded-full shadow-lg print:hidden hover:bg-slate-100 z-50"
                            >
                                <XCircle size={24} />
                            </button>

                            <div id="invoice" className="bg-white p-12 md:p-20 shadow-2xl rounded-[1rem] relative print:shadow-none print:border-none">
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
                                        <p className="text-xl font-black italic uppercase text-slate-900">#SVGE-{selectedOrder.id?.substring(0,6).toUpperCase()}</p>
                                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{new Date(selectedOrder.createdAt?.toMillis ? selectedOrder.createdAt.toMillis() : selectedOrder.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-l-2 border-brand-blue pl-4">Customer Transcript</h4>
                                        <div className="space-y-2 ml-4">
                                            <p className="text-lg font-black italic uppercase text-slate-900">{selectedOrder.customerDetails?.name}</p>
                                            <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Phone size={12} className="text-brand-blue" /> {selectedOrder.customerDetails?.phone}</p>
                                            <p className="text-xs font-bold text-slate-500 flex items-center gap-2"><Mail size={12} className="text-brand-blue" /> {selectedOrder.customerDetails?.email}</p>
                                            <p className="text-xs font-bold text-slate-500 uppercase mt-4 flex items-start gap-2 max-w-[250px]"><MapPin size={12} className="text-brand-blue mt-1 shrink-0" /> {selectedOrder.customerDetails?.address}</p>
                                            {selectedOrder.customerDetails?.gst && (
                                                <p className="text-xs font-black text-brand-blue mt-4 uppercase tracking-widest bg-brand-blue/5 px-3 py-1 rounded-lg inline-block">GSTIN: {selectedOrder.customerDetails.gst}</p>
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
                                        {selectedOrder.items?.map((item, i) => (
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
                                            <p className="text-xs font-black text-slate-900 uppercase italic leading-loose">Method: {selectedOrder.paymentMethod === 'card' ? 'DIGITAL CARD' : selectedOrder.paymentMethod?.toUpperCase()}</p>
                                            <p className="text-xs font-black text-emerald-500 uppercase italic">Status: TRANSACTION VERIFIED</p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right space-y-4">
                                        <div className="flex justify-between md:justify-end gap-16 text-slate-400">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Valuation</span>
                                            <span className="text-lg font-black text-slate-900">₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between md:justify-end gap-16 text-brand-blue">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dispatch Logistics</span>
                                            <span className="text-sm font-black uppercase italic">COMPLIMENTARY</span>
                                        </div>
                                        <div className="flex justify-between md:justify-end gap-16 pt-6 border-t border-slate-100">
                                            <span className="text-slate-900 text-xs font-black uppercase tracking-[0.2em]">Net Payable</span>
                                            <span className="text-5xl font-black italic text-slate-900 tracking-tighter">₹{selectedOrder.totalAmount?.toLocaleString()}</span>
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

                            <div className="mt-8 flex justify-center gap-6 print:hidden items-center pb-10">
                                <button onClick={handlePrint} className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl">
                                    <Printer size={18} /> Print Invoice
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #invoice, #invoice * { visibility: visible; }
                    #invoice { position: absolute; left: 0; top: 0; width: 100%; transform: scale(0.95); transform-origin: top center;}
                }
            `}</style>
        </motion.div>
    );
};

export default Orders;
