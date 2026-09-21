import { NextResponse } from "next/server";
import os from "os";

export async function POST() {
    try {
        const platform = os.platform();

        if (platform !== "win32") {
            return NextResponse.json({
                success: false,
                available: false,
                code: "WINDOWS_BACKUP_NOT_AVAILABLE",
                message:
                    "This Railway server cannot access Windows local drives. Run the PhonePOS Windows Backup Agent on your PC.",
            });
        }

        // Only reached when PhonePOS itself is running on Windows.
        return NextResponse.json({
            success: true,
            available: true,
            message: "Windows backup can be started.",
        });

    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Backup failed.",
            },
            { status: 500 }
        );
    }
}