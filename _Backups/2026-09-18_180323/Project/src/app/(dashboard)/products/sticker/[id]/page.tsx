"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Printer,
    Plus,
    Minus,
} from "lucide-react";

declare global {
    interface Window {
        BrowserPrint?: any;
    }
}

/* =========================================================
   PRODUCT
========================================================= */

interface Product {
    id: number;
    name: string;

    model?: string | null;
    barcode?: string | null;
    productCode?: string | null;

    imei?: string | null;
    serialNumber?: string | null;

    storage?: string | null;
    ram?: string | null;
    color?: string | null;

    sellingPrice: number;
    discountPrice?: number | null;

    stock: number;

    brand?: {
        id: number;
        name: string;
    } | null;

    category?: {
        id: number;
        name: string;
    } | null;
}

/* =========================================================
   ZEBRA ZD230 - 203 DPI

   PHYSICAL STICKER
   ----------------
   Width  = 40mm
   Height = 20mm

   203 DPI
   40mm ≈ 320 dots
   20mm ≈ 160 dots

   TWO COLUMNS
   LEFT  = 0
   RIGHT = 336

   TOTAL WIDTH
   320 + 16 + 320 = 656
========================================================= */

const DPI = 203;

const LABEL_WIDTH = 320;
const LABEL_HEIGHT = 160;

const COLUMN_GAP = 6;

const RIGHT_X =
    LABEL_WIDTH + COLUMN_GAP;

const PRINT_WIDTH =
    LABEL_WIDTH * 2 + COLUMN_GAP;

/* =========================================================
   STICKER CONTENT POSITIONS

   Keep everything inside 160 dots.
========================================================= */

const NAME_Y = 30;

const BARCODE_Y = 60;

const BARCODE_TEXT_Y = 98;

const PRICE_Y = 130;

/*
 * Barcode moved slightly to the right.
 */
const BARCODE_X_OFFSET = 72;

/*
 * Code 128 barcode.
 *
 * ^BY2 = larger barcode
 */
const BARCODE_MODULE = 1;

const BARCODE_HEIGHT = 36;

/* =========================================================
   PAGE
========================================================= */

export default function StickerPage() {
    const params = useParams();
    const router = useRouter();

    const id = Number(params.id);

    const [product, setProduct] =
        useState<Product | null>(null);

    const [quantity, setQuantity] =
        useState<number>(1);

    const [loading, setLoading] =
        useState<boolean>(true);

    const [printing, setPrinting] =
        useState<boolean>(false);

    const [error, setError] =
        useState<string>("");

    const [printer, setPrinter] =
        useState<any>(null);

    const [printerName, setPrinterName] =
        useState<string>("");

    const [printerStatus, setPrinterStatus] =
        useState<string>(
            "Loading Zebra Browser Print..."
        );

    /* =====================================================
       LOAD PRODUCT
    ===================================================== */

    useEffect(() => {
        let cancelled = false;

        async function loadProduct() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await fetch(
                        `/api/products/${id}`,
                        {
                            cache: "no-store",
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        "Product not found"
                    );
                }

                const data =
                    await response.json();

                const p =
                    data.product ?? data;

                if (!cancelled) {
                    setProduct(p);
                }

            } catch (err: any) {
                console.error(
                    "PRODUCT ERROR:",
                    err
                );

                if (!cancelled) {
                    setError(
                        err?.message ||
                        "Failed to load product"
                    );
                }

            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        if (id > 0) {
            loadProduct();
        } else {
            setError(
                "Invalid product ID"
            );
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };

    }, [id]);

    /* =====================================================
       LOAD ZEBRA BROWSER PRINT
    ===================================================== */

    const loadBrowserPrint =
        useCallback(async () => {

            if (
                typeof window ===
                "undefined"
            ) {
                throw new Error(
                    "Browser environment required."
                );
            }

            if (window.BrowserPrint) {
                return window.BrowserPrint;
            }

            const loadScript = (
                src: string,
                scriptId: string
            ): Promise<void> => {

                return new Promise(
                    (resolve, reject) => {

                        const existing =
                            document.getElementById(
                                scriptId
                            ) as
                                | HTMLScriptElement
                                | null;

                        if (existing) {

                            if (
                                window.BrowserPrint
                            ) {
                                resolve();
                                return;
                            }

                            existing.addEventListener(
                                "load",
                                () => resolve(),
                                {
                                    once: true,
                                }
                            );

                            existing.addEventListener(
                                "error",
                                () =>
                                    reject(
                                        new Error(
                                            `Failed to load ${src}`
                                        )
                                    ),
                                {
                                    once: true,
                                }
                            );

                            return;
                        }

                        const script =
                            document.createElement(
                                "script"
                            );

                        script.id =
                            scriptId;

                        script.src =
                            src;

                        script.async =
                            false;

                        script.onload =
                            () => {
                                console.log(
                                    "Zebra Browser Print loaded:",
                                    src
                                );

                                resolve();
                            };

                        script.onerror =
                            () => {
                                reject(
                                    new Error(
                                        `Cannot load Zebra Browser Print file:\n${src}`
                                    )
                                );
                            };

                        document.head.appendChild(
                            script
                        );
                    }
                );
            };

            /*
             * Put these two files here:
             *
             * public/zebra/
             *
             * BrowserPrint-3.1.250.min.js
             * BrowserPrint-Zebra-1.1.250.min.js
             */

            await loadScript(
                "/zebra/BrowserPrint-3.1.250.min.js",
                "zebra-browser-print-core"
            );

            await new Promise<void>(
                (resolve) =>
                    setTimeout(
                        resolve,
                        300
                    )
            );

            await loadScript(
                "/zebra/BrowserPrint-Zebra-1.1.250.min.js",
                "zebra-browser-print-zebra"
            );

            await new Promise<void>(
                (resolve) =>
                    setTimeout(
                        resolve,
                        300
                    )
            );

            if (
                !window.BrowserPrint
            ) {
                throw new Error(
                    "BrowserPrint loaded but window.BrowserPrint is undefined."
                );
            }

            return window.BrowserPrint;

        }, []);

    /* =====================================================
       CHECK PRINTER
    ===================================================== */

    const isUsablePrinter =
        (device: any): boolean => {

            if (
                !device ||
                typeof device !==
                    "object"
            ) {
                return false;
            }

            if (
                typeof device.send !==
                "function"
            ) {
                return false;
            }

            const name =
                String(
                    device.name ?? ""
                ).trim();

            const uid =
                String(
                    device.uid ?? ""
                ).trim();

            return Boolean(
                name || uid
            );
        };

    /* =====================================================
       FIND PRINTER
    ===================================================== */

    const findPrinter =
        useCallback(async () => {

            try {

                setPrinterStatus(
                    "Detecting Zebra printer..."
                );

                setPrinter(null);
                setPrinterName("");

                const BrowserPrint =
                    await loadBrowserPrint();

                /* -----------------------------------------
                   DEFAULT PRINTER
                ----------------------------------------- */

                const defaultDevice =
                    await new Promise<any>(
                        (resolve) => {

                            try {

                                BrowserPrint
                                    .getDefaultDevice(
                                        "printer",

                                        (
                                            device: any
                                        ) => {
                                            resolve(
                                                device ||
                                                null
                                            );
                                        },

                                        () => {
                                            resolve(
                                                null
                                            );
                                        }
                                    );

                            } catch {
                                resolve(
                                    null
                                );
                            }
                        }
                    );

                if (
                    isUsablePrinter(
                        defaultDevice
                    )
                ) {

                    let name =
                        String(
                            defaultDevice.name ??
                            ""
                        ).trim();

                    const uid =
                        String(
                            defaultDevice.uid ??
                            ""
                        ).trim();

                    if (
                        !name &&
                        uid
                    ) {
                        name =
                            `Zebra Printer (${uid})`;
                    }

                    setPrinter(
                        defaultDevice
                    );

                    setPrinterName(
                        name ||
                        "Zebra Printer"
                    );

                    setPrinterStatus(
                        `Printer Ready: ${
                            name ||
                            "Zebra Printer"
                        }`
                    );

                    return defaultDevice;
                }

                /* -----------------------------------------
                   LOCAL PRINTERS
                ----------------------------------------- */

                const devices =
                    await new Promise<any[]>(
                        (resolve) => {

                            try {

                                BrowserPrint
                                    .getLocalDevices(
                                        (
                                            result: any
                                        ) => {

                                            if (
                                                Array.isArray(
                                                    result
                                                )
                                            ) {
                                                resolve(
                                                    result
                                                );
                                                return;
                                            }

                                            if (
                                                result &&
                                                Array.isArray(
                                                    result.printer
                                                )
                                            ) {
                                                resolve(
                                                    result.printer
                                                );
                                                return;
                                            }

                                            if (
                                                result &&
                                                Array.isArray(
                                                    result.devices
                                                )
                                            ) {
                                                resolve(
                                                    result.devices
                                                );
                                                return;
                                            }

                                            resolve(
                                                []
                                            );
                                        },

                                        (
                                            err: any
                                        ) => {

                                            console.error(
                                                "LOCAL DEVICE ERROR:",
                                                err
                                            );

                                            resolve(
                                                []
                                            );
                                        },

                                        "printer"
                                    );

                            } catch (
                                err
                            ) {

                                console.error(
                                    "LOCAL DEVICE EXCEPTION:",
                                    err
                                );

                                resolve(
                                    []
                                );
                            }
                        }
                    );

                const usable =
                    devices.filter(
                        (
                            device: any
                        ) =>
                            isUsablePrinter(
                                device
                            )
                    );

                const selected =
                    usable.find(
                        (
                            device: any
                        ) => {

                            const name =
                                String(
                                    device?.name ??
                                    ""
                                ).toLowerCase();

                            return (
                                name.includes(
                                    "zd230"
                                ) ||
                                name.includes(
                                    "zdesigner"
                                )
                            );
                        }
                    ) ||
                    usable[0];

                if (!selected) {
                    throw new Error(
                        "Browser Print found no usable Zebra printer."
                    );
                }

                const name =
                    String(
                        selected.name ??
                        ""
                    ).trim();

                setPrinter(
                    selected
                );

                setPrinterName(
                    name ||
                    "Zebra Printer"
                );

                setPrinterStatus(
                    `Printer Ready: ${
                        name ||
                        "Zebra Printer"
                    }`
                );

                return selected;

            } catch (err: any) {

                console.error(
                    "FIND PRINTER ERROR:",
                    err
                );

                setPrinter(null);
                setPrinterName("");

                setPrinterStatus(
                    err?.message ||
                    "Zebra printer not found"
                );

                return null;
            }

        }, [
            loadBrowserPrint,
        ]);

    /* =====================================================
       INITIALIZE
    ===================================================== */

    useEffect(() => {

        let cancelled =
            false;

        async function initialise() {

            try {

                await loadBrowserPrint();

                if (
                    cancelled
                ) {
                    return;
                }

                await findPrinter();

            } catch (
                err: any
            ) {

                console.error(
                    "BROWSER PRINT ERROR:",
                    err
                );

                if (
                    !cancelled
                ) {

                    setPrinter(
                        null
                    );

                    setPrinterStatus(
                        err?.message ||
                        "Zebra Browser Print is not available"
                    );
                }
            }
        }

        initialise();

        return () => {
            cancelled = true;
        };

    }, [
        loadBrowserPrint,
        findPrinter,
    ]);

    /* =====================================================
       QUANTITY
    ===================================================== */

    const increase =
        () => {

            setQuantity(
                (current) =>
                    Math.min(
                        current + 1,
                        500
                    )
            );
        };

    const decrease =
        () => {

            setQuantity(
                (current) =>
                    current > 1
                        ? current - 1
                        : 1
            );
        };

    const changeQuantity =
        (value: string) => {

            const number =
                Number(value);

            if (
                !Number.isFinite(
                    number
                ) ||
                number < 1
            ) {
                setQuantity(1);
                return;
            }

            setQuantity(
                Math.min(
                    500,
                    Math.floor(
                        number
                    )
                )
            );
        };

    /* =====================================================
       ZPL SAFE TEXT
    ===================================================== */

    const zplSafe =
        (
            value: unknown
        ): string => {

            if (
                value === null ||
                value === undefined
            ) {
                return "";
            }

            return String(value)
                .replace(
                    /[\^~]/g,
                    " "
                )
                .replace(
                    /[\r\n]+/g,
                    " "
                );
        };

    /* =====================================================
       PRICE
    ===================================================== */

    const getPrice =
        () => {

            if (!product) {
                return 0;
            }

            return Number(
                product.discountPrice ??
                product.sellingPrice ??
                0
            );
        };

    const getPriceText =
        () => {

            return `RS: ${getPrice().toLocaleString(
                "en-LK",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }
            )}`;
        };

    /* =====================================================
       PRODUCT NAME
    ===================================================== */

    const getProductName =
        () => {

            if (!product) {
                return "";
            }

            return zplSafe(
                product.brand?.name
                    ? `${product.brand.name} ${product.name}`
                    : product.name
            );
        };

    /* =====================================================
       BARCODE
    ===================================================== */

    const getBarcode =
        () => {

            if (!product) {
                return "";
            }

            return zplSafe(
                product.barcode ||
                product.productCode ||
                String(product.id)
            );
        };

    /* =====================================================
       CREATE ONE STICKER
    ===================================================== */

    const createStickerZPL =
        (
            x: number
        ): string => {

            const name =
                getProductName();

            const barcode =
                getBarcode();

            const price =
                getPriceText();

            let zpl = "";

            /* -----------------------------------------
               PRODUCT NAME
            ----------------------------------------- */

            zpl +=
                `^FO${x + 4},${NAME_Y}\n`;

            zpl +=
                "^A0N,18,18\n";

            zpl +=
                "^FB312,20,0,C,0\n";

            zpl +=
                `^FD${name}^FS\n`;

            /* -----------------------------------------
               BARCODE
            ----------------------------------------- */

            const barcodeX =
                x +
                BARCODE_X_OFFSET;

            zpl +=
                `^FO${barcodeX},${BARCODE_Y}\n`;

            /*
             * ^BY2
             *
             * Barcode module width = 2 dots.
             * This is larger than ^BY1.
             */
            zpl +=
                `^BY${BARCODE_MODULE},2,${BARCODE_HEIGHT}\n`;

            /*
             * Code 128
             */
            zpl +=
                `^BCN,${BARCODE_HEIGHT},N,N,N\n`;

            zpl +=
                `^FD${barcode}^FS\n`;

            /* -----------------------------------------
               BARCODE NUMBER
            ----------------------------------------- */

            zpl +=
                `^FO${x + 5},${BARCODE_TEXT_Y}\n`;

            zpl +=
                "^A0N,14,14\n";

            zpl +=
                "^FB310,18,0,C,0\n";

            zpl +=
                `^FD${barcode}^FS\n`;

            /* -----------------------------------------
               PRICE
            ----------------------------------------- */

            zpl +=
                `^FO${x + 4},${PRICE_Y}\n`;

            zpl +=
                "^A0N,25,25\n";

            zpl +=
                "^FB312,28,0,C,0\n";

            zpl +=
                `^FD${price}^FS\n`;

            return zpl;
        };

    /* =====================================================
       CREATE ONE PHYSICAL ROW

       ONE ROW:

       ┌──────────────┐ ┌──────────────┐
       │   PRODUCT    │ │   PRODUCT    │
       └──────────────┘ └──────────────┘

       This is one physical 20mm row.
    ===================================================== */

    const createPhysicalRowZPL =
        (
            left: boolean,
            right: boolean
        ): string => {

            let zpl = "";

            zpl +=
                "^XA\n";

            /*
             * TWO 40mm LABELS + GAP
             */
            zpl +=
                `^PW${PRINT_WIDTH}\n`;

            /*
             * Physical row height
             *
             * 20mm = 160 dots
             */
            zpl +=
                `^LL${LABEL_HEIGHT}\n`;

            /*
             * Label home
             */
            zpl +=
                "^LH0,0\n";

            /*
             * No horizontal shift
             */
            zpl +=
                "^LS0\n";

            /*
             * IMPORTANT:
             *
             * Your labels have gaps.
             *
             * ^MNY = non-continuous
             * web/gap sensing.
             */
            zpl +=
                "^MNY\n";

            /*
             * Label top position.
             */
            zpl +=
                "^LT0\n";

            /*
             * Direct thermal.
             */
            zpl +=
                "^MTD\n";

            /*
             * Tear off.
             */
            zpl +=
                "^MMT\n";

            /*
             * UTF-8.
             */
            zpl +=
                "^CI28\n";

            /*
             * Darkness.
             */
            zpl +=
                "^MD0\n";

            /*
             * LEFT
             */
            if (left) {
                zpl +=
                    createStickerZPL(
                        0
                    );
            }

            /*
             * RIGHT
             */
            if (right) {
                zpl +=
                    createStickerZPL(
                        RIGHT_X
                    );
            }

            zpl +=
                "^XZ\n";

            return zpl;
        };

    /* =====================================================
       CREATE COMPLETE ZPL

       QUANTITY 2

       ROW 1
       [A] [A]

       QUANTITY 4

       ROW 1
       [A] [A]

       ROW 2
       [A] [A]

       QUANTITY 3

       ROW 1
       [A] [A]

       ROW 2
       [A] [ ]

       IMPORTANT:
       No artificial blank row.
    ===================================================== */

    const createZPL =
        () => {

            if (!product) {
                return "";
            }

            const safeQuantity =
                Math.max(
                    1,
                    Math.min(
                        500,
                        Math.floor(
                            quantity
                        )
                    )
                );

            let zpl = "";

            const totalRows =
                Math.ceil(
                    safeQuantity / 2
                );

            for (
                let row = 0;
                row < totalRows;
                row++
            ) {

                const leftIndex =
                    row * 2;

                const rightIndex =
                    leftIndex + 1;

                const hasLeft =
                    leftIndex <
                    safeQuantity;

                const hasRight =
                    rightIndex <
                    safeQuantity;

                zpl +=
                    createPhysicalRowZPL(
                        hasLeft,
                        hasRight
                    );
            }

            return zpl;
        };

    /* =====================================================
       PRINT ERROR
    ===================================================== */

    function getPrintErrorMessage(
        error: any
    ): string {

        if (!error) {
            return "Unknown Zebra printer error.";
        }

        if (
            typeof error ===
            "string"
        ) {
            return error;
        }

        if (
            error.message
        ) {
            return String(
                error.message
            );
        }

        if (
            error.responseText
        ) {
            return String(
                error.responseText
            );
        }

        try {

            return JSON.stringify(
                error
            );

        } catch {

            return "Unknown Zebra printer error.";
        }
    }

    /* =====================================================
       PRINT
    ===================================================== */

    const handlePrint =
        async () => {

            if (!product) {

                alert(
                    "Product not loaded."
                );

                return;
            }

            if (!getBarcode()) {

                alert(
                    "This product does not have a barcode or product code."
                );

                return;
            }

            setPrinting(true);

            try {

                const selectedPrinter =
                    await findPrinter();

                if (
                    !selectedPrinter
                ) {

                    throw new Error(
                        "No usable Zebra printer was found."
                    );
                }

                if (
                    typeof selectedPrinter.send !==
                    "function"
                ) {

                    throw new Error(
                        "Selected Zebra printer does not support send()."
                    );
                }

                const zpl =
                    createZPL();

                console.log(
                    "===================================="
                );

                console.log(
                    "ZEBRA ZD230"
                );

                console.log(
                    "Sticker:",
                    "40mm x 20mm"
                );

                console.log(
                    "DPI:",
                    DPI
                );

                console.log(
                    "Label width:",
                    LABEL_WIDTH
                );

                console.log(
                    "Label height:",
                    LABEL_HEIGHT
                );

                console.log(
                    "Print width:",
                    PRINT_WIDTH
                );

                console.log(
                    "Right X:",
                    RIGHT_X
                );

                console.log(
                    "Quantity:",
                    quantity
                );

                console.log(
                    "Rows:",
                    Math.ceil(
                        quantity / 2
                    )
                );

                console.log(
                    "Barcode BY:",
                    BARCODE_MODULE
                );

                console.log(
                    "===================================="
                );

                console.log(
                    "ZPL:",
                    zpl
                );

                await new Promise<void>(
                    (
                        resolve,
                        reject
                    ) => {

                        try {

                            selectedPrinter.send(
                                zpl,

                                () => {

                                    console.log(
                                        "ZEBRA PRINT SUCCESS"
                                    );

                                    resolve();
                                },

                                (
                                    printError: any
                                ) => {

                                    console.error(
                                        "ZEBRA PRINT ERROR:",
                                        printError
                                    );

                                    reject(
                                        new Error(
                                            getPrintErrorMessage(
                                                printError
                                            )
                                        )
                                    );
                                }
                            );

                        } catch (
                            sendError
                        ) {

                            reject(
                                sendError
                            );
                        }
                    }
                );

                setPrinting(false);

                alert(
                    `${quantity} sticker${
                        quantity > 1
                            ? "s"
                            : ""
                    } sent to ${
                        printerName ||
                        "Zebra printer"
                    }.`
                );

            } catch (
                err: any
            ) {

                console.error(
                    "PRINT STICKER ERROR:",
                    err
                );

                setPrinting(false);

                alert(
                    err?.message ||
                    "Unable to print sticker."
                );
            }
        };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (
            <div className="loading-page">
                <div className="loading-box">
                    Loading product...
                </div>
            </div>
        );
    }

    /* =====================================================
       ERROR
    ===================================================== */

    if (
        error ||
        !product
    ) {

        return (
            <div className="error-page">

                <div className="error-box">

                    <h2>
                        {error ||
                            "Product not found"}
                    </h2>

                    <button
                        className="back-button"
                        onClick={() =>
                            router.back()
                        }
                    >
                        <ArrowLeft
                            size={18}
                        />

                        Back
                    </button>

                </div>

            </div>
        );
    }

    /* =====================================================
       PREVIEW DATA
    ===================================================== */

    const price =
        getPrice();

    const barcode =
        getBarcode();

    const productName =
        product.brand?.name
            ? `${product.brand.name} ${product.name}`
            : product.name;

    const rows =
        Math.ceil(
            quantity / 2
        );

    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <>
            <div className="page">

                {/* HEADER */}

                <div className="header">

                    <button
                        className="back-button"
                        onClick={() =>
                            router.back()
                        }
                    >

                        <ArrowLeft
                            size={18}
                        />

                        Back

                    </button>

                    <div>

                        <h1>
                            Print Product Sticker
                        </h1>

                        <p>
                            Zebra ZD230 •
                            40mm × 20mm •
                            2 Columns
                        </p>

                    </div>

                </div>

                {/* PRINTER STATUS */}

                <div
                    className={
                        printer
                            ? "printer-status ready"
                            : "printer-status"
                    }
                >

                    <div>

                        🖨️{" "}

                        <strong>
                            {printer
                                ? "Printer Ready"
                                : "Printer Status"}
                        </strong>

                    </div>

                    <span>
                        {printerStatus}
                    </span>

                    <button
                        className="refresh-button"
                        onClick={
                            findPrinter
                        }
                    >
                        Refresh
                    </button>

                </div>

                {/* PRODUCT */}

                <div className="product-card">

                    <div>

                        <h2>
                            {productName}
                        </h2>

                        <p>

                            <strong>
                                Barcode:
                            </strong>{" "}

                            {barcode}

                        </p>

                    </div>

                    <strong className="price">

                        RS:{" "}

                        {price.toLocaleString(
                            "en-LK",
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }
                        )}

                    </strong>

                </div>

                {/* CONTROLS */}

                <div className="controls">

                    <div>

                        <label>
                            Number of stickers
                        </label>

                        <div className="quantity">

                            <button
                                type="button"
                                onClick={
                                    decrease
                                }
                            >
                                <Minus
                                    size={18}
                                />
                            </button>

                            <input
                                type="number"
                                min="1"
                                max="500"
                                value={
                                    quantity
                                }
                                onChange={(e) =>
                                    changeQuantity(
                                        e.target.value
                                    )
                                }
                            />

                            <button
                                type="button"
                                onClick={
                                    increase
                                }
                            >
                                <Plus
                                    size={18}
                                />
                            </button>

                        </div>

                    </div>

                    <button
                        className="print-button"
                        disabled={
                            printing ||
                            !printer ||
                            !product
                        }
                        onClick={
                            handlePrint
                        }
                    >

                        <Printer
                            size={19}
                        />

                        {printing
                            ? "Printing..."
                            : "Print Stickers"}

                    </button>

                </div>

                {/* INFO */}

                <div className="quantity-info">

                    <strong>
                        {quantity}
                    </strong>{" "}

                    sticker
                    {quantity !== 1
                        ? "s"
                        : ""}

                    {" → "}

                    <strong>
                        {rows}
                    </strong>{" "}

                    physical row
                    {rows !== 1
                        ? "s"
                        : ""}

                    {" → "}

                    2 stickers per row

                </div>

                {/* PREVIEW */}

                <div className="preview-title">
                    Sticker Preview
                </div>

                <div className="sheet">

                    <div className="preview-grid">

                        {Array.from(
                            {
                                length:
                                    quantity,
                            }
                        ).map(
                            (
                                _,
                                index
                            ) => (

                                <StickerPreview
                                    key={
                                        index
                                    }
                                    product={
                                        product
                                    }
                                />

                            )
                        )}

                    </div>

                </div>

            </div>

            <style jsx global>
                {styles}
            </style>
        </>
    );
}

/* ============================================================
   STICKER PREVIEW
============================================================ */

function StickerPreview({
    product,
}: {
    product: Product;
}) {

    const barcode =
        product.barcode ||
        product.productCode ||
        String(product.id);

    const price =
        Number(
            product.discountPrice ??
            product.sellingPrice ??
            0
        );

    const name =
        product.brand?.name
            ? `${product.brand.name} ${product.name}`
            : product.name;

    return (

        <div className="sticker-preview">

            {/* NAME */}

            <div className="sticker-name">
                {name}
            </div>

            {/* BARCODE */}

            <div className="barcode-area">

                <div className="barcode-lines">

                    {Array.from(
                        {
                            length: 48,
                        }
                    ).map(
                        (
                            _,
                            index
                        ) => (

                            <span
                                key={
                                    index
                                }
                                className={
                                    index %
                                        3 ===
                                    0
                                        ? "barcode-wide"
                                        : ""
                                }
                            />

                        )
                    )}

                </div>

                <div className="barcode-number">
                    {barcode}
                </div>

            </div>

            {/* PRICE */}

            <div className="sticker-price">

                RS:{" "}

                {price.toLocaleString(
                    "en-LK",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }
                )}

            </div>

        </div>
    );
}

/* ============================================================
   STYLES
============================================================ */

const styles = `

* {
    box-sizing: border-box;
}

body {
    margin: 0;
}

.page {
    min-height: 100vh;
    background: #f3f4f6;
    padding: 25px;
    font-family:
        Arial,
        Helvetica,
        sans-serif;
}

/* =========================================================
   HEADER
========================================================= */

.header {
    max-width: 1100px;
    margin: 0 auto 20px;

    display: flex;
    gap: 15px;

    align-items: center;
}

.header h1 {
    margin: 0;

    font-size: 27px;

    color: #111827;
}

.header p {
    margin: 5px 0 0;

    color: #6b7280;

    font-size: 14px;
}

/* =========================================================
   BACK
========================================================= */

.back-button {
    display: flex;

    align-items: center;

    gap: 7px;

    padding: 10px 16px;

    border:
        1px solid #d1d5db;

    background: white;

    border-radius: 8px;

    cursor: pointer;

    font-size: 14px;
}

.back-button:hover {
    background: #f9fafb;
}

/* =========================================================
   PRINTER STATUS
========================================================= */

.printer-status {
    max-width: 1100px;

    margin:
        0 auto 18px;

    padding: 14px 16px;

    background: #fff7ed;

    border:
        1px solid #fed7aa;

    border-radius: 10px;

    display: flex;

    align-items: center;

    gap: 15px;

    color: #9a3412;
}

.printer-status.ready {
    background: #ecfdf5;

    border-color:
        #a7f3d0;

    color: #065f46;
}

.printer-status span {
    flex: 1;

    font-size: 13px;
}

.refresh-button {
    border: none;

    background:
        #111827;

    color: white;

    padding:
        8px 13px;

    border-radius: 7px;

    cursor: pointer;
}

/* =========================================================
   PRODUCT
========================================================= */

.product-card {
    max-width: 1100px;

    margin: 0 auto 18px;

    background: white;

    border:
        1px solid #e5e7eb;

    border-radius: 12px;

    padding: 18px 20px;

    display: flex;

    justify-content:
        space-between;

    align-items: center;

    gap: 20px;
}

.product-card h2 {
    margin:
        0 0 6px;

    color: #111827;
}

.product-card p {
    margin: 0;

    color: #6b7280;
}

.product-card .price {
    font-size: 22px;

    color: #111827;

    white-space: nowrap;
}

/* =========================================================
   CONTROLS
========================================================= */

.controls {
    max-width: 1100px;

    margin: 0 auto 15px;

    background: white;

    border:
        1px solid #e5e7eb;

    border-radius: 12px;

    padding: 18px;

    display: flex;

    justify-content:
        space-between;

    align-items:
        flex-end;

    gap: 20px;
}

.controls label {
    display: block;

    margin-bottom: 8px;

    font-size: 13px;

    color: #374151;
}

.quantity {
    display: flex;

    align-items: center;

    gap: 6px;
}

.quantity button {
    width: 38px;

    height: 38px;

    border:
        1px solid #d1d5db;

    background: white;

    border-radius: 7px;

    cursor: pointer;

    display: flex;

    align-items: center;

    justify-content: center;
}

.quantity input {
    width: 80px;

    height: 38px;

    text-align: center;

    border:
        1px solid #d1d5db;

    border-radius: 7px;

    font-size: 15px;
}

.print-button {
    height: 42px;

    padding:
        0 20px;

    border: none;

    border-radius: 8px;

    background:
        #111827;

    color: white;

    cursor: pointer;

    display: flex;

    align-items: center;

    gap: 8px;

    font-size: 14px;
}

.print-button:disabled {
    opacity: .5;

    cursor:
        not-allowed;
}

/* =========================================================
   QUANTITY INFO
========================================================= */

.quantity-info {
    max-width: 1100px;

    margin:
        0 auto 18px;

    color: #4b5563;

    font-size: 14px;
}

/* =========================================================
   PREVIEW
========================================================= */

.preview-title {
    max-width: 1100px;

    margin:
        0 auto 10px;

    font-size: 18px;

    font-weight: 700;

    color: #111827;
}

.sheet {
    max-width: 1100px;

    margin: 0 auto;

    padding: 20px;

    background:
        #d1d5db;

    border-radius: 12px;
}

.preview-grid {
    display: grid;

    grid-template-columns:
        repeat(
            2,
            320px
        );

    gap:
        12px 16px;

    justify-content: center;
}

/* =========================================================
   40mm × 20mm PREVIEW
========================================================= */

.sticker-preview {
    width: 320px;

    height: 160px;

    background: white;

    border-radius: 8px;

    padding: 5px 4px;

    overflow: hidden;

    display: flex;

    flex-direction:
        column;

    align-items:
        center;
    margin-left: 165px;
}

.sticker-name {
    width: 312px;

    height: 23px;

    display: flex;

    align-items:
        center;

    justify-content:
        center;

    font-size: 14px;

    font-weight: 700;

    white-space:
        nowrap;

    overflow:
        hidden;

    text-overflow:
        ellipsis;
}

.barcode-area {
    width: 312px;

    height: 80px;

    display: flex;

    flex-direction:
        column;

    align-items:
        center;

    justify-content:
        center;
}

.barcode-lines {
    width: 255px;

    height: 47px;

    display: flex;

    align-items:
        stretch;

    justify-content:
        center;

    overflow:
        hidden;
}

.barcode-lines span {
    width: 2px;

    margin-right: 2px;

    background:
        #111827;
}

.barcode-lines
.barcode-wide {
    width: 4px;
}

.barcode-number {
    margin-top: 3px;

    font-size: 10px;

    font-weight: 600;
}

.sticker-price {
    height: 38px;

    width: 312px;

    display: flex;

    align-items:
        center;

    justify-content:
        center;

    font-size: 18px;

    font-weight: 700;
}

/* =========================================================
   LOADING
========================================================= */

.loading-page {
    min-height: 100vh;

    display: flex;

    align-items:
        center;

    justify-content:
        center;

    background:
        #f3f4f6;
}

.loading-box {
    background: white;

    padding:
        30px 40px;

    border-radius: 10px;

    font-size: 16px;
}

/* =========================================================
   ERROR
========================================================= */

.error-page {
    min-height: 100vh;

    display: flex;

    align-items:
        center;

    justify-content:
        center;

    background:
        #f3f4f6;
}

.error-box {
    background: white;

    padding:
        30px;

    border-radius: 12px;

    text-align: center;

    max-width: 500px;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (
    max-width: 750px
) {

    .page {
        padding: 12px;
    }

    .header {
        align-items:
            flex-start;
    }

    .product-card {
        flex-direction:
            column;

        align-items:
            flex-start;
    }

    .controls {
        flex-direction:
            column;

        align-items:
            stretch;
    }

    .print-button {
        justify-content:
            center;
    }

    .preview-grid {
        grid-template-columns:
            320px;
    }
}

`;