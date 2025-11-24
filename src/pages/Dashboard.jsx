import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Users, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
    const [students, setStudents] = useState([]);
    const [attendanceCounts, setAttendanceCounts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        setLoading(true);
        try {
            const studentsQ = query(collection(db, "students"), where("isActive", "==", true));
            const studentsSnapshot = await getDocs(studentsQ);
            const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            const attendanceQ = query(
                collection(db, "attendance"),
                where("date", ">=", Timestamp.fromDate(startOfMonth)),
                where("date", "<=", Timestamp.fromDate(endOfMonth))
            );
            const attendanceSnapshot = await getDocs(attendanceQ);

            const counts = {};
            attendanceSnapshot.forEach(doc => {
                const studentId = doc.data().studentId;
                counts[studentId] = (counts[studentId] || 0) + 1;
            });

            setStudents(studentsData);
            setAttendanceCounts(counts);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
        setLoading(false);
    }

    function getStatus(count) {
        const TARGET = 12;
        if (count >= TARGET) return 'completed';
        if (count >= 8) return 'on-track';
        if (count >= 5) return 'attention';
        return 'critical';
    }

    const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const completedCount = students.filter(s => (attendanceCounts[s.id] || 0) >= 12).length;
    const needsAttentionCount = students.filter(s => {
        const count = attendanceCounts[s.id] || 0;
        return count < 12 && count < 8;
    }).length;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Monthly Overview</h1>
                <p className="text-gray-600">{monthName}</p>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                                    <p className="text-3xl font-bold text-gray-800">{students.length}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Completed (12+)</p>
                                    <p className="text-3xl font-bold text-gray-800">{completedCount}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Needs Attention</p>
                                    <p className="text-3xl font-bold text-gray-800">{needsAttentionCount}</p>
                                </div>
                                <div className="p-3 bg-orange-100 rounded-xl">
                                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Student Progress List */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Student Progress</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {students.map(student => {
                                const count = attendanceCounts[student.id] || 0;
                                const status = getStatus(count);
                                const percentage = Math.min((count / 12) * 100, 100);

                                const statusConfig = {
                                    completed: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500', label: 'Completed' },
                                    'on-track': { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500', label: 'On Track' },
                                    attention: { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500', label: 'Needs Attention' },
                                    critical: { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500', label: 'Critical' }
                                };

                                const config = statusConfig[status];

                                return (
                                    <div key={student.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-800">{student.name}</h3>
                                                        <p className="text-sm text-gray-500">Grade {student.grade}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-gray-800">{count}<span className="text-lg text-gray-500">/12</span></p>
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className={`${config.bar} h-2.5 rounded-full transition-all duration-500`}
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
