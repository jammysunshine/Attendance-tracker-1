import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { Users, Edit, Trash2, Plus, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null); // For editing

    // Form State
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [phone, setPhone] = useState('');
    const [days, setDays] = useState([]);
    const [time, setTime] = useState('18:30');

    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    useEffect(() => {
        fetchStudents();
    }, []);

    async function fetchStudents() {
        setLoading(true);
        try {
            const q = query(collection(db, "students"), where("isActive", "==", true));
            const querySnapshot = await getDocs(q);
            const studentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(studentsData);
        } catch (error) {
            console.error("Error fetching students: ", error);
        }
        setLoading(false);
    }

    function handleOpenModal(student = null) {
        if (student) {
            setCurrentStudent(student);
            setName(student.name);
            setGrade(student.grade);
            setPhone(student.phoneNumber);
            setDays(student.preferredDays || []);
            setTime(student.preferredTime || '18:30');
        } else {
            setCurrentStudent(null);
            setName('');
            setGrade('');
            setPhone('');
            setDays([]);
            setTime('18:30');
        }
        setIsModalOpen(true);
    }

    function handleDayToggle(day) {
        if (days.includes(day)) {
            setDays(days.filter(d => d !== day));
        } else {
            setDays([...days, day]);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const studentData = {
            name,
            grade,
            phoneNumber: phone,
            preferredDays: days,
            preferredTime: time,
            isActive: true
        };

        try {
            if (currentStudent) {
                await updateDoc(doc(db, "students", currentStudent.id), studentData);
            } else {
                await addDoc(collection(db, "students"), studentData);
            }
            setIsModalOpen(false);
            fetchStudents();
        } catch (error) {
            console.error("Error saving student: ", error);
        }
    }

    async function handleDelete(id) {
        if (window.confirm("Are you sure you want to delete this student?")) {
            try {
                await updateDoc(doc(db, "students", id), { isActive: false });
                fetchStudents();
            } catch (error) {
                console.error("Error deleting student: ", error);
            }
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Student Management</CardTitle>
                                <CardDescription className="text-indigo-100">Manage your student database and preferences</CardDescription>
                            </div>
                        </div>
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => handleOpenModal()}
                                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Student
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>{currentStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
                                    <DialogDescription>
                                        {currentStudent ? 'Update student information' : 'Add a new student to your database'}
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="Student name"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="grade">Grade</Label>
                                        <Input
                                            id="grade"
                                            type="text"
                                            placeholder="Grade level"
                                            value={grade}
                                            onChange={e => setGrade(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="Phone number"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Preferred Days</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {daysOfWeek.map(day => (
                                                <Button
                                                    key={day}
                                                    type="button"
                                                    variant={days.includes(day) ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleDayToggle(day)}
                                                >
                                                    {day.slice(0, 3)}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="time">Preferred Time</Label>
                                        <Input
                                            id="time"
                                            type="time"
                                            value={time}
                                            onChange={e => setTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">
                                            {currentStudent ? 'Update' : 'Add'} Student
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
            </Card>

            {loading ? (
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">Loading students...</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {students.map((student) => (
                        <Card key={student.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold text-primary">{student.name}</h3>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Badge variant="outline">Grade {student.grade}</Badge>
                                            </span>
                                            <span>{student.phoneNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{student.preferredDays?.join(', ') || 'No preferred days'}</span>
                                            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                                            <span>{student.preferredTime || '18:30'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenModal(student)}
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(student.id)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {students.length === 0 && (
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-12 text-center">
                                <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-muted-foreground mb-2">No students found</h3>
                                <p className="text-sm text-muted-foreground">Add your first student to get started.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
