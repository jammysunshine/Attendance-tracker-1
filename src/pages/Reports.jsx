import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { FileText, Calendar, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

export default function Reports() {
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(true);
    const [openStudents, setOpenStudents] = useState({});
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    async function fetchData() {
        setLoading(true);
        try {
            const studentsQ = query(collection(db, "students"), where("isActive", "==", true));
            const studentsSnapshot = await getDocs(studentsQ);
            const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <div>
                                <CardTitle>Student Reports</CardTitle>
                                <CardDescription>Detailed attendance history</CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Select Month</label>
                            <Input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-auto"
                            />
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {loading ? (
                <p className="text-muted-foreground">Loading...</p>
            ) : (
                <div className="space-y-3">
                    {students.map(student => {
                        const attendance = attendanceData[student.id] || [];
                        const attendedCount = attendance.length;
                        const isOpen = openStudents[student.id];

                        return (
                            <Collapsible
                                key={student.id}
                                open={isOpen}
                                onOpenChange={(open) => setOpenStudents(prev => ({ ...prev, [student.id]: open }))}
                            >
                                <Card>
                                    <CollapsibleTrigger asChild>
                                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${attendedCount >= 12 ? 'bg-green-100' : attendedCount >= 8 ? 'bg-blue-100' : 'bg-orange-100'
                                                        }`}>
                                                        <span className="text-lg font-bold">{attendedCount}</span>
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg">{student.name}</CardTitle>
                                                        <CardDescription>Grade {student.grade} • {attendedCount} classes in {monthName}</CardDescription>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge className={
                                                        attendedCount >= 12 ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                            attendedCount >= 8 ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                                                                'bg-orange-100 text-orange-700 hover:bg-orange-100'
                                                    }>
                                                        {attendedCount}/12 classes
                                                    </Badge>
                                                    <Button variant="ghost" size="sm">
                                                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <CardContent className="border-t pt-4">
                                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Attendance History
                                            </h4>

                                            {attendance.length > 0 ? (
                                                <div className="space-y-2 mb-4">
                                                    {attendance.map((record, index) => (
                                                        <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">{formatDate(record.date)}</p>
                                                                    <p className="text-xs text-muted-foreground">Class #{attendance.length - index}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Clock className="h-4 w-4" />
                                                                <span className="font-medium">{record.time}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <XCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                                                    <p className="text-muted-foreground text-sm">No classes attended in {monthName}</p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-green-600">{attendedCount}</p>
                                                    <p className="text-xs text-muted-foreground">Attended</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-muted-foreground">{12 - attendedCount}</p>
                                                    <p className="text-xs text-muted-foreground">Remaining</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-blue-600">{Math.round((attendedCount / 12) * 100)}%</p>
                                                    <p className="text-xs text-muted-foreground">Completion</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
