const http = require("http");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const PORT = 8787;

// Your actual PhonePOS project folder
const PROJECT_PATH = "C:\\Users\\USER\\phoneshop-pos";

const SCRIPT_PATH = path.join(
    PROJECT_PATH,
    "backup-phonepos.ps1"
);

console.log("====================================");
console.log("PhonePOS Windows Backup Agent");
console.log("====================================");
console.log("Project:", PROJECT_PATH);
console.log("Script :", SCRIPT_PATH);

const server = http.createServer((req, res) => {

    // CORS
    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    // OPTIONS
    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    // -----------------------------------------
    // HEALTH CHECK
    // -----------------------------------------

    if (
        req.method === "GET" &&
        req.url === "/health"
    ) {
        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(
            JSON.stringify({
                success: true,
                agent: "PhonePOS Windows Backup Agent",
                platform: process.platform,
                projectPath: PROJECT_PATH,
                scriptExists: fs.existsSync(SCRIPT_PATH)
            })
        );

        return;
    }

    // -----------------------------------------
    // BACKUP
    // -----------------------------------------

    if (
        req.method === "POST" &&
        req.url === "/backup"
    ) {

        // Check project
        if (!fs.existsSync(PROJECT_PATH)) {

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(
                JSON.stringify({
                    success: false,
                    message:
                        "PhonePOS project folder was not found.",
                    path: PROJECT_PATH
                })
            );

            return;
        }

        // Check PowerShell script
        if (!fs.existsSync(SCRIPT_PATH)) {

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(
                JSON.stringify({
                    success: false,
                    message:
                        "backup-phonepos.ps1 was not found.",
                    path: SCRIPT_PATH
                })
            );

            return;
        }

        console.log("Backup requested...");

        const powershellPath =
            "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";

        execFile(
            powershellPath,
            [
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                SCRIPT_PATH
            ],
            {
                windowsHide: true,
                maxBuffer: 50 * 1024 * 1024,
                timeout: 10 * 60 * 1000
            },
            (error, stdout, stderr) => {

                if (error) {

                    console.error(
                        "BACKUP ERROR:",
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

                    res.writeHead(500, {
                        "Content-Type":
                            "application/json"
                    });

                    res.end(
                        JSON.stringify({
                            success: false,
                            message:
                                stderr ||
                                stdout ||
                                error.message
                        })
                    );

                    return;
                }

                console.log(
                    "Backup completed successfully."
                );

                res.writeHead(200, {
                    "Content-Type":
                        "application/json"
                });

                res.end(
                    JSON.stringify({
                        success: true,
                        message:
                            "Backup completed successfully.",
                        output: stdout
                    })
                );
            }
        );

        return;
    }

    // -----------------------------------------
    // 404
    // -----------------------------------------

    res.writeHead(404, {
        "Content-Type": "application/json"
    });

    res.end(
        JSON.stringify({
            success: false,
            message: "Not found"
        })
    );
});

server.listen(PORT, "127.0.0.1", () => {

    console.log("");
    console.log(
        `Backup Agent running at http://127.0.0.1:${PORT}`
    );

    console.log(
        `Health: http://127.0.0.1:${PORT}/health`
    );

    console.log(
        `Project: ${PROJECT_PATH}`
    );

    console.log(
        `Script exists: ${fs.existsSync(SCRIPT_PATH)}`
    );

});