import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    MessageSquare,
    LogOut,
    Plus,
    Search,
    Bell,
    User,
    Edit2,
    Trash2,
    Send,
    CheckCircle2,
    ArrowUpRight,
    ChevronRight,
    Clock,
    MoreVertical,
    Users,
    Calendar,
    X
} from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, onSnapshot, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import './Admin.css';
import ProductManager from '../components/Admin/ProductManager';
import ChatBotManager from '../components/Admin/ChatBotManager';
import AttendanceManager from '../components/Admin/AttendanceManager';
import OrderManager from '../components/Admin/OrderManager';
import { Bot as BotIcon, ShoppingBag } from 'lucide-react';

// --- Helper Components ---
const SidebarLink = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-6 py-4 rounded-[1.5rem] transition-all duration-300 group ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
        <div className="flex items-center gap-4">
            <Icon size={20} className={active ? 'active-icon' : ''} />
            <span className="font-bold text-sm tracking-wide">{label}</span>
        </div>
        {active && <motion.div layoutId="activeTab" className="w-1.5 h-6 bg-white rounded-full" />}
    </button>
);

const Warehouse = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 21V10l9-7 9 7v11" />
        <path d="M9 21h6" />
        <path d="M12 3v18" />
    </svg>
);

const Admin = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [usersLoading, setUsersLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('isLoggedIn');
        navigate('/login');
    };

    // --- Mock Data ---
    const stats = [
        { label: 'Total Queries', value: '1,284', grow: '+12%', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Active Products', value: '482', grow: '+3%', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Staff Present', value: '12', grow: 'Today', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Avg Response', value: '1.2m', grow: '-10%', icon: Bell, color: 'text-orange-500', bg: 'bg-orange-50' },
    ];

    const [queries, setQueries] = useState([]);
    const [queriesLoading, setQueriesLoading] = useState(false);
    const [selectedQueryChat, setSelectedQueryChat] = useState(null);
    const [queryMessages, setQueryMessages] = useState([]);
    const [queryReplyText, setQueryReplyText] = useState('');

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setUsersLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        
        let unsub;
        if (activeTab === 'queries') {
            setQueriesLoading(true);
            const q = query(collection(db, 'customer_queries'), orderBy('lastUpdated', 'desc'));
            unsub = onSnapshot(q, (snap) => {
                setQueries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setQueriesLoading(false);
            });
        }
        return () => {
            if (unsub) unsub();
        };
    }, [activeTab]);

    useEffect(() => {
        if (selectedQueryChat) {
            const q = query(collection(db, "customer_queries", selectedQueryChat.id, "messages"), orderBy("timestamp", "asc"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setQueryMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            return () => unsubscribe();
        }
    }, [selectedQueryChat]);

    const handleQueryReply = async () => {
        if (!queryReplyText.trim() || !selectedQueryChat) return;
        try {
            await addDoc(collection(db, "customer_queries", selectedQueryChat.id, "messages"), {
                text: queryReplyText,
                sender: 'admin',
                timestamp: serverTimestamp()
            });
            await setDoc(doc(db, "customer_queries", selectedQueryChat.id), {
                status: 'Replied',
                lastMessage: queryReplyText,
                lastUpdated: serverTimestamp()
            }, { merge: true });
            setQueryReplyText('');
        } catch (err) {
            console.error("Error sending query reply:", err);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-50">
                <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Warehouse size={22} className="text-white" />
                    </div>
                    <span className="font-extrabold tracking-[0.1em] text-xl uppercase font-display">SVGE <span className="text-blue-500">ADMIN</span></span>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">

                    <SidebarLink icon={Package} label="Manage Products" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
                    <SidebarLink icon={ShoppingBag} label="Manage Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                    <SidebarLink icon={User} label="Users Directory" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <SidebarLink icon={MessageSquare} label="Customer Queries" active={activeTab === 'queries'} onClick={() => setActiveTab('queries')} />
                    <SidebarLink icon={Calendar} label="Attendance Registry" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
                    <SidebarLink icon={BotIcon} label="ChatBot Settings" active={activeTab === 'chatbot'} onClick={() => setActiveTab('chatbot')} />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 font-bold transition-all group">
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">
                            {activeTab.replace('-', ' ')}
                        </h1>
                        <p className="text-slate-500 font-medium">Control Center Hub</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Quick search..." className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all w-64 text-sm" />
                        </div>
                        <button className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden lg:block">
                                <div className="text-sm font-black text-slate-900">Admin User</div>
                                <div className="text-[10px] uppercase font-bold text-blue-500 tracking-widest">Super Administrator</div>
                            </div>
                            <div className="h-11 w-11 bg-slate-200 rounded-2xl border-2 border-white shadow-sm overflow-hidden transform hover:scale-105 transition-transform cursor-pointer">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=AdminBoss" alt="Admin" />
                            </div>
                        </div>
                    </div>
                </header>
                <AnimatePresence>


                    {/* Manage Products Tab */}
                    {activeTab === 'products' && (
                        <motion.div key="prod" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                            <ProductManager />
                        </motion.div>
                    )}

                    {/* Manage Orders Tab */}
                    {activeTab === 'orders' && (
                        <motion.div key="orders-tab" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                            <OrderManager />
                        </motion.div>
                    )}

                    {/* Users Directory Tab */}
                    {activeTab === 'users' && (
                        <motion.div key="users" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black italic mb-1 uppercase tracking-tight">Vault Enrolled Entities</h3>
                                    <p className="text-sm text-slate-400 font-medium tracking-wide italic uppercase">Full registry of registered architects & clients</p>
                                </div>
                                <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-500">
                                        <Users size={16} /> {(users || []).length} Total Users
                                    </div>
                                </div>
                            </div>
                            <div className="p-2 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            <th className="px-8 py-6">Entity Identity</th>
                                            <th className="px-8 py-6 text-right">Vault Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {usersLoading ? (
                                            <tr><td colSpan="2" className="text-center py-20 animate-pulse font-bold tracking-widest text-slate-300">SYNCHRONIZING USER REGISTRY...</td></tr>
                                        ) : users.length === 0 ? (
                                            <tr><td colSpan="2" className="text-center py-20 font-bold tracking-widest text-slate-300">NO SECURED ENTITIES FOUND</td></tr>
                                        ) : (
                                            users.map((u) => (
                                                <tr key={u.id} className="hover:bg-slate-50 transition-all group cursor-pointer" onClick={() => setSelectedUser(u)}>
                                                    <td className="px-8 py-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 bg-slate-100 rounded-2xl border-2 border-white shadow-sm overflow-hidden transform group-hover:scale-110 transition-transform">
                                                                <img
                                                                    src={u.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                                                                    alt="Avatar"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-slate-900 uppercase tracking-tight italic">{u.name || 'Anonymous User'}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-8 text-right">
                                                        <button
                                                            className="px-6 py-2.5 bg-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                                            onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}
                                                        >
                                                            View Credentials
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* Quick View Modal */}
                    {selectedUser && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden relative"
                            >
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="absolute top-8 right-8 p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all z-10"
                                >
                                    <X size={20} />
                                </button>

                                <div className="p-10">
                                    {/* Header: Photo and Name */}
                                    <div className="flex flex-col items-center text-center mb-10 pb-10 border-b border-slate-100">
                                        <div className="w-28 h-28 rounded-[2.5rem] border-4 border-slate-50 shadow-2xl overflow-hidden mb-6 transform hover:scale-105 transition-transform">
                                            <img
                                                src={selectedUser.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`}
                                                className="w-full h-full object-cover"
                                                alt="Profile"
                                            />
                                        </div>
                                        <h2 className="text-3xl font-black italic uppercase text-slate-900 tracking-tight leading-none mb-2">{selectedUser.name || 'ANONYMOUS ENTITY'}</h2>
                                        <div className="h-1 w-12 bg-blue-500 rounded-full"></div>
                                    </div>

                                    {/* Procedural Data Stream */}
                                    <div className="space-y-6">
                                        <div className="flex items-baseline border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-32 shrink-0">email id:</span>
                                            <span className="font-bold text-slate-700 text-sm">{selectedUser.email}</span>
                                        </div>

                                        <div className="flex items-baseline border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-32 shrink-0">job:</span>
                                            <span className="font-bold text-slate-700 text-sm uppercase">{selectedUser.jobRole || (selectedUser.isAdmin ? 'SYSTEM CURATOR' : 'CLIENT ARCHITECT')}</span>
                                        </div>

                                        <div className="flex items-baseline border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-32 shrink-0">phone no:</span>
                                            <span className="font-black text-blue-500 text-sm tracking-wider">{selectedUser.phone || 'HIDDEN FREQUENCY'}</span>
                                        </div>

                                        <div className="flex items-baseline border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-32 shrink-0">date of birth:</span>
                                            <span className="font-bold text-slate-700 text-sm uppercase">{selectedUser.dob || 'NOT RECORDED'}</span>
                                        </div>

                                        <div className="flex items-start border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-32 shrink-0 pt-1">Address:</span>
                                            <span className="font-medium text-slate-600 text-sm italic">{selectedUser.address || selectedUser.district || 'GLOBAL REGION ORIGIN'}</span>
                                        </div>

                                        <div className="flex items-baseline border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-32 shrink-0">nation:</span>
                                            <span className="font-black text-slate-900 text-[11px] uppercase tracking-[0.2em]">{selectedUser.country || 'INTERNATIONAL'}</span>
                                        </div>

                                        <div className="flex items-baseline">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-32 shrink-0">enrolled on:</span>
                                            <span className="font-bold text-slate-700 text-sm">
                                                {selectedUser.createdAt ? (
                                                    selectedUser.createdAt.toDate ? (
                                                        <>
                                                            {selectedUser.createdAt.toDate().toLocaleDateString('en-GB')}
                                                            <span className="text-slate-300 mx-2">|</span>
                                                            <span className="text-blue-500">{selectedUser.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </>
                                                    ) : (
                                                        new Date(selectedUser.createdAt).toLocaleString()
                                                    )
                                                ) : 'ALPHA STREAM'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="w-full mt-10 py-5 bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-blue-600 transition-all shadow-2xl active:scale-95"
                                    >
                                        Return to Registry
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Queries Tab */}
                    {activeTab === 'queries' && (
                        <motion.div key="queries" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black italic mb-1 uppercase tracking-tight">Active Protocol Streams</h3>
                                    <p className="text-sm text-slate-400 font-medium tracking-wide italic uppercase">Real-time incoming customer architectural requests</p>
                                </div>
                                <div className="flex gap-4 px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-500 border-r border-slate-200 pr-4">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div> {queries.filter(q => q.status === 'Pending').length} Pending
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-500 pl-4">
                                        <CheckCircle2 size={16} /> {queries.filter(q => q.status === 'Replied').length} Replied
                                    </div>
                                </div>
                            </div>
                            <div className="p-2 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            <th className="px-8 py-6">Inquirer Identity</th>
                                            <th className="px-8 py-6">Protocol Type</th>
                                            <th className="px-8 py-6">Status</th>
                                            <th className="px-8 py-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {queriesLoading ? (
                                            <tr><td colSpan="4" className="text-center py-20 font-bold text-slate-300 animate-pulse tracking-widest text-[10px]">LOADING QUERIES...</td></tr>
                                        ) : queries.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-20 font-bold text-slate-300 tracking-widest text-[10px]">NO QUERIES FOUND</td></tr>
                                        ) : queries.map((q) => (
                                            <tr key={q.id} className="hover:bg-slate-50 transition-all group">
                                                <td className="px-8 py-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center text-slate-900 font-bold shadow-sm group-hover:border-blue-500 transition-colors overflow-hidden">
                                                            {q.userPhoto ? (
                                                                <img src={q.userPhoto} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                (q.userName || 'G').charAt(0)
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 uppercase tracking-tight italic">{q.userName || 'Guest Client'}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{q.email || 'guest@arch.com'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="text-sm font-bold text-slate-600 mb-1 max-w-[200px] truncate">{q.topic || q.lastMessage || 'Direct Message'}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {q.id.substring(0,6)}</div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${q.status === 'Pending' || q.status === 'active' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                        {(q.status || 'Pending').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-8 text-right">
                                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setSelectedQueryChat(q)} className="px-6 py-2.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 shadow-xl transition-all">Manual Reply</button>
                                                        <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"><MoreVertical size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {selectedQueryChat && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-white w-full max-w-4xl h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col"
                            >
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-sm flex items-center justify-center bg-slate-800 text-white font-bold">
                                            {selectedQueryChat.userPhoto ? (
                                                <img src={selectedQueryChat.userPhoto} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                (selectedQueryChat.userName || 'G').charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-black italic text-slate-900 uppercase tracking-tight text-lg">{selectedQueryChat.userName || 'Customer'}</h3>
                                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Secure Chat Channel</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedQueryChat(null)} className="p-3 bg-white hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-all shadow-sm">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50">
                                    {queryMessages.map((m) => (
                                        <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[70%] p-4 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${m.sender === 'user'
                                                ? 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                                                : m.sender === 'bot'
                                                  ? 'bg-emerald-50 text-slate-900 border border-emerald-200 rounded-br-none'
                                                  : 'bg-blue-600 text-white rounded-br-none shadow-blue-500/20'
                                                }`}>
                                                {m.text}
                                                {m.timestamp && (
                                                    <div className={`text-[8px] mt-2 opacity-60 font-bold uppercase tracking-widest ${m.sender === 'user' || m.sender === 'bot' ? 'text-slate-400' : 'text-blue-200'}`}>
                                                        {m.timestamp.toDate ? m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {queryMessages.length === 0 && (
                                        <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                           Initializing Stream...
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-white flex gap-4 items-center">
                                    <input
                                        type="text"
                                        placeholder="Type an admin reply..."
                                        value={queryReplyText}
                                        onChange={(e) => setQueryReplyText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleQueryReply()}
                                        className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm"
                                    />
                                    <button
                                        onClick={handleQueryReply}
                                        className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                                        disabled={!queryReplyText.trim()}
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}



                    {/* ChatBot Settings Tab */}
                    {activeTab === 'chatbot' && (
                        <motion.div key="chatbot" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                            <ChatBotManager />
                        </motion.div>
                    )}

                    {/* Attendance Registry Tab */}
                    {activeTab === 'attendance' && (
                        <motion.div key="attendance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <AttendanceManager />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};


export default Admin;
