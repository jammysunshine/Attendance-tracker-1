import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    Add Student
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {students.map((student) => (
                            <li key={student.id} className="px-4 py-4 sm:px-6 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium text-indigo-600">{student.name}</h3>
                                    <p className="text-sm text-gray-500">Grade: {student.grade} | {student.phoneNumber}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {student.preferredDays.join(', ')} @ {student.preferredTime}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleOpenModal(student)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </div>
                            </li>
                        ))}
                        {students.length === 0 && (
                            <li className="px-4 py-8 text-center text-gray-500">
                                No students found. Add one to get started.
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">{currentStudent ? 'Edit Student' : 'Add Student'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Grade"
                                    value={grade}
                                    onChange={e => setGrade(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Days</label>
                                    <div className="flex flex-wrap gap-2">
                                        {daysOfWeek.map(day => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => handleDayToggle(day)}
                                                className={`px-2 py-1 text-xs rounded ${days.includes(day) ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                            >
                                                {day.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
