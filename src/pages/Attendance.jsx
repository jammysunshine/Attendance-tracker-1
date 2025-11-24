import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Calendar as CalendarIcon, UserCheck } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
        <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
                                <UserCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Attendance Tracking</CardTitle>
                                <CardDescription className="text-blue-100">
                                    <span className="font-semibold text-white">{presentCount}</span> of {students.length} students present today
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-auto bg-white/20 border-white/30 text-white placeholder:text-white/60"
                            />
                            <Badge variant="outline" className="text-sm px-3 py-1 bg-white/20 border-white/30 text-white">
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                {currentDay}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {loading ? (
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">Loading attendance data...</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {sortedStudents.map((student) => {
                        const isPresent = !!attendanceRecords[student.id];
                        const isPreferredDay = student.preferredDays?.includes(currentDay);
                        const isEditing = editingStudent === student.id;
                        const currentTime = isPresent ? attendanceRecords[student.id].time : student.preferredTime || '18:30';

                        return (
                            <Card
                                key={student.id}
                                className={`border-0 shadow-md hover:shadow-lg transition-all ${isPreferredDay ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500' : ''
                                    }`}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md ${isPresent
                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                                    : 'bg-gradient-to-br from-gray-300 to-gray-400'
                                                }`}>
                                                {isPresent ? (
                                                    <Check className="h-6 w-6 text-white" />
                                                ) : (
                                                    <X className="h-6 w-6 text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <h3 className="font-bold text-lg">{student.name}</h3>
                                                    <span className="text-sm text-muted-foreground">Grade {student.grade}</span>
                                                </div>
                                                {isPreferredDay && (
                                                    <Badge variant="outline" className="mt-1 text-xs">
                                                        Preferred Day
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isPresent ? (
                                                <>
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="time"
                                                                value={tempTime}
                                                                onChange={(e) => setTempTime(e.target.value)}
                                                                className="w-32"
                                                                autoFocus
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleUpdateTime(student, tempTime)}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setEditingStudent(null)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setEditingStudent(student.id);
                                                                    setTempTime(currentTime);
                                                                }}
                                                            >
                                                                <Clock className="mr-2 h-4 w-4" />
                                                                {currentTime}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleRemoveAttendance(student)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <Button
                                                    onClick={() => handleMarkPresent(student)}
                                                    className="shadow-md"
                                                >
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Mark Present
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
