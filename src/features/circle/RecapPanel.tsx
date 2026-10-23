"use client";

import { useState } from "react";

import type { Proposal, Rejection } from "./extraction";
import type { ServiceClient } from "./service-client";
import { applyConfirmed } from "./state";
import type { CircleState } from "./types";

type Row = Proposal & { checked: boolean };

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function RecapPanel({
  state,
  onChange,
  client,
  today,
}: {
  state: CircleState;
  onChange: (next: CircleState) => void;
  client: Pick<ServiceClient, "transcribe" | "extract">;
  today: string;
}) {
  const [transcript, setTranscript] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [rejected, setRejected] = useState<Rejection[]>([]);
  const [model, setModel] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(label: string, task: () => Promise<void>) {
    setBusy(label);
    setMessage(null);
    try {
      await task();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const checked = rows.filter((r) => r.checked);

  return (
    <section aria-label="Voice recap" className="my-4 rounded-lg border border-dashed border-amber-300 p-4">
      <h2 className="font-serif text-xl">Voice recap</h2>
      <p className="text-sm text-stone-600">
        Runs on this computer. Everything below is a proposal until you tick it and save.
      </p>
      <label className="my-2 block text-sm">
        Recording
        <input
          type="file"
          accept="audio/*"
          className="ml-2"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void run("Transcribing locally…", async () => {
              const draft = await client.transcribe(await fileToBase64(file), file.name);
              setTranscript(draft.transcript);
            });
          }}
        />
      </label>
      <textarea
        aria-label="Recap transcript"
        className="w-full rounded border p-2"
        rows={3}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
      />
      <button
        type="button"
        className="rounded bg-amber-200 px-3 py-1 disabled:opacity-50"
        disabled={!transcript.trim() || busy !== null}
        onClick={() =>
          run("Finding proposals…", async () => {
            const result = await client.extract(
              transcript,
              state.people.map((p) => ({ id: p.id, name: p.name })),
              today,
            );
            setRows(result.proposals.map((p) => ({ ...p, checked: false })));
            setRejected(result.rejected);
            setModel(result.model);
          })
        }
      >
        Find proposals
      </button>
      {busy && <p role="status">{busy}</p>}
      {message && <p role="alert">{message}</p>}

      {model && (
        <div className="mt-3">
          <h3 className="font-serif text-lg">Proposals from {model}</h3>
          {rows.length === 0 && <p>Nothing the app could verify.</p>}
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id} className="rounded bg-amber-50 p-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={row.checked}
                    aria-label={`Keep ${row.type} for ${row.personName}`}
                    onChange={() =>
                      setRows(rows.map((r) => (r.id === row.id ? { ...r, checked: !r.checked } : r)))
                    }
                  />
                  <strong>{row.type}</strong> · {row.personName}
                </label>
                <input
                  aria-label={`Edit ${row.type} for ${row.personName}`}
                  className="mt-1 w-full rounded border p-1"
                  value={row.text}
                  onChange={(e) =>
                    setRows(rows.map((r) => (r.id === row.id ? { ...r, text: e.target.value } : r)))
                  }
                />
                {row.type !== "memory" && (
                  <input
                    aria-label={`Date for ${row.type} for ${row.personName}`}
                    type="date"
                    value={row.date ?? ""}
                    onChange={(e) =>
                      setRows(
                        rows.map((r) =>
                          r.id === row.id ? { ...r, date: e.target.value || undefined } : r,
                        ),
                      )
                    }
                  />
                )}
                <p className="text-stone-500">You said: “{row.evidence}”</p>
              </li>
            ))}
          </ul>
          {rejected.length > 0 && (
            <details className="text-sm">
              <summary>{rejected.length} set aside by the app</summary>
              <ul>
                {rejected.map((r, i) => (
                  <li key={i}>{r.reason}</li>
                ))}
              </ul>
            </details>
          )}
          <button
            type="button"
            className="mt-2 rounded bg-amber-300 px-3 py-1 disabled:opacity-50"
            disabled={checked.length === 0}
            onClick={() => {
              try {
                onChange(applyConfirmed(state, checked, today));
                setRows([]);
                setRejected([]);
                setModel(null);
                setTranscript("");
                setMessage(`Saved ${checked.length} confirmed item${checked.length === 1 ? "" : "s"}.`);
              } catch (e) {
                setMessage(e instanceof Error ? e.message : String(e));
              }
            }}
          >
            Save {checked.length} confirmed
          </button>
        </div>
      )}
    </section>
  );
}
