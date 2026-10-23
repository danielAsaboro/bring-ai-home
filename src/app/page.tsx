import { Workbench } from "@/features/pattern/Workbench";

export default function Home() {
  return (
    <div className="min-h-screen bg-amber-50/40 text-stone-900">
      <header className="border-b border-stone-200 px-4 py-3">
        <h1 className="text-2xl font-semibold">Pattern</h1>
        <p className="text-sm text-stone-600">Examples are threads. Ordered rules are the weave. Outputs are swatches you can compare.</p>
      </header>
      <Workbench />
    </div>
  );
}
