import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    AlertCircle,
    CheckCircle2,
    Filter,
    Image as ImageIcon,
    Upload,
    Loader
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── CLOUDINARY CONFIG ───────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = 'davodo3rr';
const CLOUDINARY_UPLOAD_PRESET = 'granite_upload';
// ─────────────────────────────────────────────────────────────────────────────

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [message, setMessage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        graniteName: '',
        category: 'Slab',
        otherCategory: '',
        price: '',
        priceUnit: 'sft',
        stockQuantity: '',
        options: [], // [{ key: '', value: '' }]
        description: '',
        imageUrl: '' // Cloudinary URL stored here
    });

    // ── Real-time Firestore Fetch ──────────────────────────────────────────
    useEffect(() => {
        const q = query(collection(db, 'products'), orderBy('graniteName'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

    const resetForm = () => {
        setFormData({ graniteName: '', category: 'Slab', otherCategory: '', price: '', priceUnit: 'sft', stockQuantity: '', options: [], description: '', imageUrl: '' });
        setPreviewImage(null);
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            const predefinedCategories = ['Slab', 'Tile', 'Silivai'];
            const isPredefined = predefinedCategories.includes(product.category);

            setCurrentProduct(product);
            setFormData({
                graniteName: product.graniteName,
                category: isPredefined ? product.category : 'Others',
                otherCategory: isPredefined ? '' : product.category,
                price: product.price || '',
                priceUnit: product.priceUnit || 'sft',
                stockQuantity: product.stockQuantity || '',
                options: product.options || [],
                description: product.description || '',
                imageUrl: product.imageUrl || ''
            });
            setPreviewImage(product.imageUrl || null);
        } else {
            setCurrentProduct(null);
            resetForm();
        }
        setModalOpen(true);
    };

    // ── Cloudinary Upload ─────────────────────────────────────────────────
    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show local preview instantly
        const reader = new FileReader();
        reader.onloadend = () => setPreviewImage(reader.result);
        reader.readAsDataURL(file);

        // Upload to Cloudinary
        setUploading(true);
        try {
            const data = new FormData();
            data.append('file', file);
            data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            data.append('folder', 'granite_products');

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: 'POST', body: data }
            );
            const json = await res.json();

            if (json.secure_url) {
                setFormData(prev => ({ ...prev, imageUrl: json.secure_url }));
                setPreviewImage(json.secure_url);
                showMessage('Image uploaded to Cloudinary!');
            } else {
                showMessage('Cloudinary upload failed. Check preset name.', 'error');
            }
        } catch (err) {
            console.error('Upload Error:', err);
            showMessage('Upload failed. Check internet connection.', 'error');
        } finally {
            setUploading(false);
        }
    };

    // ── Save to Firestore ─────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.graniteName) { showMessage('Granite name is required', 'error'); return; }

        let finalCategory = formData.category;
        if (formData.category === 'Others') {
            if (!formData.otherCategory || formData.otherCategory.trim() === '') {
                showMessage('Please specify the custom category', 'error');
                return;
            }
            finalCategory = formData.otherCategory.trim();
        }

        if (!formData.price) { showMessage('Price is required', 'error'); return; }

        try {
            const productData = {
                graniteName: formData.graniteName,
                category: finalCategory,
                price: formData.price,
                priceUnit: formData.priceUnit,
                stockQuantity: formData.stockQuantity,
                options: formData.options.filter(opt => opt.key.trim() !== '' || opt.value.trim() !== ''),
                description: formData.description,
                imageUrl: formData.imageUrl, // This is the Cloudinary URL
                updatedAt: serverTimestamp()
            };

            if (currentProduct) {
                await updateDoc(doc(db, 'products', currentProduct.id), productData);
                showMessage('Product updated successfully!');
            } else {
                await addDoc(collection(db, 'products'), { ...productData, createdAt: serverTimestamp() });
                showMessage('Product added to database!');
            }
            setModalOpen(false);
        } catch (err) {
            console.error('Firestore Error:', err);
            if (err.code === 'permission-denied') {
                showMessage('Permission Denied — Update your Firestore Rules!', 'error');
            } else {
                showMessage(`Save failed: ${err.message}`, 'error');
            }
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await deleteDoc(doc(db, 'products', deleteConfirm.id));
            showMessage('Product deleted.');
            setDeleteConfirm(null);
        } catch { showMessage('Delete failed.', 'error'); }
    };

    const filteredProducts = products.filter(p => {
        return p.graniteName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (filterCategory === 'All' ? true : p.category === filterCategory);
    });

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
                    <button onClick={() => handleOpenModal()} className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95">
                        <Plus size={20} /> Add New Product
                    </button>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all w-72 text-xs font-bold" />
                    </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <Filter size={16} className="text-slate-400" />
                    <select className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer"
                        value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="All">All Categories</option>
                        <option value="Slab">Slabs</option>
                        <option value="Tile">Tiles</option>
                        <option value="Silivai">Silivai</option>
                        <option value="Others">Others (Custom)</option>
                    </select>
                </div>
            </div>

            {/* PRODUCT TABLE */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                <th className="px-10 py-8 text-center w-32">Image</th>
                                <th className="px-6 py-8">Granite Name</th>
                                <th className="px-6 py-8">Specifications</th>
                                <th className="px-10 py-8 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="py-32 text-center text-slate-300 font-bold uppercase tracking-[0.4em] text-[10px] animate-pulse">Loading...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="5" className="py-32 text-center text-slate-300 font-bold uppercase tracking-[0.4em] text-[10px]">No Products Found</td></tr>
                            ) : filteredProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-all group">
                                    <td className="px-10 py-6">
                                        <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 mx-auto transform group-hover:scale-110 transition-transform">
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt={p.graniteName} className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100?text=Img'; }} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={28} /></div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="font-black text-slate-900 text-lg uppercase italic tracking-tight mb-1">{p.graniteName}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">{p.category}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6" colSpan={2}>
                                        <div className="text-sm font-black text-slate-900 mb-1">
                                            ₹{p.price} <span className="text-[10px] text-slate-400 font-normal">/ {p.priceUnit || 'sft'}</span>
                                        </div>
                                        <div className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mb-2">
                                            Stock: {p.stockQuantity || 'Contact Owner'}
                                        </div>
                                        {p.options && p.options.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {p.options.map((opt, i) => (
                                                    <span key={i} className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-500 border border-slate-200 uppercase">
                                                        {opt.key}: {opt.value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button onClick={() => handleOpenModal(p)} className="p-3 bg-white border border-slate-200 rounded-2xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit2 size={16} /></button>
                                            <button onClick={() => setDeleteConfirm(p)} className="p-3 bg-white border border-slate-200 rounded-2xl text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD / EDIT MODAL */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setModalOpen(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                                <div>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                                        {currentProduct ? 'Edit Product' : 'Add New Product'}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                        🌥️ Images saved to Cloudinary
                                    </p>
                                </div>
                                <button onClick={() => setModalOpen(false)} className="p-3 hover:bg-red-500 hover:text-white rounded-2xl transition-all text-slate-400"><X size={24} /></button>
                            </div>

                            {/* Scrollable Form Body */}
                            <div className="overflow-y-auto flex-1">
                                <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Granite Name */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Granite Name *</label>
                                        <input required type="text" value={formData.graniteName}
                                            onChange={(e) => setFormData({ ...formData, graniteName: e.target.value })}
                                            placeholder="e.g. Black Galaxy Premium"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900" />
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Category *</label>
                                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold">
                                            <option value="Slab">Slab</option>
                                            <option value="Tile">Tile</option>
                                            <option value="Silivai">Silivai</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>

                                    {/* Compulsory Manual Input for "Others" */}
                                    {formData.category === 'Others' && (
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 ml-2">Specify Custom Category *</label>
                                            <input required type="text" value={formData.otherCategory}
                                                onChange={(e) => setFormData({ ...formData, otherCategory: e.target.value })}
                                                placeholder="Enter new category name..."
                                                className="w-full px-6 py-4 bg-blue-50 border border-blue-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 placeholder:text-blue-300" />
                                        </div>
                                    )}

                                    {/* Price & Unit & Stock */}
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Price (₹) *</label>
                                            <input required type="text" value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                placeholder="e.g. 1000"
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Unit</label>
                                            <input type="text" value={formData.priceUnit}
                                                onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                                                placeholder="e.g. sft or pics"
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Stock</label>
                                            <input type="text" value={formData.stockQuantity}
                                                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                                                placeholder="e.g. 60 pics"
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900" />
                                        </div>
                                    </div>

                                    {/* Image Upload — Full Width */}
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Product Image (Cloudinary Auto-Upload)</label>
                                        <div
                                            className={`w-full p-8 bg-slate-50 border-2 border-dashed rounded-[2.5rem] cursor-pointer flex flex-col items-center justify-center gap-5 transition-all group ${uploading ? 'border-blue-400 animate-pulse' : 'border-slate-200 hover:border-blue-500'}`}
                                            onClick={() => !uploading && document.getElementById('cloudinaryUpload').click()}
                                        >
                                            {uploading ? (
                                                <div className="flex flex-col items-center gap-3 text-blue-500">
                                                    <Loader size={40} className="animate-spin" />
                                                    <span className="text-xs font-black uppercase tracking-widest">Uploading to Cloudinary...</span>
                                                </div>
                                            ) : previewImage ? (
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="relative w-36 h-36 group/img">
                                                        <img src={previewImage} className="w-full h-full object-cover rounded-[1.5rem] shadow-xl border-4 border-white" alt="Preview" />
                                                        <div className="absolute inset-0 bg-black/40 rounded-[1.5rem] opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                                            <Upload className="text-white" size={28} />
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                                        <CheckCircle2 size={16} /> Uploaded to Cloudinary
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold">Click to change image</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 shadow-sm border border-slate-100 group-hover:scale-110 group-hover:text-blue-500 transition-all">
                                                        <Upload size={32} />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-sm font-black text-slate-900 block uppercase italic">Click to Upload Image</span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Auto-saved to Cloudinary for free</span>
                                                    </div>
                                                </div>
                                            )}
                                            <input id="cloudinaryUpload" type="file" hidden accept="image/*" onChange={handleImageSelect} />
                                        </div>
                                    </div>

                                    {/* Custom Options */}
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="flex items-center justify-between ml-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom Specifications (Max 6)</label>
                                            {formData.options.length < 6 && (
                                                <button type="button" onClick={() => setFormData({ ...formData, options: [...formData.options, { key: '', value: '' }] })}
                                                    className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2">
                                                    <Plus size={12} /> Add Specification
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {formData.options.map((opt, index) => (
                                                <div key={index} className="flex gap-3 items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <input type="text" value={opt.key} placeholder="Label (e.g. Height)"
                                                        onChange={(e) => {
                                                            const newOpts = [...formData.options];
                                                            newOpts[index].key = e.target.value;
                                                            setFormData({ ...formData, options: newOpts });
                                                        }}
                                                        className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 text-xs" />
                                                    <input type="text" value={opt.value} placeholder="Value (e.g. 1 Feet)"
                                                        onChange={(e) => {
                                                            const newOpts = [...formData.options];
                                                            newOpts[index].value = e.target.value;
                                                            setFormData({ ...formData, options: newOpts });
                                                        }}
                                                        className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 text-xs" />
                                                    <button type="button" onClick={() => {
                                                        const newOpts = formData.options.filter((_, i) => i !== index);
                                                        setFormData({ ...formData, options: newOpts });
                                                    }} className="p-3 text-red-400 hover:text-red-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {formData.options.length === 0 && (
                                                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No custom specifications added</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Description</label>
                                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Material details, quality, origin..."
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold min-h-[100px]" />
                                    </div>

                                    {/* Buttons */}
                                    <div className="md:col-span-2 flex justify-end gap-4 pt-6 border-t border-slate-100">
                                        <button type="button" onClick={() => setModalOpen(false)}
                                            className="px-10 py-4 bg-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={uploading}
                                            className="px-14 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {uploading ? <><Loader size={16} className="animate-spin" /> Uploading...</> : currentProduct ? 'Save Changes' : 'Save Product'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DELETE CONFIRMATION */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-12 text-center shadow-2xl">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black italic uppercase mb-2">Delete Product?</h3>
                            <p className="text-slate-500 text-sm mb-10 font-medium">
                                Are you sure you want to remove <span className="font-black text-red-500">{deleteConfirm.graniteName}</span>?
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="py-4 bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-xl">Cancel</button>
                                <button onClick={handleDelete} className="py-4 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-500/30">Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductManager;
