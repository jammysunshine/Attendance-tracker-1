import React, { useState, useEffect } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

export default function Attendance() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [loading, setLoading] = useState(true);
    const [editingStudent, setEditingStudent] = useState(null);
    const [tempTime, setTempTime] = useState('');

    const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    async function fetchData() {
        setLoading(true);
        try {
            const studentsQ = query(collection(db, "students"), where("isActive", "==", true));
            const studentsSnapshot = await getDocs(studentsQ);
            const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const attendanceQ = query(
                collection(db, "attendance"),
                where("date", ">=", Timestamp.fromDate(startOfDay)),
                where("date", "<=", Timestamp.fromDate(endOfDay))
            );
            const attendanceSnapshot = await getDocs(attendanceQ);
            const attendanceMap = {};
            attendanceSnapshot.forEach(doc => {
                attendanceMap[doc.data().studentId] = { id: doc.id, ...doc.data() };
            });

            setStudents(studentsData);
            setAttendanceRecords(attendanceMap);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    }

    function getDayOfWeek(dateString) {
        const date = new Date(dateString);
        return daysOfWeek[date.getDay()];
    }

    function getSortedStudents() {
        const currentDay = getDayOfWeek(selectedDate);
        return [...students].sort((a, b) => {
            const aPref = a.preferredDays?.includes(currentDay);
            const bPref = b.preferredDays?.includes(currentDay);
            if (aPref && !bPref) return -1;
            if (!aPref && bPref) return 1;
            return a.name.localeCompare(b.name);
        });
    }

    async function handleMarkPresent(student) {
        const time = student.preferredTime || '18:30';
        const dateObj = new Date(selectedDate);
        const [hours, minutes] = time.split(':');
        dateObj.setHours(parseInt(hours), parseInt(minutes));

        try {
            await addDoc(collection(db, "attendance"), {
                studentId: student.id,
                date: Timestamp.fromDate(dateObj),
                time: time
            });
            fetchData();
        } catch (error) {
            console.error("Error marking present:", error);
        }
    }

    async function handleUpdateTime(student, newTime) {
        const record = attendanceRecords[student.id];
        if (record) {
            try {
                await updateDoc(doc(db, "attendance", record.id), {
                    time: newTime
                });
                setEditingStudent(null);
                fetchData();
            } catch (error) {
                console.error("Error updating time:", error);
            }
        }
    }

    async function handleRemoveAttendance(student) {
        const record = attendanceRecords[student.id];
        if (record && window.confirm('Remove attendance record?')) {
            try {
                await deleteDoc(doc(db, "attendance", record.id));
                fetchData();
            } catch (error) {
                console.error("Error deleting attendance:", error);
            }
        }
    }

    const sortedStudents = getSortedStudents();
    const currentDay = getDayOfWeek(selectedDate);
    const presentCount = Object.keys(attendanceRecords).length;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Compact Header */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{presentCount} of {students.length} present</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                        />
                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">{currentDay}</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {sortedStudents.map((student) => {
                            const isPresent = !!attendanceRecords[student.id];
                            const isPreferredDay = student.preferredDays?.includes(currentDay);
                            const isEditing = editingStudent === student.id;
                            const currentTime = isPresent ? attendanceRecords[student.id].time : student.preferredTime || '18:30';

                            return (
                                <div
                                    key={student.id}
                                    className={`px-4 py-3 flex justify-between items-center transition-colors ${isPreferredDay ? 'bg-blue-50' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isPresent ? 'bg-green-500' : 'bg-gray-200'
                                            }`}>
                                            {isPresent ? (
                                                <Check className="text-white w-5 h-5" />
                                            ) : (
                                                <X className="text-gray-400 w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-baseline space-x-2">
                                                <h3 className="text-base font-semibold text-gray-800">{student.name}</h3>
                                                <span className="text-xs text-gray-500">Grade {student.grade}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {isPresent ? (
                                            <>
                                                {isEditing ? (
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="time"
                                                            value={tempTime}
                                                            onChange={(e) => setTempTime(e.target.value)}
                                                            className="border-2 border-blue-500 rounded-lg px-2 py-1 text-sm focus:outline-none"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateTime(student, tempTime)}
                                                            className="px-2 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingStudent(null)}
                                                            className="px-2 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setEditingStudent(student.id);
                                                                setTempTime(currentTime);
                                                            }}
                                                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                                        >
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>{currentTime}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveAttendance(student)}
                                                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                                        >
                                                            Remove
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleMarkPresent(student)}
                                                className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                                            >
                                                Mark Present
                                            </button>
                                        )}
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
