import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, UserCheck, Users, FileText, LogOut, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Layout({ children }) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error("Failed to log out");
        }
    }

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Attendance', path: '/attendance', icon: UserCheck },
        { name: 'Students', path: '/students', icon: Users },
        { name: 'Reports', path: '/reports', icon: FileText },
    ];

    return (
        <div className="min-h-screen">
            {/* Modern Top Navigation */}
            <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    TutorTracker
                                </span>
                            </div>
                            <div className="flex space-x-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                        >
                                            <Button
                                                variant={isActive ? "default" : "ghost"}
                                                className={isActive ? "shadow-md" : ""}
                                            >
                                                <Icon className="w-4 h-4 mr-2" />
                                                {item.name}
                                            </Button>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 px-6">
                {children}
            </main>
        </div>
    );
}
