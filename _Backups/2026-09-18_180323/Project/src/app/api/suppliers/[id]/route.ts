import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
        where: {
            id: Number(id),
        },
    });

    if (!supplier) {
        return NextResponse.json(
            { error: 'Supplier not found' },
            { status: 404 }
        );
    }

    return NextResponse.json(supplier);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await request.json();

    const supplier = await prisma.supplier.update({
        where: {
            id: Number(id),
        },
        data: {
            name: data.name,
            company: data.company,
            phone: data.phone,
            email: data.email,
            address: data.address,
        },
    });

    return NextResponse.json(supplier);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    await prisma.supplier.delete({
        where: {
            id: Number(id),
        },
    });

    return new NextResponse(null, { status: 204 });
}