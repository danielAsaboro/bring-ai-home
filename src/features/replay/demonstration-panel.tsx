"use client";

import { useState } from "react";

import { formatTimestamp } from "./narration";
import { readScreenshot, transcribeRecording } from "./service-client";
import type { ReadScreenshotResponse, TranscribeResponse } from "./service-contract";

type Status = { kind: "idle" } | { kind: "working"; label: string } | { kind: "error"; code: string; message: string };

// Evidence from a demonstration. Nothing here changes the tape by itself.
export function DemonstrationPanel() {
  const [recording, setRecording] = useState<File | null>(null);
  const [narration, setNarration] = useState<TranscribeResponse | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [notes, setNotes] = useState<(ReadScreenshotResponse & { fileName: string })[]>([]);
  const btn = "rounded border border-stone-700 px-3 py-1 text-sm disabled:opacity-40";

  async function transcribe() {
    if (!recording) return;
    setStatus({ kind: "working", label: "Transcribing on this machine…" });
    const result = await transcribeRecording(recording);
    if (result.ok) {
      setNarration(result.value);
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", code: result.code, message: result.message });
    }
  }

  async function readScreen() {
    if (!screenshot) return;
    setStatus({ kind: "working", label: "Reading the screenshot on this machine…" });
    const result = await readScreenshot(screenshot);
    if (result.ok) {
      setNotes((n) => [...n, { ...result.value, fileName: screenshot.name }]);
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", code: result.code, message: result.message });
    }
  }

  return (
    <section aria-label="Demonstration" className="space-y-3 rounded border border-dashed border-stone-700 p-3">
      <h2 className="font-semibold">Draft from a demonstration</h2>
      <p className="text-sm text-stone-400">
        Narrate the job once. The local QVAC service listens; you decide what becomes a frame.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">
          Narration (.wav)
          <input
            type="file"
            accept=".wav,audio/wav"
            className="ml-2 text-sm"
            onChange={(e) => setRecording(e.target.files?.[0] ?? null)}
          />
        </label>
        <button type="button" className={btn} disabled={!recording || status.kind === "working"} onClick={transcribe}>
          Transcribe locally
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">
          Screenshot (.png, .jpg)
          <input
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            className="ml-2 text-sm"
            onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
          />
        </label>
        <button type="button" className={btn} disabled={!screenshot || status.kind === "working"} onClick={readScreen}>
          Read screenshot locally
        </button>
      </div>
      {status.kind === "working" && <p role="status">{status.label}</p>}
      {status.kind === "error" && (
        <p role="alert" className="text-sm text-red-300">
          {status.message} <span className="font-mono text-xs">({status.code})</span>
        </p>
      )}
      {notes.length > 0 && (
        <ul aria-label="Screen notes" className="space-y-1 text-sm">
          {notes.map((n) => (
            <li key={n.sourceDigest}>
              <span className="mr-2 text-xs text-stone-400">
                {n.fileName} · {n.model} · proposed description
              </span>
              {n.note.text}
            </li>
          ))}
        </ul>
      )}
      {narration && (
        <div>
          <p className="text-xs text-stone-400">
            Narration evidence from {narration.model} · not steps yet
          </p>
          <ol aria-label="Narration" className="space-y-1 text-sm">
            {narration.narration.segments.map((s) => (
              <li key={s.startMs}>
                <span className="mr-2 font-mono text-xs text-amber-400">{formatTimestamp(s.startMs)}</span>
                {s.text}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
