import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { FileText, Calendar, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function Reports() {
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedStudent, setExpandedStudent] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    async function fetchData() {
        setLoading(true);
        try {
            // Fetch students
            const studentsQ = query(collection(db, "students"), where("isActive", "==", true));
            const studentsSnapshot = await getDocs(studentsQ);
            const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch attendance for selected month
            const [year, month] = selectedMonth.split('-');
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

            const attendanceQ = query(
                collection(db, "attendance"),
                where("date", ">=", Timestamp.fromDate(startOfMonth)),
                where("date", "<=", Timestamp.fromDate(endOfMonth)),
                orderBy("date", "desc")
            );
            const attendanceSnapshot = await getDocs(attendanceQ);

            // Group attendance by student
            const attendanceByStudent = {};
            attendanceSnapshot.forEach(doc => {
                const data = doc.data();
                if (!attendanceByStudent[data.studentId]) {
                    attendanceByStudent[data.studentId] = [];
                }
                attendanceByStudent[data.studentId].push({
                    id: doc.id,
                    date: data.date.toDate(),
                    time: data.time
                });
            });

            setStudents(studentsData);
            setAttendanceData(attendanceByStudent);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    }

    function formatDate(date) {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }

    const monthName = new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-5 mb-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6" />
                        <div>
                            <h1 className="text-2xl font-bold">Student Reports</h1>
                            <p className="text-indigo-100 text-sm">Detailed attendance history</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-indigo-100 mb-1">Select Month</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-3 py-2 rounded-lg text-gray-800 font-medium text-sm"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : (
                <div className="space-y-3">
                    {students.map(student => {
                        const attendance = attendanceData[student.id] || [];
                        const isExpanded = expandedStudent === student.id;
                        const attendedCount = attendance.length;

                        return (
                            <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Student Header - Clickable */}
                                <div
                                    onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${attendedCount >= 12 ? 'bg-green-100' : attendedCount >= 8 ? 'bg-blue-100' : 'bg-orange-100'
                                                }`}>
                                                <span className="text-lg font-bold text-gray-800">{attendedCount}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">{student.name}</h3>
                                                <p className="text-sm text-gray-500">Grade {student.grade} • {attendedCount} classes in {monthName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${attendedCount >= 12 ? 'bg-green-100 text-green-700' :
                                                    attendedCount >= 8 ? 'bg-blue-100 text-blue-700' :
                                                        'bg-orange-100 text-orange-700'
                                                }`}>
                                                {attendedCount}/12 classes
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 bg-gray-50">
                                        <div className="p-4">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                Attendance History
                                            </h4>

                                            {attendance.length > 0 ? (
                                                <div className="space-y-2">
                                                    {attendance.map((record, index) => (
                                                        <div key={record.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-800">{formatDate(record.date)}</p>
                                                                    <p className="text-xs text-gray-500">Class #{attendance.length - index}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                                <Clock className="w-4 h-4" />
                                                                <span className="font-medium">{record.time}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-gray-500 text-sm">No classes attended in {monthName}</p>
                                                </div>
                                            )}

                                            {/* Summary */}
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div>
                                                        <p className="text-2xl font-bold text-green-600">{attendedCount}</p>
                                                        <p className="text-xs text-gray-500">Attended</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold text-gray-400">{12 - attendedCount}</p>
                                                        <p className="text-xs text-gray-500">Remaining</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold text-blue-600">{Math.round((attendedCount / 12) * 100)}%</p>
                                                        <p className="text-xs text-gray-500">Completion</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
