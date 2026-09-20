import {
    NextRequest,
    NextResponse
} from 'next/server';

import {
    prisma
} from '@/src/lib/prisma';


export async function GET(
    request: NextRequest,
    {
        params
    }: {
        params: Promise<{
            barcode: string
        }>
    }
) {

    try {

        const {
            barcode
        } = await params;


        const product =
            await prisma.product.findUnique({

                where: {
                    barcode
                },

                include: {

                    brand: true,

                    category: true

                }

            });


        if (!product) {

            return NextResponse.json(
                {
                    error:
                        'Product not found'
                },
                {
                    status: 404
                }
            );

        }


        return NextResponse.json(
            product
        );


    } catch (error) {

        console.error(
            'BARCODE SEARCH ERROR:',
            error
        );


        return NextResponse.json(
            {
                error:
                    'Barcode search failed'
            },
            {
                status: 500
            }
        );
    }
}