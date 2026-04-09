import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { db } from '../../firebase';
import {
    doc,
    setDoc,
    collection,
    onSnapshot
} from 'firebase/firestore';

// ─── Simple helper: format Date to YYYY-MM-DD ───────────────────────────────
const toDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// ─── Main Component ──────────────────────────────────────────────────────────
const AttendanceCalendar = ({ employee }) => {
    // employee = { id, name, role, imageUrl }

    const [selectedDate, setSelectedDate] = useState(null);       // clicked date
    const [records, setRecords] = useState({});                   // { "YYYY-MM-DD": { status, hours, reason } }
    const [dayDetail, setDayDetail] = useState(null);             // record for selected date
    const [formStatus, setFormStatus] = useState('Present');
    const [formHours, setFormHours] = useState('');
    const [formReason, setFormReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // ── Real-time listener for all records of this employee ─────────────────
    useEffect(() => {
        if (!employee) return;
        setLoading(true);
        const ref = collection(db, 'attendance', employee.id, 'records');
        // onSnapshot keeps data fresh — no need to refresh manually
        const unsub = onSnapshot(ref, (snap) => {
            const data = {};
            snap.forEach(d => { data[d.id] = d.data(); });
            setRecords(data);
            setLoading(false);
        }, (err) => {
            console.error('Error listening to records:', err);
            setLoading(false);
        });
        // Cleanup listener when employee changes or component unmounts
        return () => unsub();
    }, [employee]);

    // ── When user clicks a date ───────────────────────────────────────────────
    const handleDateClick = (date) => {
        const dateStr = toDateStr(date);
        setSelectedDate(dateStr);
        const existing = records[dateStr] || null;
        setDayDetail(existing);
        // Pre-fill form with existing data
        setFormStatus(existing?.status || 'Present');
        setFormHours(existing?.hours || '');
        setFormReason(existing?.reason || '');
    };

    // ── Save attendance to Firestore ─────────────────────────────────────────
    const handleSave = async () => {
        if (!selectedDate || !employee) return;
        setSaving(true);
        try {
            const data = {
                status: formStatus,
                hours: formStatus === 'Present' ? Number(formHours) || 0 : 0,
                reason: formStatus === 'Absent' ? formReason : '',
                updatedAt: new Date().toISOString()
            };
            // Save to: attendance/{employeeId}/records/{YYYY-MM-DD}
            await setDoc(
                doc(db, 'attendance', employee.id, 'records', selectedDate),
                data
            );
            // onSnapshot will auto-update records state — just update dayDetail
            setDayDetail(data);
            alert(`✅ Attendance saved for ${selectedDate}`);
        } catch (err) {
            console.error('Error saving:', err);
            alert('❌ Failed to save. Check console for details.');
        } finally {
            setSaving(false);
        }
    };

    // ── Calendar tile color logic ─────────────────────────────────────────────
    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return '';
        const dateStr = toDateStr(date);
        const rec = records[dateStr];
        if (!rec) return '';
        if (rec.status === 'Present') return 'present-tile';
        if (rec.status === 'Absent') return 'absent-tile';
        return '';
    };

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <span className="text-5xl mb-4">📋</span>
                <p className="text-sm font-medium">Select an employee to view attendance</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Employee Header */}
            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <img
                    src={employee.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.id}`}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-gray-100"
                    alt={employee.name}
                />
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{employee.name}</h3>
                    <span className="text-xs font-medium text-blue-500 bg-blue-50 px-3 py-0.5 rounded-full">
                        {employee.role}
                    </span>
                </div>
                {loading && <span className="ml-auto text-xs text-gray-400 animate-pulse">Loading records...</span>}
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs font-semibold">
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-400 inline-block"></span> Present
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-red-400 inline-block"></span> Absent
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-gray-200 inline-block"></span> No Record
                </span>
            </div>

            {/* Calendar + Detail Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Calendar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <style>{`
                        .present-tile { background-color: #bbf7d0 !important; color: #166534 !important; font-weight: bold; border-radius: 8px; }
                        .absent-tile  { background-color: #fecaca !important; color: #991b1b !important; font-weight: bold; border-radius: 8px; }
                        .react-calendar { border: none !important; width: 100% !important; font-family: inherit; }
                        .react-calendar__tile { border-radius: 8px !important; height: 48px !important; }
                        .react-calendar__tile--active { background: #3b82f6 !important; color: white !important; }
                        .react-calendar__tile:hover { background: #eff6ff !important; }
                        .react-calendar__navigation button { border-radius: 8px; font-weight: 700; }
                    `}</style>
                    {/* key={Object.keys(records).length} forces calendar to re-render when records load */}
                    <Calendar
                        key={Object.keys(records).join(',')}
                        onClickDay={handleDateClick}
                        tileClassName={tileClassName}
                        className="rounded-xl"
                    />
                </div>

                {/* Detail & Form Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    {selectedDate ? (
                        <div className="space-y-5">
                            {/* Selected Date Header */}
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Selected Date</p>
                                <h4 className="text-xl font-bold text-gray-800 mt-1">{selectedDate}</h4>
                            </div>

                            {/* Current Record Display */}
                            {dayDetail ? (
                                <div className={`p-4 rounded-xl border-2 ${dayDetail.status === 'Present' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Current Record</p>
                                    <p className={`text-2xl font-black ${dayDetail.status === 'Present' ? 'text-green-600' : 'text-red-600'}`}>
                                        {dayDetail.status === 'Present' ? '✅' : '❌'} {dayDetail.status}
                                    </p>
                                    {dayDetail.status === 'Present' && (
                                        <p className="text-sm text-gray-600 mt-1">⏱ {dayDetail.hours} hours worked</p>
                                    )}
                                    {dayDetail.status === 'Absent' && dayDetail.reason && (
                                        <p className="text-sm text-gray-600 mt-1">📝 {dayDetail.reason}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 text-center">
                                    <p className="text-gray-400 font-medium">No record found for this date</p>
                                    <p className="text-xs text-gray-300 mt-1">Fill the form below to add one</p>
                                </div>
                            )}

                            {/* Update Form */}
                            <div className="space-y-4 pt-2 border-t border-gray-100">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    {dayDetail ? 'Update Record' : 'Add Record'}
                                </p>

                                {/* Status Dropdown */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Status</label>
                                    <select
                                        value={formStatus}
                                        onChange={(e) => setFormStatus(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                                    >
                                        <option value="Present">✅ Present</option>
                                        <option value="Absent">❌ Absent</option>
                                    </select>
                                </div>

                                {/* If Present → Hours input */}
                                {formStatus === 'Present' && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Hours Worked</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="24"
                                            value={formHours}
                                            onChange={(e) => setFormHours(e.target.value)}
                                            placeholder="e.g. 8"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </div>
                                )}

                                {/* If Absent → Reason input */}
                                {formStatus === 'Absent' && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Reason for Absence</label>
                                        <input
                                            type="text"
                                            value={formReason}
                                            onChange={(e) => setFormReason(e.target.value)}
                                            placeholder="e.g. Sick, Personal, Unannounced..."
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </div>
                                )}

                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? '⏳ Saving...' : '💾 Save Attendance'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400">
                            <span className="text-5xl mb-4">👆</span>
                            <p className="text-sm font-medium">Click a date on the calendar</p>
                            <p className="text-xs mt-1">to view or add attendance</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceCalendar;
