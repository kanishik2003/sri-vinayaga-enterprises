import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Maximize2,
    Warehouse,
    X,
    ArrowRight,
    ShoppingBag,
    ShoppingCart
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const ProductCard = ({ name, price, image, category, color, dimensions, onViewDetails }) => {
    const badgeStyle = {
        color: '#00FF54',
        backgroundColor: 'rgba(0, 255, 84, 0.1)',
        borderColor: 'rgba(0, 255, 84, 0.2)'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flip-card h-[450px]"
        >
            <div className="flip-card-inner">
                {/* FRONT SIDE */}
                <div className="flip-card-front relative shadow-2xl group cursor-pointer border border-white/5 overflow-hidden rounded-[2rem]">
                    <img src={image || 'https://placehold.co/600x800?text=No+Image'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white scale-50 group-hover:scale-100 transition-transform shadow-xl">
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
                        <h3 className="text-2xl font-bold text-white uppercase italic tracking-tighter">{name}</h3>
                    </div>
                </div>

                {/* BACK SIDE */}
                <div className="flip-card-back bg-[#0d1520] p-10 flex flex-col justify-center items-center text-center shadow-2xl border border-white/10 rounded-[2rem] text-white">
                    <Warehouse size={48} className="text-blue-400 mb-6" />
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">{name}</h3>
                    <p className="text-blue-400 text-xl font-bold mb-6">{price}</p>

                    <button
                        onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl transition-all shadow-xl hover:bg-blue-700 uppercase text-[10px] tracking-[0.2em]"
                    >
                        View Details
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const ProductDetailsModal = ({ product, onClose, isLoggedIn }) => {
    if (!product) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="relative w-full max-w-5xl bg-[#0a121d] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-white/10"
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 z-20 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md">
                    <X size={24} />
                </button>

                {/* Left Side: Image Gallery Style */}
                <div className="md:w-1/2 relative bg-slate-900 min-h-[400px]">
                    <img src={product.imageUrl} alt={product.graniteName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a121d] via-transparent to-transparent md:hidden" />
                </div>

                {/* Right Side: Details */}
                <div className="md:w-1/2 p-10 md:p-14 overflow-y-auto">
                    <div className="mb-8">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-3 inline-block px-3 py-1 bg-cyan-400/10 border border-cyan-400/20 rounded-lg">
                            {product.category}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none mb-4">
                            {product.graniteName}
                        </h2>
                        <p className="text-3xl font-bold text-white">
                            ₹{product.price} <span className="text-sm font-normal text-slate-500">/ {product.priceUnit || 'sft'}</span>
                        </p>
                        <p className="text-[10px] font-black text-emerald-400 mt-2 uppercase tracking-widest">
                            Stock: {product.stockQuantity || 'Contact Owner'}
                        </p>
                    </div>

                    {product.options && product.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 mb-12">
                            {product.options.map((opt, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">{opt.key}</span>
                                    <span className="text-sm font-bold text-slate-200 uppercase italic">{opt.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mb-12">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-3">
                            <ArrowRight size={14} className="text-cyan-400" /> Technical Description
                        </h4>
                        <p className="text-slate-400 text-lg leading-relaxed font-medium">
                            {product.description || "This premium natural stone slab has been meticulously verified by our digital inspection AI. Our Signature Registry ensures only the highest quality architectural components are made available for our elite clientele."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-white/10">
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
                                    
                                    // Change button text
                                    const btn = e.currentTarget;
                                    const original = btn.innerHTML;
                                    btn.innerHTML = 'Added!';
                                    btn.style.backgroundColor = '#10b981'; // emerald
                                    setTimeout(() => {
                                        btn.innerHTML = original;
                                        btn.style.backgroundColor = '';
                                    }, 2000);
                                }}
                                className="flex-1 py-5 bg-cyan-400 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-cyan-300 transition-all shadow-xl flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={16} /> Add to Cart
                            </button>
                        ) : (
                            <button 
                                onClick={() => window.location.href = '/login'} 
                                className="flex-1 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-cyan-400 transition-all shadow-xl"
                            >
                                Login to Add to Cart
                            </button>
                        )}
                        <button onClick={onClose} className="flex-1 py-5 bg-white/5 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-white/10 transition-all border border-white/10">
                            Back to Gallery
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const Products = ({ isLoggedIn }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const categories = ['All', ...new Set(products.map(p => p.category))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.graniteName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[#02060c] pt-32 pb-20 px-6 md:px-12 relative overflow-hidden"
        >
            {/* Background Accents & Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="absolute inset-0 opacity-[0.08]"
                    style={{ 
                        backgroundImage: `linear-gradient(#ffffff 0.5px, transparent 0.5px), linear-gradient(90deg, #ffffff 0.5px, transparent 0.5px)`,
                        backgroundSize: '80px 80px' 
                    }} />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-cyan-400 font-black uppercase tracking-[0.3em] text-[10px]">
                            <ShoppingBag size={16} /> Premium Stone Library
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none">
                            Architectural <br /> <span className="text-cyan-400 italic">Inventory</span>
                        </h1>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all w-full sm:w-64 text-xs font-bold text-white placeholder:text-slate-500 backdrop-blur-xl"
                            />
                        </div>

                        {/* Filter */}
                        <div className="relative group">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="pl-12 pr-10 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all w-full sm:w-48 text-xs font-black uppercase tracking-widest appearance-none backdrop-blur-xl cursor-pointer text-white"
                            >
                                {categories.map(cat => (cat === 'All' ? <option key={cat} value={cat} style={{ color: 'black' }}>ALL CATEGORIES</option> : <option key={cat} value={cat} style={{ color: 'black' }}>{cat.toUpperCase()}</option>))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-[450px] bg-white/5 rounded-[2rem] animate-pulse border border-white/10" />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="py-40 text-center space-y-4">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-700">
                            <Search size={40} />
                        </div>
                        <h3 className="text-xl font-black italic uppercase text-slate-500">No stones found</h3>
                        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Try adjusting your search or filter</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProducts.map((p) => (
                            <ProductCard
                                key={p.id}
                                name={p.graniteName}
                                price={p.price == null ? 'Contact Owner' : `₹${p.price}/ ${p.priceUnit || 'sft'}`}
                                image={p.imageUrl}
                                category={p.category}
                                onViewDetails={() => setSelectedProduct(p)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedProduct && (
                    <ProductDetailsModal
                        product={selectedProduct}
                        onClose={() => setSelectedProduct(null)}
                        isLoggedIn={isLoggedIn}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Products;
