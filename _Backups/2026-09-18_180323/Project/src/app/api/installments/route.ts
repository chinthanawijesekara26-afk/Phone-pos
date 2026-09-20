import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
    const contracts = await prisma.installment.findMany({
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(contracts);
}