import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Users, TrendingUp, CheckCircle2, AlertTriangle, Calendar, Award, Target, Clock } from 'lucide-react';

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
    const avgClasses = students.length > 0 ? (totalClasses / students.length).toFixed(1) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Colorful Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-600 rounded-2xl shadow-lg p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-blue-700 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <TrendingUp className="w-5 h-5 opacity-50" />
                    </div>
                    <p className="text-3xl font-bold mb-1">{students.length}</p>
                    <p className="text-blue-100 text-sm font-medium">Total Students</p>
                </div>

                <div className="bg-green-600 rounded-2xl shadow-lg p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-green-700 rounded-xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <Award className="w-5 h-5 opacity-50" />
                    </div>
                    <p className="text-3xl font-bold mb-1">{completedCount}</p>
                    <p className="text-green-100 text-sm font-medium">Completed Goal</p>
                </div>

                <div className="bg-orange-600 rounded-2xl shadow-lg p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-orange-700 rounded-xl">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <Target className="w-5 h-5 opacity-50" />
                    </div>
                    <p className="text-3xl font-bold mb-1">{needsAttentionCount}</p>
                    <p className="text-orange-100 text-sm font-medium">Need Attention</p>
                </div>

                <div className="bg-purple-600 rounded-2xl shadow-lg p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-purple-700 rounded-xl">
                            <Clock className="w-6 h-6" />
                        </div>
                        <Calendar className="w-5 h-5 opacity-50" />
                    </div>
                    <p className="text-3xl font-bold mb-1">{avgClasses}</p>
                    <p className="text-purple-100 text-sm font-medium">Avg Classes</p>
                </div>
            </div>

            {/* Month Header */}
            <div className="bg-gray-800 rounded-2xl shadow-lg p-4 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5" />
                        <h2 className="text-xl font-bold">{monthName}</h2>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                        <span className="px-3 py-1 bg-gray-700 rounded-lg">Target: 12 classes</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {students.map(student => {
                        const count = attendanceCounts[student.id] || 0;
                        const status = getStatus(count);
                        const percentage = Math.min((count / 12) * 100, 100);

                        const statusConfig = {
                            completed: {
                                color: 'bg-green-600',
                                bg: 'bg-green-50',
                                text: 'text-green-700',
                                barColor: 'bg-green-500',
                                icon: CheckCircle2,
                                label: 'Completed'
                            },
                            'on-track': {
                                color: 'bg-blue-600',
                                bg: 'bg-blue-50',
                                text: 'text-blue-700',
                                barColor: 'bg-blue-500',
                                icon: TrendingUp,
                                label: 'On Track'
                            },
                            attention: {
                                color: 'bg-orange-600',
                                bg: 'bg-orange-50',
                                text: 'text-orange-700',
                                barColor: 'bg-orange-500',
                                icon: AlertTriangle,
                                label: 'Needs Attention'
                            },
                            critical: {
                                color: 'bg-red-600',
                                bg: 'bg-red-50',
                                text: 'text-red-700',
                                barColor: 'bg-red-500',
                                icon: AlertTriangle,
                                label: 'Critical'
                            }
                        };

                        const config = statusConfig[status];
                        const StatusIcon = config.icon;

                        return (
                            <div key={student.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                {/* Colored Top Bar */}
                                <div className={`h-2 ${config.color}`}></div>

                                <div className="p-5">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-800 mb-1">{student.name}</h3>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-500">Grade {student.grade}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${config.bg} ${config.text}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-xl ${config.bg}`}>
                                            <StatusIcon className={`w-6 h-6 ${config.text}`} />
                                        </div>
                                    </div>

                                    {/* Progress Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Classes Attended</p>
                                                <p className="text-3xl font-bold text-gray-800">{count}<span className="text-lg text-gray-400">/12</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 mb-1">Completion</p>
                                                <p className="text-2xl font-bold text-gray-800">{Math.round(percentage)}%</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="relative">
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className={`${config.barColor} h-3 rounded-full transition-all duration-700`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Mini Stats */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <Target className="w-3 h-3" />
                                                <span>{12 - count} more to goal</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                {[...Array(12)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-1.5 h-1.5 rounded-full ${i < count ? config.barColor : 'bg-gray-200'
                                                            }`}
                                                    ></div>
                                                ))}
                                            </div>
                                        </div>
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
