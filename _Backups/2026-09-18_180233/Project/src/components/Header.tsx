'use client';
import { useState, useEffect, useRef } from 'react';
import { User } from '@/types';
import { Bell, ShoppingCart, User as UserIcon, LogOut, Mail, Shield, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
    id: string;
    type: 'warning' | 'info' | 'success';
    title: string;
    details?: string;
    time: string;
}

export default function Header({ user }: { user: User | null }) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications/unread');
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh notifications every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const unreadCount = notifications.length;

    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Welcome, {user?.name || 'User'}</h2>
            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Bell className="w-5 h-5 text-gray-600" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                            <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-semibold">Notifications</h3>
                                <button
                                    onClick={() => setShowNotifications(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-2">
                                {notifications.length === 0 ? (
                                    <p className="text-gray-500 text-sm p-2">No new notifications</p>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`p-2 rounded-md mb-1 text-sm ${
                                                notif.type === 'warning'
                                                    ? 'bg-yellow-50 border-l-4 border-yellow-400'
                                                    : notif.type === 'info'
                                                        ? 'bg-blue-50 border-l-4 border-blue-400'
                                                        : 'bg-green-50 border-l-4 border-green-400'
                                            }`}
                                        >
                                            <p className="font-medium">{notif.title}</p>
                                            {notif.details && <p className="text-xs text-gray-600">{notif.details}</p>}
                                            <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Avatar */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold hover:ring-2 hover:ring-blue-300 transition-all"
                    >
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </button>

                    {/* Profile Dropdown */}
                    {showProfile && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{user?.name || 'User'}</p>
                                        <p className="text-xs text-gray-500">{user?.email || ''}</p>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                    <Shield className="w-3 h-3" />
                                    <span>Role: {user?.role || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="p-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}