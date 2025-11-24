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
        <div className="min-h-screen relative">
            {/* Premium Glass Navigation */}
            <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-lg">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-8">
                            {/* Premium Logo */}
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl blur opacity-75"></div>
                                    <div className="relative p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        TutorTracker
                                    </span>
                                    <p className="text-xs text-muted-foreground -mt-0.5">Professional Edition</p>
                                </div>
                            </div>

                            {/* Navigation Items */}
                            <div className="flex space-x-1">
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
                                                className={`relative ${isActive ? "shadow-lg" : ""}`}
                                                size="sm"
                                            >
                                                <Icon className="w-4 h-4 mr-2" />
                                                {item.name}
                                                {isActive && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                                                )}
                                            </Button>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Logout Button */}
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            size="sm"
                            className="shadow-sm hover:shadow-md transition-shadow"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Main Content with relative positioning for z-index */}
            <main className="relative z-10 max-w-7xl mx-auto py-8 px-6">
                {children}
            </main>
        </div>
    );
}
