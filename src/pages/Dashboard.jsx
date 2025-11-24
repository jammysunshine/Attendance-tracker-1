import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Users, TrendingUp, CheckCircle2, AlertTriangle, Calendar, Award, Target } from 'lucide-react';
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
            className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md',
            label: '✓ Completed',
            progressClass: 'bg-gradient-to-r from-green-500 to-emerald-500'
        },
        'on-track': {
            variant: 'default',
            className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md',
            label: '↗ On Track',
            progressClass: 'bg-gradient-to-r from-blue-500 to-cyan-500'
        },
        attention: {
            variant: 'default',
            className: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-md',
            label: '⚠ Attention',
            progressClass: 'bg-gradient-to-r from-orange-500 to-amber-500'
        },
        critical: {
            variant: 'destructive',
            className: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-md',
            label: '⚠ Critical',
            progressClass: 'bg-gradient-to-r from-red-500 to-pink-500'
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Premium Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white card-hover overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-blue-50">Total Students</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                            <Users className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-bold tracking-tight">{students.length}</div>
                        <p className="text-xs text-blue-50 mt-1 font-medium">Active students</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white card-hover overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-green-50">Completed Goal</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                            <Award className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-bold tracking-tight">{completedCount}</div>
                        <p className="text-xs text-green-50 mt-1 font-medium">12+ classes this month</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white card-hover overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-orange-50">Need Attention</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                            <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-bold tracking-tight">{needsAttentionCount}</div>
                        <p className="text-xs text-orange-50 mt-1 font-medium">Below target pace</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white card-hover overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-purple-50">Avg Classes</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                            <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-bold tracking-tight">{avgClasses}</div>
                        <p className="text-xs text-purple-50 mt-1 font-medium">Per student</p>
                    </CardContent>
                </Card>
            </div>

            {/* Month Header */}
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-white/95">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                                <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl tracking-tight">{monthName}</CardTitle>
                                <CardDescription className="text-base">Student Progress Overview</CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-sm px-4 py-1.5 font-medium">Target: 12 classes</Badge>
                    </div>
                </CardHeader>
            </Card>

            {loading ? (
                <p className="text-muted-foreground">Loading...</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {students.map(student => {
                        const count = attendanceCounts[student.id] || 0;
                        const status = getStatus(count);
                        const percentage = Math.min((count / 12) * 100, 100);
                        const config = statusConfig[status];

                        return (
                            <Card key={student.id} className="border-0 shadow-xl card-hover backdrop-blur-sm bg-white/95">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1.5">
                                            <CardTitle className="text-xl tracking-tight">{student.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 text-base">
                                                <span>Grade {student.grade}</span>
                                            </CardDescription>
                                        </div>
                                        <Badge className={config.className}>
                                            {config.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Classes Attended</p>
                                            <p className="text-4xl font-bold tracking-tight">{count}<span className="text-xl text-muted-foreground">/12</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Completion</p>
                                            <p className="text-3xl font-bold tracking-tight">{Math.round(percentage)}%</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full ${config.progressClass} transition-all duration-700 rounded-full shadow-lg`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                            <Target className="h-3.5 w-3.5" />
                                            <span>{12 - count} more to goal</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[...Array(12)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i < count ? config.progressClass + ' shadow-sm' : 'bg-muted'
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
