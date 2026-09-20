import { randomInt } from "crypto";

export function generateBarcode(): string {
    // Internal AB Mart barcode
    // Starts with 20 so it is clearly an internal barcode

    const number = randomInt(
        100000000,
        999999999
    );

    return `20${number}`;
}