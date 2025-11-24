import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

export default function Attendance() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [time, setTime] = useState('');

    const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    async function fetchData() {
        setLoading(true);
        try {
            // Fetch Students
            const studentsQ = query(collection(db, "students"), where("isActive", "==", true));
            const studentsSnapshot = await getDocs(studentsQ);
            const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch Attendance for selected date
            // Normalize date to midnight for query
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

    function handleStudentClick(student) {
        const record = attendanceRecords[student.id];
        setSelectedStudent(student);
        if (record) {
            // Editing existing record
            setTime(record.time);
        } else {
            // New record
            setTime(student.preferredTime || '18:30');
        }
        setModalOpen(true);
    }

    async function handleSaveAttendance() {
        if (!selectedStudent) return;

        const record = attendanceRecords[selectedStudent.id];
        const dateObj = new Date(selectedDate);
        // Set time on date object roughly for sorting if needed, but we store time string separately
        const [hours, minutes] = time.split(':');
        dateObj.setHours(parseInt(hours), parseInt(minutes));

        try {
            if (record) {
                // Update
                await updateDoc(doc(db, "attendance", record.id), {
                    time: time,
                    // We don't update date usually, but if we did we'd need to be careful
                });
            } else {
                // Create
                await addDoc(collection(db, "attendance"), {
                    studentId: selectedStudent.id,
                    date: Timestamp.fromDate(dateObj),
                    time: time
                });
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving attendance:", error);
        }
    }

    async function handleDeleteAttendance() {
        if (!selectedStudent) return;
        const record = attendanceRecords[selectedStudent.id];
        if (record) {
            if (window.confirm("Remove attendance record?")) {
                try {
                    await deleteDoc(doc(db, "attendance", record.id));
                    setModalOpen(false);
                    fetchData();
                } catch (error) {
                    console.error("Error deleting attendance:", error);
                }
            }
        }
    }

    const sortedStudents = getSortedStudents();
    const currentDay = getDayOfWeek(selectedDate);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Attendance</h1>
                <div className="flex items-center space-x-4">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border rounded px-3 py-2 shadow-sm"
                    />
                    <span className="text-gray-500 font-medium">{currentDay}</span>
                </div>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {sortedStudents.map((student) => {
                            const isPresent = !!attendanceRecords[student.id];
                            const isPreferredDay = student.preferredDays?.includes(currentDay);

                            return (
                                <li
                                    key={student.id}
                                    className={`px-4 py-4 sm:px-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 ${isPreferredDay ? 'bg-indigo-50' : ''}`}
                                    onClick={() => handleStudentClick(student)}
                                >
                                    <div className="flex items-center">
                                        <div className={`flex-shrink-0 h-5 w-5 rounded border ${isPresent ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                            {isPresent && (
                                                <svg className="h-4 w-4 text-white mx-auto" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {isPresent ? `Present @ ${attendanceRecords[student.id].time}` : 'Absent'}
                                            </p>
                                        </div>
                                    </div>
                                    {isPreferredDay && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            Scheduled
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {modalOpen && selectedStudent && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-sm w-full p-6">
                        <h2 className="text-xl font-bold mb-4">
                            Mark Attendance for {selectedStudent.name}
                        </h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                        <div className="flex justify-between">
                            {attendanceRecords[selectedStudent.id] ? (
                                <button
                                    onClick={handleDeleteAttendance}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    Remove Attendance
                                </button>
                            ) : (
                                <div></div> // Spacer
                            )}
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveAttendance}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
