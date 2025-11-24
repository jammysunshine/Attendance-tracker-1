import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { TrendingUp, Award, AlertCircle, CheckCircle } from 'lucide-react';

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
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysElapsed = now.getDate();

        if (count >= TARGET) {
            return {
                label: 'Completed',
                color: 'from-green-500 to-emerald-500',
                text: 'text-green-700',
                bg: 'bg-green-50',
                icon: CheckCircle
            };
        }

        const expected = (daysElapsed / daysInMonth) * TARGET;
        const diff = count - expected;

        if (diff >= -1) {
            return {
                label: 'On Track',
                color: 'from-blue-500 to-cyan-500',
                text: 'text-blue-700',
                bg: 'bg-blue-50',
                icon: TrendingUp
            };
        } else if (diff >= -3) {
            return {
                label: 'Needs Attention',
                color: 'from-yellow-500 to-orange-500',
                text: 'text-yellow-700',
                bg: 'bg-yellow-50',
                icon: AlertCircle
            };
        } else {
            return {
                label: 'Critically Low',
                color: 'from-red-500 to-pink-500',
                text: 'text-red-700',
                bg: 'bg-red-50',
                icon: AlertCircle
            };
        }
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
                <p className="text-gray-600">Monthly progress overview for all students</p>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {students.map(student => {
                        const count = attendanceCounts[student.id] || 0;
                        const status = getStatus(count);
                        const percentage = Math.min((count / 12) * 100, 100);
                        const StatusIcon = status.icon;

                        return (
                            <div key={student.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                <div className={`h-2 bg-gradient-to-r ${status.color}`}></div>
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{student.name}</h3>
                                            <p className="text-sm text-gray-500">Grade {student.grade}</p>
                                        </div>
                                        <div className={`p-2 rounded-xl ${status.bg}`}>
                                            <StatusIcon className={`w-5 h-5 ${status.text}`} />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-end justify-between mb-2">
                                            <span className="text-4xl font-bold text-gray-800">{count}</span>
                                            <span className="text-sm text-gray-500 mb-1">/ 12 classes</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className={`bg-gradient-to-r ${status.color} h-3 rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                                        {status.label}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
