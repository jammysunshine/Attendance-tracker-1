import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

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
            // 1. Fetch Active Students
            const studentsQ = query(collection(db, "students"), where("isActive", "==", true));
            const studentsSnapshot = await getDocs(studentsQ);
            const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 2. Fetch Attendance for Current Month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            const attendanceQ = query(
                collection(db, "attendance"),
                where("date", ">=", Timestamp.fromDate(startOfMonth)),
                where("date", "<=", Timestamp.fromDate(endOfMonth))
            );
            const attendanceSnapshot = await getDocs(attendanceQ);

            // 3. Aggregate Counts
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

        // Completed
        if (count >= TARGET) {
            return { label: 'Completed', color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' };
        }

        // On Track Calculation
        const expected = (daysElapsed / daysInMonth) * TARGET;
        const diff = count - expected;

        if (diff >= -1) { // Roughly on track
            return { label: 'On Track', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' };
        } else if (diff >= -3) { // Slightly behind
            return { label: 'Needs Attention', color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' };
        } else { // Critically behind
            return { label: 'Critically Low', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' };
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Monthly Progress</h1>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {students.map(student => {
                        const count = attendanceCounts[student.id] || 0;
                        const status = getStatus(count);
                        const percentage = Math.min((count / 12) * 100, 100);

                        return (
                            <div key={student.id} className={`bg-white overflow-hidden shadow rounded-lg border-l-4 ${status.text.replace('text', 'border')}`}>
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900 truncate">{student.name}</h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="flex items-end justify-between mb-2">
                                        <span className="text-3xl font-bold text-gray-900">{count}</span>
                                        <span className="text-sm text-gray-500 mb-1">/ 12 classes</span>
                                    </div>

                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className={`${status.color} h-2.5 rounded-full transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
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
