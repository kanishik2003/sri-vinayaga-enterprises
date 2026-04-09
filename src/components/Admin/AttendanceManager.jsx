import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    UserCheck,
    UserX,
    Search,
    Clock,
    Filter,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Smartphone
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, serverTimestamp, orderBy, where, onSnapshot } from 'firebase/firestore';
import {
    Plus,
    Trash2,
    Edit2,
    Upload,
    Loader,
    Briefcase,
    User as UserIcon,
    Contact,
    Wallet,
    CalendarDays,
    X
} from 'lucide-react';

const AttendanceManager = () => {
    const [view, setView] = useState('attendance'); // 'attendance', 'directory', or 'salary'
    const [staff, setStaff] = useState([]);
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Staff Profile State
    const [profileModal, setProfileModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        role: '',
        address: '',
        dob: '',
        gender: 'Male',
        joiningDate: '',
        resignDate: '',
        phone: '',
        gpay: '',
        imageUrl: ''
    });

    // Calendar Modal State
    const [selectedStaffForCalendar, setSelectedStaffForCalendar] = useState(null);
    const [personalLogs, setPersonalLogs] = useState([]);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [activeDateEditor, setActiveDateEditor] = useState(null); // { date: string, log: object }
    const [dateFormData, setDateFormData] = useState({ status: 'Present', hoursWorked: 8, reason: '' });
    const [isEditingEntry, setIsEditingEntry] = useState(false);

    // Salary Management State
    const [selectedSalaryOrder, setSelectedSalaryOrder] = useState(null);
    const [selectedStaffForOrder, setSelectedStaffForOrder] = useState(null);
    const [salaryOrders, setSalaryOrders] = useState([]);
    const [salaryLogs, setSalaryLogs] = useState([]);
    const [orderFormData, setOrderFormData] = useState({ name: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] });
    const [disbursementFormData, setDisbursementFormData] = useState({ label: '', amount: '', type: 'Advance Payment', date: new Date().toISOString().split('T')[0], paymentType: 'Manual' });
    const [showOrderModal, setShowOrderModal] = useState(false);

    useEffect(() => {
        if (!selectedStaffForCalendar) return;

        const unsubscribe = onSnapshot(
            collection(db, "attendance", selectedStaffForCalendar.id, "records"),
            (snap) => {
                const data = snap.docs.map(doc => ({ id: doc.id, date: doc.id, ...doc.data() }));
                data.sort((a, b) => b.date.localeCompare(a.date));
                setPersonalLogs(data);
            },
            (err) => console.error("personalLogs error:", err)
        );

        return () => unsubscribe();
    }, [selectedStaffForCalendar]);

    useEffect(() => {
        const qOrders = query(collection(db, "salary_orders"));
        const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
            setSalaryOrders(data);
        }, (err) => console.error("salaryOrders error:", err));
        return () => unsubscribeOrders();
    }, []);

    useEffect(() => {
        if (!selectedSalaryOrder) return;
        const qLogs = query(collection(db, "salary_logs"), where("orderId", "==", selectedSalaryOrder.id));
        const unsubscribeLogs = onSnapshot(qLogs, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            setSalaryLogs(data);
        }, (err) => console.error("salaryLogs error:", err));
        return () => unsubscribeLogs();
    }, [selectedSalaryOrder]);

    useEffect(() => {
        // ✅ No orderBy on timestamp — sort client-side
        const unsubscribe = onSnapshot(collection(db, "staff_profiles"), (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setStaff(data);
        }, (err) => console.error("staff_profiles error:", err));

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (staff.length === 0) {
            return;
        }

        const unsubscribes = [];
        const logsData = {};

        staff.forEach(s => {
            const unsub = onSnapshot(
                doc(db, "attendance", s.id, "records", selectedDate),
                (docSnap) => {
                    if (docSnap.exists()) {
                        logsData[s.id] = { id: selectedDate, userId: s.id, date: selectedDate, ...docSnap.data() };
                    } else {
                        delete logsData[s.id];
                    }
                    setLogs(Object.values(logsData));
                },
                (err) => console.error("logs error:", err)
            );
            unsubscribes.push(unsub);
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, [selectedDate, staff]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            if (staff.length >= 10 && !editingProfile) {
                alert("Maximum limit of 10 staff profiles reached.");
                return;
            }

            if (editingProfile) {
                await updateDoc(doc(db, "staff_profiles", editingProfile.id), {
                    ...profileData,
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, "staff_profiles"), {
                    ...profileData,
                    createdAt: serverTimestamp()
                });
            }
            setProfileModal(false);
            setEditingProfile(null);
            setProfileData({ name: '', role: '', address: '', dob: '', gender: 'Male', joiningDate: '', resignDate: '', phone: '', gpay: '', imageUrl: '' });
        } catch (err) {
            console.error("Error saving profile:", err);
        }
    };

    const handleDeleteProfile = async (id) => {
        if (window.confirm("Delete this staff profile?")) {
            try {
                await deleteDoc(doc(db, "staff_profiles", id));
            } catch (err) {
                console.error("Error deleting profile:", err);
            }
        }
    };

    const handleImageUpload = async (file) => {
        setUploading(true);
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "granite_preset"); // Ensure this matches your Cloudinary preset

        try {
            const res = await fetch("https://api.cloudinary.com/v1_1/dr6m9tcti/image/upload", {
                method: "POST",
                body: data
            });
            const fileData = await res.json();
            setProfileData({ ...profileData, imageUrl: fileData.secure_url });
        } catch (err) {
            console.error("Image upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    const handleMarkAttendance = async (user, status, data = {}, forDate = null) => {
        const targetDate = forDate || selectedDate;
        try {
            await setDoc(doc(db, "attendance", user.id, "records", targetDate), {
                status: status,
                hoursWorked: Number(data.hoursWorked) || 0,
                reason: data.reason || '',
                timestamp: serverTimestamp()
            });
        } catch (err) {
            console.error("Error marking attendance:", err);
        }
    };

    const openEditModal = (s) => {
        setEditingProfile(s);
        setProfileData({
            name: s.name,
            role: s.role,
            address: s.address,
            dob: s.dob,
            gender: s.gender || 'Male',
            joiningDate: s.joiningDate,
            resignDate: s.resignDate || '',
            phone: s.phone,
            gpay: s.gpay || '',
            imageUrl: s.imageUrl || ''
        });
        setProfileModal(true);
    };

    const filteredStaff = staff.filter(s =>
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusForStaff = (userId) => {
        const log = logs.find(l => l.userId === userId);
        return log ? log.status : null;
    };

    const PersonalCalendar = ({ logs, currentMonth, onDateClick }) => {
        const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
        const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const days = [];

        for (let i = 0; i < startDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth(year, month); i++) days.push(i);

        const getStatusForDate = (day) => {
            if (!day) return null;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const log = logs.find(l => l.date === dateStr);
            return log ? log : null;
        };

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        return (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-black italic uppercase tracking-tighter text-slate-800">{monthNames[month]} {year}</h4>
                    <div className="flex gap-2">
                        <button onClick={() => setCalendarDate(new Date(year, month - 1))} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><ChevronLeft size={18} /></button>
                        <button onClick={() => setCalendarDate(new Date(year, month + 1))} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><ChevronRight size={18} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <div key={d} className="text-[9px] font-black text-slate-300 uppercase text-center tracking-widest">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, idx) => {
                        const log = getStatusForDate(day);
                        const status = log?.status;
                        return (
                            <div
                                key={idx}
                                onClick={() => day && onDateClick(day, log)}
                                className={`h-11 flex flex-col items-center justify-center rounded-xl text-[10px] font-bold transition-all cursor-pointer relative group ${!day ? 'bg-transparent' :
                                        status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                                            status === 'Absent' ? 'bg-red-50 text-red-600' :
                                                'bg-slate-50 text-slate-300 hover:bg-slate-100'
                                    }`}
                            >
                                {day}
                                {log?.hoursWorked > 0 && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-400 rounded-full" title={`${log.hoursWorked} hours`} />}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const exportAttendanceToCSV = () => {
        const header = ["Name", "Phone", "Role", "Status", "Hours Worked", "Reason", "Date"];
        const rows = staff.map(s => {
            const log = logs.find(l => l.userId === s.id);
            return [
                `"${s.name || 'Anonymous'}"`,
                `"${s.phone || ''}"`,
                `"${s.role || ''}"`,
                `"${log ? log.status : 'Pending'}"`,
                log?.hoursWorked || 0,
                `"${log?.reason || ''}"`,
                selectedDate
            ];
        });

        const csvContent = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_export_${selectedDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportOrderReportToCSV = async (order) => {
        try {
            const startDate = order.startDate;
            const endDate = order.endDate || new Date().toISOString().split('T')[0];
            const reportData = [];
            
            for (const s of staff) {
                const qRef = query(collection(db, "attendance", s.id, "records"), where("__name__", ">=", startDate), where("__name__", "<=", endDate));
                const snap = await getDocs(qRef);
                const records = snap.docs.map(doc => doc.data());
                
                const presentDays = records.filter(r => r.status === 'Present').length;
                const absentDays = records.filter(r => r.status === 'Absent').length;
                const totalHours = records.reduce((acc, curr) => acc + (Number(curr.hoursWorked) || 0), 0);
                
                const specificLogs = salaryLogs.filter(l => l.userId === s.id);
                const totalAdvance = specificLogs.filter(l => l.type === 'Advance Payment').reduce((c, l) => c + Number(l.amount), 0);
                const totalSalary = specificLogs.filter(l => l.type === 'Salary Payment').reduce((c, l) => c + Number(l.amount), 0);
                const finalAmount = totalAdvance + totalSalary;
                
                reportData.push([
                    `"${s.name || 'Anonymous'}"`,
                    `"${s.role || ''}"`,
                    `"${startDate} to ${endDate}"`,
                    presentDays,
                    absentDays,
                    totalHours,
                    totalAdvance,
                    totalSalary,
                    finalAmount
                ]);
            }
            
            const header = ["Staff Name", "Role", "Date Range", "Days Present", "Days Absent", "Total Hours Worked", "Total Advance", "Total Salary", "Total Net Pay"];
            const csvContent = [header.join(","), ...reportData.map(r => r.join(","))].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Order_Report_${order.name.replace(/\s+/g, '_')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Aggregation Failed:", err);
            alert("Failed to compile order report.");
            throw err;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* View Toggle */}
            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => setView('attendance')}
                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'attendance' ? 'bg-slate-900 text-white shadow-xl italic' : 'bg-white text-slate-400 border border-slate-100'}`}
                >
                    Daily Registry
                </button>
                <button
                    onClick={() => setView('directory')}
                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'directory' ? 'bg-slate-900 text-white shadow-xl italic' : 'bg-white text-slate-400 border border-slate-100'}`}
                >
                    Staff Directory
                </button>
                <button
                    onClick={() => setView('salary')}
                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'salary' ? 'bg-slate-900 text-white shadow-xl italic' : 'bg-white text-slate-400 border border-slate-100'}`}
                >
                    Salary Ledger
                </button>
            </div>

            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Enrolled Agents</p>
                        <h3 className="text-3xl font-black text-slate-900 italic uppercase">{(staff || []).length} <span className="text-xs text-slate-300 font-normal">/ 10</span></h3>
                    </div>
                    <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                        <Smartphone size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Operational</p>
                        <h3 className="text-3xl font-black text-emerald-500 italic uppercase">{logs.filter(l => l.status === 'Present').length}</h3>
                    </div>
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                        <UserCheck size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Off-Duty</p>
                        <h3 className="text-3xl font-black text-red-500 italic uppercase">{logs.filter(l => l.status === 'Absent').length}</h3>
                    </div>
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                        <UserX size={24} />
                    </div>
                </div>
            </div>

            {view === 'attendance' ? (
                /* Attendance Registry */
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                <CalendarIcon size={24} className="text-blue-500" /> Daily Protocol Ledger
                            </h3>
                            <p className="text-sm text-slate-400 font-medium tracking-wide italic uppercase mt-1">Real-time status monitoring system</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search identity..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-xs w-full md:w-64"
                                />
                            </div>
                            <button
                                onClick={exportAttendanceToCSV}
                                className="px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm italic flex items-center gap-2"
                            >
                                <Plus size={14} className="rotate-45" /> Export Registry
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                                    <th className="px-10 py-6">Identity Profile</th>
                                    <th className="px-10 py-6">Assigned Role</th>
                                    <th className="px-10 py-6">Current Status</th>
                                    <th className="px-10 py-6 text-right">Vault Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-20 font-bold tracking-widest text-slate-300 uppercase italic">No entities found for tracking</td>
                                    </tr>
                                ) : (
                                    filteredStaff.map((s) => {
                                        const status = getStatusForStaff(s.id);
                                        const log = logs.find(l => l.userId === s.id);
                                        return (
                                            <tr key={s.id} className="hover:bg-slate-50/80 transition-all group">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedStaffForCalendar(s)}>
                                                        <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-sm overflow-hidden transform group-hover:scale-110 transition-transform bg-slate-100">
                                                            <img src={s.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <div className="font-extrabold text-slate-900 uppercase italic tracking-tight group-hover:text-blue-500 transition-colors">{s.name || 'ANONYMOUS AGENT'}</div>
                                                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{s.phone}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="text-[10px] font-black uppercase text-blue-500 tracking-wider flex items-center gap-2">
                                                        <Briefcase size={12} /> {s.role}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    {status ? (
                                                        <div className="space-y-1">
                                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                                                                    status === 'Absent' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                                                                }`}>
                                                                {status === 'Present' ? <CheckCircle2 size={12} /> : status === 'Absent' ? <XCircle size={12} /> : <Clock size={12} />}
                                                                {status}
                                                            </span>
                                                            {log && log.timestamp && <div className="text-[8px] text-slate-400 font-bold uppercase ml-1 italic">{log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 font-bold uppercase italic tracking-widest">Protocol Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <button onClick={() => setSelectedStaffForCalendar(s)} className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-sm italic">
                                                        View Archive
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : view === 'salary' ? (
                /* Salary Ledger View (Order Centric) */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20">
                    {/* ORDER LIST COLUMN */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black italic uppercase tracking-tight mb-6 flex items-center gap-3">
                                <Wallet size={20} className="text-blue-500" /> Salary Orders
                            </h3>
                            <button
                                onClick={() => setShowOrderModal(true)}
                                className="w-full mb-6 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-xl italic flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Create Order
                            </button>
                            <div className="space-y-3">
                                {salaryOrders.map(order => (
                                    <div
                                        key={order.id}
                                        onClick={() => { setSelectedSalaryOrder(order); setSelectedStaffForOrder(null); }}
                                        className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer ${selectedSalaryOrder?.id === order.id ? 'bg-slate-900 border-slate-900 shadow-lg' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}
                                    >
                                        <div className={`text-[12px] font-black uppercase tracking-tight ${selectedSalaryOrder?.id === order.id ? 'text-white italic' : 'text-slate-900'}`}>{order.name}</div>
                                        <div className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${selectedSalaryOrder?.id === order.id ? 'text-blue-400' : 'text-slate-400'}`}>{order.startDate} - {order.endDate}</div>
                                        {order.status === 'Finished' && <span className="inline-block mt-3 px-3 py-1 bg-slate-100/20 text-blue-300 text-[8px] font-black uppercase tracking-widest rounded-lg">Sealed</span>}
                                    </div>
                                ))}
                                {salaryOrders.length === 0 && (
                                    <div className="text-[10px] text-center font-bold text-slate-300 uppercase tracking-widest italic py-4">No Orders Created</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* STAFF IN ORDER COLUMN */}
                    <div className="lg:col-span-3 space-y-6">
                        {selectedSalaryOrder ? (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[500px]">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center"><Wallet size={24} /></div>
                                        <div>
                                            <h4 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">{selectedSalaryOrder.name}</h4>
                                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">{selectedSalaryOrder.startDate} to {selectedSalaryOrder.endDate}</p>
                                        </div>
                                    </div>
                                    {selectedSalaryOrder.status !== 'Finished' ? (
                                        <button
                                            onClick={async (e) => {
                                                if (!window.confirm("Seal this order? A global Excel report will be securely initiated.")) return;
                                                const btn = e.currentTarget;
                                                const originalText = btn.innerText;
                                                btn.innerText = "Exporting...";
                                                btn.disabled = true;

                                                try {
                                                    await exportOrderReportToCSV(selectedSalaryOrder);
                                                    await updateDoc(doc(db, "salary_orders", selectedSalaryOrder.id), { status: 'Finished' });
                                                    setSelectedSalaryOrder(prev => ({ ...prev, status: 'Finished' }));
                                                } catch (err) {
                                                    console.error("End Order Failed", err);
                                                } finally {
                                                    btn.innerText = originalText;
                                                    btn.disabled = false;
                                                }
                                            }}
                                            className="px-6 py-3 bg-red-50 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all italic shadow-sm"
                                        >End Order</button>
                                    ) : (
                                        <button
                                            onClick={async (e) => {
                                                const btn = e.currentTarget;
                                                const originalText = btn.innerText;
                                                btn.innerText = "Loading...";
                                                btn.disabled = true;
                                                try {
                                                    await exportOrderReportToCSV(selectedSalaryOrder);
                                                } finally {
                                                    btn.innerText = originalText;
                                                    btn.disabled = false;
                                                }
                                            }}
                                            className="px-6 py-3 bg-blue-50 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 hover:text-white transition-all italic shadow-sm"
                                        >Download Report</button>
                                    )}
                                </div>

                                {/* IF A STAFF IS SELECTED */}
                                {selectedStaffForOrder ? (
                                    <div className="animate-in fade-in zoom-in-95 duration-300">
                                        <div className="flex items-center gap-4 mb-8">
                                            <button onClick={() => setSelectedStaffForOrder(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"><ChevronLeft size={20} /></button>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-sm border border-slate-100">
                                                    <img src={selectedStaffForOrder.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStaffForOrder.id}`} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h5 className="text-lg font-black italic uppercase text-slate-900">{selectedStaffForOrder.name}</h5>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedStaffForOrder.role}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Left side: Advanced & Salary forms */}
                                            {selectedSalaryOrder.status !== 'Finished' ? (
                                                <div className="space-y-6">
                                                    <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl w-full">
                                                        <button onClick={() => setDisbursementFormData({ ...disbursementFormData, type: 'Advance Payment' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${disbursementFormData.type === 'Advance Payment' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 opacity-60'}`}>Advance</button>
                                                        <button onClick={() => setDisbursementFormData({ ...disbursementFormData, type: 'Salary Payment' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${disbursementFormData.type === 'Salary Payment' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 opacity-60'}`}>Salary</button>
                                                    </div>

                                                    <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Date</label>
                                                            <input type="date" value={disbursementFormData.date} onChange={e => setDisbursementFormData({ ...disbursementFormData, date: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-800" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Reason</label>
                                                            <input type="text" placeholder="e.g. For festival, monthly salary" value={disbursementFormData.label} onChange={e => setDisbursementFormData({ ...disbursementFormData, label: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-800 italic" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Amount</label>
                                                            <input type="number" placeholder="₹0" value={disbursementFormData.amount} onChange={e => setDisbursementFormData({ ...disbursementFormData, amount: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-black text-slate-800" />
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                if (!disbursementFormData.amount) return;
                                                                await addDoc(collection(db, "salary_logs"), {
                                                                    orderId: selectedSalaryOrder.id,
                                                                    userId: selectedStaffForOrder.id,
                                                                    userName: selectedStaffForOrder.name,
                                                                    label: disbursementFormData.label,
                                                                    type: disbursementFormData.type,
                                                                    amount: Number(disbursementFormData.amount),
                                                                    date: disbursementFormData.date,
                                                                    paymentType: disbursementFormData.paymentType,
                                                                    timestamp: serverTimestamp()
                                                                });
                                                                setDisbursementFormData({ label: '', amount: '', type: disbursementFormData.type, date: new Date().toISOString().split('T')[0], paymentType: 'Manual' });
                                                            }}
                                                            className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-600 shadow-md italic mt-2"
                                                        >Add {disbursementFormData.type.split(' ')[0]}</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 p-10 rounded-3xl border border-slate-100 flex flex-col items-center text-center justify-center h-full">
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic mb-2">Order Completed</div>
                                                    <h3 className="text-xl font-black text-slate-900 uppercase">Cannot Modify</h3>
                                                </div>
                                            )}

                                            {/* Right side: Log listings */}
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                                {['Advance Payment', 'Salary Payment'].map(typeLog => {
                                                    const specificLogs = salaryLogs.filter(l => l.userId === selectedStaffForOrder.id && l.type === typeLog);
                                                    return (
                                                        <div key={typeLog} className="bg-white border text-center border-slate-100 rounded-3xl shadow-sm p-5">
                                                            <h5 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-left ${typeLog === 'Advance Payment' ? 'text-emerald-500' : 'text-blue-500'}`}>{typeLog} Log</h5>
                                                            {specificLogs.length === 0 ? (
                                                                <div className="text-[10px] font-bold text-slate-300 uppercase italic">No entries yet</div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {specificLogs.map(log => (
                                                                        <div key={log.id} className="flex items-center justify-between text-left p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                                                                            <div>
                                                                                <div className="text-[10px] font-black text-slate-800 italic uppercase">{log.label || typeLog}</div>
                                                                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{log.date}</div>
                                                                            </div>
                                                                            <div className="text-sm font-black text-slate-900 italic">₹{log.amount}</div>
                                                                            {selectedSalaryOrder.status !== 'Finished' && (
                                                                                <button onClick={() => deleteDoc(doc(db, "salary_logs", log.id))} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {specificLogs.length > 0 && (
                                                                <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-3">
                                                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</div>
                                                                    <div className={`text-md font-black italic ${typeLog === 'Advance Payment' ? 'text-emerald-600' : 'text-blue-600'}`}>₹{specificLogs.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* SHOW ALL STAFF GRID IN THIS ORDER */
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {staff.map(s => {
                                            // Calculate total logs
                                            const totalAdvance = salaryLogs.filter(l => l.userId === s.id && l.type === 'Advance Payment').reduce((c, l) => c + Number(l.amount), 0);
                                            const totalSalary = salaryLogs.filter(l => l.userId === s.id && l.type === 'Salary Payment').reduce((c, l) => c + Number(l.amount), 0);
                                            return (
                                                <div 
                                                    key={s.id} 
                                                    onClick={() => setSelectedStaffForOrder(s)} 
                                                    className="p-5 border border-slate-100 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col items-center text-center"
                                                >
                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform">
                                                        <img src={s.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`} className="w-full h-full object-cover" />
                                                    </div>
                                                    <h5 className="font-black text-slate-900 uppercase italic tracking-tight mb-1 group-hover:text-blue-600 transition-colors">{s.name}</h5>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3 py-1 bg-white rounded-full">{s.role}</p>

                                                    <div className="w-full flex justify-between px-2 pt-3 border-t border-slate-200 gap-2">
                                                        <div>
                                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Advance</div>
                                                            <div className="text-xs font-black text-emerald-500 italic">₹{totalAdvance}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Salary</div>
                                                            <div className="text-xs font-black text-blue-500 italic">₹{totalSalary}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="h-full min-h-[500px] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 bg-white/50">
                                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-200 mb-6">
                                    <Wallet size={40} />
                                </div>
                                <h4 className="text-lg font-black text-slate-400 uppercase tracking-[0.3em] italic mb-3">Order Selection Required</h4>
                                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed">Select a salary order from the left partition<br />to initialize or track agent disbursements.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Staff Directory */
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                <UserIcon size={24} className="text-blue-500" /> Enrolled Entities Directory
                            </h3>
                            <p className="text-sm text-slate-400 font-medium tracking-wide italic uppercase mt-1">Full registry of secured personnel profiles</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by name or role..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-xs w-full md:w-64"
                                />
                            </div>
                            <button
                                onClick={() => { setEditingProfile(null); setProfileData({ name: '', role: '', address: '', dob: '', gender: 'Male', joiningDate: '', resignDate: '', phone: '', gpay: '', imageUrl: '' }); setProfileModal(true); }}
                                className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl italic flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Staff Profile
                            </button>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStaff.map((s) => (
                            <div key={s.id} className="relative group bg-slate-50 border border-slate-100 rounded-[2rem] p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(s)} className="p-2 bg-white text-blue-500 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDeleteProfile(s.id)} className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                                </div>
                                <div className="flex items-center gap-4 mb-6 cursor-pointer" onClick={() => setSelectedStaffForCalendar(s)}>
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white">
                                        <img src={s.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 uppercase italic tracking-tight group-hover:text-blue-500 transition-colors">{s.name}</h4>
                                        <div className="px-3 py-1 bg-blue-100 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-full w-fit mt-1 italic">{s.role}</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Smartphone size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-600 tracking-wider">MOB: {s.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Wallet size={14} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-600 tracking-wider uppercase italic">GPay: {s.gpay || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CalendarDays size={14} className="text-slate-400" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Enrolled: {s.joiningDate}</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 flex items-center gap-2">
                                        <MapPin size={12} className="text-slate-300" />
                                        <p className="text-[9px] text-slate-400 font-bold uppercase italic truncate">{s.address}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {profileModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 mt-10">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setProfileModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl p-10 md:p-12">
                        <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-8">
                            <div>
                                <h3 className="text-3xl font-black uppercase italic tracking-tight text-slate-900">{editingProfile ? 'Evolve Identity' : 'Enroll New Entity'}</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Staff Protocol Initialization</p>
                            </div>
                            <button onClick={() => setProfileModal(false)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><XCircle size={24} /></button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Profile Image Upload */}
                            <div className="md:col-span-2 flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] mb-4">
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader className="animate-spin text-blue-500" size={32} />
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Processing Image...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={() => document.getElementById('staffImg').click()}>
                                        <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-white flex items-center justify-center text-slate-200">
                                            {profileData.imageUrl ? <img src={profileData.imageUrl} className="w-full h-full object-cover" /> : <Upload size={32} />}
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] font-black text-slate-900 uppercase italic block">Identity Signature (Optional)</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Click to upload identity photo</span>
                                        </div>
                                    </div>
                                )}
                                <input type="file" id="staffImg" hidden onChange={(e) => handleImageUpload(e.target.files[0])} />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Legal Name *</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input required type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} placeholder="e.g. John Doe" className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 italic" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Designation / Role *</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input required type="text" value={profileData.role} onChange={(e) => setProfileData({ ...profileData, role: e.target.value })} placeholder="e.g. Supervisor" className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 italic" />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Permanent Address *</label>
                                <div className="relative">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input required type="text" value={profileData.address} onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} placeholder="Street name, City, Zip" className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 italic" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Date of Birth *</label>
                                <input required type="date" value={profileData.dob} onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900" />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Gender Protocol *</label>
                                <select value={profileData.gender} onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Protocol Intake Date *</label>
                                <input required type="date" value={profileData.joiningDate} onChange={(e) => setProfileData({ ...profileData, joiningDate: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900" />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Resignation Date (Opt)</label>
                                <input type="date" value={profileData.resignDate} onChange={(e) => setProfileData({ ...profileData, resignDate: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900" />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Cellular ID (Phone) *</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input required type="tel" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} placeholder="e.g. +91 9876543210" className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900 tracking-wider font-mono" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">GPay Terminal Identifier</label>
                                <div className="relative">
                                    <Wallet className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-300" size={16} />
                                    <input type="text" value={profileData.gpay} onChange={(e) => setProfileData({ ...profileData, gpay: e.target.value })} placeholder="e.g. username@okaxis" className="w-full pl-14 pr-6 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-emerald-700 italic" />
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-8 flex justify-end gap-4 border-t border-slate-100 mt-4">
                                <button type="button" onClick={() => setProfileModal(false)} className="px-10 py-4 bg-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all italic">Abort</button>
                                <button type="submit" disabled={uploading} className="px-14 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-xl italic flex items-center gap-3 disabled:opacity-50">{uploading ? <Loader size={12} className="animate-spin" /> : editingProfile ? 'Update Registry' : 'Initialize Enrollment'}</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Personal Calendar Modal */}
            {selectedStaffForCalendar && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setSelectedStaffForCalendar(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" />
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative bg-[#f1f5f9] w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
                        {/* LEFT COLUMN: STATS */}
                        <div className="md:w-[400px] bg-white p-10 flex flex-col border-r border-slate-100">
                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-xl bg-slate-50">
                                    <img src={selectedStaffForCalendar.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStaffForCalendar.id}`} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">{selectedStaffForCalendar.name}</h3>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-2 px-3 py-1 bg-blue-50 rounded-full w-fit italic">{selectedStaffForCalendar.role}</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Filter Archive</h4>
                                <div className="flex gap-2 mb-2">
                                    <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full text-[10px] px-3 py-2 bg-slate-50 font-bold text-slate-600 border border-slate-100 shadow-sm rounded-xl outline-none" title="Start Date" />
                                    <span className="text-slate-300 flex items-center">-</span>
                                    <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full text-[10px] px-3 py-2 bg-slate-50 font-bold text-slate-600 border border-slate-100 shadow-sm rounded-xl outline-none" title="End Date" />
                                </div>
                                <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }} className="w-full mb-6 py-2 text-[9px] font-black uppercase text-slate-500 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 hover:text-slate-700 transition-all shadow-sm tracking-widest">Clear Filter</button>

                                {(() => {
                                    // Calculate filtered logs for analytics
                                    const filteredLogs = personalLogs.filter(l => {
                                        if (!filterStartDate && !filterEndDate) return true;
                                        if (filterStartDate && l.date < filterStartDate) return false;
                                        if (filterEndDate && l.date > filterEndDate) return false;
                                        return true;
                                    });

                                    // If no filter, the denominator is the days in the current calendar month.
                                    // If filtered, denominator is total filtered days span.
                                    const totalDaysSpan = (filterStartDate && filterEndDate)
                                        ? Math.max(1, Math.ceil((new Date(filterEndDate) - new Date(filterStartDate)) / (1000 * 60 * 60 * 24)) + 1)
                                        : new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();

                                    const presentCount = filteredLogs.filter(l => l.status === 'Present').length;
                                    const absentCount = filteredLogs.filter(l => l.status === 'Absent').length;
                                    const hoursWorked = filteredLogs.reduce((acc, curr) => acc + (Number(curr.hoursWorked) || 0), 0);

                                    return (
                                        <>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
                                                {filterStartDate || filterEndDate ? 'Filtered Analytics' : 'Monthly Analytics'}
                                            </h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Presence Ratio</p>
                                                    <div className="text-xl font-black text-emerald-600 italic">
                                                        {presentCount} <span className="text-[10px] text-slate-300 font-normal">/ {totalDaysSpan}</span>
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-red-200 transition-all">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Absence Ratio</p>
                                                    <div className="text-xl font-black text-red-500 italic">
                                                        {absentCount} <span className="text-[10px] text-slate-300 font-normal">/ {totalDaysSpan}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center justify-between mt-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Labor Commitment</p>
                                                    <div className="text-2xl font-black text-blue-600 italic">{hoursWorked} <span className="text-[10px] font-normal uppercase">Hours Worked</span></div>
                                                </div>
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100">
                                                    <Clock size={24} />
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    const header = ["Date", "Status", "Hours Worked", "Reason"];
                                                    const rows = filteredLogs.map(l => [
                                                        l.date,
                                                        l.status,
                                                        l.hoursWorked || 0,
                                                        `"${l.reason || ''}"`
                                                    ]);
                                                    const csvContent = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
                                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                                    const link = document.createElement("a");
                                                    const url = URL.createObjectURL(blob);
                                                    link.setAttribute("href", url);
                                                    link.setAttribute("download", `analytics_${selectedStaffForCalendar.id}_${filterStartDate || 'all'}_to_${filterEndDate || 'all'}.csv`);
                                                    link.style.visibility = 'hidden';
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                                className="w-full mt-4 py-4 border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm italic flex items-center justify-center gap-2"
                                            >
                                                <Plus size={14} className="rotate-45" /> Export Report (CSV)
                                            </button>
                                        </>
                                    );
                                })()}
                            </div>

                            <button onClick={() => setSelectedStaffForCalendar(null)} className="w-full py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 transition-all shadow-xl italic mt-6">Exit Portal</button>
                        </div>

                        {/* RIGHT COLUMN: CALENDAR & LOGS */}
                        <div className="flex-1 p-10 overflow-y-auto">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] italic">Attendance Archive Registry</h3>
                                <button onClick={() => setSelectedStaffForCalendar(null)} className="p-2 bg-white text-slate-300 rounded-xl hover:text-red-500 transition-all"><XCircle size={28} /></button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <PersonalCalendar
                                    staff={selectedStaffForCalendar}
                                    logs={personalLogs}
                                    currentMonth={calendarDate}
                                    onDateClick={(day, log) => {
                                        const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        setActiveDateEditor({ date: dateStr, log: log });
                                        setDateFormData({
                                            status: log?.status || 'Present',
                                            hoursWorked: log?.hoursWorked || 0,
                                            reason: log?.reason || ''
                                        });
                                        setIsEditingEntry(!log); // Auto-edit if new entry
                                    }}
                                />

                                <div className="space-y-6">
                                    {activeDateEditor ? (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl relative min-h-[400px] flex flex-col">
                                            <button onClick={() => { setActiveDateEditor(null); setIsEditingEntry(false); }} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500"><XCircle size={20} /></button>
                                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-8">Registry Protocol: {activeDateEditor.date}</h4>

                                            {isEditingEntry ? (
                                                <div className="space-y-6 flex-1">
                                                    <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
                                                        <button
                                                            onClick={() => setDateFormData({ ...dateFormData, status: 'Present' })}
                                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFormData.status === 'Present' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 opacity-60'}`}
                                                        >Present</button>
                                                        <button
                                                            onClick={() => setDateFormData({ ...dateFormData, status: 'Absent' })}
                                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFormData.status === 'Absent' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 opacity-60'}`}
                                                        >Absent</button>
                                                    </div>

                                                    {dateFormData.status === 'Present' ? (
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Total Hours Worked</label>
                                                            <input
                                                                type="number"
                                                                value={dateFormData.hoursWorked}
                                                                onChange={(e) => setDateFormData({ ...dateFormData, hoursWorked: e.target.value })}
                                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white transition-all"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Reason for Absence</label>
                                                            <input
                                                                type="text"
                                                                value={dateFormData.reason}
                                                                onChange={(e) => setDateFormData({ ...dateFormData, reason: e.target.value })}
                                                                placeholder="Personal / Health / Unannounced"
                                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-900 italic focus:bg-white transition-all"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="mt-auto pt-6 flex gap-3">
                                                        {activeDateEditor.log && (
                                                            <button onClick={() => setIsEditingEntry(false)} className="px-6 py-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all italic">Cancel</button>
                                                        )}
                                                        <button
                                                            onClick={async () => {
                                                                await handleMarkAttendance(selectedStaffForCalendar, dateFormData.status, dateFormData, activeDateEditor.date);
                                                                setActiveDateEditor(null);
                                                                setIsEditingEntry(false);
                                                            }}
                                                            className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-lg italic"
                                                        >Initialize Entry</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col">
                                                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex-1 flex flex-col items-center justify-center text-center">
                                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl ${activeDateEditor.log.status === 'Present' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                                            {activeDateEditor.log.status === 'Present' ? <Briefcase size={32} /> : <X size={32} />}
                                                        </div>
                                                        <h5 className={`text-4xl font-black italic uppercase tracking-tighter mb-2 ${activeDateEditor.log.status === 'Present' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {activeDateEditor.log.status}
                                                        </h5>
                                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-8">Archived Protocol</div>

                                                        {activeDateEditor.log.status === 'Present' ? (
                                                            <div className="bg-white px-8 py-4 rounded-2xl shadow-sm border border-slate-100">
                                                                <div className="text-4xl font-black text-slate-900 italic leading-none">{activeDateEditor.log.hoursWorked}<span className="text-sm uppercase font-normal ml-2">Hours</span></div>
                                                                <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-2">Labor Commitment Recorded</div>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-white px-8 py-4 rounded-2xl shadow-sm border border-slate-100 max-w-[80%]">
                                                                <div className="text-sm font-black text-slate-900 italic uppercase leading-tight">"{activeDateEditor.log.reason || 'No specific reason provided'}"</div>
                                                                <div className="text-[8px] font-black text-red-400 uppercase tracking-widest mt-2">Documented Absence Reason</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button onClick={() => setIsEditingEntry(true)} className="w-full py-5 bg-white border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-900 hover:text-white transition-all italic mt-6 flex items-center justify-center gap-3">
                                                        <Edit2 size={14} /> Update Archive Entry
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 bg-white/50">
                                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mb-6">
                                                <CalendarIcon size={32} />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest italic mb-2">Select a Registry Date</h4>
                                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight leading-relaxed">Choose a date from the calendar to view<br />status or initialize a new labor record.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
            {/* NEW ORDER MODAL */}
            {showOrderModal && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowOrderModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tight text-slate-900">Initialize Global Order</h3>
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">Salary & Advance Container</p>
                            </div>
                            <button onClick={() => setShowOrderModal(false)} className="text-slate-300 hover:text-red-500 transition-colors"><XCircle size={28} /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Order Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. March 2026 Salary"
                                    value={orderFormData.name}
                                    onChange={(e) => setOrderFormData({ ...orderFormData, name: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-900 italic focus:bg-white transition-all text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={orderFormData.startDate}
                                        onChange={(e) => setOrderFormData({ ...orderFormData, startDate: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white transition-all text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={orderFormData.endDate}
                                        onChange={(e) => setOrderFormData({ ...orderFormData, endDate: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white transition-all text-xs"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    if (!orderFormData.name) {
                                        alert("Protocol Alert: Order Name Required");
                                        return;
                                    }
                                    await addDoc(collection(db, "salary_orders"), {
                                        name: orderFormData.name,
                                        startDate: orderFormData.startDate,
                                        endDate: orderFormData.endDate,
                                        status: 'Active',
                                        timestamp: serverTimestamp()
                                    });
                                    setOrderFormData({ name: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] });
                                    setShowOrderModal(false);
                                }}
                                className="w-full py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 transition-all shadow-xl italic mt-4"
                            >Save Order</button>
                        </div>
                    </motion.div>
                </div>
            )}


        </div>
    );
};

export default AttendanceManager;
