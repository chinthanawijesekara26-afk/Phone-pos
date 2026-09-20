const {
  app,
  BrowserWindow,
  dialog
} = require("electron");

const path = require("path");
const fs = require("fs");
const {
  spawn
} = require("child_process");
const http = require("http");


let mainWindow = null;
let nextProcess = null;


const PORT = 3000;
const HOST = "127.0.0.1";


const DATABASE_URL =
  "mysql://root:Chinthana2006@localhost:3306/phone_pos";


const JWT_SECRET =
  "phone_pos_secret_key_2026";


// ==================================================
// PATHS
// ==================================================

function getServerPath() {

  if (app.isPackaged) {

    return path.join(
      process.resourcesPath,
      "next",
      "server.js"
    );
  }

  return path.join(
    __dirname,
    "..",
    ".next",
    "standalone",
    "server.js"
  );
}


function getNodePath() {

  if (app.isPackaged) {

    return path.join(
      process.resourcesPath,
      "node.exe"
    );
  }

  return process.execPath;
}


function getNextRoot() {

  if (app.isPackaged) {

    return path.join(
      process.resourcesPath,
      "next"
    );
  }

  return path.join(
    __dirname,
    "..",
    ".next",
    "standalone"
  );
}


// ==================================================
// START NEXT.JS
// ==================================================

function startNextServer() {

  return new Promise((resolve, reject) => {

    const serverPath = getServerPath();

    const nodePath = getNodePath();

    const nextRoot = getNextRoot();


    console.log("");
    console.log("=================================");
    console.log("Starting PhonePOS Next.js");
    console.log("=================================");

    console.log("Packaged:", app.isPackaged);

    console.log("Node:");
    console.log(nodePath);

    console.log("Server:");
    console.log(serverPath);

    console.log("Root:");
    console.log(nextRoot);

    console.log("=================================");


    // ----------------------------------------------
    // SERVER
    // ----------------------------------------------

    if (!fs.existsSync(serverPath)) {

      reject(
        new Error(
          "Next.js server.js not found:\n\n" +
          serverPath
        )
      );

      return;
    }


    // ----------------------------------------------
    // NODE
    // ----------------------------------------------

    if (!fs.existsSync(nodePath)) {

      reject(
        new Error(
          "Node.js runtime not found:\n\n" +
          nodePath
        )
      );

      return;
    }


    // ----------------------------------------------
    // NEXT MODULE
    // ----------------------------------------------

    const nextModulePath = path.join(
      nextRoot,
      "node_modules",
      "next"
    );


    if (!fs.existsSync(nextModulePath)) {

      reject(
        new Error(
          "Next.js module not found:\n\n" +
          nextModulePath +
          "\n\n" +
          "The standalone Next.js files were not packaged correctly."
        )
      );

      return;
    }


    // ----------------------------------------------
    // ENVIRONMENT
    // ----------------------------------------------

    const env = {

      ...process.env,

      NODE_ENV: "production",

      PORT: String(PORT),

      HOSTNAME: HOST,

      DATABASE_URL,

      JWT_SECRET,

      NODE_PATH: path.join(
        nextRoot,
        "node_modules"
      )
    };


    console.log("");
    console.log("Starting Node process...");


    // ----------------------------------------------
    // START NODE
    // ----------------------------------------------

    nextProcess = spawn(
      nodePath,
      [serverPath],
      {
        cwd: nextRoot,

        env,

        windowsHide: false,

        stdio: [
          "ignore",
          "pipe",
          "pipe"
        ]
      }
    );


    // ----------------------------------------------
    // STDOUT
    // ----------------------------------------------

    nextProcess.stdout.on(
      "data",
      (data) => {

        console.log(
          "[NEXT]",
          data.toString()
        );
      }
    );


    // ----------------------------------------------
    // STDERR
    // ----------------------------------------------

    nextProcess.stderr.on(
      "data",
      (data) => {

        console.error(
          "[NEXT ERROR]",
          data.toString()
        );
      }
    );


    // ----------------------------------------------
    // PROCESS ERROR
    // ----------------------------------------------

    nextProcess.on(
      "error",
      (error) => {

        console.error(
          "NEXT PROCESS ERROR:",
          error
        );

        reject(error);
      }
    );


    // ----------------------------------------------
    // PROCESS EXIT
    // ----------------------------------------------

    nextProcess.on(
      "exit",
      (code, signal) => {

        console.error(
          `NEXT PROCESS EXITED: code=${code}, signal=${signal}`
        );

        if (code !== 0) {

          reject(
            new Error(
              "Next.js process stopped before the server started.\n\n" +
              `Code: ${code}\n` +
              `Signal: ${signal}`
            )
          );
        }
      }
    );


    // ----------------------------------------------
    // WAIT SERVER
    // ----------------------------------------------

    waitForServer()

      .then(() => {

        console.log("");
        console.log(
          "Next.js server is ready."
        );

        resolve();
      })

      .catch(reject);

  });
}


// ==================================================
// WAIT FOR SERVER
// ==================================================

function waitForServer() {

  return new Promise(
    (resolve, reject) => {

      const startTime =
        Date.now();


      function check() {

        const req =
          http.get(
            `http://${HOST}:${PORT}`,
            (res) => {

              console.log(
                "Next.js HTTP status:",
                res.statusCode
              );

              resolve();
            }
          );


        req.on(
          "error",
          () => {

            if (
              Date.now() - startTime >
              60000
            ) {

              reject(
                new Error(
                  "Next.js server did not start within 60 seconds."
                )
              );

              return;
            }


            setTimeout(
              check,
              500
            );
          }
        );


        req.setTimeout(
          2000,
          () => {

            req.destroy();
          }
        );
      }


      check();
    }
  );
}


// ==================================================
// CREATE WINDOW
// ==================================================

async function createWindow() {

  try {

    await startNextServer();


    mainWindow =
      new BrowserWindow({

        width: 1400,

        height: 900,

        minWidth: 1100,

        minHeight: 700,

        show: false,

        webPreferences: {

          nodeIntegration: false,

          contextIsolation: true
        }
      });


    const url =
      `http://${HOST}:${PORT}/dashboard`;


    console.log(
      "Loading:",
      url
    );


    await mainWindow.loadURL(url);


    mainWindow.once(
      "ready-to-show",
      () => {

        mainWindow.show();
      }
    );


    mainWindow.on(
      "closed",
      () => {

        mainWindow = null;
      }
    );

  }

  catch (error) {

    console.error(
      "PHONEPOS START ERROR:",
      error
    );


    dialog.showErrorBox(
      "PhonePOS Error",
      error.message ||
      String(error)
    );


    app.quit();
  }
}


// ==================================================
// APP EVENTS
// ==================================================

app.whenReady()
  .then(createWindow);


app.on(
  "window-all-closed",
  () => {

    stopNextServer();

    if (
      process.platform !==
      "darwin"
    ) {

      app.quit();
    }
  }
);


app.on(
  "before-quit",
  () => {

    stopNextServer();
  }
);


// ==================================================
// STOP NEXT
// ==================================================

function stopNextServer() {

  if (nextProcess) {

    try {

      nextProcess.kill();

    }
    catch (error) {

      console.error(
        "Failed to stop Next.js:",
        error
      );
    }

    nextProcess = null;
  }
}