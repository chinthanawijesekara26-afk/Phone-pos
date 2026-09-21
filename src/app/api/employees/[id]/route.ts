import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/src/lib/prisma";

// ============================================================
// CHECK ADMIN
// ============================================================

async function checkAdmin(request: NextRequest) {
    try {
        const token = request.cookies.get("token")?.value;

        if (!token) {
            console.error("ADMIN CHECK: No token");
            return null;
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error("ADMIN CHECK: JWT_SECRET missing");
            return null;
        }

        const decoded = jwt.verify(
            token,
            secret
        ) as {
            id?: number | string;
            userId?: number | string;
        };

        const rawUserId =
            decoded.id ?? decoded.userId;

        if (
            rawUserId === undefined ||
            rawUserId === null
        ) {
            console.error(
                "ADMIN CHECK: User ID missing"
            );
            return null;
        }

        const userId = Number(rawUserId);

        if (!Number.isInteger(userId)) {
            console.error(
                "ADMIN CHECK: Invalid user ID:",
                rawUserId
            );
            return null;
        }

        const user =
            await prisma.user.findUnique({
                where: {
                    id: userId,
                },

                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                },
            });

        if (!user) {
            console.error(
                "ADMIN CHECK: User not found:",
                userId
            );
            return null;
        }

        if (!user.isActive) {
            console.error(
                "ADMIN CHECK: User inactive"
            );
            return null;
        }

        if (user.role !== "ADMIN") {
            console.error(
                "ADMIN CHECK: User is not ADMIN"
            );
            return null;
        }

        return user;
    } catch (error) {
        console.error(
            "ADMIN CHECK ERROR:",
            error
        );

        return null;
    }
}

// ============================================================
// GET ONE EMPLOYEE
// ============================================================

export async function GET(
    request: NextRequest,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        const admin =
            await checkAdmin(request);

        if (!admin) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unauthorized. Admin access required.",
                },
                { status: 403 }
            );
        }

        const { id } =
            await context.params;

        const employeeId =
            Number(id);

        if (
            !Number.isInteger(employeeId)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid employee ID.",
                },
                { status: 400 }
            );
        }

        const employee =
            await prisma.user.findUnique({
                where: {
                    id: employeeId,
                },

                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                },
            });

        if (!employee) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Employee not found.",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            employee,
            { status: 200 }
        );
    } catch (error: any) {
        console.error(
            "GET EMPLOYEE ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to load employee.",
            },
            { status: 500 }
        );
    }
}

// ============================================================
// PATCH - UPDATE EMPLOYEE
// ============================================================

export async function PATCH(
    request: NextRequest,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        console.log(
            "================================="
        );

        console.log(
            "PATCH EMPLOYEE REQUEST"
        );

        const admin =
            await checkAdmin(request);

        if (!admin) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unauthorized. Admin access required.",
                },
                { status: 403 }
            );
        }

        const { id } =
            await context.params;

        console.log(
            "PATCH EMPLOYEE ID:",
            id
        );

        const employeeId =
            Number(id);

        if (
            !Number.isInteger(employeeId)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid employee ID.",
                },
                { status: 400 }
            );
        }

        const body =
            await request.json();

        console.log(
            "PATCH BODY:",
            body
        );

        const existingEmployee =
            await prisma.user.findUnique({
                where: {
                    id: employeeId,
                },
            });

        if (!existingEmployee) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Employee not found.",
                },
                { status: 404 }
            );
        }

        const data: {
            name?: string;
            email?: string;
            password?: string;
            role?: "ADMIN" | "CASHIER";
            isActive?: boolean;
        } = {};

        // -----------------------------
        // NAME
        // -----------------------------

        if (
            body.name !== undefined
        ) {
            const name =
                String(body.name).trim();

            if (!name) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Employee name cannot be empty.",
                    },
                    { status: 400 }
                );
            }

            data.name = name;
        }

        // -----------------------------
        // EMAIL
        // -----------------------------

        if (
            body.email !== undefined
        ) {
            const email =
                String(body.email)
                    .trim()
                    .toLowerCase();

            if (!email) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Email cannot be empty.",
                    },
                    { status: 400 }
                );
            }

            const emailOwner =
                await prisma.user.findFirst({
                    where: {
                        email,
                        NOT: {
                            id: employeeId,
                        },
                    },
                    select: {
                        id: true,
                    },
                });

            if (emailOwner) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Another employee already uses this email.",
                    },
                    { status: 409 }
                );
            }

            data.email = email;
        }

        // -----------------------------
        // ROLE
        // -----------------------------

        if (
            body.role !== undefined
        ) {
            if (
                body.role !== "ADMIN" &&
                body.role !== "CASHIER"
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Invalid employee role.",
                    },
                    { status: 400 }
                );
            }

            data.role = body.role;
        }

        // -----------------------------
        // STATUS
        // -----------------------------

        if (
            body.isActive !== undefined
        ) {
            data.isActive =
                Boolean(body.isActive);
        }

        // -----------------------------
        // PASSWORD
        // -----------------------------

        if (
            body.password !== undefined &&
            String(body.password).trim()
        ) {
            const password =
                String(body.password);

            if (password.length < 6) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Password must contain at least 6 characters.",
                    },
                    { status: 400 }
                );
            }

            data.password =
                await bcrypt.hash(
                    password,
                    10
                );
        }

        // -----------------------------
        // NOTHING TO UPDATE
        // -----------------------------

        if (
            Object.keys(data).length === 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "No changes were provided.",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // UPDATE DATABASE
        // -----------------------------

        const updatedEmployee =
            await prisma.user.update({
                where: {
                    id: employeeId,
                },

                data,

                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                },
            });

        console.log(
            "EMPLOYEE UPDATED:",
            updatedEmployee.id
        );

        return NextResponse.json(
            {
                success: true,
                message:
                    "Employee updated successfully.",
                employee:
                    updatedEmployee,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(
            "PATCH EMPLOYEE ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to update employee.",
                error:
                    process.env.NODE_ENV ===
                    "development"
                        ? error?.message
                        : undefined,
            },
            { status: 500 }
        );
    }
}

// ============================================================
// DELETE - DELETE EMPLOYEE
// ============================================================

export async function DELETE(
    request: NextRequest,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        console.log(
            "================================="
        );

        console.log(
            "DELETE EMPLOYEE REQUEST"
        );

        const admin =
            await checkAdmin(request);

        if (!admin) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unauthorized. Admin access required.",
                },
                { status: 403 }
            );
        }

        const { id } =
            await context.params;

        console.log(
            "DELETE EMPLOYEE ID:",
            id
        );

        const employeeId =
            Number(id);

        if (
            !Number.isInteger(employeeId)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid employee ID.",
                },
                { status: 400 }
            );
        }

        // -----------------------------------------
        // Find employee
        // -----------------------------------------

        const employee =
            await prisma.user.findUnique({
                where: {
                    id: employeeId,
                },
            });

        if (!employee) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Employee not found.",
                },
                { status: 404 }
            );
        }

        // -----------------------------------------
        // Prevent deleting logged-in admin
        // -----------------------------------------

        if (
            employee.id === admin.id
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "You cannot delete your own account.",
                },
                { status: 400 }
            );
        }

        // -----------------------------------------
        // DELETE
        // -----------------------------------------

        try {
            await prisma.user.delete({
                where: {
                    id: employeeId,
                },
            });
        } catch (deleteError: any) {
            console.error(
                "PRISMA DELETE ERROR:",
                deleteError
            );

            // Foreign key protection
            if (
                deleteError?.code ===
                "P2003"
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "This employee cannot be permanently deleted because this account is linked to other records. Deactivate the employee instead.",
                    },
                    { status: 409 }
                );
            }

            // Record already gone
            if (
                deleteError?.code ===
                "P2025"
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Employee no longer exists.",
                    },
                    { status: 404 }
                );
            }

            throw deleteError;
        }

        console.log(
            "EMPLOYEE DELETED:",
            employeeId
        );

        return NextResponse.json(
            {
                success: true,
                message:
                    "Employee deleted successfully.",
                id: employeeId,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(
            "DELETE EMPLOYEE ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to delete employee.",
                error:
                    process.env.NODE_ENV ===
                    "development"
                        ? error?.message
                        : undefined,
            },
            { status: 500 }
        );
    }
}