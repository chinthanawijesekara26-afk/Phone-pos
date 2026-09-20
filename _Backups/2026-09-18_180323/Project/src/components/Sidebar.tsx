'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Truck,
    Wrench,
    Receipt,
    BarChart3,
    LogOut,
    UserCog,
} from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';

// Define menu items with required roles
const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'CASHIER', 'TECHNICIAN'] },
    { href: '/products', label: 'Products', icon: Package, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { href: '/sales', label: 'Sales POS', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { href: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { href: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['ADMIN', 'MANAGER'] },
    { href: '/installments', label: 'Installments', icon: Receipt, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { href: '/repairs', label: 'Repairs', icon: Wrench, roles: ['ADMIN', 'MANAGER', 'CASHIER', 'TECHNICIAN'] },
    { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
    {href: '/employees', label: 'Employees', icon: UserCog, roles: ['ADMIN'],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, loading } = useAuth();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    // Filter menu items based on user role
    const filteredItems = menuItems.filter((item) =>
        item.roles.includes(user?.role || '')
    );

    if (loading) return <div className="w-64 bg-white shadow-md p-4">Loading...</div>;

    return (
        <aside className="w-64 bg-white shadow-md flex flex-col">
            <div className="p-2.5 border-b">
                <h1 className="text-xl font-bold text-blue-600">📱 PhonePOS</h1>
                {user && (
                    <p className="text-xs text-gray-500 mt-1 ml-2">Role: {user.role}</p>
                )}
            </div>
            <nav className="flex-1 p-6 space-y-4">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 rounded-md"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}