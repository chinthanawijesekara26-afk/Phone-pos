"use client";

import { useState } from "react";
import {
    HardDrive,
    Cloud,
    Usb,
    Database,
    Folder,
    CheckCircle,
    XCircle,
    Loader2,
} from "lucide-react";

export default function BackupPage() {

    const [backupRunning, setBackupRunning] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [success, setSuccess] =
        useState<boolean | null>(null);
    const [output, setOutput] =
        useState("");

    const handleBackup = async () => {
    try {
        // setLoading(true);
        setMessage("");

        const response = await fetch(
            "http://127.0.0.1:8787/backup",
            {
                method: "POST"
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Backup failed."
            );
        }

        setMessage(
            "Backup completed successfully."
        );

    } catch (error) {

        console.error(
            "Backup error:",
            error
        );

        setMessage(
            error instanceof Error
                ? error.message
                : "Backup failed."
        );

    } finally {
        // setLoading(false);
    }
};

    return (
        <div className="min-h-screen bg-gray-100 p-6">

            <div className="max-w-5xl mx-auto">

                {/* HEADER */}

                <div className="mb-6">

                    <h1 className="text-3xl font-bold text-gray-900">
                        PhonePOS Backup
                    </h1>

                    <p className="mt-1 text-gray-500">
                        Create a complete backup of your PhonePOS system.
                    </p>

                </div>

                {/* BACKUP CARD */}

                <div className="bg-white rounded-xl shadow-sm border p-8">

                    <div className="flex flex-col items-center text-center">

                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-5">

                            {backupRunning ? (
                                <Loader2
                                    className="w-10 h-10 text-blue-600 animate-spin"
                                />
                            ) : (
                                <HardDrive
                                    className="w-10 h-10 text-blue-600"
                                />
                            )}

                        </div>

                        <h2 className="text-2xl font-bold text-gray-900">
                            Complete System Backup
                        </h2>

                        <p className="text-gray-500 mt-2 max-w-xl">
                            Backup your PhonePOS project and database
                            to all configured backup locations.
                        </p>

                        <button
                            onClick={handleBackup}
                            disabled={backupRunning}
                            className="
                                mt-7
                                px-8
                                py-3
                                rounded-lg
                                bg-blue-600
                                hover:bg-blue-700
                                disabled:bg-gray-400
                                text-white
                                font-semibold
                                flex
                                items-center
                                gap-2
                                transition
                            "
                        >

                            {backupRunning ? (
                                <>
                                    <Loader2
                                        size={20}
                                        className="animate-spin"
                                    />

                                    Creating Backup...
                                </>
                            ) : (
                                <>
                                    <HardDrive
                                        size={20}
                                    />

                                    Backup Now
                                </>
                            )}

                        </button>

                    </div>

                    {/* BACKUP LOCATIONS */}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">

                        <BackupLocation
                            icon={
                                <HardDrive
                                    size={25}
                                />
                            }
                            title="Local Backup"
                            description="C:\\PhonePOS-Backups"
                        />

                        <BackupLocation
                            icon={
                                <Cloud
                                    size={25}
                                />
                            }
                            title="Google Drive"
                            description="G:\\My Drive\\PhonePOS-Backups"
                        />

                        <BackupLocation
                            icon={
                                <Usb
                                    size={25}
                                />
                            }
                            title="USB Backup"
                            description="F:\\PhonePOS-Backups"
                        />

                    </div>

                    {/* INCLUDED DATA */}

                    <div className="mt-8 border-t pt-7">

                        <h3 className="font-bold text-gray-900 mb-4">
                            Backup includes
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                            <BackupItem
                                icon={<Database size={18} />}
                                text="MySQL Database"
                            />

                            <BackupItem
                                icon={<Folder size={18} />}
                                text="PhonePOS Project Files"
                            />

                            <BackupItem
                                icon={<Folder size={18} />}
                                text="Prisma Schema"
                            />

                            <BackupItem
                                icon={<Folder size={18} />}
                                text="Configuration Files"
                            />

                        </div>

                    </div>

                    {/* STATUS */}

                    {message && (

                        <div
                            className={`
                                mt-8
                                rounded-lg
                                border
                                p-4
                                ${
                                    success === true
                                        ? "bg-green-50 border-green-200 text-green-800"
                                        : success === false
                                        ? "bg-red-50 border-red-200 text-red-800"
                                        : "bg-blue-50 border-blue-200 text-blue-800"
                                }
                            `}
                        >

                            <div className="flex items-center gap-2 font-semibold">

                                {success === true && (
                                    <CheckCircle size={20} />
                                )}

                                {success === false && (
                                    <XCircle size={20} />
                                )}

                                {message}

                            </div>

                        </div>

                    )}

                    {/* OUTPUT */}

                    {output && (

                        <details className="mt-5">

                            <summary className="cursor-pointer font-semibold text-gray-700">
                                View backup details
                            </summary>

                            <pre
                                className="
                                    mt-3
                                    p-4
                                    bg-gray-900
                                    text-green-400
                                    rounded-lg
                                    text-xs
                                    overflow-auto
                                    max-h-96
                                "
                            >
                                {output}
                            </pre>

                        </details>

                    )}

                </div>

            </div>

        </div>
    );
}


/* =========================================================
   BACKUP LOCATION
========================================================= */

function BackupLocation({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {

    return (
        <div className="border rounded-lg p-5 bg-gray-50">

            <div className="flex items-center gap-3">

                <div className="text-blue-600">
                    {icon}
                </div>

                <div>

                    <h3 className="font-bold text-gray-900">
                        {title}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1 break-all">
                        {description}
                    </p>

                </div>

            </div>

        </div>
    );
}


/* =========================================================
   BACKUP ITEM
========================================================= */

function BackupItem({
    icon,
    text,
}: {
    icon: React.ReactNode;
    text: string;
}) {

    return (
        <div className="flex items-center gap-3">

            <div className="text-green-600">
                {icon}
            </div>

            <span className="text-gray-700">
                {text}
            </span>

        </div>
    );
}