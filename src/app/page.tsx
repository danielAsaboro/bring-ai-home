import { ReceiptInbox } from "@/features/ledger/receipt-inbox";

export default function Home() {
  return (
    <main>
      <h1>Ledger</h1>
      <ReceiptInbox />
    </main>
  );
}
