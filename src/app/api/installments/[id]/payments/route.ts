import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Next.js 16 dynamic route params
        const { id } = await params;

        const installmentId = parseInt(id, 10);

        if (isNaN(installmentId)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid installment ID",
                },
                { status: 400 }
            );
        }

        const body = await request.json();

        const amount = Number(body.amount);

        const paidDate = body.paidDate
            ? new Date(body.paidDate)
            : new Date();

        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid payment amount",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // FIND INSTALLMENT CONTRACT
        // --------------------------------------------------
        const contract = await prisma.installment.findUnique({
            where: {
                id: installmentId,
            },
        });

        if (!contract) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Installment contract not found",
                },
                { status: 404 }
            );
        }

        const remainingBalance = Number(
            contract.remainingBalance
        );

        // Already completed
        if (remainingBalance <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This installment is already fully paid",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // PAYMENT AMOUNT
        // --------------------------------------------------
        const actualPayment = Math.min(
            amount,
            remainingBalance
        );

        // --------------------------------------------------
        // FIND LAST PAYMENT
        // --------------------------------------------------
        const lastPayment =
            await prisma.installmentPayment.findFirst({
                where: {
                    contractId: installmentId,
                },
                orderBy: {
                    installmentNo: "desc",
                },
            });

        // Next payment number
        const nextInstallmentNo = lastPayment
            ? Number(lastPayment.installmentNo) + 1
            : 1;

        // --------------------------------------------------
        // DUE DATE
        // --------------------------------------------------
        // Your Installment model does not contain a due-date
        // field, so use the payment date as the due date for
        // the payment record.
        const dueDate = paidDate;

        // --------------------------------------------------
        // CREATE PAYMENT
        // --------------------------------------------------
        const payment =
            await prisma.installmentPayment.create({
                data: {
                    contractId: installmentId,
                    installmentNo: nextInstallmentNo,
                    dueDate: dueDate,
                    amount: actualPayment,
                    paidDate: paidDate,
                    status: "PAID",
                },
            });

        // --------------------------------------------------
        // UPDATE REMAINING BALANCE
        // --------------------------------------------------
        const newBalance =
            remainingBalance - actualPayment;

        const updatedContract =
            await prisma.installment.update({
                where: {
                    id: installmentId,
                },
                data: {
                    remainingBalance: Math.max(
                        newBalance,
                        0
                    ),
                    status:
                        newBalance <= 0
                            ? "COMPLETED"
                            : "ACTIVE",
                },
            });

        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------
        return NextResponse.json(
            {
                success: true,
                message:
                    "Installment payment recorded successfully",
                payment,
                contract: updatedContract,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "Installment payment error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to process installment payment",
            },
            {
                status: 500,
            }
        );
    }
}