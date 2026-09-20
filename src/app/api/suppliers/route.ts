import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
    const suppliers = await prisma.supplier.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(suppliers);
}

export async function POST(request: NextRequest) {
    const data = await request.json();
    const supplier = await prisma.supplier.create({ data });
    return NextResponse.json(supplier, { status: 201 });
}