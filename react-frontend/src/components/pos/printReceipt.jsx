// printReceipt.jsx
import { printA4Receipt } from "./print_A4_receipt";
import { print80mmReceipt } from "./print_80mm_receipt";

/**
 * Print receipt in either A4 or 80mm format
 * @param {string} format - "A4" or "80mm"
 * @param {object} data - Receipt data (SHOP_NAME, invoice, items, etc.)
 */
export const printReceipt = (format, data) => {
  switch (format) {
    case "A4":
      printA4Receipt(data);
      break;

    case "80mm":
      print80mmReceipt(data);
      break;

    default:
      console.warn(`Unknown receipt format "${format}", defaulting to A4`);
      printA4Receipt(data);
      break;
  }
};
