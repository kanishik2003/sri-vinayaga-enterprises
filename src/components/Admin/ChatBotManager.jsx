import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Edit2, Trash2, Plus, Save, X, Bot, RefreshCw, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── CLOUDINARY CONFIG ───────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = 'davodo3rr';
const CLOUDINARY_UPLOAD_PRESET = 'granite_upload';
// ─────────────────────────────────────────────────────────────────────────────

const defaultKnowledge = [
    {
        topic: "Pricing",
        keywords: ["price", "cost", "how much", "rate"],
        answer: "Our prices range from ₹140 to ₹210 per sqft depending on the variety and finish. For example, Absolute Black is ₹210/sqft.",
    },
    {
        topic: "Products",
        keywords: ["product", "granite", "name", "variety"],
        answer: "We offer a wide range of premium granites including: Black Galaxy, Tan Brown, Moon White, and Absolute Black. Which one would you like to know more about?",
    },
    {
        topic: "Export Information",
        keywords: ["export", "country", "shipping", "minimum", "moq"],
        answer: "We export to USA, UK, UAE, Germany, Australia, Canada. Our Minimum Order Quantity (MOQ) is 1 Container (Approx 400-450 sqm).",
    },
    {
        topic: "Company Info",
        keywords: ["company", "about", "experience", "where"],
        answer: "SRI VINAYAGA ENTERPRISES has 10+ Years of experience. We are located in Flat No.:2/1G, PANANGADU, REDDIYUR, SALEM- PIN Code:636004 and are ISO 9001:2015 and CE Certified.",
    },
    {
        topic: "Brochure & Catalog",
        keywords: ["catalog", "brochure", "download"],
        answer: "You can download our catalog and brochure directly. *Note: We will automatically attach the catalog link below this message.*",
        type: "catalog"
    },
    {
        topic: "Images",
        keywords: ["image", "photo", "look", "picture"],
        answer: "Here are some of our top-selling products. *Note: We will automatically attach top product images below this message.*",
        type: "image"
    }
];

const ChatBotManager = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ topic: '', keywords: '', answer: '', fileUrl: '', fileName: '', fileType: '' });
    const [isSeeding, setIsSeeding] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'chatbot_knowledge'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setQueries(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleEdit = (q) => {
        setEditingId(q.id);
        setFormData({
            topic: q.topic || '',
            keywords: q.keywords ? q.keywords.join(', ') : '',
            answer: q.answer || '',
            fileUrl: q.fileUrl || '',
            fileName: q.fileName || '',
            fileType: q.fileType || ''
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);

        const type = file.type.startsWith('image/') ? 'image' : 'document';
        
        try {
            const data = new FormData();
            data.append('file', file);
            data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            data.append('folder', 'chatbot_files');

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
                { method: 'POST', body: data }
            );
            
            const json = await res.json();

            if (json.secure_url) {
                setFormData(prev => ({
                    ...prev,
                    fileUrl: json.secure_url,
                    fileName: file.name,
                    fileType: type
                }));
            } else {
                console.error("Cloudinary error:", json);
                alert("File upload failed! " + (json.error?.message || ''));
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("File upload failed!");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (id) => {
        try {
            const dataToSave = {
                topic: formData.topic,
                keywords: formData.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k),
                answer: formData.answer,
                fileUrl: formData.fileUrl || null,
                fileName: formData.fileName || null,
                fileType: formData.fileType || null,
                updatedAt: serverTimestamp()
            };

            if (id === 'new') {
                await addDoc(collection(db, 'chatbot_knowledge'), dataToSave);
            } else {
                await setDoc(doc(db, 'chatbot_knowledge', id), dataToSave, { merge: true });
            }

            setEditingId(null);
            setFormData({ topic: '', keywords: '', answer: '', fileUrl: '', fileName: '', fileType: '' });
        } catch (error) {
            console.error("Error saving chatbot query:", error);
            alert("Failed to save changes.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this chatbot response?")) {
            try {
                await deleteDoc(doc(db, 'chatbot_knowledge', id));
            } catch (error) {
                console.error("Error deleting document:", error);
            }
        }
    };

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            for (let item of defaultKnowledge) {
                await addDoc(collection(db, 'chatbot_knowledge'), {
                    ...item,
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Error seeding data:", error);
            alert("Failed to populate default data.");
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black italic mb-1 uppercase tracking-tight flex items-center gap-3">
                        <Bot className="text-blue-500" /> AI Responses Manager
                    </h3>
                    <p className="text-sm text-slate-400 font-medium tracking-wide italic uppercase">Train the ChatBot with custom questions and answers</p>
                </div>
                <div className="flex gap-4">
                    {queries.length === 0 && !loading && (
                        <button
                            onClick={handleSeedData}
                            disabled={isSeeding}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-sm hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isSeeding ? "animate-spin" : ""} />
                            {isSeeding ? 'Populating...' : 'Load Default Answers'}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setEditingId('new');
                            setFormData({ topic: '', keywords: '', answer: '', fileUrl: '', fileName: '', fileType: '' });
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl shadow-sm hover:bg-blue-600 transition-all font-bold text-xs uppercase tracking-widest shadow-blue-500/20"
                    >
                        <Plus size={16} /> Add New Response
                    </button>
                </div>
            </div>

            <div className="p-8">
                {loading ? (
                    <div className="text-center py-20 animate-pulse font-bold tracking-widest text-slate-300">LOADING AI KNOWLEDGE BASE...</div>
                ) : queries.length === 0 && editingId !== 'new' ? (
                    <div className="text-center py-20">
                        <Bot size={48} className="mx-auto text-slate-200 mb-4" />
                        <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">Knowledge Base is Empty</h4>
                        <p className="text-slate-400 mb-6 text-sm">Add custom responses or load standard industry answers to activate the AI.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {editingId === 'new' && (
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-6 border-2 border-blue-500 rounded-2xl bg-blue-50/10">
                                <h4 className="text-sm font-black text-blue-500 mb-4 uppercase tracking-widest">Create New Response</h4>
                                <div className="grid gap-4 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Topic Name (e.g. Discount Info)"
                                        value={formData.topic}
                                        onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-700"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Keywords (comma separated, e.g. discount, offer, sale)"
                                        value={formData.keywords}
                                        onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-700"
                                    />
                                    <textarea
                                        placeholder="Chatbot Answer..."
                                        value={formData.answer}
                                        onChange={e => setFormData({ ...formData, answer: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-700 resize-none"
                                    />
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="file-upload-new"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="image/*,.pdf,.doc,.docx"
                                        />
                                        <label htmlFor="file-upload-new" className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all w-max text-sm font-bold text-slate-600">
                                            <Paperclip size={16} />
                                            {isUploading ? 'Uploading...' : formData.fileName ? formData.fileName : 'Attach Image or Document'}
                                        </label>
                                        {formData.fileUrl && !isUploading && (
                                            <button type="button" onClick={() => setFormData({...formData, fileUrl: '', fileName: '', fileType: ''})} className="ml-4 p-1 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-all inline-flex items-center justify-center">
                                                <X size={14} /> Remove Attachment
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setEditingId(null)} className="px-5 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold text-xs uppercase tracking-widest transition-all">Cancel</button>
                                    <button onClick={() => handleSave('new')} className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"><Save size={14} /> Save</button>
                                </div>
                            </motion.div>
                        )}

                        {queries.map((q) => (
                            <div key={q.id} className="p-6 border border-slate-200 rounded-2xl hover:border-blue-500 transition-all group bg-white shadow-sm">
                                {editingId === q.id ? (
                                    <div>
                                        <div className="grid gap-4 mb-4" key={`editing-${q.id}`}>
                                            <input
                                                type="text"
                                                value={formData.topic}
                                                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-700"
                                            />
                                            <input
                                                type="text"
                                                value={formData.keywords}
                                                onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-700"
                                            />
                                            <textarea
                                                value={formData.answer}
                                                onChange={e => setFormData({ ...formData, answer: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-700 resize-none"
                                            />
                                            <div className="block">
                                                <input
                                                    type="file"
                                                    id={`file-upload-${q.id}`}
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    accept="image/*,.pdf,.doc,.docx"
                                                />
                                                <div className="flex items-center gap-3">
                                                    <label htmlFor={`file-upload-${q.id}`} className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all w-max text-sm font-bold text-slate-600">
                                                        <Paperclip size={16} />
                                                        {isUploading ? 'Uploading...' : formData.fileName ? formData.fileName : 'Attach Image or Document'}
                                                    </label>
                                                    {formData.fileUrl && !isUploading && (
                                                        <button type="button" onClick={() => setFormData({...formData, fileUrl: '', fileName: '', fileType: ''})} className="px-3 py-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                                            <X size={14} /> Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => setEditingId(null)} className="px-5 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold text-xs uppercase tracking-widest transition-all">Cancel</button>
                                            <button onClick={() => handleSave(q.id)} className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"><Save size={14} /> Update</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-lg font-black text-slate-900 tracking-tight">{q.topic}</h4>
                                                {q.type && (
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                        Special action: {q.type}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {q.keywords.map((k, i) => (
                                                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">
                                                        {k}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="text-sm text-slate-600 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bot Answer:</span>
                                                {q.answer}
                                                {q.fileUrl && (
                                                    <div className="mt-3 inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                                                        <Paperclip size={14} className="text-blue-500" />
                                                        <a href={q.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-700 underline truncate max-w-[200px]">
                                                            {q.fileName || 'Attached File'}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(q)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-500 transition-all border border-slate-200"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(q.id)} className="p-2.5 bg-slate-50 text-red-500 rounded-xl hover:bg-red-50 transition-all border border-slate-200"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatBotManager;
