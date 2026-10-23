import type { OcrBlock } from "@/features/ledger/receipt-contract";

// HAND-WRITTEN FIXTURE. This is not recorded model output.
// It mimics the shape QVAC OCR returns for receipt-corner-cafe.png with
// paragraph: false: one block per word group, with pixel boxes and confidence.
// Amounts are split from their labels on purpose, as real OCR often does.
// It includes one imperfect read ("Croissamt") so tests do not assume clean text.
export const cornerCafeOcrFixture: OcrBlock[] = [
  { text: "CORNER CAFE", bbox: [40, 38, 205, 66], confidence: 0.97 },
  { text: "12 Example Street", bbox: [40, 84, 245, 104], confidence: 0.93 },
  { text: "Date: 2026-03-14", bbox: [40, 114, 235, 134], confidence: 0.91 },
  { text: "Flat white", bbox: [40, 174, 160, 194], confidence: 0.95 },
  { text: "4.50", bbox: [270, 174, 320, 194], confidence: 0.96 },
  { text: "Croissamt", bbox: [40, 209, 150, 229], confidence: 0.62 },
  { text: "3.25", bbox: [270, 209, 320, 229], confidence: 0.95 },
  { text: "Sparkling water", bbox: [40, 244, 220, 264], confidence: 0.9 },
  { text: "2.00", bbox: [270, 244, 320, 264], confidence: 0.94 },
  { text: "Subtotal", bbox: [40, 304, 135, 324], confidence: 0.96 },
  { text: "9.75", bbox: [270, 304, 320, 324], confidence: 0.95 },
  { text: "Tax", bbox: [40, 339, 80, 359], confidence: 0.98 },
  { text: "0.78", bbox: [270, 339, 320, 359], confidence: 0.93 },
  { text: "TOTAL", bbox: [40, 389, 115, 413], confidence: 0.97 },
  { text: "10.53", bbox: [255, 389, 330, 413], confidence: 0.95 },
  { text: "Paid: CARD ****0000", bbox: [40, 454, 265, 474], confidence: 0.81 },
  { text: "Fictional test receipt", bbox: [40, 514, 290, 534], confidence: 0.92 },
  { text: "Not a real business", bbox: [40, 544, 265, 564], confidence: 0.92 },
];
