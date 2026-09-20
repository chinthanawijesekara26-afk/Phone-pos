import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { format, differenceInDays } from 'date-fns';

export async function GET() {
    const notifications: any[] = [];

    // 1. Low stock alerts (using reorderLevel, fallback to < 5)
    const allProducts = await prisma.product.findMany({
        select: { id: true, name: true, stock: true, reorderLevel: true },
    });
    const lowStockItems = allProducts.filter(
        (p) => p.stock < p.reorderLevel || p.stock < 10
    );
    if (lowStockItems.length > 0) {
        notifications.push({
            id: 'low-stock',
            type: 'warning',
            title: `${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} are running low in stock`,
            details: lowStockItems.map((item) => `${item.name} (${item.stock} left)`).join(', '),
            time: format(new Date(), 'hh:mm a'),
        });
    }

    // 2. Expiring warranties
    const now = new Date();
    const expiringItems = await prisma.product.findMany({
        where: {
            warrantyMonths: { gt: 0 },
            createdAt: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { id: true, name: true, warrantyMonths: true, createdAt: true },
    });
    expiringItems.forEach((item) => {
        const expiryDate = new Date(item.createdAt);
        expiryDate.setMonth(expiryDate.getMonth() + item.warrantyMonths);
        const daysLeft = differenceInDays(expiryDate, now);
        if (daysLeft <= 30 && daysLeft > 0) {
            notifications.push({
                id: `expiry-${item.id}`,
                type: 'warning',
                title: `${item.name} warranty expires soon`,
                details: `${daysLeft} days remaining`,
                time: format(expiryDate, 'dd/MM/yyyy'),
            });
        }
    });

    // 3. New Purchase (mock – replace with real data when available)
    notifications.push({
        id: 'new-purchase',
        type: 'info',
        title: 'New Purchase',
        details: 'New GRN #GRN-2026-007 added successfully.',
        time: format(new Date(), 'dd/MM/yyyy'),
    });

    return NextResponse.json({
        count: notifications.length,
        notifications,
    });
}