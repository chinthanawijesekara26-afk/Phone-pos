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
    try {
        const { id } = await params;
        const productId = Number(id);

        if (!Number.isInteger(productId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid product ID",
                },
                { status: 400 }
            );
        }

        // Check product exists
        const product = await prisma.product.findUnique({
            where: {
                id: productId,
            },
        });

        if (!product) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Product not found",
                },
                { status: 404 }
            );
        }

        // Check if product is already used in sales
        const saleItemCount = await prisma.saleItem.count({
            where: {
                productId: productId,
            },
        });

        if (saleItemCount > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "This product cannot be deleted because it is already used in a sale.",
                },
                { status: 409 }
            );
        }

        // Check if product is used in repairs
        const repairCount = await prisma.repair.count({
            where: {
                productId: productId,
            },
        });

        if (repairCount > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "This product cannot be deleted because it is linked to a repair.",
                },
                { status: 409 }
            );
        }

        // Delete product
        await prisma.product.delete({
            where: {
                id: productId,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Product deleted successfully.",
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("DELETE PRODUCT ERROR:", error);

        if (error?.code === "P2003") {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "This product is being used by another record and cannot be deleted.",
                },
                { status: 409 }
            );
        }

        if (error?.code === "P2025") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Product not found.",
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
                        : "Failed to delete product.",
            },
            { status: 500 }
        );
    }
}