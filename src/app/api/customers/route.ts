import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
    const customers = await prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
    const data = await request.json();
    const customer = await prisma.customer.create({
        data: {
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            loyaltyPoints: data.loyaltyPoints || 0,
        },
    });
    return NextResponse.json(customer, { status: 201 });
}