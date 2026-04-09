import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, Sparkles } from 'lucide-react';
import './ChatBot.css';
import { db } from '../../firebase';
import {
    collection, addDoc, serverTimestamp,
    doc, setDoc, onSnapshot, query, orderBy
} from 'firebase/firestore';
import { buildSystemPrompt, searchProducts } from './knowledgeBase';

const BACKEND_URL = 'http://localhost:3001';

const ChatBot = ({ isOpen, onClose, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [products, setProducts] = useState([]);
    const [sessionKey, setSessionKey] = useState(Math.random().toString(36).substr(2, 9));
    const scrollRef = useRef(null);

    // Update sessionKey when user changes (login/logout) to start fresh per session
    useEffect(() => {
        setSessionKey(Math.random().toString(36).substr(2, 9));
    }, [currentUser?.uid]);

    // Fetch live products for context (Real-time sync)
    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("graniteName", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const prodList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(prodList);
        });
        return () => unsubscribe();
    }, []);

    // Unique chat session ID - resets on user change to start fresh
    const chatId = currentUser
        ? `${currentUser.uid}_${sessionKey}`
        : (localStorage.getItem('chatSessionId') || `guest_${sessionKey}`);

    useEffect(() => {
        if (!currentUser && !localStorage.getItem('chatSessionId')) {
            localStorage.setItem('chatSessionId', chatId);
        }
    }, [chatId, currentUser]);

    // Load messages from Firebase in real-time
    useEffect(() => {
        if (!isOpen || !chatId) return;

        const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            if (msgs.length === 0) {
                const welcome = "👋 Welcome to SRI VINAYAGA ENTERPRISES! I'm your AI granite expert. I can help you find the best granite for your project from our vast collection!";
                setMessages([{ id: 'welcome', text: welcome, sender: 'bot', timestamp: new Date() }]);
                await saveMessage(welcome, 'bot');
            } else {
                setMessages(msgs);
                let history = msgs
                    .filter(m => m.text && m.sender)
                    .map(m => ({
                        role: m.sender === 'user' ? 'user' : 'model',
                        parts: [{ text: m.text }]
                    }));
                
                while (history.length > 0 && history[0].role === 'model') {
                    history.shift();
                }

                setChatHistory(history);
            }
        }, (error) => {
            console.error('Firebase listen error:', error);
        });
        return () => unsubscribe();
    }, [chatId, isOpen]);

    // Sync session info
    useEffect(() => {
        if (messages.length > 0 && chatId) {
            const sessionRef = doc(db, 'chats', chatId);
            setDoc(sessionRef, {
                userId: currentUser ? currentUser.uid : null,
                userName: currentUser ? (currentUser.displayName || currentUser.email) : 'Guest User',
                userPhoto: currentUser ? currentUser.photoURL : null,
                lastMessage: messages[messages.length - 1].text,
                lastUpdated: serverTimestamp(),
                messagesCount: messages.length,
                status: 'active'
            }, { merge: true }).catch(err => {
                console.error('Error updating session:', err);
            });
        }
    }, [messages, chatId, currentUser]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const saveMessage = async (text, sender) => {
        try {
            await addDoc(collection(db, 'chats', chatId, 'messages'), {
                text,
                sender,
                timestamp: serverTimestamp()
            });
        } catch (err) {
            console.error('Error saving message:', err);
        }
    };

    // 🤖 Call backend AI proxy with Retrieval-Based system (RAG)
    const callAI = async (userMessage) => {
        try {
            // STEP 1: RETRIEVAL
            // Search for products that match the user's intent
            const relevantProducts = searchProducts(userMessage, products);
            
            // Build prompt with only relevant products
            const dynamicSystemPrompt = buildSystemPrompt(relevantProducts);

            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: chatHistory.slice(0, -1),
                    systemPrompt: dynamicSystemPrompt
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error?.includes('quota') || response.status === 500) {
                    return await getLocalFallback(userMessage);
                }
                throw new Error(data.error || 'Backend error');
            }

            return data.reply;
        } catch (error) {
            console.error('Chat error:', error.message);
            return await getLocalFallback(userMessage);
        }
    };

    // 📚 Search local Firestore knowledge base if AI fails
    const getLocalFallback = async (queryText) => {
        try {
            const lowerQuery = queryText.toLowerCase();
            
            // Check for product-related keywords
            const isProductQuery = ['product', 'granite', 'slabs', 'available', 'items'].some(k => lowerQuery.includes(k));
            const isPriceQuery = ['price', 'cost', 'rate', 'sqft'].some(k => lowerQuery.includes(k));

            if (isProductQuery) {
                if (products.length > 0) {
                    const names = products.map(p => p.graniteName || p.name).join(', ');
                    return `Currently, our project features these products: ${names}. For more details, you can visit the Products page.`;
                }
                return "We have various premium granite solutions in our catalog. Check our Products gallery for the current stock!";
            }

            if (isPriceQuery) {
                if (products.length > 0) {
                    const priceInfo = products.map(p => `${p.graniteName || p.name} is ₹${p.pricePerSqft || 'TBD'}/sqft`).join('. ');
                    return `Here is some pricing info: ${priceInfo}.`;
                }
                return "Our prices typically range from ₹140 to ₹250 per sqft depending on the design.";
            }

            // Universal contact fallback
            const isContactQuery = ['contact', 'email', 'phone', 'location', 'address'].some(k => lowerQuery.includes(k));
            if (isContactQuery) {
                return "You can reach SRI VINAYAGA ENTERPRISES at +91 7530017411 or email appavum73@gmail.com. We are located in Salem, Tamil Nadu.";
            }

            return "I'm having a brief connection issue with my AI brain, but here's what I know: We provide premium granite solutions. Type 'products' to see our list or 'contact' to speak with us!";
        } catch (err) {
            return "I'm sorry, I'm currently unavailable. Please contact us at appavum73@gmail.com.";
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userText = input.trim();
        setInput('');
        await saveMessage(userText, 'user');
        setIsTyping(true);

        const aiReply = await callAI(userText);
        await saveMessage(aiReply, 'bot');
        setIsTyping(false);
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
                    className="chatbot-container"
                >
                    <div className="chatbot-header">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center text-white shadow-lg">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm tracking-widest uppercase flex items-center gap-1">
                                    SRI VINAYAGA AI
                                    <Sparkles size={12} className="text-yellow-300" />
                                </h3>
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                    Gemini AI • Online
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="chatbot-messages" ref={scrollRef}>
                        {messages.map((m) => (
                            <div key={m.id} className={`message-wrapper ${m.sender}`}>
                                <div className="message-bubble">{m.text}</div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="message-wrapper bot">
                                <div className="message-bubble typing">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="chatbot-input">
                        <input
                            type="text"
                            placeholder="Ask about products, prices, exports..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isTyping}
                        />
                        <button onClick={handleSend} className="send-btn" disabled={isTyping || !input.trim()}>
                            <Send size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ChatBot;
