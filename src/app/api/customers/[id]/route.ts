import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// GET CUSTOMER
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = Number(id);

        if (!Number.isInteger(customerId)) {
            return NextResponse.json(
                { error: 'Invalid customer ID' },
                { status: 400 }
            );
        }

        const customer = await prisma.customer.findUnique({
            where: {
                id: customerId,
            },
        });

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error('GET CUSTOMER ERROR:', error);

        return NextResponse.json(
            { error: 'Failed to get customer' },
            { status: 500 }
        );
    }
}


// UPDATE CUSTOMER
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = Number(id);

        if (!Number.isInteger(customerId)) {
            return NextResponse.json(
                { error: 'Invalid customer ID' },
                { status: 400 }
            );
        }

        const data = await request.json();

        const customer = await prisma.customer.update({
            where: {
                id: customerId,
            },
            data: {
                name: data.name,
                phone: data.phone,
                email: data.email || null,
                address: data.address || null,
                loyaltyPoints:
                    data.loyaltyPoints !== undefined
                        ? Number(data.loyaltyPoints)
                        : undefined,
            },
        });

        return NextResponse.json(customer);
    } catch (error) {
        console.error('UPDATE CUSTOMER ERROR:', error);

        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        );
    }
}


// DELETE CUSTOMER
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = Number(id);

        console.log('DELETE CUSTOMER ID:', customerId);

        if (!Number.isInteger(customerId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid customer ID',
                },
                { status: 400 }
            );
        }

        // Check customer exists
        const customer = await prisma.customer.findUnique({
            where: {
                id: customerId,
            },
        });

        if (!customer) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Customer not found',
                },
                { status: 404 }
            );
        }

        // Delete customer
        await prisma.customer.delete({
            where: {
                id: customerId,
            },
        });

        console.log(
            `Customer ${customerId} deleted successfully`
        );

        return NextResponse.json(
            {
                success: true,
                message: 'Customer deleted successfully',
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error(
            'DELETE CUSTOMER ERROR:',
            error
        );

        // Prisma foreign-key/relation error
        if (error?.code === 'P2003') {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'This customer cannot be deleted because they have related sales, orders, or other records.',
                },
                { status: 409 }
            );
        }

        // Customer does not exist
        if (error?.code === 'P2025') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Customer not found.',
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to delete customer.',
            },
            { status: 500 }
        );
    }
}