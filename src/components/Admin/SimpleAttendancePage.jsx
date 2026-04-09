import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import AttendanceCalendar from './AttendanceCalendar';

const SimpleAttendancePage = () => {
    const [staffList, setStaffList] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch employees from staff_profiles (same as your existing setup)
    useEffect(() => {
        const q = query(collection(db, 'staff_profiles'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setStaffList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const filtered = staffList.filter(s =>
        (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.role || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">

                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900">📅 Attendance Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Select an employee → Click a date → Mark Present or Absent</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* LEFT: Employee List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <h2 className="text-sm font-bold text-gray-700 mb-3">👥 Employees</h2>
                                {/* Search */}
                                <input
                                    type="text"
                                    placeholder="Search name or role..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>

                            <div className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto">
                                {loading ? (
                                    <div className="p-6 text-center text-gray-400 text-xs animate-pulse">
                                        Loading employees...
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div className="p-6 text-center text-gray-300 text-xs">
                                        No employees found
                                    </div>
                                ) : (
                                    filtered.map((emp) => (
                                        <button
                                            key={emp.id}
                                            onClick={() => setSelectedEmployee(emp)}
                                            className={`w-full text-left p-4 flex items-center gap-3 transition-all hover:bg-blue-50 ${selectedEmployee?.id === emp.id
                                                    ? 'bg-blue-600 hover:bg-blue-600'
                                                    : ''
                                                }`}
                                        >
                                            {/* Avatar */}
                                            <img
                                                src={emp.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.id}`}
                                                className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm flex-shrink-0"
                                                alt={emp.name}
                                            />
                                            <div className="min-w-0">
                                                <p className={`text-xs font-bold truncate ${selectedEmployee?.id === emp.id ? 'text-white' : 'text-gray-800'}`}>
                                                    {emp.name || 'Unknown'}
                                                </p>
                                                <p className={`text-[10px] truncate ${selectedEmployee?.id === emp.id ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {emp.role}
                                                </p>
                                            </div>
                                            {selectedEmployee?.id === emp.id && (
                                                <span className="ml-auto text-white text-xs">→</span>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Calendar + Detail */}
                    <div className="lg:col-span-3">
                        <AttendanceCalendar employee={selectedEmployee} />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SimpleAttendancePage;
