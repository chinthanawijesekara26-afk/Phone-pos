import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/src/lib/prisma";

const allowedRoles = ["ADMIN", "CASHIER"] as const;

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

        const decoded = jwt.verify(token, secret) as {
            id?: number | string;
            userId?: number | string;
        };

        const rawUserId = decoded.id ?? decoded.userId;

        if (rawUserId === undefined || rawUserId === null) {
            console.error("ADMIN CHECK: User ID missing");
            return null;
        }

        const userId = Number(rawUserId);

        if (!Number.isInteger(userId)) {
            console.error("ADMIN CHECK: Invalid user ID:", rawUserId);
            return null;
        }

        const user = await prisma.user.findUnique({
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
            console.error("ADMIN CHECK: User not found:", userId);
            return null;
        }

        if (!user.isActive) {
            console.error("ADMIN CHECK: User inactive");
            return null;
        }

        if (user.role !== "ADMIN") {
            console.error("ADMIN CHECK: Not ADMIN");
            return null;
        }

        return user;
    } catch (error) {
        console.error("ADMIN CHECK ERROR:", error);
        return null;
    }
}

// ============================================================
// GET - LOAD EMPLOYEES
// ============================================================

export async function GET(request: NextRequest) {
    try {
        const admin = await checkAdmin(request);

        if (!admin) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized. Admin access required.",
                },
                { status: 403 }
            );
        }

        const employees = await prisma.user.findMany({
            where: {
                role: {
                    in: ["ADMIN", "CASHIER"],
                },
            },

            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },

            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(employees, {
            status: 200,
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error: any) {
        console.error("GET EMPLOYEES ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to load employees.",
                error:
                    process.env.NODE_ENV === "development"
                        ? error?.message
                        : undefined,
            },
            { status: 500 }
        );
    }
}

// ============================================================
// POST - CREATE EMPLOYEE
// ============================================================

export async function POST(request: NextRequest) {
    try {
        const admin = await checkAdmin(request);

        if (!admin) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized. Admin access required.",
                },
                { status: 403 }
            );
        }

        const body = await request.json();

        const name =
            typeof body.name === "string"
                ? body.name.trim()
                : "";

        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        const password =
            typeof body.password === "string"
                ? body.password
                : "";

        const role = body.role;

        const isActive =
            body.isActive === undefined
                ? true
                : Boolean(body.isActive);

        // -----------------------------
        // Validation
        // -----------------------------

        if (!name) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Employee name is required.",
                },
                { status: 400 }
            );
        }

        if (!email) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email is required.",
                },
                { status: 400 }
            );
        }

        if (!password) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Password is required.",
                },
                { status: 400 }
            );
        }

        if (
            role !== "ADMIN" &&
            role !== "CASHIER"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Only ADMIN and CASHIER roles are allowed.",
                },
                { status: 400 }
            );
        }

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

        // -----------------------------
        // Existing email
        // -----------------------------

        const existingUser =
            await prisma.user.findUnique({
                where: {
                    email,
                },
            });

        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "An employee with this email already exists.",
                },
                { status: 409 }
            );
        }

        // -----------------------------
        // Hash password
        // -----------------------------

        const hashedPassword =
            await bcrypt.hash(password, 10);

        // -----------------------------
        // Create employee
        // -----------------------------

        const employee =
            await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role,
                    isActive,
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

        return NextResponse.json(
            {
                success: true,
                message: "Employee created successfully.",
                employee,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("POST EMPLOYEE ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to create employee.",
                error:
                    process.env.NODE_ENV === "development"
                        ? error?.message
                        : undefined,
            },
            { status: 500 }
        );
    }
}