import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
    try {
        const sales = await prisma.sale.findMany({
            include: {
                customer: true,
                cashier: true,
                saleItems: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                saleDate: 'desc',
            },
        });

        return NextResponse.json(sales);
    } catch (error) {
        console.error('GET /api/sales ERROR:', error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to load sales',
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        console.log('========== SALE REQUEST ==========');
        console.log(JSON.stringify(data, null, 2));
        console.log('===================================');

        // Check cashier
        if (!data.cashierId) {
            return NextResponse.json(
                {
                    error: 'cashierId is required',
                },
                { status: 400 }
            );
        }

        // Check items
        if (
            !Array.isArray(data.items) ||
            data.items.length === 0
        ) {
            return NextResponse.json(
                {
                    error: 'Sale must contain at least one item',
                },
                { status: 400 }
            );
        }

        // Make sure cashier exists in Railway database
        const cashier = await prisma.user.findUnique({
            where: {
                id: Number(data.cashierId),
            },
            select: {
                id: true,
                name: true,
                role: true,
            },
        });

        if (!cashier) {
            return NextResponse.json(
                {
                    error: `Cashier user ${data.cashierId} does not exist in the database`,
                },
                { status: 400 }
            );
        }

        console.log('Cashier found:', cashier);

        const sale = await prisma.$transaction(async (tx) => {

            // Create sale
            const createdSale = await tx.sale.create({
                data: {
                    invoiceNo: `INV-${Date.now()}`,

                    customerId:
                        data.customerId
                            ? Number(data.customerId)
                            : null,

                    cashierId:
                        Number(data.cashierId),

                    subtotal:
                        Number(data.subtotal || 0),

                    discount:
                        Number(data.discount || 0),

                    tax:
                        Number(data.tax || 0),

                    grandTotal:
                        Number(data.grandTotal || 0),

                    paymentMethod:
                    data.paymentMethod,

                    cashReceived:
                        Number(data.cashReceived || 0),

                    balance:
                        Number(data.balance || 0),

                    status: 'PAID',

                    saleItems: {
                        create: data.items.map(
                            (item: any) => ({
                                productId:
                                    Number(item.productId),

                                quantity:
                                    Number(item.quantity),

                                price:
                                    Number(item.price),

                                discount:
                                    Number(
                                        item.discount || 0
                                    ),
                            })
                        ),
                    },
                },

                include: {
                    saleItems: true,
                },
            });

            // Update product stock
            for (const item of data.items) {

                const product =
                    await tx.product.findUnique({
                        where: {
                            id: Number(item.productId),
                        },
                        select: {
                            id: true,
                            name: true,
                            stock: true,
                        },
                    });

                if (!product) {
                    throw new Error(
                        `Product ${item.productId} does not exist`
                    );
                }

                if (
                    product.stock <
                    Number(item.quantity)
                ) {
                    throw new Error(
                        `Insufficient stock for ${product.name}. Available: ${product.stock}`
                    );
                }

                await tx.product.update({
                    where: {
                        id: Number(item.productId),
                    },
                    data: {
                        stock: {
                            decrement:
                                Number(item.quantity),
                        },
                    },
                });
            }

            // Installment
            if (
                data.paymentMethod === 'INSTALLMENT' &&
                data.installmentDetails
            ) {
                const {
                    downPayment,
                    months,
                    monthlyAmount,
                    interest,
                } = data.installmentDetails;

                if (!data.customerId) {
                    throw new Error(
                        'Customer is required for installment sales'
                    );
                }

                const loanAmount =
                    Number(data.grandTotal || 0) -
                    Number(downPayment || 0);

                await tx.installment.create({
                    data: {
                        saleId:
                        createdSale.id,

                        customerId:
                            Number(data.customerId),

                        totalAmount:
                            Number(data.grandTotal || 0),

                        downPayment:
                            Number(downPayment || 0),

                        interestRate:
                            Number(interest || 0),

                        loanAmount:
                        loanAmount,

                        months:
                            Number(months || 1),

                        monthlyInstallment:
                            Number(monthlyAmount || 0),

                        remainingBalance:
                        loanAmount,

                        status: 'ACTIVE',
                    },
                });
            }

            return createdSale;
        });

        console.log(
            'SALE CREATED:',
            sale.id
        );

        return NextResponse.json(
            sale,
            { status: 201 }
        );

    } catch (error) {

        console.error(
            '================================='
        );

        console.error(
            'POST /api/sales ERROR:'
        );

        console.error(error);

        console.error(
            '================================='
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            },
            { status: 500 }
        );
    }
}