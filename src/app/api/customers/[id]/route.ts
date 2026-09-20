import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
        where: {
            id: Number(id),
        },
    });

    if (!customer) {
        return NextResponse.json(
            { error: 'Customer not found' },
            { status: 404 }
        );
    }

    return NextResponse.json(customer);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await request.json();

    const customer = await prisma.customer.update({
        where: {
            id: Number(id),
        },
        data: {
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            loyaltyPoints: data.loyaltyPoints,
        },
    });

    return NextResponse.json(customer);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    await prisma.customer.delete({
        where: {
            id: Number(id),
        },
    });

    return new NextResponse(null, { status: 204 });
}