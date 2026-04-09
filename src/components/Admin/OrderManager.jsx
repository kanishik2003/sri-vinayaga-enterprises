import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
    collection,
    updateDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import {
    Package,
    Search,
    Edit2,
    Trash2,
    X,
    AlertCircle,
    CheckCircle2,
    Filter,
    Clock,
    User,
    Mail,
    Phone,
    MapPin,
    ChevronRight,
    ShoppingBag,
    Printer,
    ArrowUpRight,
    ReceiptText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showBill, setShowBill] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [message, setMessage] = useState(null);

    // ── Real-time Firestore Fetch ──────────────────────────────────────────
    useEffect(() => {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orderList = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(order => order.status !== 'Cancelled');
            setOrders(orderList);
            setLoading(false);
        }, (err) => {
            console.error("Firestore Error:", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────
    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await updateDoc(doc(db, 'orders', orderId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            showMessage(`Order status updated to ${newStatus}`);
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            console.error('Update Status Error:', err);
            showMessage('Failed to update status', 'error');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const filteredOrders = orders.filter(o => {
        const searchStr = `${o.customerDetails?.name || ''} ${o.customerDetails?.email || ''} ${o.id}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase()) &&
            (filterStatus === 'All' ? true : o.status === filterStatus);
    });

    const statusColors = {
        'Pending': 'bg-orange-100 text-orange-600 border-orange-200',
        'Processing': 'bg-blue-100 text-blue-600 border-blue-200',
        'Completed': 'bg-emerald-100 text-emerald-600 border-emerald-200',
        'Cancelled': 'bg-red-100 text-red-600 border-red-200',
        'Shipped': 'bg-purple-100 text-purple-600 border-purple-200'
    };

    return (
        <div className="space-y-8">
            {/* FLOATING NOTIFICATION */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`fixed top-6 right-6 z-[999] px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 font-black text-sm uppercase tracking-widest max-w-md ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                            }`}
                    >
                        {message.type === 'error' ? <AlertCircle size={22} /> : <CheckCircle2 size={22} />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ACTION BAR */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-wrap gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search orders by ID, name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all w-96 text-xs font-bold" />
                    </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <Filter size={16} className="text-slate-400" />
                    <select className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer"
                        value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* ORDERS TABLE */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                <th className="px-10 py-8">Order Profile</th>
                                <th className="px-6 py-8">Dispatch ID</th>
                                <th className="px-6 py-8">Valuation</th>
                                <th className="px-6 py-8">Status</th>
                                <th className="px-10 py-8 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="py-32 text-center text-slate-300 font-bold uppercase tracking-[0.4em] text-[10px] animate-pulse">Syncing Order Stream...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan="5" className="py-32 text-center text-slate-300 font-bold uppercase tracking-[0.4em] text-[10px]">No Orders Found in Registry</td></tr>
                            ) : filteredOrders.map((o) => (
                                <tr key={o.id} className="hover:bg-slate-50 transition-all group cursor-pointer" onClick={() => setSelectedOrder(o)}>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 text-sm uppercase italic tracking-tight mb-0.5">{o.customerDetails?.name || 'Guest Client'}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{o.customerDetails?.email || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="font-mono text-[11px] font-bold text-slate-900 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                                            #{o.id.substring(0, 12).toUpperCase()}
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-1.5">
                                            <Clock size={10} /> {formatDate(o.createdAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="font-black text-slate-900 text-lg italic tracking-tighter">₹{o.totalAmount.toLocaleString()}</div>
                                        <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">{o.items.length} Architectural Units</div>
                                    </td>
                                    <td className="px-6 py-6" onClick={(e) => e.stopPropagation()}>
                                        <select 
                                            value={o.status} 
                                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border outline-none cursor-pointer transition-all ${statusColors[o.status] || 'bg-slate-100 text-slate-600'}`}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }} className="px-6 py-2.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 shadow-xl transition-all">View Dossier</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ORDER DOSSIER MODAL */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 md:p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-600/20">
                                        <ShoppingBag size={32} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">{selectedOrder.customerDetails?.name || 'Guest Client'} - Order</h3>
                                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${statusColors[selectedOrder.status]}`}>
                                                {selectedOrder.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                                            <span className="text-blue-500 font-mono uppercase">Transaction ID: #{selectedOrder.id}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            Time & Date: {formatDate(selectedOrder.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setShowBill(true)} className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                        <ReceiptText size={18} /> View Bill
                                    </button>
                                    <button onClick={() => setSelectedOrder(null)} className="p-4 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-slate-400 shadow-sm"><X size={20} /></button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="overflow-y-auto flex-1 p-10">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    {/* Left Content: Items */}
                                    <div className="lg:col-span-2 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                            <h4 className="text-xs font-black uppercase tracking-[0.4em] text-slate-900">Order Details</h4>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {selectedOrder.items.map((item, idx) => (
                                                <div key={idx} className="flex gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                                                    <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                                                        <img src={item.imageUrl} alt={item.graniteName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md mb-1 inline-block">{item.category}</span>
                                                                <h5 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{item.graniteName}</h5>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-black text-slate-900 italic tracking-tighter">₹{(parseFloat(item.price) * item.quantity).toLocaleString()}</p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">₹{item.price} x {item.quantity}</p>
                                                            </div>
                                                        </div>
                                                        {item.options && item.options.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-4">
                                                                {item.options.map((opt, i) => (
                                                                    <span key={i} className="text-[8px] bg-white px-2 py-0.5 rounded font-black text-slate-400 border border-slate-100 uppercase tracking-widest italic">
                                                                        {opt.key}: {opt.value}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Content: Stats & Actions */}
                                    <div className="lg:col-span-1 space-y-8">
                                        {/* Client Snapshot */}
                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2" />
                                            
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-8 flex items-center gap-3">
                                                 Client Snapshot
                                            </h4>
                                            
                                            <div className="space-y-6 relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Entity Identity</p>
                                                        <p className="font-black uppercase italic tracking-tight">{selectedOrder.customerDetails?.name || 'Guest Client'}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10">
                                                        <Mail size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Communication Frequency</p>
                                                        <p className="text-xs font-bold text-slate-300 break-all">{selectedOrder.customerDetails?.email || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <button className="w-full mt-4 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-3">
                                                    View Entity Credentials <ArrowUpRight size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Financial Ledger */}
                                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8">Financial Ledger</h4>
                                            
                                            <div className="space-y-4 mb-8">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <span>Registry Subtotal</span>
                                                    <span className="text-slate-900">₹{selectedOrder.totalAmount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <span>Dispatch Logistics</span>
                                                    <span className="text-blue-500 italic">CALCULATING...</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 border-t border-slate-50 pt-4">
                                                    <span className="text-slate-900">Net Valuation</span>
                                                    <span className="text-2xl font-black text-slate-900 italic tracking-tighter font-display">₹{selectedOrder.totalAmount.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Authorize Order Status</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'].map(status => (
                                                        <button 
                                                            key={status}
                                                            onClick={() => updateOrderStatus(selectedOrder.id, status)}
                                                            className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                                                selectedOrder.status === status 
                                                                ? `${statusColors[status]} ring-2 ring-offset-2 ring-blue-500/20` 
                                                                : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            {status === selectedOrder.status && <CheckCircle2 size={12} className="inline-block mr-2 -mt-0.5" />}
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Invoice Modal ── */}
            <AnimatePresence>
                {showBill && selectedOrder && (
                    <div className="fixed inset-0 z-[400] flex justify-center p-6 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-transparent overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-4xl h-fit my-auto flex flex-col pt-10 print:pt-0">
                            
                            {/* Close button - hidden when printing */}
                            <button 
                                onClick={() => setShowBill(false)}
                                className="absolute right-0 top-0 mt-2 bg-white text-slate-800 p-2 rounded-full shadow-lg print:hidden hover:bg-slate-100 z-50"
                            >
                                <X size={24} />
                            </button>

                            <div id="invoice" className="bg-white p-12 md:p-20 shadow-2xl rounded-[1rem] relative print:shadow-none print:border-none">
                                {/* Invoice Header */}
                                <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16 border-b border-slate-100 pb-16">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
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
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-l-2 border-blue-600 pl-4">Customer Transcript</h4>
                                        <div className="space-y-2 ml-4">
                                            <p className="text-lg font-black italic uppercase text-slate-900">{selectedOrder.customerDetails?.name}</p>
                                            <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Phone size={12} className="text-blue-600" /> {selectedOrder.customerDetails?.phone}</p>
                                            <p className="text-xs font-bold text-slate-500 flex items-center gap-2"><Mail size={12} className="text-blue-600" /> {selectedOrder.customerDetails?.email}</p>
                                            <p className="text-xs font-bold text-slate-500 uppercase mt-4 flex items-start gap-2 max-w-[250px]"><MapPin size={12} className="text-blue-600 mt-1 shrink-0" /> {selectedOrder.customerDetails?.address}</p>
                                            {selectedOrder.customerDetails?.gst && (
                                                <p className="text-xs font-black text-blue-600 mt-4 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg inline-block">GSTIN: {selectedOrder.customerDetails.gst}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 pr-4 border-r-2 border-slate-900">Corporate Details</h4>
                                        <div className="space-y-1 pr-4">
                                            <p className="text-xs font-black uppercase text-slate-900">Sri Vinayaga Enterprises</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Salat Village, Granite Zone</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tamil Nadu, India</p>
                                            <p className="text-[10px] font-bold text-blue-600 uppercase mt-2">www.svge.ai</p>
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
                                                    <p className="text-sm font-black italic text-blue-600">{item.price ? `₹${(item.price * item.quantity).toLocaleString()}` : "TBD"}</p>
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
                                        <div className="flex justify-between md:justify-end gap-16 text-blue-600">
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
                                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-2">
                                        SRI VINAYAGA ENTERPRISES • SALEM • TAMIL NADU
                                    </p>
                                </div>
                                
                                {/* Visual Decoration for Bill */}
                                <div className="absolute top-0 right-0 w-4 h-full bg-blue-600 transform translate-x-1" />
                                <div className="absolute top-0 left-0 w-1 h-24 bg-blue-600" />
                            </div>

                            <div className="mt-8 flex justify-center gap-6 print:hidden items-center pb-10">
                                <button onClick={() => window.print()} className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl">
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
        </div>
    );
};

export default OrderManager;
