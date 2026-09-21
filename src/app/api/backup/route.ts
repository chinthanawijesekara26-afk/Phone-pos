import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json({
        success: false,
        available: false,
        code: "LOCAL_BACKUP_AGENT_REQUIRED",
        message:
            "Windows backup is handled by the PhonePOS Windows Backup Agent."
    });
}