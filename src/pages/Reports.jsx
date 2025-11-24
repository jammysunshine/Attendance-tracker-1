import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { FileText, Calendar, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
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
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Student Reports</CardTitle>
                                <CardDescription className="text-indigo-100">Detailed attendance history and analytics</CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-indigo-100">Select Month</label>
                            <Input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-auto bg-white/20 border-white/30 text-white placeholder:text-white/60"
                            />
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {loading ? (
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">Loading reports...</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {students.map(student => {
                        const attendance = attendanceData[student.id] || [];
                        const attendedCount = attendance.length;
                        const isOpen = openStudents[student.id];
                        const percentage = Math.round((attendedCount / 12) * 100);

                        return (
                            <Collapsible
                                key={student.id}
                                open={isOpen}
                                onOpenChange={(open) => setOpenStudents(prev => ({ ...prev, [student.id]: open }))}
                            >
                                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                                    <CollapsibleTrigger asChild>
                                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md ${attendedCount >= 12 ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                                                            attendedCount >= 8 ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                                                                'bg-gradient-to-br from-orange-500 to-amber-500'
                                                        }`}>
                                                        <span className="text-2xl font-bold text-white">{attendedCount}</span>
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl">{student.name}</CardTitle>
                                                        <CardDescription className="text-base">
                                                            Grade {student.grade} • {attendedCount} classes in {monthName}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right mr-2">
                                                        <div className="text-3xl font-bold">{percentage}%</div>
                                                        <div className="text-xs text-muted-foreground">Complete</div>
                                                    </div>
                                                    <Badge className={`text-sm px-3 py-1 ${attendedCount >= 12 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0' :
                                                            attendedCount >= 8 ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0' :
                                                                'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0'
                                                        }`}>
                                                        {attendedCount}/12 classes
                                                    </Badge>
                                                    <Button variant="ghost" size="sm">
                                                        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <CardContent className="border-t pt-6 bg-muted/30">
                                            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Attendance History
                                            </h4>

                                            {attendance.length > 0 ? (
                                                <div className="space-y-2 mb-6">
                                                    {attendance.map((record, index) => (
                                                        <div key={record.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
                                                                    <CheckCircle className="h-5 w-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold">{formatDate(record.date)}</p>
                                                                    <p className="text-xs text-muted-foreground">Class #{attendance.length - index}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                                <span>{record.time}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-white rounded-lg">
                                                    <XCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-3" />
                                                    <p className="text-muted-foreground">No classes attended in {monthName}</p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-3 gap-6 pt-6 border-t">
                                                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                                    <div className="flex items-center justify-center gap-2 mb-2">
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                        <p className="text-3xl font-bold text-green-600">{attendedCount}</p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground font-medium">Attended</p>
                                                </div>
                                                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                                    <div className="flex items-center justify-center gap-2 mb-2">
                                                        <XCircle className="h-5 w-5 text-muted-foreground" />
                                                        <p className="text-3xl font-bold text-muted-foreground">{12 - attendedCount}</p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground font-medium">Remaining</p>
                                                </div>
                                                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                                    <div className="flex items-center justify-center gap-2 mb-2">
                                                        <TrendingUp className="h-5 w-5 text-blue-500" />
                                                        <p className="text-3xl font-bold text-blue-600">{percentage}%</p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground font-medium">Completion</p>
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
