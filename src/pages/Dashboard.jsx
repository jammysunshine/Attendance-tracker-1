import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Users, TrendingUp, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

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
    const totalClasses = Object.values(attendanceCounts).reduce((sum, count) => sum + count, 0);

    return (
        <div className="max-w-7xl mx-auto">
            {/* Compact Header with Stats */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-5 mb-4 text-white">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="text-2xl font-bold">Monthly Overview</h1>
                        <p className="text-blue-100 text-sm flex items-center mt-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            {monthName}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                            <Users className="w-4 h-4" />
                            <p className="text-xs font-medium opacity-90">Students</p>
                        </div>
                        <p className="text-2xl font-bold">{students.length}</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <p className="text-xs font-medium opacity-90">Completed</p>
                        </div>
                        <p className="text-2xl font-bold">{completedCount}</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            <p className="text-xs font-medium opacity-90">At Risk</p>
                        </div>
                        <p className="text-2xl font-bold">{needsAttentionCount}</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <p className="text-xs font-medium opacity-90">Total Classes</p>
                        </div>
                        <p className="text-2xl font-bold">{totalClasses}</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Student Progress</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {students.map(student => {
                            const count = attendanceCounts[student.id] || 0;
                            const status = getStatus(count);
                            const percentage = Math.min((count / 12) * 100, 100);

                            const statusConfig = {
                                completed: { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500', dot: 'bg-green-500' },
                                'on-track': { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500', dot: 'bg-blue-500' },
                                attention: { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500', dot: 'bg-orange-500' },
                                critical: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500', dot: 'bg-red-500' }
                            };

                            const config = statusConfig[status];

                            return (
                                <div key={student.id} className="px-4 py-2 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            <div className={`w-2 h-2 rounded-full ${config.dot} flex-shrink-0`}></div>
                                            <div className="flex items-baseline space-x-2 min-w-0">
                                                <h3 className="text-sm font-semibold text-gray-800 truncate">{student.name}</h3>
                                                <span className="text-xs text-gray-400 flex-shrink-0">Gr {student.grade}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 flex-shrink-0">
                                            <div className="w-32 bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`${config.bar} h-1.5 rounded-full transition-all duration-500`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-lg font-bold text-gray-800 w-12 text-right">{count}<span className="text-xs text-gray-400">/12</span></span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
