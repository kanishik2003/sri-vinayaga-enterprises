import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Edit2,
    Save,
    X,
    Camera,
    ChevronLeft,
    CheckCircle2,
    LogOut,
    Clock,
    Shield,
    Globe,
    Languages,
    MessageSquare,
    ChevronRight,
    TrendingUp,
    Upload,
    Loader
} from 'lucide-react';
import './userprofile.css';

// --- CLOUDINARY CONFIG ---
const CLOUDINARY_CLOUD_NAME = 'davodo3rr';
const CLOUDINARY_UPLOAD_PRESET = 'granite_upload';

// Firebase imports
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import ParticleBackground from '../components/ParticleBackground';

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        dob: '',
        district: '',
        country: '',
        language: 'English',
        jobRole: 'Client Architect',
        profilePhoto: '',
        loginLog: [],
        createdAt: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const baseline = {
                    name: currentUser.displayName || 'Architect User',
                    email: currentUser.email || '',
                    phone: '',
                    address: '',
                    dob: '',
                    district: '',
                    country: '',
                    language: 'English',
                    jobRole: 'Client Architect',
                    profilePhoto: currentUser.photoURL || '',
                    loginLog: [new Date().toISOString()],
                    createdAt: currentUser.metadata.creationTime || new Date().toISOString()
                };
                setProfileData(baseline);

                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const existingData = docSnap.data();
                        const updatedLoginLog = [new Date().toISOString(), ...(existingData.loginLog || [])].slice(0, 10);

                        setProfileData(prev => ({ ...prev, ...existingData, loginLog: updatedLoginLog }));

                        // Sync back the updated login log
                        await setDoc(docRef, { loginLog: updatedLoginLog }, { merge: true });
                    } else {
                        try {
                            await setDoc(docRef, baseline, { merge: true });
                        } catch (e) {
                            console.warn("Sync Restricted. Local values only.");
                        }
                    }
                } catch (err) {
                    if (err.code === 'permission-denied') {
                        setMessage({ type: 'error', text: 'Database restricted. Using local cache.' });
                    }
                }
            } else {
                navigate('/login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingPhoto(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setProfileData(prev => ({ ...prev, profilePhoto: data.secure_url }));
            setMessage({ type: 'success', text: 'Identity Frame Uploaded.' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Image Transmission Failure.' });
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setMessage({ type: '', text: '' });

        try {
            await updateProfile(auth.currentUser, {
                displayName: profileData.name,
                photoURL: profileData.profilePhoto
            });

            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                ...profileData,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            setMessage({ type: 'success', text: 'Profile Vault Secured.' });
            setIsEditing(false);
        } catch (err) {
            setMessage({ type: 'error', text: 'Cloud update failed.' });
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isAdmin');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="profile-loading-overlay">
                <div className="loader-box">
                    <div className="spinning-ring"></div>
                    <p className="loading-tag">SYNCHRONIZING PORTFOLIO</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="profile-page-wrapper"
        >
            <ParticleBackground />
            <div className="page-background-accents">
                <div className="accent-blob accent-1"></div>
                <div className="accent-blob accent-2"></div>
            </div>

            <div className="profile-content-container">
                {/* Header Navigation */}
                <nav className="profile-top-nav">
                    <Link to="/" className="nav-back-button">
                        <ChevronLeft size={20} />
                        <span>RETURN HOME</span>
                    </Link>
                    <div className="nav-actions">
                        <button onClick={handleLogout} className="top-logout-btn">
                            <LogOut size={16} />
                            LOGOUT
                        </button>
                    </div>
                </nav>

                <div className="profile-main-grid">
                    {/* Left Column: Identity & Chats */}
                    <motion.aside
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="profile-sidebar"
                    >
                        {/* Profile Summary Card */}
                        <div className="studio-card account-card shadow-lg">
                            <div className="avatar-section">
                                <div className="avatar-frame-studio">
                                    <img
                                        src={profileData.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}`}
                                        alt="User Avatar"
                                    />
                                    {isEditing && (
                                        <label className="avatar-edit-overlay cursor-pointer">
                                            {uploadingPhoto ? (
                                                <Loader className="animate-spin" size={20} />
                                            ) : (
                                                <>
                                                    <Camera size={20} />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handlePhotoUpload}
                                                    />
                                                </>
                                            )}
                                        </label>
                                    )}
                                </div>
                                <div className="status-badge-modern">
                                    <div className="dot pulse"></div>
                                    ACTIVE ARCHITECT
                                </div>
                            </div>

                            <h2 className="profile-name-display">{profileData.name || 'Granite Expert'}</h2>
                            <p className="profile-email-display">{profileData.email}</p>

                            <div className="user-role-badge">
                                {profileData.jobRole || (localStorage.getItem('isAdmin') === 'true' ? 'SYSTEM CURATOR' : 'CLIENT ARCHITECT')}
                            </div>

                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="edit-trigger-btn">
                                    <Edit2 size={14} />
                                    <span>MODIFY ENTITY</span>
                                </button>
                            )}
                        </div>

                        {/* Chats Section */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="studio-card chats-card shadow-lg"
                        >
                            <div className="card-heading-box">
                                <MessageSquare size={16} />
                                <h3>ACTIVE STREAMS</h3>
                            </div>
                            <div className="chats-list">
                                <div className="chat-preview-item">
                                    <div className="chat-icon-box">GD</div>
                                    <div className="chat-text">
                                        <p className="chat-title">Granite Dispatch</p>
                                        <p className="chat-subtitle">Slab #402 delivery update...</p>
                                    </div>
                                    <span className="chat-meta">2m</span>
                                </div>
                                <div className="chat-preview-item">
                                    <div className="chat-icon-box blue">AI</div>
                                    <div className="chat-text">
                                        <p className="chat-title">Atelier Assistant</p>
                                        <p className="chat-subtitle">Material estimation ready.</p>
                                    </div>
                                    <span className="chat-meta">1h</span>
                                </div>
                            </div>
                            <button className="view-chats-btn">OPEN MESSENGER</button>
                        </motion.div>

                        {/* Security Info & Login History */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                            className="studio-card security-card shadow-sm"
                        >
                            <div className="security-stat-group">
                                <div className="security-stat main-stat">
                                    <Clock size={16} />
                                    <span>ENROLLED: {new Date(profileData.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>
                                <div className="login-history-divider"></div>
                                <h4 className="login-history-title">RECENT LOGIN SESSIONS (LAST 10)</h4>
                                <div className="login-log-list">
                                    {profileData.loginLog && profileData.loginLog.length > 0 ? (
                                        profileData.loginLog.map((log, index) => (
                                            <div key={index} className="login-log-item">
                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                <span>{new Date(log).toLocaleString([], {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="no-logs">Scanning for login traces...</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.aside>

                    {/* Right Column: Detailed Information Form */}
                    <motion.main
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="profile-details-area"
                    >
                        <AnimatePresence>
                            {message.text && (
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={`modern-toast ${message.type}`}
                                >
                                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
                                    <span>{message.text}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="studio-card details-form-card shadow-xl">
                            <div className="details-header">
                                <div className="header-label">
                                    <Shield size={20} className="text-blue-500" />
                                    <h2>PROFILE</h2>
                                </div>
                                {isEditing && (
                                    <button onClick={() => setIsEditing(false)} className="cancel-edit-btn">
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSave} className="modern-profile-form">
                                <div className="form-sections-grid">
                                    {/* Personal Identity */}
                                    <div className="form-column">
                                        <div className="section-subtitle">IDENTITY & ORIGIN</div>
                                        <div className="modern-input-group">
                                            <label><User size={12} /> Full Identity</label>
                                            <input
                                                type="text"
                                                name="name"
                                                disabled={!isEditing}
                                                value={profileData.name}
                                                onChange={handleChange}
                                                placeholder="Aiden Architect"
                                            />
                                        </div>
                                        <div className="modern-input-group">
                                            <label><Shield size={12} /> Job Role / Designation</label>
                                            <input
                                                type="text"
                                                name="jobRole"
                                                disabled={!isEditing}
                                                value={profileData.jobRole}
                                                onChange={handleChange}
                                                placeholder="Senior Architect"
                                            />
                                        </div>
                                        <div className="modern-input-group">
                                            <label><Calendar size={12} /> Date of Birth</label>
                                            <input
                                                type="date"
                                                name="dob"
                                                disabled={!isEditing}
                                                value={profileData.dob}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="modern-input-group">
                                            <label><Languages size={12} /> Dialect / Language</label>
                                            <input
                                                type="text"
                                                name="language"
                                                disabled={!isEditing}
                                                value={profileData.language}
                                                onChange={handleChange}
                                                placeholder="English (Global)"
                                            />
                                        </div>
                                    </div>

                                    {/* Location & Contact */}
                                    <div className="form-column">
                                        <div className="section-subtitle">REGIONAL COORDINATES</div>
                                        <div className="modern-input-group">
                                            <label><Globe size={12} /> Country</label>
                                            <input
                                                type="text"
                                                name="country"
                                                disabled={!isEditing}
                                                value={profileData.country}
                                                onChange={handleChange}
                                                placeholder="United States"
                                            />
                                        </div>
                                        <div className="modern-input-group">
                                            <label><MapPin size={12} /> District / Region</label>
                                            <input
                                                type="text"
                                                name="district"
                                                disabled={!isEditing}
                                                value={profileData.district}
                                                onChange={handleChange}
                                                placeholder="New York"
                                            />
                                        </div>
                                        <div className="modern-input-group">
                                            <label><MapPin size={12} /> Primary Address</label>
                                            <input
                                                type="text"
                                                name="address"
                                                disabled={!isEditing}
                                                value={profileData.address}
                                                onChange={handleChange}
                                                placeholder="42 Marble Street"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-bottom-divider"></div>

                                <div className="full-width-inputs">
                                    <div className="modern-input-group">
                                        <label><Mail size={12} /> Correspondence Email</label>
                                        <input
                                            type="email"
                                            disabled={true}
                                            value={profileData.email}
                                            className="locked-field"
                                        />
                                    </div>
                                    <div className="modern-input-group">
                                        <label><Phone size={12} /> Frequency (Phone)</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            disabled={!isEditing}
                                            value={profileData.phone}
                                            onChange={handleChange}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="form-action-footer">
                                        <div className="vault-id">
                                            <TrendingUp size={14} className="text-slate-400" />
                                            <span>Secure Hash: {user?.uid.substring(0, 8)}...</span>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={updating}
                                            className="modern-save-button"
                                        >
                                            {updating ? <div className="mini-spin"></div> : <Save size={18} />}
                                            UPDATE PROFILE
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </motion.main>
                </div>
            </div>
        </motion.div>
    );
};

export default UserProfile;
