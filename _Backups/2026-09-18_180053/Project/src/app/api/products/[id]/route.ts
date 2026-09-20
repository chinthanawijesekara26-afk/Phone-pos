import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';


export async function GET(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {

    const { id } = await params;

    const product =
        await prisma.product.findUnique({

            where: {
                id: Number(id),
            },

            include: {
                brand: true,
                category: true,
            },
        });


    if (!product) {

        return NextResponse.json(
            {
                error: 'Product not found',
            },
            {
                status: 404,
            }
        );
    }


    return NextResponse.json(product);
}


export async function PUT(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {

    const { id } = await params;

    const data = await request.json();


    // Do not allow barcode/item code
    // to be changed accidentally.

    delete data.barcode;
    delete data.productCode;


    const product =
        await prisma.product.update({

            where: {
                id: Number(id),
            },

            data,
        });


    return NextResponse.json(product);
}


export async function DELETE(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {

    const { id } = await params;


    await prisma.product.delete({

        where: {
            id: Number(id),
        },

    });


    return new NextResponse(
        null,
        {
            status: 204,
        }
    );
}