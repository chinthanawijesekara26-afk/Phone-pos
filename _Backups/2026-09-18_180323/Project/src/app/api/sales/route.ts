import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
    const sales = await prisma.sale.findMany({
        include: {
            customer: true,
            cashier: true,
            saleItems: { include: { product: true } },
        },
        orderBy: { saleDate: 'desc' },
    });
    return NextResponse.json(sales);
}

export async function POST(request: NextRequest) {
    const data = await request.json();

    const sale = await prisma.sale.create({
        data: {
            invoiceNo: `INV-${Date.now()}`,
            customerId: data.customerId,
            cashierId: data.cashierId,
            subtotal: data.subtotal,
            discount: data.discount || 0,
            tax: data.tax || 0,
            grandTotal: data.grandTotal,
            paymentMethod: data.paymentMethod,
            cashReceived: data.cashReceived,
            balance: data.balance,
            status: 'PAID',
            saleItems: {
                create: data.items.map((item: any) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    discount: item.discount || 0,
                })),
            },
        },
        include: { saleItems: true },
    });

    // Update stock
    for (const item of data.items) {
        await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
        });
    }

    // If installment, create contract
    if (data.paymentMethod === 'INSTALLMENT' && data.installmentDetails) {
        const { downPayment, months, monthlyAmount, firstDueDate, interest } = data.installmentDetails;
        const loanAmount = data.grandTotal - downPayment;
        await prisma.installment.create({
            data: {
                saleId: sale.id,
                customerId: data.customerId,
                totalAmount: data.grandTotal,
                downPayment: downPayment,
                interestRate: interest || 0,
                loanAmount: loanAmount,
                months: months,
                monthlyInstallment: monthlyAmount,
                remainingBalance: loanAmount,
                status: 'ACTIVE',
                // nextDueDate: new Date(firstDueDate),
            },
        });
    }

    return NextResponse.json(sale, { status: 201 });
}