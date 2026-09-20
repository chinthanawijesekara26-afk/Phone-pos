import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const installment = await prisma.installment.findUnique({
        where: {
            id: Number(id),
        },
        include: {
            customer: true,
            sale: true,
            payments: true,
        },
    });

    if (!installment) {
        return NextResponse.json(
            { error: 'Installment not found' },
            { status: 404 }
        );
    }

    return NextResponse.json(installment);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await request.json();

    const installment = await prisma.installment.update({
        where: {
            id: Number(id),
        },
        data: {
            totalAmount: data.totalAmount,
            remainingBalance: data.remainingBalance,
            monthlyInstallment: data.monthlyInstallment,
            status: data.status,
        },
    });

    return NextResponse.json(installment);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    await prisma.installment.delete({
        where: {
            id: Number(id),
        },
    });

    return new NextResponse(null, { status: 204 });
}