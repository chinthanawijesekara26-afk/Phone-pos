import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";

function runPowerShell(
    scriptPath: string
): Promise<{
    stdout: string;
    stderr: string;
}> {
    return new Promise((resolve, reject) => {
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
}

async function createRailwayBackup() {
    /*
     * Railway runs Linux.
     *
     * We cannot use:
     * C:\
     * G:\
     * F:\
     * powershell.exe
     *
     * Therefore create a backup directory
     * using the Railway volume when available.
     */

    const volumePath =
        process.env.RAILWAY_VOLUME_MOUNT_PATH;

    const backupRoot =
        volumePath
            ? path.join(
                  volumePath,
                  "PhonePOS-Backups"
              )
            : path.join(
                  os.tmpdir(),
                  "PhonePOS-Backups"
              );

    await fs.mkdir(
        backupRoot,
        {
            recursive: true,
        }
    );

    const timestamp =
        new Date()
            .toISOString()
            .replace(/[:.]/g, "-");

    const backupDirectory =
        path.join(
            backupRoot,
            `backup-${timestamp}`
        );

    await fs.mkdir(
        backupDirectory,
        {
            recursive: true,
        }
    );

    /*
     * Save configuration information.
     */

    const configuration = {
        createdAt:
            new Date().toISOString(),

        platform: process.platform,

        nodeVersion:
            process.version,

        railway:
            Boolean(
                process.env.RAILWAY_ENVIRONMENT
            ),

        databaseConfigured:
            Boolean(
                process.env.DATABASE_URL
            ),

        backupDirectory,
    };

    await fs.writeFile(
        path.join(
            backupDirectory,
            "backup-info.json"
        ),
        JSON.stringify(
            configuration,
            null,
            2
        ),
        "utf8"
    );

    /*
     * Copy Prisma schema if available.
     */

    const prismaSchema =
        path.join(
            process.cwd(),
            "prisma",
            "schema.prisma"
        );

    try {
        await fs.copyFile(
            prismaSchema,
            path.join(
                backupDirectory,
                "schema.prisma"
            )
        );
    } catch {
        // Prisma schema may not exist in production build.
    }

    /*
     * Save environment configuration names,
     * but NEVER save secret values.
     */

    const environmentInfo = {
        NODE_ENV:
            process.env.NODE_ENV,

        RAILWAY_ENVIRONMENT:
            process.env
                .RAILWAY_ENVIRONMENT,

        RAILWAY_SERVICE_NAME:
            process.env
                .RAILWAY_SERVICE_NAME,

        databaseConfigured:
            Boolean(
                process.env.DATABASE_URL
            ),
    };

    await fs.writeFile(
        path.join(
            backupDirectory,
            "environment-info.json"
        ),
        JSON.stringify(
            environmentInfo,
            null,
            2
        ),
        "utf8"
    );

    return {
        backupDirectory,
        message:
            "Railway backup files created successfully.",
    };
}

export async function POST() {
    try {
        const isWindows =
            process.platform === "win32";

        /*
         * ==================================================
         * WINDOWS LOCAL DEVELOPMENT
         * ==================================================
         */

        if (isWindows) {
            const scriptPath =
                path.join(
                    process.cwd(),
                    "backup-phonepos.ps1"
                );

            try {
                await fs.access(
                    scriptPath
                );
            } catch {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "backup-phonepos.ps1 was not found.",
                    },
                    {
                        status: 404,
                    }
                );
            }

            const result =
                await runPowerShell(
                    scriptPath
                );

            return NextResponse.json({
                success: true,

                platform:
                    "windows",

                message:
                    "Backup completed successfully.",

                output:
                    result.stdout,

                warning:
                    result.stderr ||
                    undefined,
            });
        }

        /*
         * ==================================================
         * RAILWAY / LINUX
         * ==================================================
         */

        const result =
            await createRailwayBackup();

        return NextResponse.json({
            success: true,

            platform:
                process.platform,

            message:
                result.message,

            output:
                `Backup location: ${result.backupDirectory}`,
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