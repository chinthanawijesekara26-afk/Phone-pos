import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import os from "os";

// =====================================================
// POST /api/backup
// =====================================================

export async function POST() {
    try {
        // -------------------------------------------------
        // CHECK OPERATING SYSTEM
        // -------------------------------------------------

        const platform = os.platform();

        console.log("BACKUP PLATFORM:", platform);

        // -------------------------------------------------
        // RAILWAY / LINUX
        // -------------------------------------------------

        if (platform !== "win32") {
            return NextResponse.json(
                {
                    success: false,
                    available: false,
                    code: "WINDOWS_BACKUP_ONLY",
                    message:
                        "Windows local backup is only available when PhonePOS is running on a Windows PC. Railway cannot access your C:, F:, or G: drives.",
                },
                {
                    status: 200,
                }
            );
        }

        // -------------------------------------------------
        // WINDOWS
        // -------------------------------------------------

        const scriptPath = path.join(
            process.cwd(),
            "backup-phonepos.ps1"
        );

        console.log(
            "BACKUP SCRIPT:",
            scriptPath
        );

        // -------------------------------------------------
        // CHECK POWERSHELL
        // -------------------------------------------------

        const powershellPath =
            path.join(
                process.env.SystemRoot ||
                    "C:\\Windows",
                "System32",
                "WindowsPowerShell",
                "v1.0",
                "powershell.exe"
            );

        console.log(
            "POWERSHELL:",
            powershellPath
        );

        // -------------------------------------------------
        // RUN POWERSHELL
        // -------------------------------------------------

        const result =
            await new Promise<{
                stdout: string;
                stderr: string;
            }>((resolve, reject) => {
                execFile(
                    powershellPath,
                    [
                        "-NoProfile",
                        "-NonInteractive",
                        "-ExecutionPolicy",
                        "Bypass",
                        "-File",
                        scriptPath,
                    ],
                    {
                        windowsHide: true,

                        maxBuffer:
                            50 *
                            1024 *
                            1024,

                        timeout:
                            10 *
                            60 *
                            1000,
                    },
                    (
                        error,
                        stdout,
                        stderr
                    ) => {
                        if (error) {
                            console.error(
                                "POWERSHELL ERROR:",
                                error
                            );

                            console.error(
                                "STDOUT:",
                                stdout
                            );

                            console.error(
                                "STDERR:",
                                stderr
                            );

                            reject(
                                new Error(
                                    stderr?.trim() ||
                                        stdout?.trim() ||
                                        error.message ||
                                        "PowerShell backup failed."
                                )
                            );

                            return;
                        }

                        resolve({
                            stdout:
                                stdout || "",
                            stderr:
                                stderr || "",
                        });
                    }
                );
            });

        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        return NextResponse.json(
            {
                success: true,
                available: true,
                message:
                    "Backup completed successfully.",
                output: result.stdout,
                warning:
                    result.stderr || "",
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error(
            "BACKUP ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                available: true,
                message:
                    error instanceof Error
                        ? error.message
                        : "Backup failed.",
            },
            {
                status: 500,
            }
        );
    }
}