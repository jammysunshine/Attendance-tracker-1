import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Users, TrendingUp, CheckCircle2, AlertTriangle, Calendar, Award, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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

    const statusConfig = {
        completed: {
            variant: 'default',
            className: 'bg-green-100 text-green-700 hover:bg-green-100',
            label: 'Completed'
        },
        'on-track': {
            variant: 'default',
            className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
            label: 'On Track'
        },
        attention: {
            variant: 'default',
            className: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
            label: 'Needs Attention'
        },
        critical: {
            variant: 'destructive',
            label: 'Critical'
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{students.length}</div>
                        <p className="text-xs text-muted-foreground">Active students</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Goal</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedCount}</div>
                        <p className="text-xs text-muted-foreground">12+ classes this month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{needsAttentionCount}</div>
                        <p className="text-xs text-muted-foreground">Below target pace</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Classes</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgClasses}</div>
                        <p className="text-xs text-muted-foreground">Per student</p>
                    </CardContent>
                </Card>
            </div>

            {/* Month Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            <CardTitle>{monthName}</CardTitle>
                        </div>
                        <Badge variant="outline">Target: 12 classes</Badge>
                    </div>
                </CardHeader>
            </Card>

            {loading ? (
                <p className="text-muted-foreground">Loading...</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {students.map(student => {
                        const count = attendanceCounts[student.id] || 0;
                        const status = getStatus(count);
                        const percentage = Math.min((count / 12) * 100, 100);
                        const config = statusConfig[status];

                        return (
                            <Card key={student.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg">{student.name}</CardTitle>
                                            <CardDescription>Grade {student.grade}</CardDescription>
                                        </div>
                                        <Badge className={config.className}>
                                            {config.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Classes Attended</p>
                                            <p className="text-3xl font-bold">{count}<span className="text-lg text-muted-foreground">/12</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Completion</p>
                                            <p className="text-2xl font-bold">{Math.round(percentage)}%</p>
                                        </div>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Target className="h-3 w-3" />
                                            <span>{12 - count} more to goal</span>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[...Array(12)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-1.5 h-1.5 rounded-full ${i < count ? 'bg-primary' : 'bg-muted'
                                                        }`}
                                                />
                                            ))}
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
