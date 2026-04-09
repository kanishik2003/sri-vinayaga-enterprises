import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Headphones } from 'lucide-react';
import './ChatBot.css';
import { db } from '../../firebase';
import {
    collection, addDoc, serverTimestamp,
    doc, setDoc, onSnapshot, query, orderBy
} from 'firebase/firestore';

const AdminChatBot = ({ isOpen, onClose, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);

    const chatId = currentUser
        ? currentUser.uid
        : (localStorage.getItem('adminChatSessionId') || `guest_admin_${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (!currentUser && !localStorage.getItem('adminChatSessionId')) {
            localStorage.setItem('adminChatSessionId', chatId);
        }
    }, [chatId, currentUser]);

    useEffect(() => {
        if (!isOpen || !chatId) return;

        const q = query(collection(db, 'customer_queries', chatId, 'messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            if (msgs.length === 0) {
                const welcome = "Hello! Send a direct message to our Admin team. How can we help you today with your architectural queries?";
                setMessages([{ id: 'welcome', text: welcome, sender: 'admin', timestamp: new Date() }]);
                await saveMessage(welcome, 'admin');
            } else {
                setMessages(msgs);
            }
        }, (error) => {
            console.error('Firebase listen error:', error);
            setMessages(prev => {
                if (prev.length === 0) {
                    return [{ 
                        id: 'welcome', 
                        text: "Hello! Send a direct message to our Admin team. How can we help you today with your architectural queries?", 
                        sender: 'admin', 
                        timestamp: new Date() 
                    }];
                }
                return prev;
            });
        });
        return () => unsubscribe();
    }, [chatId, isOpen]);

    useEffect(() => {
        if (messages.length > 0 && chatId) {
            const sessionRef = doc(db, 'customer_queries', chatId);
            setDoc(sessionRef, {
                userId: currentUser ? currentUser.uid : null,
                userName: currentUser ? (currentUser.displayName || currentUser.email) : 'Guest Client',
                userPhoto: currentUser ? currentUser.photoURL : null,
                email: currentUser ? currentUser.email : 'guest@client.com',
                lastMessage: messages[messages.length - 1].text,
                lastUpdated: serverTimestamp(),
                messagesCount: messages.length,
            }, { merge: true }).catch(err => {
                console.error('Error updating query session:', err);
            });
        }
    }, [messages, chatId, currentUser]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const saveMessage = async (text, sender) => {
        try {
            await addDoc(collection(db, 'customer_queries', chatId, 'messages'), {
                text,
                sender,
                timestamp: serverTimestamp()
            });
        } catch (err) {
            console.error('Error saving message:', err);
            setMessages(prev => {
                if (prev.some(m => m.text === text && m.sender === sender)) return prev;
                return [...prev, { id: Date.now().toString(), text, sender, timestamp: new Date() }];
            });
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const userText = input.trim();
        setInput('');
        
        await saveMessage(userText, 'user');
        
        // Setting status to Pending when user sends message
        const sessionRef = doc(db, 'customer_queries', chatId);
        
        // If it's the first actual user message, set it as topic
        setDoc(sessionRef, {
            status: 'Pending',
            topic: userText.substring(0, 30) + (userText.length > 30 ? '...' : ''),
            lastUpdated: serverTimestamp()
        }, { merge: true });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 100 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 100 }}
                    className="chatbot-container z-[1100]"
                >
                    <div className="chatbot-header bg-slate-900 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white shadow-lg">
                                <Headphones size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm tracking-widest flex items-center gap-1">
                                    ADMIN DIRECT
                                </h3>
                                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span>
                                    Staff Online
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="chatbot-messages" ref={scrollRef}>
                        {messages.map((m) => (
                            <div key={m.id} className={`message-wrapper ${m.sender === 'bot' || m.sender === 'admin' ? 'admin' : 'user'}`}>
                                <div className={`message-bubble ${m.sender === 'bot' || m.sender === 'admin' ? 'bg-slate-800 text-white border border-slate-700' : 'bg-blue-600 text-white'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="chatbot-input bg-slate-900 border-t border-white/10 p-4 flex gap-2">
                        <input
                            type="text"
                            placeholder="Message Admin..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        />
                        <button
                            onClick={handleSend}
                            className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 transition-colors shrink-0 disabled:opacity-50"
                            disabled={!input.trim()}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AdminChatBot;
