import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Users, TrendingUp, CheckCircle2, AlertTriangle, Calendar, Award, Target, Sparkles } from 'lucide-react';
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
            className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0',
            label: '✓ Completed',
            progressClass: 'bg-gradient-to-r from-green-500 to-emerald-500'
        },
        'on-track': {
            variant: 'default',
            className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0',
            label: '↗ On Track',
            progressClass: 'bg-gradient-to-r from-blue-500 to-cyan-500'
        },
        attention: {
            variant: 'default',
            className: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0',
            label: '⚠ Attention',
            progressClass: 'bg-gradient-to-r from-orange-500 to-amber-500'
        },
        critical: {
            variant: 'destructive',
            className: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0',
            label: '⚠ Critical',
            progressClass: 'bg-gradient-to-r from-red-500 to-pink-500'
        }
    };

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100">Total Students</CardTitle>
                        <Users className="h-5 w-5 text-blue-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{students.length}</div>
                        <p className="text-xs text-blue-100 mt-1">Active students</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-100">Completed Goal</CardTitle>
                        <Award className="h-5 w-5 text-green-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{completedCount}</div>
                        <p className="text-xs text-green-100 mt-1">12+ classes this month</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-100">Need Attention</CardTitle>
                        <AlertTriangle className="h-5 w-5 text-orange-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{needsAttentionCount}</div>
                        <p className="text-xs text-orange-100 mt-1">Below target pace</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-100">Avg Classes</CardTitle>
                        <TrendingUp className="h-5 w-5 text-purple-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{avgClasses}</div>
                        <p className="text-xs text-purple-100 mt-1">Per student</p>
                    </CardContent>
                </Card>
            </div>

            {/* Month Header */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">{monthName}</CardTitle>
                                <CardDescription>Student Progress Overview</CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-sm">Target: 12 classes</Badge>
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
                            <Card key={student.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl">{student.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-2">
                                                <span>Grade {student.grade}</span>
                                            </CardDescription>
                                        </div>
                                        <Badge className={config.className}>
                                            {config.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Classes Attended</p>
                                            <p className="text-4xl font-bold">{count}<span className="text-xl text-muted-foreground">/12</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground mb-1">Completion</p>
                                            <p className="text-3xl font-bold">{Math.round(percentage)}%</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${config.progressClass} transition-all duration-700 rounded-full`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Target className="h-3 w-3" />
                                            <span>{12 - count} more to goal</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[...Array(12)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-2 h-2 rounded-full transition-all ${i < count ? config.progressClass : 'bg-muted'
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
