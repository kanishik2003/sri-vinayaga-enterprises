import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { db } from '../../firebase';
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    addDoc,
    getDocs,
    query,
    orderBy,
} from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Format a Date object to "YYYY-MM-DD"
// ─────────────────────────────────────────────────────────────────────────────
const toDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const TODAY = toDateStr(new Date());

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODULE — handles 3 views: 'directory', 'registry', 'calendar'
// ─────────────────────────────────────────────────────────────────────────────
const AttendanceModule = () => {
    const [view, setView] = useState('registry');           // active tab
    const [employees, setEmployees] = useState([]);         // from "employees" collection
    const [selectedEmployee, setSelectedEmployee] = useState(null); // for calendar view
    const [loading, setLoading] = useState(true);

    // ── Fetch employees in real-time from Firestore ──────────────────────────
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'employees'), (snap) => {
            setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const openCalendar = (emp) => {
        setSelectedEmployee(emp);
        setView('calendar');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── TOP NAV ── */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
                <h1 className="text-xl font-black text-gray-900 mr-6">📋 Attendance System</h1>
                {['registry', 'directory'].map(v => (
                    <button
                        key={v}
                        onClick={() => { setView(v); setSelectedEmployee(null); }}
                        className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                            view === v
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {v === 'registry' ? '📅 Daily Registry' : '👥 Staff Directory'}
                    </button>
                ))}
                {selectedEmployee && view === 'calendar' && (
                    <span className="ml-2 px-4 py-2 bg-green-100 text-green-700 text-xs font-bold rounded-xl">
                        📆 {selectedEmployee.name}'s Calendar
                    </span>
                )}
            </div>

            {/* ── CONTENT ── */}
            <div className="p-6 max-w-6xl mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-gray-400 text-sm animate-pulse">
                        Loading employees...
                    </div>
                ) : (
                    <>
                        {view === 'registry'   && <DailyRegistry   employees={employees} onViewCalendar={openCalendar} />}
                        {view === 'directory'  && <StaffDirectory  employees={employees} />}
                        {view === 'calendar'   && selectedEmployee && (
                            <EmployeeCalendar employee={selectedEmployee} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. STAFF DIRECTORY — shows all employees, allows adding new ones
// ─────────────────────────────────────────────────────────────────────────────
const StaffDirectory = ({ employees }) => {
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [salaryPerHour, setSalaryPerHour] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!name.trim()) return alert('Name is required.');
        setSaving(true);
        try {
            // Save ONLY to "employees" collection (exact Firestore structure)
            await addDoc(collection(db, 'employees'), {
                name: name.trim(),
                salaryPerHour: Number(salaryPerHour) || 0,
            });
            setName('');
            setSalaryPerHour('');
            setShowForm(false);
        } catch (err) {
            console.error(err);
            alert('Failed to add staff.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">👥 Staff Directory</h2>
                    <p className="text-sm text-gray-400 mt-1">All registered employees</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-6 py-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md"
                >
                    + Add Staff Profile
                </button>
            </div>

            {/* Add Staff Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm">New Employee Details</h3>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name *</label>
                            <input
                                required
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Ravi Kumar"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">Salary Per Hour (₹)</label>
                            <input
                                type="number"
                                value={salaryPerHour}
                                onChange={e => setSalaryPerHour(e.target.value)}
                                placeholder="e.g. 50"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300"
                            />
                        </div>
                        <div className="md:col-span-2 flex gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : '💾 Save Employee'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-3 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Employee Cards */}
            {employees.length === 0 ? (
                <div className="text-center py-20 text-gray-300 text-sm">
                    No employees yet. Click "Add Staff Profile" to add one.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees.map(emp => (
                        <div key={emp.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl font-black text-blue-400">
                                    {(emp.name || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{emp.name}</p>
                                    <p className="text-xs text-gray-400">ID: {emp.id.slice(0, 8)}...</p>
                                </div>
                            </div>
                            <div className="bg-green-50 rounded-xl px-4 py-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-green-600">Salary / Hour</span>
                                <span className="text-sm font-black text-green-700">₹{emp.salaryPerHour || 0}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. DAILY REGISTRY — shows today's attendance for every employee
// ─────────────────────────────────────────────────────────────────────────────
const DailyRegistry = ({ employees, onViewCalendar }) => {
    const [todayRecords, setTodayRecords] = useState({}); // { employeeId: record }
    const [markingFor, setMarkingFor] = useState(null);   // employee being marked
    const [formStatus, setFormStatus] = useState('Present');
    const [formHours, setFormHours] = useState('');
    const [formReason, setFormReason] = useState('');
    const [saving, setSaving] = useState(false);

    // Load today's record for ALL employees on mount
    useEffect(() => {
        if (employees.length === 0) return;
        const fetchAll = async () => {
            const results = {};
            await Promise.all(
                employees.map(async (emp) => {
                    const ref = doc(db, 'attendance', emp.id, 'records', TODAY);
                    // Instead of getDoc, set up a snapshot per employee
                    const snap = await getDocs(collection(db, 'attendance', emp.id, 'records'));
                    snap.forEach(d => {
                        if (d.id === TODAY) results[emp.id] = d.data();
                    });
                })
            );
            setTodayRecords(results);
        };
        fetchAll();
    }, [employees]);

    const openMarkForm = (emp) => {
        const existing = todayRecords[emp.id];
        setMarkingFor(emp);
        setFormStatus(existing?.status || 'Present');
        setFormHours(existing?.hours || '');
        setFormReason(existing?.reason || '');
    };

    const handleSave = async () => {
        if (!markingFor) return;
        setSaving(true);
        try {
            const data = {
                status: formStatus,
                hours: formStatus === 'Present' ? Number(formHours) || 0 : 0,
                reason: formStatus === 'Absent' ? formReason : '',
            };
            // Save to: attendance/{employeeId}/records/{YYYY-MM-DD}
            await setDoc(doc(db, 'attendance', markingFor.id, 'records', TODAY), data);
            setTodayRecords(prev => ({ ...prev, [markingFor.id]: data }));
            setMarkingFor(null);
        } catch (err) {
            console.error(err);
            alert('Failed to save attendance.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-gray-900">📅 Daily Registry</h2>
                <p className="text-sm text-gray-400 mt-1">Date: <span className="font-semibold text-blue-600">{TODAY}</span></p>
            </div>

            {/* Mark Attendance Form Modal */}
            {markingFor && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Mark Attendance</h3>
                                <p className="text-xs text-blue-500 font-semibold mt-0.5">{markingFor.name} — {TODAY}</p>
                            </div>
                            <button onClick={() => setMarkingFor(null)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">&times;</button>
                        </div>

                        <div className="space-y-4">
                            {/* Status Selector */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Status</label>
                                <div className="flex gap-3">
                                    {['Present', 'Absent'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setFormStatus(s)}
                                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                                                formStatus === s
                                                    ? s === 'Present'
                                                        ? 'bg-green-500 text-white border-green-500'
                                                        : 'bg-red-500 text-white border-red-500'
                                                    : 'bg-white text-gray-400 border-gray-200'
                                            }`}
                                        >
                                            {s === 'Present' ? '✅ Present' : '❌ Absent'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Hours — only if Present */}
                            {formStatus === 'Present' && (
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Hours Worked</label>
                                    <input
                                        type="number" min="0" max="24"
                                        value={formHours}
                                        onChange={e => setFormHours(e.target.value)}
                                        placeholder="e.g. 8"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-300"
                                    />
                                </div>
                            )}

                            {/* Reason — only if Absent */}
                            {formStatus === 'Absent' && (
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Reason</label>
                                    <input
                                        type="text"
                                        value={formReason}
                                        onChange={e => setFormReason(e.target.value)}
                                        placeholder="Sick / Personal / Unannounced..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-200"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
                            >
                                {saving ? '⏳ Saving...' : '💾 Save Attendance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {employees.length === 0 ? (
                    <div className="text-center py-20 text-gray-300 text-sm">
                        No employees found. Add some from Staff Directory.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Employee</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Today's Status</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Hours</th>
                                <th className="text-right px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {employees.map(emp => {
                                const rec = todayRecords[emp.id];
                                return (
                                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 font-black text-lg">
                                                    {(emp.name || '?')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{emp.name}</p>
                                                    <p className="text-xs text-gray-400">₹{emp.salaryPerHour}/hr</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {rec ? (
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                                    rec.status === 'Present'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {rec.status === 'Present' ? '✅' : '❌'} {rec.status}
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-400">
                                                    — Not Marked
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-gray-600">
                                                {rec?.status === 'Present' ? `${rec.hours} hrs` : rec?.status === 'Absent' ? (rec.reason || '—') : '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openMarkForm(emp)}
                                                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all"
                                                >
                                                    {rec ? 'Update' : 'Mark Attendance'}
                                                </button>
                                                <button
                                                    onClick={() => onViewCalendar(emp)}
                                                    className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-all"
                                                >
                                                    📆 Calendar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. EMPLOYEE CALENDAR — full calendar with green/red highlights + form
// ─────────────────────────────────────────────────────────────────────────────
const EmployeeCalendar = ({ employee }) => {
    const [records, setRecords] = useState({});     // { "YYYY-MM-DD": { status, hours, reason } }
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [dayRecord, setDayRecord] = useState(null);
    const [formStatus, setFormStatus] = useState('Present');
    const [formHours, setFormHours] = useState('');
    const [formReason, setFormReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    // ── Real-time listener for this employee's attendance records ─────────────
    useEffect(() => {
        if (!employee) return;
        setLoading(true);
        const ref = collection(db, 'attendance', employee.id, 'records');
        const unsub = onSnapshot(ref, (snap) => {
            const data = {};
            snap.forEach(d => { data[d.id] = d.data(); });
            setRecords(data);
            setLoading(false);
        }, err => {
            console.error('Listener error:', err);
            setLoading(false);
        });
        return () => unsub();
    }, [employee]);

    // ── When date is clicked on calendar ──────────────────────────────────────
    const handleDateClick = (date) => {
        const dateStr = toDateStr(date);
        const rec = records[dateStr] || null;
        setSelectedDate(dateStr);
        setDayRecord(rec);
        setFormStatus(rec?.status || 'Present');
        setFormHours(rec?.hours?.toString() || '');
        setFormReason(rec?.reason || '');
        setEditing(!rec); // auto-open form if no record
    };

    // ── Save/Update to Firestore ──────────────────────────────────────────────
    const handleSave = async () => {
        if (!selectedDate) return;
        setSaving(true);
        try {
            const data = {
                status: formStatus,
                hours: formStatus === 'Present' ? Number(formHours) || 0 : 0,
                reason: formStatus === 'Absent' ? formReason : '',
            };
            // Exact path: attendance/{employeeId}/records/{YYYY-MM-DD}
            await setDoc(doc(db, 'attendance', employee.id, 'records', selectedDate), data);
            // onSnapshot will auto-update records state
            setDayRecord(data);
            setEditing(false);
        } catch (err) {
            console.error(err);
            alert('Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    // ── Calendar tile color: green=Present, red=Absent ────────────────────────
    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return '';
        const rec = records[toDateStr(date)];
        if (!rec) return '';
        return rec.status === 'Present' ? 'cal-present' : 'cal-absent';
    };

    // ── Summary stats ──────────────────────────────────────────────────────────
    const totalPresent = Object.values(records).filter(r => r.status === 'Present').length;
    const totalAbsent  = Object.values(records).filter(r => r.status === 'Absent').length;
    const totalHours   = Object.values(records).reduce((s, r) => s + (r.hours || 0), 0);

    return (
        <div className="space-y-6">
            {/* Calendar CSS injected inline */}
            <style>{`
                .cal-present { background: #bbf7d0 !important; color: #166534 !important; border-radius: 8px !important; font-weight: 700; }
                .cal-absent  { background: #fecaca !important; color: #991b1b !important; border-radius: 8px !important; font-weight: 700; }
                .react-calendar { border: none !important; width: 100% !important; font-family: inherit; background: transparent; }
                .react-calendar__tile { border-radius: 8px !important; height: 50px !important; font-size: 13px; }
                .react-calendar__tile--active { background: #3b82f6 !important; color: white !important; border-radius: 8px !important; }
                .react-calendar__tile--active.cal-present { background: #3b82f6 !important; color: white !important; }
                .react-calendar__tile--active.cal-absent  { background: #3b82f6 !important; color: white !important; }
                .react-calendar__tile:hover { background: #eff6ff !important; border-radius: 8px !important; }
                .react-calendar__navigation button { border-radius: 10px; font-weight: 800; font-size: 14px; }
                .react-calendar__month-view__weekdays__weekday { font-size: 11px; font-weight: 800; color: #94a3b8; text-decoration: none !important; }
                .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none !important; }
            `}</style>

            {/* Employee Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                    {(employee.name || '?')[0].toUpperCase()}
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900">{employee.name}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">₹{employee.salaryPerHour}/hr · Attendance Archive</p>
                </div>
                {loading && <span className="ml-auto text-xs text-gray-300 animate-pulse">Loading records...</span>}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Present</p>
                    <p className="text-3xl font-black text-green-500">{totalPresent}</p>
                    <p className="text-[10px] text-gray-300 mt-1">Days</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Absent</p>
                    <p className="text-3xl font-black text-red-400">{totalAbsent}</p>
                    <p className="text-[10px] text-gray-300 mt-1">Days</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Hours Worked</p>
                    <p className="text-3xl font-black text-blue-500">{totalHours}</p>
                    <p className="text-[10px] text-gray-300 mt-1">Total</p>
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-5 text-xs font-bold text-gray-500">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400"></span> Present</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400"></span> Absent</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-200"></span> No Record</span>
            </div>

            {/* Calendar + Detail Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Calendar */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <Calendar
                        key={Object.keys(records).join(',')}
                        onClickDay={handleDateClick}
                        tileClassName={tileClassName}
                    />
                </div>

                {/* Detail + Form Panel */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    {selectedDate ? (
                        <div className="space-y-5 h-full flex flex-col">
                            {/* Date Title */}
                            <div className="pb-4 border-b border-gray-100">
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Selected Date</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{selectedDate}</p>
                            </div>

                            {/* Show existing record or "No Record" */}
                            {!editing && (
                                <>
                                    {dayRecord ? (
                                        <div className={`p-5 rounded-2xl border-2 ${
                                            dayRecord.status === 'Present'
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-red-50 border-red-200'
                                        }`}>
                                            <p className={`text-3xl font-black ${dayRecord.status === 'Present' ? 'text-green-600' : 'text-red-600'}`}>
                                                {dayRecord.status === 'Present' ? '✅' : '❌'} {dayRecord.status}
                                            </p>
                                            {dayRecord.status === 'Present' && (
                                                <p className="text-sm text-gray-600 mt-2">⏱ <strong>{dayRecord.hours}</strong> hours worked</p>
                                            )}
                                            {dayRecord.status === 'Absent' && dayRecord.reason && (
                                                <p className="text-sm text-gray-600 mt-2">📝 {dayRecord.reason}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-5 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                                            <p className="text-gray-400 font-semibold text-sm">No attendance record</p>
                                            <p className="text-xs text-gray-300 mt-1">for this date</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setEditing(true)}
                                        className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all mt-auto"
                                    >
                                        {dayRecord ? '✏️ Update Record' : '➕ Add Record'}
                                    </button>
                                </>
                            )}

                            {/* Edit / Add Form */}
                            {editing && (
                                <div className="space-y-4 flex-1 flex flex-col">
                                    {/* Status */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Status</label>
                                        <div className="flex gap-2">
                                            {['Present', 'Absent'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setFormStatus(s)}
                                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                                        formStatus === s
                                                            ? s === 'Present'
                                                                ? 'bg-green-500 border-green-500 text-white'
                                                                : 'bg-red-500 border-red-500 text-white'
                                                            : 'border-gray-200 text-gray-400 bg-white'
                                                    }`}
                                                >
                                                    {s === 'Present' ? '✅ Present' : '❌ Absent'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Hours — Present only */}
                                    {formStatus === 'Present' && (
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Hours Worked</label>
                                            <input
                                                type="number" min="0" max="24"
                                                value={formHours}
                                                onChange={e => setFormHours(e.target.value)}
                                                placeholder="e.g. 8"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-300"
                                            />
                                        </div>
                                    )}

                                    {/* Reason — Absent only */}
                                    {formStatus === 'Absent' && (
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Reason</label>
                                            <input
                                                type="text"
                                                value={formReason}
                                                onChange={e => setFormReason(e.target.value)}
                                                placeholder="Sick / Personal / Unannounced..."
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-200"
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-auto pt-2">
                                        {dayRecord && (
                                            <button
                                                onClick={() => setEditing(false)}
                                                className="px-5 py-3 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
                                        >
                                            {saving ? '⏳ Saving...' : '💾 Save'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-gray-300">
                            <span className="text-5xl mb-3">👆</span>
                            <p className="font-semibold text-sm">Click a date on the calendar</p>
                            <p className="text-xs mt-1">to view or update attendance</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceModule;
