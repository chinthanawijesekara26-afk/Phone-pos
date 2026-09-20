import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";

export async function POST() {
    try {
        const scriptPath = path.join(
            process.cwd(),
            "backup-phonepos.ps1"
        );

        const result = await new Promise<{
            stdout: string;
            stderr: string;
        }>((resolve, reject) => {

            execFile(
                "powershell.exe",
                [
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    scriptPath,
                ],
                {
                    windowsHide: true,
                    maxBuffer: 20 * 1024 * 1024,
                },
                (error, stdout, stderr) => {

                    if (error) {
                        reject(
                            new Error(
                                stderr ||
                                stdout ||
                                error.message
                            )
                        );

                        return;
                    }

                    resolve({
                        stdout,
                        stderr,
                    });
                }
            );
        });

        return NextResponse.json({
            success: true,
            message: "Backup completed successfully.",
            output: result.stdout,
        });

    } catch (error: any) {

        console.error(
            "BACKUP ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error?.message ||
                    "Backup failed.",
            },
            {
                status: 500,
            }
        );
    }
}