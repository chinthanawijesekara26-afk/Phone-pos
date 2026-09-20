import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

import { generateBarcode } from '@/src/lib/barcode-generator';
import { generateItemCode } from '@/src/lib/item-code';


export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const lowStock =
            searchParams.get('lowStock') === 'true';

        const where = lowStock
            ? { stock: { lt: 5 } }
            : {};

        const products = await prisma.product.findMany({
            where,

            include: {
                brand: true,
                category: true,
            },

            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(products);

    } catch (error) {
        console.error('GET PRODUCTS ERROR:', error);

        return NextResponse.json(
            {
                error: 'Failed to load products',
            },
            {
                status: 500,
            }
        );
    }
}


export async function POST(request: NextRequest) {
    try {

        const data = await request.json();


        // -----------------------------
        // Get Brand
        // -----------------------------

        let brandName = 'GEN';

        if (data.brandId) {

            const brand = await prisma.brand.findUnique({
                where: {
                    id: Number(data.brandId),
                },
            });

            if (brand) {
                brandName = brand.name;
            }
        }


        // -----------------------------
        // Get Category
        // -----------------------------

        let categoryName = '';

        if (data.categoryId) {

            const category =
                await prisma.category.findUnique({
                    where: {
                        id: Number(data.categoryId),
                    },
                });

            if (category) {
                categoryName =
                    category.name.toLowerCase();
            }
        }


        // -----------------------------
        // Generate Barcode
        // -----------------------------

        let barcode = generateBarcode();

        // Make sure barcode is unique

        while (
            await prisma.product.findUnique({
                where: {
                    barcode,
                },
            })
            ) {
            barcode = generateBarcode();
        }


        // -----------------------------
        // Generate Item Code
        // -----------------------------

        let productCode = generateItemCode(
            brandName,
            data.name,
            data.storage || null,
            categoryName
        );


        // -----------------------------
        // Make Item Code unique
        // -----------------------------

        while (
            await prisma.product.findUnique({
                where: {
                    productCode,
                },
            })
            ) {
            productCode = generateItemCode(
                brandName,
                data.name,
                data.storage || null,
                categoryName
            );
        }


        // -----------------------------
        // Create Product
        // -----------------------------

        const product = await prisma.product.create({

            data: {

                name: data.name,

                // New field
                productCode,

                // Automatically generated
                barcode,

                // Model
                model: data.model || null,

                imei: data.imei || null,

                serialNumber:
                    data.serialNumber || null,

                brandId:
                    data.brandId
                        ? Number(data.brandId)
                        : null,

                categoryId:
                    data.categoryId
                        ? Number(data.categoryId)
                        : null,

                storage:
                    data.storage || null,

                ram:
                    data.ram || null,

                color:
                    data.color || null,

                purchasePrice:
                    Number(data.purchasePrice || 0),

                sellingPrice:
                    Number(data.sellingPrice || 0),

                discountPrice:
                    data.discountPrice !== null &&
                    data.discountPrice !== undefined &&
                    data.discountPrice !== ''
                        ? Number(data.discountPrice)
                        : null,

                tax:
                    Number(data.tax || 0),

                stock:
                    Number(data.stock || 0),

                reorderLevel:
                    Number(data.reorderLevel || 5),

                warrantyMonths:
                    Number(data.warrantyMonths || 12),

                description:
                    data.description || null,
            },

            include: {
                brand: true,
                category: true,
            },
        });


        // -----------------------------
        // Return product
        // -----------------------------

        return NextResponse.json(
            product,
            {
                status: 201,
            }
        );

    } catch (error) {

        console.error(
            'CREATE PRODUCT ERROR:',
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to create product',
            },
            {
                status: 500,
            }
        );
    }
}